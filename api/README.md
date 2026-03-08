# BayLeaf API

API key provisioning, LLM inference proxy, and sandboxed code execution for UC Santa Cruz, part of the [BayLeaf AI Playground](https://bayleaf.dev).

## Features

- **OIDC Authentication**: Sign in with UCSC Google accounts
- **API Key Provisioning**: Automatic key management (one key per user, authenticates all services)
- **Inference Proxy**: OpenAI-compatible Chat Completions and Responses API endpoints with campus-specific system prompt injection
- **Code Sandbox**: Persistent Linux sandbox per user for code execution, file upload/download — backed by Daytona
- **Self-Service Dashboard**: Create, view, and revoke API keys; see LLM usage stats and sandbox status
- **Campus Pass**: On-campus users can access inference and ephemeral sandboxes without authentication

## Architecture

This is a Cloudflare Worker (Hono) with a D1 database:

1. Authenticates users via Google OIDC (restricted to `@ucsc.edu`)
2. Uses the OpenRouter Provisioning API to manage per-user LLM API keys
3. Proxies `/v1/*` requests to OpenRouter, injecting a configurable system prompt prefix
4. Proxies `/sandbox/*` requests to Daytona for sandboxed code execution and file operations

A single `sk-bayleaf-` token authenticates both the LLM inference proxy and the sandbox service. D1 stores the key mapping and caches the Daytona sandbox ID to avoid a control-plane lookup per request.

### D1 Schema

```
user_keys
├── email                TEXT PRIMARY KEY
├── bayleaf_token        TEXT NOT NULL UNIQUE   ← user-facing key
├── or_key_hash          TEXT NOT NULL          ← OpenRouter key hash (for lookup)
├── or_key_secret        TEXT NOT NULL          ← OpenRouter key secret (for proxying)
├── revoked              INTEGER DEFAULT 0
├── created_at           TEXT DEFAULT now()
└── daytona_sandbox_id   TEXT DEFAULT NULL      ← cached sandbox ID
```

## Deployment

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Google Cloud project with OAuth 2.0 credentials
- OpenRouter account with Provisioning API key
- Daytona account with API key

### Setup

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/rndmcnlly/bayleaf.git
   cd bayleaf/api
   npm install
   ```

2. Create the D1 database and apply migrations:
   ```bash
   wrangler d1 create bayleaf-keys
   wrangler d1 migrations apply bayleaf-keys --remote
   ```

3. Configure secrets:
   ```bash
   wrangler secret put OPENROUTER_PROVISIONING_KEY
   wrangler secret put OIDC_CLIENT_ID
   wrangler secret put OIDC_CLIENT_SECRET
   wrangler secret put CAMPUS_POOL_KEY
   wrangler secret put DAYTONA_API_KEY
   ```

4. Update `wrangler.jsonc` with your configuration (non-secret values)

5. Deploy:
   ```bash
   npm run deploy
   ```

6. **Important**: After deployment is working, disable observability in `wrangler.jsonc` to avoid data accumulation:
   ```jsonc
   "observability": {
     "enabled": false
   }
   ```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `https://api.bayleaf.dev/callback`
4. Set the OIDC client ID and secret as Cloudflare secrets

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SPENDING_LIMIT_DOLLARS` | Daily spending limit per user | `1.0` |
| `SPENDING_LIMIT_RESET` | Limit reset period | `daily` |
| `KEY_NAME_TEMPLATE` | Template for key names (`$email` replaced) | `BayLeaf API for $email` |
| `ALLOWED_EMAIL_DOMAIN` | Restrict to this email domain | `ucsc.edu` |
| `SYSTEM_PROMPT_PREFIX` | Prefix injected into all chat requests | `You are an AI assistant...` |
| `CAMPUS_IP_RANGES` | CIDR ranges for Campus Pass (comma-separated, empty = disabled) | `128.114.0.0/16,169.233.0.0/16` |
| `CAMPUS_SYSTEM_PREFIX` | Additional system prompt prefix for Campus Pass users | `Note: This user is using shared access...` |
| `DAYTONA_API_URL` | Sandbox provider control plane URL | `https://app.daytona.io/api` |
| `DAYTONA_PROXY_URL` | Sandbox provider toolbox proxy URL | `https://proxy.app.daytona.io/toolbox` |
| `DAYTONA_DEPLOYMENT_LABEL` | Label prefix for sandbox tagging | `api.bayleaf.dev` |

### Secrets

| Secret | Description |
|--------|-------------|
| `OPENROUTER_PROVISIONING_KEY` | OpenRouter provisioning API key |
| `OIDC_CLIENT_ID` | Google OAuth client ID |
| `OIDC_CLIENT_SECRET` | Google OAuth client secret |
| `CAMPUS_POOL_KEY` | Shared OpenRouter key for Campus Pass |
| `DAYTONA_API_KEY` | Sandbox provider API key |

## Campus Pass

Campus Pass allows users on the UC Santa Cruz campus network to access the API without signing in or creating a personal API key.

### How it works

1. When a request arrives at `/v1/*` or `/sandbox/exec` with no API key (or `Bearer campus`), the system checks the client IP
2. If the IP matches a configured campus CIDR range, the request is proxied using a shared pool key (for LLM) or an ephemeral sandbox (for code execution)
3. Ephemeral sandboxes are created per-request and deleted immediately after execution
4. An additional system prompt prefix is injected for LLM requests to inform the model about the shared access context

### Configuration

1. Pre-provision a shared OpenRouter key and add it as a secret:
   ```bash
   wrangler secret put CAMPUS_POOL_KEY
   ```

2. Set the campus IP ranges in `wrangler.jsonc`:
   ```jsonc
   "CAMPUS_IP_RANGES": "128.114.0.0/16,169.233.0.0/16,192.35.220.0/24,192.35.223.0/24,2607:F5F0::/32"
   ```

### Usage

On-campus users can access the API without any authentication:

```bash
# LLM Chat Completions — no Authorization header needed on campus
curl https://api.bayleaf.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek/deepseek-v3.2", "messages": [{"role": "user", "content": "Hello!"}]}'

# Sandbox — ephemeral, one-shot execution on campus
curl https://api.bayleaf.dev/sandbox/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "echo hello from campus"}'
```

Off-campus users will receive a 401 error directing them to get a personal key at https://api.bayleaf.dev/

## API Endpoints

### User-Facing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Landing page |
| `/login` | GET | Start OIDC flow |
| `/callback` | GET | OIDC callback |
| `/logout` | GET | Clear session |
| `/dashboard` | GET | Dashboard (key management, LLM stats, sandbox status) |
| `/key` | GET | Get current key info (JSON) |
| `/key` | POST | Create new key (returns key in JSON) |
| `/key` | DELETE | Revoke current key |

### LLM Inference Proxy

| Endpoint | Description |
|----------|-------------|
| `/v1/responses` | Responses API (system prompt injected via `instructions` field) |
| `/v1/chat/completions` | Chat completions (system prompt injected via system message) |
| `/v1/completions` | Text completions |
| `/v1/models` | List available models |
| `/v1/*` | All other OpenRouter endpoints |

### Code Sandbox

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/sandbox/exec` | POST | Campus Pass or keyed | Execute a bash command. Body: `{"command": "...", "workdir?": "..."}`. Returns `{"exitCode": 0, "output": "..."}` |
| `/sandbox/files/*` | GET | Keyed only | Download a file by absolute path |
| `/sandbox/files/*` | PUT | Keyed only | Upload a file by absolute path (raw body) |
| `/sandbox` | DELETE | Keyed or session | Destroy the user's sandbox |

Keyed users get a persistent sandbox (auto-stops after 15 min idle, auto-archives after 60 min stopped, recreated transparently on next request). Campus Pass users get ephemeral sandboxes that are deleted after each execution.

Default working directory is `/home/daytona/workspace`. No output truncation.

## License

MIT License - see [LICENSE](LICENSE)

## Links

- [BayLeaf Chat](https://bayleaf.dev)
- [OpenRouter](https://openrouter.ai/)
- [Daytona](https://www.daytona.io/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
