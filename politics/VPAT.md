# VPAT and BayLeaf

BayLeaf's working-draft Accessibility Conformance Report (ACR) lives in four files:

- [VPAT-overview.md](VPAT-overview.md): framing memo, scope, policy drivers (ADA Title II, Section 508, UC IMG-2150), evaluation methodology, open questions for the AI Council and accessibility stakeholders, future work, and references. Read this first.
- [VPAT-chat.md](VPAT-chat.md): per-surface ACR for BayLeaf Chat at [`chat.bayleaf.dev`](https://chat.bayleaf.dev) (Open WebUI deployment). Includes the AI-generated-output section, because that concern is Chat-specific.
- [VPAT-api.md](VPAT-api.md): per-surface ACR for the BayLeaf API at [`api.bayleaf.dev`](https://api.bayleaf.dev), covering the public landing and the authenticated dashboard (both served from BayLeaf-authored Hono/JSX templates).
- [VPAT-pages.md](VPAT-pages.md): per-surface ACR for the bayleaf.dev static pages: the landing at [`bayleaf.dev`](https://bayleaf.dev) (from [`docs/index.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/index.html)) and the support page at [`bayleaf.dev/support.html`](https://bayleaf.dev/support.html) (from [`docs/support.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/support.html)), sharing [`docs/style.css`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/style.css).

Each per-surface ACR carries its own header, a surface description, a full WCAG 2.1 A/AA conformance table scoped to that surface, and the Section 508 and EN 301 549 tables that apply to the service as a whole. The overview carries the material that is common across surfaces.

Sibling documents in this directory: [HECVAT.md](HECVAT.md) (security), [FERPA.md](FERPA.md) (student privacy), [SECURITY.md](SECURITY.md) (platform data handling), [DEPENDENCIES.md](DEPENDENCIES.md) (dependency audit).
