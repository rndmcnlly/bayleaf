/**
 * Dashboard Page Template
 */

import type { Session, UserKeyRow, OpenRouterKey } from '../types';
import type { SandboxInfo } from '../daytona';
import { baseLayout, recommendedModelHint, opencodeOnboardingSection } from './layout';

export function dashboardPage(
  session: Session,
  row: UserKeyRow | null,
  orKey: OpenRouterKey | null,
  recommendedModel: string,
  sandboxInfo?: SandboxInfo | null,
): string {
  const greeting = `Welcome, ${session.name || session.email}`;
  const hasKey = !!(row && orKey);

  // ── Key Card ───────────────────────────────────────────────────
  let keySection: string;

  if (hasKey) {
    keySection = `
      <div class="card" id="keyCard">
        <h3>Your API Key</h3>
        <div id="keyDisplaySlot"></div>
        <p style="margin-top: 0.5rem; font-size: 0.9em; color: #666;">
          This key authenticates both the LLM inference and sandbox services below.
        </p>
        <button class="btn btn-danger" style="margin-top: 0.75rem;" onclick="revokeKey()">Revoke Key</button>
      </div>
    `;
  } else {
    keySection = `
      <div class="card" id="keySection">
        <h3>Get Your API Key</h3>
        <p>You don't have an API key yet. Create one to start using the BayLeaf API.</p>
        <button class="btn" onclick="createKey()">Create API Key</button>
      </div>
    `;
  }

  // ── LLM Inference Card ─────────────────────────────────────────
  let llmSection = '';
  if (hasKey) {
    const remaining = orKey.limit_remaining?.toFixed(4) ?? 'N/A';

    llmSection = `
      <div class="card">
        <h3>LLM Inference</h3>
        <p>OpenAI-compatible chat completions and responses API, proxied through BayLeaf with zero data retention.</p>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">$${orKey.usage_daily.toFixed(4)}</div>
            <div class="stat-label">Today's Usage</div>
          </div>
          <div class="stat">
            <div class="stat-value">$${remaining}</div>
            <div class="stat-label">Remaining Today</div>
          </div>
          <div class="stat">
            <div class="stat-value">$${orKey.usage_monthly.toFixed(4)}</div>
            <div class="stat-label">This Month</div>
          </div>
        </div>
        <details style="margin-top: 1rem;">
          <summary style="cursor: pointer; color: #006aad; font-weight: 500;">Quick start</summary>
          <div style="margin-top: 0.75rem;">
            <p><strong>Endpoint:</strong></p>
            <div class="copy-box" onclick="copyToClipboard(this)">
              <code>https://api.bayleaf.dev/v1</code>
              <span class="copy-hint">Click to copy</span>
            </div>
            <p style="margin-top: 1rem;"><strong>Example:</strong></p>
            <pre><code>curl https://api.bayleaf.dev/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${recommendedModel}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'</code></pre>
            ${recommendedModelHint(recommendedModel)}
          </div>
        </details>
      </div>
    `;
  }

  // ── Sandbox Card ───────────────────────────────────────────────
  let sandboxSection = '';
  if (hasKey) {
    const state = sandboxInfo?.state ?? null;
    const stateLabel = state
      ? state.charAt(0).toUpperCase() + state.slice(1)
      : 'None';
    const stateColor = state === 'started' ? '#2d7d46'
      : state === 'stopped' ? '#b88a00'
      : state === 'archived' ? '#3a6fb5'
      : state === 'error' ? '#c41e3a'
      : '#666';

    let statsHtml = `
      <div class="stat">
        <div class="stat-value" style="color: ${stateColor}">${stateLabel}</div>
        <div class="stat-label">Status</div>
      </div>
    `;

    if (sandboxInfo) {
      if (sandboxInfo.cpu != null) {
        statsHtml += `
          <div class="stat">
            <div class="stat-value">${sandboxInfo.cpu}</div>
            <div class="stat-label">vCPU</div>
          </div>
        `;
      }
      if (sandboxInfo.memory != null) {
        statsHtml += `
          <div class="stat">
            <div class="stat-value">${sandboxInfo.memory} GB</div>
            <div class="stat-label">RAM</div>
          </div>
        `;
      }
      if (sandboxInfo.disk != null) {
        statsHtml += `
          <div class="stat">
            <div class="stat-value">${sandboxInfo.disk} GB</div>
            <div class="stat-label">Disk</div>
          </div>
        `;
      }
      if (sandboxInfo.createdAt) {
        const created = new Date(sandboxInfo.createdAt);
        const age = timeSince(created);
        statsHtml += `
          <div class="stat">
            <div class="stat-value">${age}</div>
            <div class="stat-label">Age</div>
          </div>
        `;
      }
    }

    let sandboxActions: string;
    if (sandboxInfo) {
      sandboxActions = `
        <button class="btn btn-danger" style="margin-top: 1rem;" onclick="deleteSandbox()">Delete Sandbox</button>
      `;
    } else {
      sandboxActions = `
        <p style="margin-top: 0.75rem; color: #666; font-size: 0.9em;">
          A sandbox will be created automatically on your first <code>POST /sandbox/exec</code> request.
        </p>
      `;
    }

    sandboxSection = `
      <div class="card" id="sandboxCard">
        <h3>Code Sandbox</h3>
        <p>A persistent Linux environment for running code, accessible via the API.</p>
        <div class="stats">${statsHtml}</div>
        ${sandboxActions}
        <details style="margin-top: 1rem;">
          <summary style="cursor: pointer; color: #006aad; font-weight: 500;">Quick start</summary>
          <div style="margin-top: 0.75rem;">
            <p><strong>Run a command:</strong></p>
            <pre><code>curl https://api.bayleaf.dev/sandbox/exec \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"command": "echo hello"}'</code></pre>
            <p style="margin-top: 0.75rem;"><strong>Upload a file:</strong></p>
            <pre><code>curl https://api.bayleaf.dev/sandbox/files/home/daytona/workspace/hello.txt \\
  -X PUT \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  --data-binary "Hello, world!"</code></pre>
            <p style="margin-top: 0.75rem;"><strong>Download a file:</strong></p>
            <pre><code>curl https://api.bayleaf.dev/sandbox/files/home/daytona/workspace/hello.txt \\
  -H "Authorization: Bearer YOUR_API_KEY"</code></pre>
            <p style="margin-top: 0.75rem; font-size: 0.9em; color: #666;">
              Sandboxes auto-stop after ${sandboxInfo?.autoStopInterval ?? 15} min idle and auto-archive after ${sandboxInfo?.autoArchiveInterval ?? 60} min stopped.
              The first request after idle may take a few seconds while the sandbox restarts.
            </p>
          </div>
        </details>
      </div>
    `;
  }

  // ── Scripts ────────────────────────────────────────────────────
  const bayleafToken = row?.bayleaf_token || '';
  const scripts = `
    <script>
      const BAYLEAF_TOKEN = '${bayleafToken}';

      function copyToClipboard(el) {
        const code = el.querySelector('code');
        if (!code) return;
        const text = code.textContent;
        if (!navigator.clipboard) {
          const range = document.createRange();
          range.selectNodeContents(code);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy');
          sel.removeAllRanges();
        } else {
          navigator.clipboard.writeText(text);
        }
        el.querySelector('.copy-hint').textContent = 'Copied!';
        setTimeout(() => {
          el.querySelector('.copy-hint').textContent = 'Click to copy';
        }, 1200);
      }

      function copyToken() {
        const input = document.getElementById('apiKey');
        navigator.clipboard.writeText(input.value);
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
      }
      
      function toggleKeyVisibility() {
        const input = document.getElementById('apiKey');
        const btn = document.getElementById('toggleBtn');
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = 'Hide';
        } else {
          input.type = 'password';
          btn.textContent = 'Show';
        }
      }
      
      async function createKey() {
        const res = await fetch('/key', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.key) {
          sessionStorage.setItem('newKey', data.key);
          location.reload();
        } else {
          alert(data.error || 'Failed to create key');
        }
      }

      async function revokeKey() {
        if (!confirm('Revoke your API key? You can create a new one afterward.')) return;
        const res = await fetch('/key', { method: 'DELETE' });
        if (res.ok) {
          location.reload();
        } else {
          alert('Failed to revoke key');
        }
      }

      async function deleteSandbox() {
        if (!confirm('Delete your sandbox? All files in it will be permanently lost.')) return;
        const res = await fetch('/sandbox', { method: 'DELETE' });
        if (res.ok) {
          location.reload();
        } else {
          alert('Failed to delete sandbox');
        }
      }

      // On page load: show key display
      (function() {
        const newKey = sessionStorage.getItem('newKey');
        const displaySlot = document.getElementById('keyDisplaySlot');
        if (!displaySlot) return;

        if (newKey) {
          sessionStorage.removeItem('newKey');
          displaySlot.innerHTML = \`
            <div class="success" style="margin-bottom: 1rem;">
              <strong>Your new API key is ready.</strong>
              <p style="font-size: 0.9em; color: #155724; margin: 0.25rem 0 0 0;">Use the Copy button — the key is hidden to keep it safe during screen sharing.</p>
            </div>
            <div class="key-display" style="margin-bottom: 1rem;">
              <input type="password" value="\${newKey}" id="apiKey" readonly>
              <button class="btn copy-btn" id="copyBtn" onclick="copyToken()">Copy</button>
            </div>
          \`;
        } else if (BAYLEAF_TOKEN) {
          displaySlot.innerHTML = \`
            <div class="key-display" style="margin-bottom: 1rem;">
              <input type="password" value="\${BAYLEAF_TOKEN}" id="apiKey" readonly>
              <button class="btn copy-btn" id="copyBtn" onclick="copyToken()">Copy</button>
              <button class="btn copy-btn" id="toggleBtn" onclick="toggleKeyVisibility()" style="right: 4rem;">Show</button>
            </div>
          \`;
        }
      })();
    </script>
  `;

  return baseLayout('Dashboard', `
    <p>${greeting} | <a href="/logout">Sign out</a></p>
    ${keySection}
    ${llmSection}
    ${sandboxSection}
    ${opencodeOnboardingSection(recommendedModel)}
    ${scripts}
  `);
}

/** Format a duration from a date to now as a human-readable string. */
function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return '<1m';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  const days = Math.floor(seconds / 86400);
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}
