# AGENTS.md

Guidelines for agentic coding agents working in this repository.

---

## Project Overview

Public repo for the **BayLeaf AI Playground** — an experimental Generative AI service
for the UC Santa Cruz campus community, operated by Adam Smith (Dept. of Computational
Media). **Publicly visible; never commit secrets, API keys, or credentials.**

- **BayLeaf Chat** — `https://bayleaf.chat` — Open WebUI with curated models,
  invite-code-gated groups, web search/browsing tools, and rate limiting.
- **BayLeaf API** — `https://api.bayleaf.chat` — OpenRouter-proxying API with keyless
  on-campus access and key-based off-campus access.
  Source: `https://github.com/rndmcnlly/bayleaf-api`

All LLM inference uses **zero-data-retention (ZDR)** providers via OpenRouter.

---

## Repository Structure

```
bayleaf/
├── docs/               # GitHub Pages site → https://about.bayleaf.chat
│   ├── CNAME
│   ├── index.html      # Single-file about/landing page
│   └── images/
├── README.md
└── AGENTS.md           # This file
```

`docs/` is published via GitHub Pages at `https://about.bayleaf.chat`. The apex
domain `https://bayleaf.chat` runs Open WebUI and is **not** managed here.

---

## Build / Lint / Test

No build step or test suite. The site is a single static HTML file.

**Local preview:** Use the VS Code **Live Server** extension (right-click
`docs/index.html` → *Open with Live Server*), which serves on `http://localhost:5500`
by default. Alternatively:

```bash
python3 -m http.server 8000 --directory docs
```

---

## Security & Privacy

- **No secrets in the repo.** No API keys, tokens, passwords, or `.env` files.
- Any code calling LLM APIs must use ZDR providers via OpenRouter; note this in comments.
- Invite codes, filter names, and internal operational details must not appear in
  committed files.

---

## Agent Conduct

This repo backs a live service used by the entire UC Santa Cruz campus community.
**Do not perform destructive or publishing actions unless explicitly asked.** This
includes — but is not limited to — committing, pushing, force-pushing, deleting
branches, or modifying GitHub settings. Always show the user a diff or summary and
wait for approval before touching git history or remote state.

---

## Commit Style

```
add:    new content or feature
update: change to existing content or feature
fix:    bug fix
docs:   documentation only
chore:  tooling, deps, CI
```

Concise, imperative mood: `add screenshot gallery to about page` ✓
