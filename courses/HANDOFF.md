# courses/ — Handoff Notes

Written 2026-03-11 at the end of a long implementation session.
Pick this up in a fresh agent context.

---

## What Exists

`courses.bayleaf.dev` is live and deployed. The full stack:

- **Worker**: Hono + TypeScript + D1, deployed to Cloudflare
- **Auth**: Google OIDC (shared OAuth client with `api/`), JWT sessions
- **DALs**: Chat (Open WebUI) and Canvas, with mock/live switching via `USE_MOCK_DALS` env var
- **D1 schema**: `courses` and `memberships` tables (2 migrations applied)
- **All secrets set** in production: OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, SESSION_SECRET, OWUI_ADMIN_JWT, CANVAS_TOKEN

### File Layout

```
courses/src/
  index.ts              Entry point, route mounting, DAL middleware
  types.ts              Bindings, Session, AppEnv, CourseRow, MembershipRow
  constants.ts          GOOGLE_OIDC, SESSION_COOKIE, CANVAS_API
  middleware.ts         dalMiddleware (mock/live switch), requireSession
  dal/
    types.ts            ChatDAL + CanvasDAL interfaces, AccessGrant types
    mock-chat.ts        In-memory mock OWUI
    mock-canvas.ts      Canned Canvas data with injectClaimCode()
    live-chat.ts        Real OWUI admin API calls
    live-canvas.ts      Real Canvas REST API calls
  routes/
    auth.tsx            /login, /callback, /logout
    landing.tsx         GET / — dashboard with course lists
    courses.tsx         All course CRUD: register, verify, cancel, publish, join, leave, refresh, revoke, detail
  templates/
    layout.tsx          BaseLayout, ErrorPage, shared CSS
  utils/
    session.ts          JWT create/verify/clear
    html.ts             stripHtml, extractCanvasCourseId, generateClaimCode
```

### Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/` | GET | No | Landing / dashboard |
| `/login` | GET | No | OIDC start |
| `/callback` | GET | No | OIDC callback |
| `/logout` | GET | No | Clear session |
| `/courses` | POST | Yes | Register a Canvas course |
| `/courses/:id` | GET | Yes | Course detail page |
| `/courses/:id/verify` | POST | Yes | Verify Canvas claim code |
| `/courses/:id/cancel-claim` | POST | Yes | Cancel pending claim |
| `/courses/:id/publish` | POST | Yes | Create model in OWUI (staff) |
| `/courses/:id/join` | POST | Yes | Install model (student) |
| `/courses/:id/leave` | POST | Yes | Remove model access (student) |
| `/courses/:id/refresh` | POST | Yes | Re-sync prompt from Canvas (staff) |
| `/courses/:id/staff/:email/revoke` | POST | Yes | Remove staff member (staff) |

---

## Known Issue: Claim Flow Needs Rework

The current claim flow has a design problem that was identified during manual
testing but not yet fixed.

### The Problem

When someone registers a course (POST /courses), a `courses` row is created
with `claim_email` set to their email, and other users are blocked from
claiming the same course. This is wrong because:

1. A **student** might paste a course URL out of curiosity, see the claim
   instructions, realize they can't create a Canvas page, close the tab, and
   never come back. The course is now stuck — the student won't remember to
   cancel, and the real instructor can't claim it.

2. The cancel-claim button exists but requires the student to navigate back
   and explicitly cancel. Students who chicken out won't do this.

### The Intended Fix

**Don't block concurrent claims.** The claim code on the Canvas page is the
real security gate — only someone who can edit the Canvas page can verify.
So the flow should be:

1. **Anyone** can POST /courses with a Canvas URL and get a claim code.
2. If the course already exists and is pending, show them the **same claim
   instructions** with a **fresh claim code** (regenerate and update the
   row). This means the last person to register gets the active code —
   earlier codes become stale, which is fine.
3. If the course is already verified/published, redirect to the detail page.
4. **Anyone** can POST /courses/:id/verify. The Canvas page check is the
   auth — if the page contains the current claim code, whoever submitted
   the verify request becomes staff.
5. Remove the `claim_email` column and the `cancel-claim` route entirely.
   Pending claims are self-healing: a new registration just overwrites
   the stale claim code.

### What to Change

In `courses.tsx`:
- **POST /courses**: If course exists and is pending (`prompt_text` starts
  with `CLAIM:`), regenerate the claim code, update the row, and show
  instructions. Remove the `claim_email` blocking logic.
- **POST /courses/:id/verify**: Remove the `claim_email !== email` guard.
  Anyone who can prove Canvas page ownership gets staff.
- **DELETE the cancel-claim route**. No longer needed.
- **GET /courses/:id**: For pending courses, show claim instructions to
  everyone (not just the claimant). Anyone can attempt to verify.

In `landing.tsx`:
- Remove the "Pending Claims" section (no longer user-specific). Pending
  courses are just unverified — don't show them in listings at all, or
  show them generically.

In `types.ts`:
- `claim_email` can be kept in `CourseRow` for now (column exists in D1)
  but stop reading/writing it.

### Migration

A migration to drop `claim_email` is optional — SQLite ALTER TABLE DROP
COLUMN works in newer versions but it's simpler to just ignore the column.

---

## Other Notes

- **Claim code stripping bug was fixed**: Uses regex with escaped special
  chars and whitespace matching to remove the CLAIM:xxx token from the
  prompt text after verification.

- **Join doesn't clobber staff**: Fixed a bug where `INSERT OR REPLACE`
  on the memberships table would overwrite a staff membership with a user
  one. Now checks for existing membership first.

- **Mock testing**: `wrangler dev` with `USE_MOCK_DALS=true` in `.dev.vars`
  uses canned data. The mock Canvas DAL has `injectClaimCode()` which is
  called automatically during registration in mock mode so the verify flow
  works end-to-end locally.

- **Production DB is clean** (wiped at end of session). No stale test data.

- **Production is deployed** and matches the committed code.

---

## Commands

```bash
cd courses/
npm run dev          # Local dev (uses .dev.vars, mock DALs, local D1)
npm run deploy       # Deploy to production
npx tsc --noEmit     # Type check

# Local D1 management
npx wrangler d1 migrations apply bayleaf-courses --local
rm -rf .wrangler/state  # Reset local DB

# Remote D1
npx wrangler d1 migrations apply bayleaf-courses --remote
npx wrangler d1 execute bayleaf-courses --remote --command "SELECT * FROM courses;"
```
