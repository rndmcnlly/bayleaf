/**
 * Course Routes — Core CRUD and Workflow
 *
 * All routes require authentication (session middleware applied in index.ts).
 * DALs are available via c.var.chatDAL and c.var.canvasDAL.
 */

import { Hono } from 'hono';
import type { AppEnv, CourseRow, MembershipRow } from '../types';
import type { AccessGrant } from '../dal/types';
import { injectClaimCode } from '../dal/mock-canvas';
import { BaseLayout, cardStyle, btnStyle, errorStyle } from '../templates/layout';
import { stripHtml, extractCanvasCourseId, generateClaimCode } from '../utils/html';

export const courseRoutes = new Hono<AppEnv>();

// ── Helpers ─────────────────────────────────────────────────────

function modelId(courseId: number): string {
  return `course-${courseId}`;
}

// ── POST /courses — Start course registration ───────────────────

courseRoutes.post('/courses', async (c) => {
  const body = await c.req.parseBody();
  const canvasUrl = (body['canvas_url'] as string ?? '').trim();

  const courseId = extractCanvasCourseId(canvasUrl);
  if (!courseId) {
    return c.html(
      <BaseLayout title="Invalid URL">
        <div class={errorStyle}>
          <h2>Invalid Canvas URL</h2>
          <p>Please paste a full Canvas course URL like <code>https://canvas.ucsc.edu/courses/85291</code>.</p>
          <p><a href="/">Go back</a></p>
        </div>
      </BaseLayout>,
      400,
    );
  }

  // Check if course already registered
  const existing = await c.env.DB.prepare(
    'SELECT * FROM courses WHERE canvas_course_id = ?'
  ).bind(courseId).first<CourseRow>();

  if (existing) {
    // Already verified or published — go to the detail page
    if (!existing.prompt_text.startsWith('CLAIM:')) {
      return c.redirect(`/courses/${courseId}`, 302);
    }

    // Pending claim — regenerate code so the latest registrant gets the active code.
    // Earlier codes become stale, which is fine — Canvas page check is the real gate.
    const freshCode = generateClaimCode();
    await c.env.DB.prepare(
      `UPDATE courses SET prompt_text = ? WHERE canvas_course_id = ?`
    ).bind(freshCode, courseId).run();

    // In mock mode, inject the new code so verify works locally
    if (c.env.USE_MOCK_DALS === 'true') {
      injectClaimCode(courseId, freshCode);
    }

    return c.html(
      <BaseLayout title="Claim Your Course">
        <h2>Claim: {existing.name}</h2>
        <div class={cardStyle}>
          <p>To verify you have instructor access to this course, follow these steps:</p>
          <ol>
            <li>Go to your course on Canvas: <a href={canvasUrl} target="_blank">{canvasUrl}</a></li>
            <li>Create a new <strong>Page</strong> titled exactly: <code>BayLeaf AI</code></li>
            <li>Paste this claim code anywhere on the page:
              <pre style="background: #f4f4f4; padding: 0.5rem 1rem; border-radius: 4px; font-size: 1.1rem; user-select: all;">{freshCode}</pre>
            </li>
            <li>Save the page, then click the button below to verify.</li>
          </ol>
          <p style="color: #666; font-size: 0.9rem;">
            Tip: You can also write your AI system prompt on this page (below or above the claim code).
            After verification, the full page content becomes the model's system prompt.
          </p>
        </div>
        <form method="post" action={`/courses/${courseId}/verify`} style="margin-top: 1rem;">
          <button type="submit" class={btnStyle}>Verify Claim</button>
        </form>
      </BaseLayout>,
    );
  }

  // Fetch course info from Canvas
  const courseInfo = await c.var.canvasDAL.getCourseInfo(courseId);
  if (!courseInfo) {
    return c.html(
      <BaseLayout title="Course Not Found">
        <div class={errorStyle}>
          <h2>Course Not Found</h2>
          <p>Could not find course {courseId} on Canvas. Check the URL and try again.</p>
          <p><a href="/">Go back</a></p>
        </div>
      </BaseLayout>,
      404,
    );
  }

  // Generate claim code
  const claimCode = generateClaimCode();

  // Insert course with claim code in prompt_text
  // No staff membership yet — that happens after verification
  await c.env.DB.prepare(
    `INSERT INTO courses (canvas_course_id, name, base_model, prompt_text)
     VALUES (?, ?, ?, ?)`
  ).bind(courseId, courseInfo.name, c.env.DEFAULT_BASE_MODEL, claimCode).run();

  // In mock mode, auto-inject claim code so verify flow works without real Canvas
  if (c.env.USE_MOCK_DALS === 'true') {
    injectClaimCode(courseId, claimCode);
  }

  return c.html(
    <BaseLayout title="Claim Your Course">
      <h2>Claim: {courseInfo.name}</h2>
      <div class={cardStyle}>
        <p>To verify you have instructor access to this course, follow these steps:</p>
        <ol>
          <li>Go to your course on Canvas: <a href={canvasUrl} target="_blank">{canvasUrl}</a></li>
          <li>Create a new <strong>Page</strong> titled exactly: <code>BayLeaf AI</code></li>
          <li>Paste this claim code anywhere on the page:
            <pre style="background: #f4f4f4; padding: 0.5rem 1rem; border-radius: 4px; font-size: 1.1rem; user-select: all;">{claimCode}</pre>
          </li>
          <li>Save the page, then click the button below to verify.</li>
        </ol>
        <p style="color: #666; font-size: 0.9rem;">
          Tip: You can also write your AI system prompt on this page (below or above the claim code).
          After verification, the full page content becomes the model's system prompt.
        </p>
      </div>
      <form method="post" action={`/courses/${courseId}/verify`} style="margin-top: 1rem;">
        <button type="submit" class={btnStyle}>Verify Claim</button>
      </form>
    </BaseLayout>,
  );
});

// ── POST /courses/:id/verify — Verify claim code on Canvas ──────

courseRoutes.post('/courses/:id/verify', async (c) => {
  const courseId = parseInt(c.req.param('id'), 10);
  const email = c.var.session.email;

  const course = await c.env.DB.prepare(
    'SELECT * FROM courses WHERE canvas_course_id = ?'
  ).bind(courseId).first<CourseRow>();

  if (!course) {
    return c.html(
      <BaseLayout title="Not Found">
        <div class={errorStyle}>
          <h2>Course Not Found</h2>
          <p><a href="/">Go back</a></p>
        </div>
      </BaseLayout>,
      404,
    );
  }

  // The claim code is stored in prompt_text during registration
  const claimCode = course.prompt_text;
  if (!claimCode.startsWith('CLAIM:')) {
    // Already verified
    return c.redirect(`/courses/${courseId}`, 302);
  }

  // Anyone can attempt verification — the Canvas page check is the real auth gate.
  // Read the "BayLeaf AI" page from Canvas
  const page = await c.var.canvasDAL.getPageByTitle(courseId, 'bayleaf-ai');
  if (!page) {
    return c.html(
      <BaseLayout title="Page Not Found">
        <div class={errorStyle}>
          <h2>BayLeaf AI Page Not Found</h2>
          <p>Could not find a page titled "BayLeaf AI" in course {courseId} on Canvas.</p>
          <p>Create the page, add the claim code, and try again.</p>
          <p><a href={`/courses/${courseId}`}>Go back</a></p>
        </div>
      </BaseLayout>,
      400,
    );
  }

  // Check for claim code in page body
  if (!page.body.includes(claimCode)) {
    return c.html(
      <BaseLayout title="Claim Code Not Found">
        <div class={errorStyle}>
          <h2>Claim Code Not Found</h2>
          <p>Found the "BayLeaf AI" page, but it doesn't contain the claim code:</p>
          <pre style="background: #f4f4f4; padding: 0.5rem 1rem; border-radius: 4px;">{claimCode}</pre>
          <p>Add the code to the page, save it, and try again.</p>
          <p><a href={`/courses/${courseId}`}>Go back</a></p>
        </div>
      </BaseLayout>,
      400,
    );
  }

  // Claim verified! Strip HTML from the page body and remove the claim code.
  // Also strip any stale CLAIM:xxx tokens (from earlier registrations) as a safety net.
  const rawText = stripHtml(page.body);
  const promptText = rawText.replace(/CLAIM:[a-f0-9]+/g, '').replace(/\s+/g, ' ').trim();
  const pageUrl = `https://canvas.ucsc.edu/courses/${courseId}/pages/${page.url}`;

  // Store verified prompt (claim code is replaced with actual content)
  await c.env.DB.prepare(
    `UPDATE courses SET prompt_text = ?, canvas_page_url = ?
     WHERE canvas_course_id = ?`
  ).bind(promptText, pageUrl, courseId).run();

  // Now register the claimant as staff (verification succeeded)
  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO memberships (canvas_course_id, email, role)
     VALUES (?, ?, 'staff')`
  ).bind(courseId, email).run();

  return c.redirect(`/courses/${courseId}`, 302);
});

// ── POST /courses/:id/publish — Publish model to OWUI ───────────

courseRoutes.post('/courses/:id/publish', async (c) => {
  const courseId = parseInt(c.req.param('id'), 10);
  const email = c.var.session.email;

  // Verify staff membership
  const membership = await c.env.DB.prepare(
    `SELECT * FROM memberships WHERE canvas_course_id = ? AND email = ? AND role = 'staff'`
  ).bind(courseId, email).first<MembershipRow>();

  if (!membership) {
    return c.html(
      <BaseLayout title="Unauthorized">
        <div class={errorStyle}>
          <h2>Not Authorized</h2>
          <p>You are not a staff member of this course.</p>
          <p><a href="/">Go back</a></p>
        </div>
      </BaseLayout>,
      403,
    );
  }

  const course = await c.env.DB.prepare(
    'SELECT * FROM courses WHERE canvas_course_id = ?'
  ).bind(courseId).first<CourseRow>();

  if (!course) return c.redirect('/', 302);

  if (course.prompt_text.startsWith('CLAIM:')) {
    return c.html(
      <BaseLayout title="Not Verified">
        <div class={errorStyle}>
          <h2>Course Not Verified</h2>
          <p>Complete the claim verification before publishing.</p>
          <p><a href={`/courses/${courseId}`}>Go back</a></p>
        </div>
      </BaseLayout>,
      400,
    );
  }

  // Resolve staff OWUI user ID for write access grant
  const staffUser = await c.var.chatDAL.searchUserByEmail(email);
  const initialGrants: AccessGrant[] = [];
  if (staffUser) {
    initialGrants.push({ principal_type: 'user', principal_id: staffUser.id, permission: 'write' });
    // Update membership with OWUI user ID
    await c.env.DB.prepare(
      `UPDATE memberships SET owui_user_id = ? WHERE canvas_course_id = ? AND email = ?`
    ).bind(staffUser.id, courseId, email).run();
  }

  // Create the model in OWUI
  const mid = modelId(courseId);
  const displayName = `Course: ${course.name}`;
  const description = `Canvas course ${courseId}`;
  const model = await c.var.chatDAL.createModel(
    mid, displayName, description, course.base_model, course.prompt_text, initialGrants,
  );

  if (!model) {
    return c.html(
      <BaseLayout title="Publish Failed">
        <div class={errorStyle}>
          <h2>Failed to Publish</h2>
          <p>Could not create the model in BayLeaf Chat. The model ID <code>{mid}</code> may already exist, or the Chat service may be unavailable.</p>
          <p><a href={`/courses/${courseId}`}>Go back</a></p>
        </div>
      </BaseLayout>,
      500,
    );
  }

  // Mark as published
  await c.env.DB.prepare(
    `UPDATE courses SET published = 1, owui_model_id = ? WHERE canvas_course_id = ?`
  ).bind(mid, courseId).run();

  return c.redirect(`/courses/${courseId}`, 302);
});

// ── POST /courses/:id/join — Student installs course model ──────

courseRoutes.post('/courses/:id/join', async (c) => {
  const courseId = parseInt(c.req.param('id'), 10);
  const email = c.var.session.email;

  const course = await c.env.DB.prepare(
    'SELECT * FROM courses WHERE canvas_course_id = ? AND published = 1'
  ).bind(courseId).first<CourseRow>();

  if (!course) {
    return c.html(
      <BaseLayout title="Not Found">
        <div class={errorStyle}>
          <h2>Course Not Found</h2>
          <p>This course is not published or does not exist.</p>
          <p><a href="/">Go back</a></p>
        </div>
      </BaseLayout>,
      404,
    );
  }

  // Resolve OWUI user
  const owuiUser = await c.var.chatDAL.searchUserByEmail(email);
  if (!owuiUser) {
    return c.html(
      <BaseLayout title="Account Required">
        <div class={errorStyle}>
          <h2>BayLeaf Chat Account Required</h2>
          <p>
            You need to sign in to <a href="https://chat.bayleaf.dev" target="_blank">chat.bayleaf.dev</a> at
            least once before installing a course model. This creates your account in the system.
          </p>
          <p>After signing in there, come back here and try again.</p>
          <p><a href={`/courses/${courseId}`}>Go back</a></p>
        </div>
      </BaseLayout>,
      400,
    );
  }

  // Read-modify-write access grants
  const mid = modelId(courseId);
  const currentGrants = await c.var.chatDAL.getModelAccessGrants(mid);

  // Check if already granted
  const alreadyGranted = currentGrants.some(
    (g) => g.principal_type === 'user' && g.principal_id === owuiUser.id && g.permission === 'read'
  );

  if (!alreadyGranted) {
    const newGrants: AccessGrant[] = [
      ...currentGrants,
      { principal_type: 'user', principal_id: owuiUser.id, permission: 'read' },
    ];
    await c.var.chatDAL.setModelAccessGrants(mid, newGrants);
  }

  // Success page with deep link and instructions
  const deepLink = `${c.env.OWUI_BASE_URL}/?model=${mid}`;
  const displayName = `Course: ${course.name}`;
  return c.html(
    <BaseLayout title="Installed!">
      <div class={cardStyle} style="background: #d4edda;">
        <h2>Model Installed</h2>
        <p>You now have access to <strong>{course.name}</strong> in BayLeaf Chat.</p>
        <a href={deepLink} class={btnStyle} target="_blank" style="margin-top: 0.5rem;">
          Open in BayLeaf Chat
        </a>
        <p style="margin-top: 1rem; color: #555; font-size: 0.9rem;">
          To find this model later, open <a href={c.env.OWUI_BASE_URL} target="_blank">BayLeaf Chat</a> and
          select <strong>{displayName}</strong> from the model selector at the top of a new chat.
        </p>
      </div>
    </BaseLayout>,
  );
});

// ── POST /courses/:id/leave — Student removes course model ──────

courseRoutes.post('/courses/:id/leave', async (c) => {
  const courseId = parseInt(c.req.param('id'), 10);
  const email = c.var.session.email;

  const owuiUser = await c.var.chatDAL.searchUserByEmail(email);
  if (!owuiUser) {
    return c.redirect(`/courses/${courseId}`, 302);
  }

  // Remove read grant from OWUI
  const mid = modelId(courseId);
  const currentGrants = await c.var.chatDAL.getModelAccessGrants(mid);
  const filteredGrants = currentGrants.filter(
    (g) => !(g.principal_type === 'user' && g.principal_id === owuiUser.id && g.permission === 'read')
  );
  await c.var.chatDAL.setModelAccessGrants(mid, filteredGrants);

  return c.redirect(`/courses/${courseId}`, 302);
});

// ── POST /courses/:id/refresh — Re-sync prompt from Canvas ──────

courseRoutes.post('/courses/:id/refresh', async (c) => {
  const courseId = parseInt(c.req.param('id'), 10);
  const email = c.var.session.email;

  // Verify staff
  const membership = await c.env.DB.prepare(
    `SELECT * FROM memberships WHERE canvas_course_id = ? AND email = ? AND role = 'staff'`
  ).bind(courseId, email).first<MembershipRow>();

  if (!membership) {
    return c.html(
      <BaseLayout title="Unauthorized">
        <div class={errorStyle}><h2>Not Authorized</h2><p><a href="/">Go back</a></p></div>
      </BaseLayout>,
      403,
    );
  }

  const course = await c.env.DB.prepare(
    'SELECT * FROM courses WHERE canvas_course_id = ?'
  ).bind(courseId).first<CourseRow>();

  if (!course) return c.redirect('/', 302);

  // Fetch page from Canvas
  const page = await c.var.canvasDAL.getPageByTitle(courseId, 'bayleaf-ai');
  if (!page) {
    return c.html(
      <BaseLayout title="Page Not Found">
        <div class={errorStyle}>
          <h2>BayLeaf AI Page Not Found</h2>
          <p>Could not find the "BayLeaf AI" page in course {courseId} on Canvas.</p>
          <p><a href={`/courses/${courseId}`}>Go back</a></p>
        </div>
      </BaseLayout>,
      400,
    );
  }

  const promptText = stripHtml(page.body);

  // Update D1
  await c.env.DB.prepare(
    `UPDATE courses SET prompt_text = ? WHERE canvas_course_id = ?`
  ).bind(promptText, courseId).run();

  // Update OWUI model if published
  if (course.published && course.owui_model_id) {
    await c.var.chatDAL.updateModelPrompt(course.owui_model_id, promptText);
  }

  return c.redirect(`/courses/${courseId}`, 302);
});

// ── POST /courses/:id/staff/:email/revoke — Remove a staff member

courseRoutes.post('/courses/:id/staff/:email/revoke', async (c) => {
  const courseId = parseInt(c.req.param('id'), 10);
  const targetEmail = decodeURIComponent(c.req.param('email'));
  const callerEmail = c.var.session.email;

  // Verify caller is staff
  const callerMembership = await c.env.DB.prepare(
    `SELECT * FROM memberships WHERE canvas_course_id = ? AND email = ? AND role = 'staff'`
  ).bind(courseId, callerEmail).first<MembershipRow>();

  if (!callerMembership) {
    return c.html(
      <BaseLayout title="Unauthorized">
        <div class={errorStyle}><h2>Not Authorized</h2><p><a href="/">Go back</a></p></div>
      </BaseLayout>,
      403,
    );
  }

  // Get target membership
  const targetMembership = await c.env.DB.prepare(
    `SELECT * FROM memberships WHERE canvas_course_id = ? AND email = ? AND role = 'staff'`
  ).bind(courseId, targetEmail).first<MembershipRow>();

  if (targetMembership) {
    // Remove write access grant from OWUI if they have an OWUI ID
    if (targetMembership.owui_user_id) {
      const mid = modelId(courseId);
      const currentGrants = await c.var.chatDAL.getModelAccessGrants(mid);
      const filteredGrants = currentGrants.filter(
        (g) => !(g.principal_type === 'user' && g.principal_id === targetMembership.owui_user_id && g.permission === 'write')
      );
      await c.var.chatDAL.setModelAccessGrants(mid, filteredGrants);
    }

    // Delete membership
    await c.env.DB.prepare(
      `DELETE FROM memberships WHERE canvas_course_id = ? AND email = ? AND role = 'staff'`
    ).bind(courseId, targetEmail).run();
  }

  return c.redirect(`/courses/${courseId}`, 302);
});

// ── GET /courses/:id — Course detail page ───────────────────────

courseRoutes.get('/courses/:id', async (c) => {
  const courseId = parseInt(c.req.param('id'), 10);
  const email = c.var.session.email;

  const course = await c.env.DB.prepare(
    'SELECT * FROM courses WHERE canvas_course_id = ?'
  ).bind(courseId).first<CourseRow>();

  if (!course) {
    return c.html(
      <BaseLayout title="Not Found">
        <div class={errorStyle}><h2>Course Not Found</h2><p><a href="/">Go back</a></p></div>
      </BaseLayout>,
      404,
    );
  }

  const isPendingClaim = course.prompt_text.startsWith('CLAIM:');

  // If claim is pending, show claim-verification instructions to everyone.
  // Anyone who can put the code on the Canvas page can verify — that's the auth gate.
  if (isPendingClaim) {
    return c.html(
      <BaseLayout title={course.name}>
        <h2>{course.name}</h2>
        <p style="color: #666;">Canvas course {courseId}</p>

        <div class={cardStyle} style="border-color: #e67e22;">
          <h3 style="color: #e67e22; margin-top: 0;">Awaiting Verification</h3>
          <p>This course hasn't been verified yet. If you're an instructor, follow these steps to claim it:</p>
          <ol>
            <li>Go to your course on Canvas: <a href={`https://canvas.ucsc.edu/courses/${courseId}`} target="_blank">canvas.ucsc.edu/courses/{courseId}</a></li>
            <li>Create a new <strong>Page</strong> titled exactly: <code>BayLeaf AI</code></li>
            <li>Paste this claim code anywhere on the page:
              <pre style="background: #f4f4f4; padding: 0.5rem 1rem; border-radius: 4px; font-size: 1.1rem; user-select: all;">{course.prompt_text}</pre>
            </li>
            <li>Save the page, then click the button below.</li>
          </ol>
          <p style="color: #666; font-size: 0.9rem;">
            Tip: You can also write your AI system prompt on this page. After verification, the full page content (minus the claim code) becomes the model's system prompt.
          </p>
          <form method="post" action={`/courses/${courseId}/verify`} style="margin-top: 1rem;">
            <button type="submit" class={btnStyle}>Verify Claim</button>
          </form>
        </div>

        <p style="margin-top: 2rem;"><a href="/">Back to all courses</a></p>
      </BaseLayout>,
    );
  }

  // Course is verified — show full detail page
  const staffRows = await c.env.DB.prepare(
    `SELECT * FROM memberships WHERE canvas_course_id = ? AND role = 'staff'`
  ).bind(courseId).all<MembershipRow>();

  const isStaff = staffRows.results.some((m) => m.email === email);

  // Student enrollment comes from OWUI access grants (source of truth)
  const mid = modelId(courseId);
  const deepLink = `${c.env.OWUI_BASE_URL}/?model=${mid}`;
  let isUser = false;
  let userCount = 0;

  if (course.published) {
    const grants = await c.var.chatDAL.getModelAccessGrants(mid);
    const staffUserIds = new Set(
      grants.filter((g) => g.permission === 'write').map((g) => g.principal_id)
    );
    const readGrants = grants.filter(
      (g) => g.principal_type === 'user' && g.permission === 'read' && !staffUserIds.has(g.principal_id)
    );
    userCount = readGrants.length;

    // Check if current user is enrolled
    const owuiUser = await c.var.chatDAL.searchUserByEmail(email);
    if (owuiUser) {
      isUser = readGrants.some((g) => g.principal_id === owuiUser.id);
    }
  }

  return c.html(
    <BaseLayout title={course.name}>
      <h2>{course.name}</h2>
      <p style="color: #666;">
        Canvas course {courseId}
        {course.canvas_page_url && (
          <span> &middot; <a href={course.canvas_page_url} target="_blank">BayLeaf AI page</a></span>
        )}
        {course.published ? (
          <span> &middot; <span style="color: #28a745; font-weight: bold;">Published</span></span>
        ) : (
          <span> &middot; <span style="color: #dc3545;">Not published</span></span>
        )}
      </p>

      {/* Staff Controls */}
      {isStaff && (
        <div class={cardStyle}>
          <h3>Staff Controls</h3>

          {!course.published && (
            <form method="post" action={`/courses/${courseId}/publish`} style="margin-bottom: 1rem;">
              <button type="submit" class={btnStyle}>Publish Model</button>
              <span style="margin-left: 0.5rem; color: #666; font-size: 0.9rem;">Creates the model in BayLeaf Chat</span>
            </form>
          )}

          <form method="post" action={`/courses/${courseId}/refresh`} style="margin-bottom: 1rem;">
            <button type="submit" class={btnStyle} style="background: #555;">Refresh Prompt from Canvas</button>
          </form>

          <details style="margin-top: 1rem;">
            <summary style="cursor: pointer; color: #666;">Staff members ({staffRows.results.length})</summary>
            <ul style="margin-top: 0.5rem;">
              {staffRows.results.map((m) => (
                <li key={m.email}>
                  {m.email}
                  {m.email !== email && (
                    <form method="post" action={`/courses/${courseId}/staff/${encodeURIComponent(m.email)}/revoke`} style="display: inline; margin-left: 0.5rem;">
                      <button type="submit" style="background: none; border: none; color: #dc3545; cursor: pointer; font-size: 0.85rem;">revoke</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {/* Prompt Preview */}
      <div class={cardStyle}>
        <h3>System Prompt</h3>
        <p style="color: #666; font-size: 0.85rem; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">
          {course.prompt_text || '(empty)'}
        </p>
      </div>

      {/* User Actions */}
      {course.published && (
        <div class={cardStyle}>
          <h3>For Students</h3>
          <p>{userCount} student{userCount !== 1 ? 's' : ''} installed</p>
          {isUser ? (
            <div>
              <a href={deepLink} class={btnStyle} target="_blank">Open in BayLeaf Chat</a>
              <form method="post" action={`/courses/${courseId}/leave`} style="display: inline; margin-left: 1rem;">
                <button type="submit" style="background: none; border: 1px solid #dc3545; color: #dc3545; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Leave</button>
              </form>
            </div>
          ) : (
            <form method="post" action={`/courses/${courseId}/join`}>
              <button type="submit" class={btnStyle}>Install Model</button>
            </form>
          )}
        </div>
      )}

      <p style="margin-top: 2rem;"><a href="/">Back to all courses</a></p>
    </BaseLayout>,
  );
});
