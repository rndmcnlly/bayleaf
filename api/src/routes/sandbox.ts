/**
 * Sandbox Route Handlers
 *
 * Proxies sandboxed code execution and file operations to the sandbox
 * provider (Daytona). Reuses the same auth model as the LLM proxy:
 *   - Campus Pass users get ephemeral one-shot sandboxes
 *   - Keyed users get persistent sandboxes identified by email
 *
 * Keyed users' sandbox IDs are cached in D1 (daytona_sandbox_id column)
 * to avoid a control-plane label lookup on every request — symmetric
 * with how we cache OpenRouter key hashes.
 *
 * Routes (mounted at /sandbox):
 *   POST /exec         Execute a bash command (campus-pass or keyed)
 *   GET  /files/*      Download a file by absolute path (keyed only)
 *   PUT  /files/*      Upload a file by absolute path (keyed only)
 *   DELETE /            Destroy the user's sandbox (keyed or session)
 */

import { Hono } from 'hono';
import type { AppEnv, UserKeyRow } from '../types';
import { resolveAuth } from '../utils/auth';
import { getSession } from '../utils/session';
import {
  type EnsureResult,
  ensureSandbox,
  createEphemeralSandbox,
  waitForReady,
  waitForStarted,
  execCommand,
  downloadFile,
  uploadFile,
  findSandboxByLabel,
  deleteSandbox,
} from '../daytona';

export const sandboxRoutes = new Hono<AppEnv>();

// ── Shared helper ──────────────────────────────────────────────────

/**
 * Resolve the user's sandbox ID via D1 cache → ensureSandbox().
 * Writes the sandbox ID back to D1 if it changed (new creation, or
 * cached ID was stale).  Returns the sandbox ID on success, or null
 * with an error response already sent.
 */
async function resolveSandboxId(
  email: string,
  env: AppEnv['Bindings'],
): Promise<string> {
  // Load cached sandbox ID from D1
  const row = await env.DB.prepare(
    'SELECT daytona_sandbox_id FROM user_keys WHERE email = ? AND revoked = 0',
  ).bind(email).first<Pick<UserKeyRow, 'daytona_sandbox_id'>>();

  const cachedId = row?.daytona_sandbox_id ?? null;
  const result: EnsureResult = await ensureSandbox(email, env, cachedId);

  // Write back if the ID changed (new sandbox, or cached ID was stale)
  if (result.changed) {
    await env.DB.prepare(
      'UPDATE user_keys SET daytona_sandbox_id = ? WHERE email = ? AND revoked = 0',
    ).bind(result.id, email).run();
  }

  return result.id;
}

/** Clear the cached sandbox ID in D1 for the given email. */
async function clearCachedSandboxId(
  email: string,
  env: AppEnv['Bindings'],
): Promise<void> {
  await env.DB.prepare(
    'UPDATE user_keys SET daytona_sandbox_id = NULL WHERE email = ?',
  ).bind(email).run();
}

// ── POST /exec ─────────────────────────────────────────────────────

sandboxRoutes.post('/exec', async (c) => {
  const auth = await resolveAuth(c);
  if (auth instanceof Response) return auth;

  let body: { command?: string; workdir?: string };
  try {
    body = await c.req.json() as typeof body;
  } catch {
    return c.json({ error: { message: 'Invalid JSON in request body.', code: 400 } }, 400);
  }

  if (!body.command || typeof body.command !== 'string') {
    return c.json({ error: { message: 'Missing required field: command', code: 400 } }, 400);
  }

  const workdir = body.workdir || '/home/daytona/workspace';

  try {
    if (auth.isCampusMode) {
      return await execEphemeral(body.command, workdir, c);
    }

    if (!auth.userEmail) {
      return c.json({
        error: {
          message: 'Sandbox requires a BayLeaf API key (sk-bayleaf-...) or Campus Pass.',
          code: 403,
        },
      }, 403);
    }

    const sandboxId = await resolveSandboxId(auth.userEmail, c.env);
    const result = await execCommand(sandboxId, body.command, workdir, c.env);
    return c.json(result);
  } catch (e) {
    console.error('Sandbox exec error:', e);
    return c.json({
      error: { message: 'Sandbox execution failed. Please try again.', code: 502 },
    }, 502);
  }
});

/**
 * Handle ephemeral sandbox execution for campus-pass users.
 * Creates a sandbox, waits for it, executes the command, and tears it down.
 * The cleanup runs in a finally block so the sandbox is deleted even on error.
 */
async function execEphemeral(
  command: string,
  workdir: string,
  c: { env: AppEnv['Bindings']; json: (data: unknown, status?: number) => Response },
): Promise<Response> {
  let sandboxId: string | null = null;

  try {
    const sandbox = await createEphemeralSandbox(c.env);
    sandboxId = sandbox.id;

    if (sandbox.state !== 'started') {
      await waitForStarted(sandboxId, c.env);
    }
    await waitForReady(sandboxId, c.env);

    const result = await execCommand(sandboxId, command, workdir, c.env);
    return c.json(result);
  } finally {
    if (sandboxId) {
      deleteSandbox(sandboxId, c.env).catch((e) => {
        console.error('Ephemeral sandbox cleanup failed:', e);
      });
    }
  }
}

// ── GET /files/* ───────────────────────────────────────────────────

sandboxRoutes.get('/files/*', async (c) => {
  const auth = await resolveAuth(c);
  if (auth instanceof Response) return auth;

  if (auth.isCampusMode || !auth.userEmail) {
    return c.json({
      error: { message: 'File access requires a BayLeaf API key.', code: 403 },
    }, 403);
  }

  const filePath = extractFilePath(c.req.url);
  if (!filePath) {
    return c.json({ error: { message: 'Missing file path.', code: 400 } }, 400);
  }

  try {
    const sandboxId = await resolveSandboxId(auth.userEmail, c.env);
    const resp = await downloadFile(sandboxId, filePath, c.env);

    if (!resp.ok) {
      const status = resp.status === 404 ? 404 : 502;
      const message = resp.status === 404 ? `File not found: ${filePath}` : 'Failed to download file.';
      return c.json({ error: { message, code: status } }, status as 404 | 502);
    }

    const headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(resp.body, { status: 200, headers });
  } catch (e) {
    console.error('Sandbox file download error:', e);
    return c.json({
      error: { message: 'Failed to access sandbox file.', code: 502 },
    }, 502);
  }
});

// ── PUT /files/* ───────────────────────────────────────────────────

sandboxRoutes.put('/files/*', async (c) => {
  const auth = await resolveAuth(c);
  if (auth instanceof Response) return auth;

  if (auth.isCampusMode || !auth.userEmail) {
    return c.json({
      error: { message: 'File access requires a BayLeaf API key.', code: 403 },
    }, 403);
  }

  const filePath = extractFilePath(c.req.url);
  if (!filePath) {
    return c.json({ error: { message: 'Missing file path.', code: 400 } }, 400);
  }

  try {
    const body = await c.req.arrayBuffer();
    const sandboxId = await resolveSandboxId(auth.userEmail, c.env);
    await uploadFile(sandboxId, filePath, body, c.env);

    return c.json({ success: true, path: filePath, bytes: body.byteLength });
  } catch (e) {
    console.error('Sandbox file upload error:', e);
    return c.json({
      error: { message: 'Failed to upload file to sandbox.', code: 502 },
    }, 502);
  }
});

// ── DELETE / ───────────────────────────────────────────────────────

sandboxRoutes.delete('/', async (c) => {
  let email: string | null = null;

  const auth = await resolveAuth(c);
  if (!(auth instanceof Response) && auth.userEmail) {
    email = auth.userEmail;
  }

  if (!email) {
    const session = await getSession(c);
    if (session) email = session.email;
  }

  if (!email) {
    return c.json({ error: { message: 'Unauthorized', code: 401 } }, 401);
  }

  try {
    // Try cached ID first, then fall back to label lookup
    const row = await c.env.DB.prepare(
      'SELECT daytona_sandbox_id FROM user_keys WHERE email = ? AND revoked = 0',
    ).bind(email).first<Pick<UserKeyRow, 'daytona_sandbox_id'>>();

    let sandboxId = row?.daytona_sandbox_id ?? null;

    if (!sandboxId) {
      const sandbox = await findSandboxByLabel(email, c.env);
      sandboxId = sandbox?.id ?? null;
    }

    if (!sandboxId) {
      return c.json({ success: true, message: 'No sandbox found.' });
    }

    await deleteSandbox(sandboxId, c.env);
    await clearCachedSandboxId(email, c.env);
    return c.json({ success: true, message: 'Sandbox deleted.' });
  } catch (e) {
    console.error('Sandbox delete error:', e);
    return c.json({
      error: { message: 'Failed to delete sandbox.', code: 502 },
    }, 502);
  }
});

// ── Helpers ────────────────────────────────────────────────────────

function extractFilePath(url: string): string | null {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/sandbox\/files(\/.*)/);
  if (!match || match[1] === '/') return null;
  return decodeURIComponent(match[1]);
}
