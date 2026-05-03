# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx"]
# ///
"""
BayLeaf Chat — Retention Cleanup Job

Two-phase cleanup per RETENTION.md:

  Phase A: Delete conversations older than RETENTION_DAYS (default 90) with no
           recent activity. Users in any `hold:*` group are exempt.

  Phase B: Delete orphan files: file rows with no reference from any surviving
           chat or knowledge base, older than ORPHAN_GRACE_SECONDS (default
           86400 = 24h). The grace window protects in-flight uploads from
           temporary chats that have not yet been sent or saved.

Communicates exclusively through the OWUI admin API (no direct DB access).

Design principles:
  - Fails hard (non-zero exit) on ANY inconsistency or API error.
  - Logs are never sensitive: no user names, emails, chat titles, or IDs.
    Only aggregate counts appear in stdout.
  - DO App Platform captures stdout; configure "Failed job invocation" alert
    to get emailed on failures.
  - Phase B runs AFTER Phase A so that files attached to just-expired chats
    are correctly classified as orphans.

Usage:
    # Dry run (default): report what would be deleted
    uv run chat/retention_cleanup.py

    # Live run: actually delete
    DRY_RUN=false uv run chat/retention_cleanup.py

Environment:
    OWUI_URL              Base URL of the OWUI instance (required)
    OWUI_TOKEN            Admin bearer token (required)
    RETENTION_DAYS        Days of inactivity before chat deletion (default: 90)
    ORPHAN_GRACE_SECONDS  Min age for orphan file deletion (default: 86400)
    DRY_RUN               "true" (default) or "false"
"""

import argparse
import json
import os
import re
import sys
import time
import httpx


def parse_args():
    parser = argparse.ArgumentParser(
        description="BayLeaf Chat retention cleanup. Deletes conversations "
        "inactive for longer than RETENTION_DAYS. Users in hold:* groups are exempt.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
environment variables:
  OWUI_URL              Base URL of the OWUI instance (required)
  OWUI_TOKEN            Admin bearer token (required)
  RETENTION_DAYS        Days of inactivity before deletion (default: 90)
  RETENTION_SUNRISE     Policy announcement date, YYYY-MM-DD (optional).
                        Existing chats are treated as active until at least this
                        date, giving users a full RETENTION_DAYS grace period.
  ORPHAN_GRACE_SECONDS  Min age of an orphan file before deletion (default: 86400).
                        Protects in-flight uploads from temporary chats that have
                        not yet been sent or saved.
  DRY_RUN               "true" (default) or "false"

examples:
  # Dry run (default): report what would be deleted
  uv run chat/retention_cleanup.py

  # Live run: actually delete
  DRY_RUN=false uv run chat/retention_cleanup.py

  # Override retention period
  RETENTION_DAYS=30 uv run chat/retention_cleanup.py
""",
    )
    parser.add_argument(
        "--live", action="store_true",
        help="Run in live mode (actually delete). Overrides DRY_RUN env var.",
    )
    parser.add_argument(
        "--retention-days", type=int, default=None,
        help="Days of inactivity before deletion. Overrides RETENTION_DAYS env var.",
    )
    return parser.parse_args()


args = parse_args()

# --- Configuration ---

OWUI_URL = os.environ.get("OWUI_URL", "").rstrip("/")
OWUI_TOKEN = os.environ.get("OWUI_TOKEN", "")
RETENTION_DAYS = args.retention_days or int(os.environ.get("RETENTION_DAYS", "90"))
ORPHAN_GRACE_SECONDS = int(os.environ.get("ORPHAN_GRACE_SECONDS", str(86400)))

# Sunrise date: the date the retention policy was announced. All chats are
# treated as if their last activity was at least this date, giving existing
# users a full RETENTION_DAYS window from announcement to back up their data.
# Format: YYYY-MM-DD (UTC). If unset, no grace period (immediate enforcement).
_sunrise_env = os.environ.get("RETENTION_SUNRISE", "")
SUNRISE_TS: int | None = None
if _sunrise_env:
    try:
        SUNRISE_TS = int(time.mktime(time.strptime(_sunrise_env, "%Y-%m-%d")))
    except ValueError:
        print(
            f"FATAL: RETENTION_SUNRISE must be YYYY-MM-DD, got {_sunrise_env!r}",
            file=sys.stderr,
        )
        sys.exit(1)

# Mode resolution: --live requires DRY_RUN to not be "true".
# If --live is passed but DRY_RUN=true is set, abort (conflicting intent).
# Destructive action requires positive consent (--live) AND lack of negative
# consent (DRY_RUN not explicitly "true").
_dry_run_env = os.environ.get("DRY_RUN", "true").lower()
if args.live and _dry_run_env == "true" and "DRY_RUN" in os.environ:
    print(
        "FATAL: --live conflicts with DRY_RUN=true in environment. "
        "Unset DRY_RUN or set DRY_RUN=false to proceed.",
        file=sys.stderr,
    )
    sys.exit(1)

DRY_RUN = not args.live if args.live else _dry_run_env != "false"


def fail(msg: str):
    """Print error and exit non-zero. DO alerts trigger on this."""
    print(f"FATAL: {msg}", file=sys.stderr)
    sys.exit(1)


def log(msg: str):
    """Non-sensitive structured log line."""
    mode = "DRY_RUN" if DRY_RUN else "LIVE"
    print(f"[{mode}] {msg}")


# --- Preflight checks ---

if not OWUI_URL:
    fail("OWUI_URL is not set")
if not OWUI_TOKEN:
    fail("OWUI_TOKEN is not set")
if RETENTION_DAYS < 1:
    fail(f"RETENTION_DAYS must be >= 1, got {RETENTION_DAYS}")
if ORPHAN_GRACE_SECONDS < 0:
    fail(f"ORPHAN_GRACE_SECONDS must be >= 0, got {ORPHAN_GRACE_SECONDS}")

CUTOFF = int(time.time()) - (RETENTION_DAYS * 86400)
HEADERS = {"Authorization": f"Bearer {OWUI_TOKEN}"}
client = httpx.Client(base_url=OWUI_URL, headers=HEADERS, timeout=30)


# --- API helpers (fail hard on any error) ---

def check_health():
    """Verify OWUI is reachable and healthy before doing anything."""
    try:
        resp = client.get("/health")
    except httpx.RequestError as e:
        fail(f"Cannot reach OWUI: {e}")
    if resp.status_code != 200:
        fail(f"Health check returned HTTP {resp.status_code}")
    data = resp.json()
    if not data.get("status"):
        fail(f"Health check returned unhealthy: {data}")


def get_all_users() -> list[dict]:
    """Paginate through all users.

    OWUI API quirk: page 1 (or no page param) returns a bare list;
    pages > 1 return {"users": [...], "total": N}.
    """
    users = []
    page = 1
    while True:
        try:
            resp = client.get("/api/v1/users/", params={"page": page})
        except httpx.RequestError as e:
            fail(f"Network error fetching users page {page}: {e}")
        if resp.status_code != 200:
            fail(f"Users endpoint returned HTTP {resp.status_code} on page {page}")
        data = resp.json()
        if isinstance(data, list):
            batch = data
        elif isinstance(data, dict):
            batch = data.get("users", [])
        else:
            fail(f"Unexpected users response type: {type(data).__name__}")
        if not batch:
            break
        users.extend(batch)
        if len(batch) < 30:  # page size is fixed at 30
            break
        page += 1
    if not users:
        fail("Users list is empty (auth issue or misconfiguration?)")
    return users


def get_all_groups() -> dict[str, str]:
    """Get all groups, return {group_id: group_name} mapping."""
    try:
        resp = client.get("/api/v1/groups/")
    except httpx.RequestError as e:
        fail(f"Network error fetching groups: {e}")
    if resp.status_code != 200:
        fail(f"Groups endpoint returned HTTP {resp.status_code}")
    groups = resp.json()
    if not isinstance(groups, list):
        fail(f"Unexpected groups response type: {type(groups).__name__}")
    return {g["id"]: g["name"] for g in groups}


def is_held(user: dict, group_map: dict[str, str]) -> bool:
    """Check if any of the user's groups is a hold:* group."""
    for gid in user.get("group_ids", []):
        name = group_map.get(gid, "")
        if name.startswith("hold:"):
            return True
    return False


def get_user_chats(user_id: str) -> list[dict]:
    """Get all chats for a user via admin endpoint. Paginated."""
    chats = []
    page = 1
    while True:
        try:
            resp = client.get(
                f"/api/v1/chats/list/user/{user_id}", params={"page": page}
            )
        except httpx.RequestError as e:
            fail(f"Network error fetching chats: {e}")
        if resp.status_code != 200:
            fail(f"Chat list endpoint returned HTTP {resp.status_code}")
        data = resp.json()
        batch = data if isinstance(data, list) else data.get("chats", data.get("items", []))
        if not batch:
            break
        chats.extend(batch)
        if len(batch) < 30:
            break
        page += 1
    return chats


def delete_chat(chat_id: str) -> bool:
    """Delete a single chat. Returns True on success."""
    try:
        resp = client.delete(f"/api/v1/chats/{chat_id}")
    except httpx.RequestError as e:
        fail(f"Network error during delete: {e}")
    return resp.status_code == 200


# --- Orphan file sweep helpers ---

UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")


def get_all_files() -> list[dict]:
    """Paginate through all files via /api/v1/files/ ({items, total} envelope).

    Uses content=false to avoid shipping extracted text over the wire.
    """
    files = []
    page = 1
    while True:
        try:
            resp = client.get(
                "/api/v1/files/", params={"page": page, "content": "false"}
            )
        except httpx.RequestError as e:
            fail(f"Network error fetching files page {page}: {e}")
        if resp.status_code != 200:
            fail(f"Files endpoint returned HTTP {resp.status_code} on page {page}")
        data = resp.json()
        if not isinstance(data, dict) or "items" not in data:
            fail(f"Unexpected /api/v1/files/ response shape: {type(data).__name__}")
        batch = data.get("items", [])
        files.extend(batch)
        if len(files) >= data.get("total", 0):
            break
        if not batch:
            break
        page += 1
        if page > 500:  # hard stop guard
            fail("Files pagination exceeded 500 pages; likely a bug")
    return files


def get_all_knowledge_bases() -> list[dict]:
    """Paginate through all knowledge bases via /api/v1/knowledge/."""
    kbs = []
    page = 1
    while True:
        try:
            resp = client.get("/api/v1/knowledge/", params={"page": page})
        except httpx.RequestError as e:
            fail(f"Network error fetching knowledge page {page}: {e}")
        if resp.status_code != 200:
            fail(f"Knowledge endpoint returned HTTP {resp.status_code}")
        data = resp.json()
        # /api/v1/knowledge/ may return a list (small instances) or an envelope
        if isinstance(data, list):
            kbs.extend(data)
            break
        if isinstance(data, dict) and "items" in data:
            batch = data.get("items", [])
            kbs.extend(batch)
            if len(kbs) >= data.get("total", 0):
                break
            if not batch:
                break
            page += 1
            if page > 500:
                fail("Knowledge pagination exceeded 500 pages; likely a bug")
            continue
        fail(f"Unexpected /api/v1/knowledge/ response shape: {type(data).__name__}")
    return kbs


def get_kb_file_ids(kb_id: str) -> set[str]:
    """Return the set of file ids attached to a knowledge base."""
    try:
        resp = client.get(f"/api/v1/knowledge/{kb_id}/files")
    except httpx.RequestError as e:
        fail(f"Network error fetching KB files for {kb_id[:8]}: {e}")
    if resp.status_code != 200:
        fail(f"KB files endpoint returned HTTP {resp.status_code}")
    data = resp.json()
    items = data.get("items", []) if isinstance(data, dict) else (data or [])
    return {item["id"] for item in items if isinstance(item, dict) and item.get("id")}


def get_full_chat(chat_id: str) -> dict | None:
    """Fetch a single chat's full JSON. Returns None on 404."""
    try:
        resp = client.get(f"/api/v1/chats/{chat_id}")
    except httpx.RequestError as e:
        fail(f"Network error fetching chat: {e}")
    if resp.status_code == 404:
        return None
    if resp.status_code != 200:
        fail(f"Chat detail endpoint returned HTTP {resp.status_code}")
    return resp.json()


def delete_file(file_id: str) -> bool:
    """Delete a single file. Returns True on success."""
    try:
        resp = client.delete(f"/api/v1/files/{file_id}")
    except httpx.RequestError as e:
        fail(f"Network error during file delete: {e}")
    return resp.status_code == 200


# --- Main ---

def main():
    log(f"retention_days={RETENTION_DAYS}")
    log(f"cutoff={time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(CUTOFF))}")
    if SUNRISE_TS:
        log(f"sunrise={time.strftime('%Y-%m-%d', time.gmtime(SUNRISE_TS))}")
        grace_expires = time.strftime(
            "%Y-%m-%d", time.gmtime(SUNRISE_TS + RETENTION_DAYS * 86400)
        )
        log(f"grace_expires={grace_expires}")
    else:
        log("sunrise=none (immediate enforcement)")

    # 0. Health check
    check_health()
    log("health=ok")

    # 1. Get all users
    users = get_all_users()
    log(f"users_total={len(users)}")

    # 2. Get group map and identify held users
    group_map = get_all_groups()
    held_user_ids: set[str] = set()
    for user in users:
        if is_held(user, group_map):
            held_user_ids.add(user["id"])
    log(f"users_held={len(held_user_ids)}")

    # 3. Enumerate chats and apply retention
    total_scanned = 0
    total_expired = 0
    total_deleted = 0
    total_errors = 0
    users_impacted: set[str] = set()

    for user in users:
        uid = user["id"]
        if uid in held_user_ids:
            continue

        chats = get_user_chats(uid)
        for chat in chats:
            total_scanned += 1
            updated_at = chat.get("updated_at", 0)

            # Sunrise grace: treat activity as at least the sunrise date
            effective_updated = max(updated_at, SUNRISE_TS) if SUNRISE_TS else updated_at

            if effective_updated >= CUTOFF:
                continue  # still fresh (or protected by grace period)

            total_expired += 1
            chat_id = chat["id"]

            if DRY_RUN:
                users_impacted.add(uid)
            else:
                if delete_chat(chat_id):
                    total_deleted += 1
                    users_impacted.add(uid)
                else:
                    total_errors += 1

    # 4. Fail if any deletion errors occurred
    if total_errors > 0:
        # Log summary first so it's visible in DO logs before exit
        log(f"chats_scanned={total_scanned}")
        log(f"chats_expired={total_expired}")
        log(f"chats_deleted={total_deleted}")
        log(f"chats_errors={total_errors}")
        log(f"users_impacted={len(users_impacted)}")
        fail(f"{total_errors} deletion(s) failed")

    # 5. Phase A summary (non-sensitive aggregate only)
    log(f"chats_scanned={total_scanned}")
    log(f"chats_expired={total_expired}")
    if DRY_RUN:
        log(f"chats_would_delete={total_expired}")
    else:
        log(f"chats_deleted={total_deleted}")
    log(f"users_impacted={len(users_impacted)}")

    # --- Phase B: orphan file sweep ---
    #
    # Definition (per RETENTION.md §5): a file is an orphan when NO surviving
    # chat embeds its id in message JSON AND no knowledge base references it.
    # Files younger than ORPHAN_GRACE_SECONDS are exempt; this protects
    # in-flight uploads from temporary chats that have not yet been committed.
    #
    # Note: OWUI internally maintains a `chat_file` link table for permission
    # checks, which is not exposed through the API. Files referenced only by
    # that table (typically abandoned draft attachments that the user never
    # sent) are classified as orphans and deleted. This is intentional: those
    # files are no longer reachable through the UI.
    log(f"orphan_grace_seconds={ORPHAN_GRACE_SECONDS}")

    files = get_all_files()
    log(f"files_total={len(files)}")

    referenced_ids: set[str] = set()
    file_id_set: set[str] = {f["id"] for f in files if f.get("id")}

    # Reference source 1: knowledge bases
    kbs = get_all_knowledge_bases()
    log(f"knowledge_bases={len(kbs)}")
    for kb in kbs:
        kb_id = kb.get("id")
        if not kb_id:
            continue
        referenced_ids.update(get_kb_file_ids(kb_id))

    # Reference source 2: every surviving chat's full JSON.
    # After Phase A, expired chats have been deleted; their attachments
    # correctly no longer appear in anyone's chat list.
    chats_fetched = 0
    for user in users:
        uid = user["id"]
        # Re-list: a user whose chats were all expired during Phase A might
        # return an empty list now, which is fine.
        chats = get_user_chats(uid)
        for chat_summary in chats:
            chat_id = chat_summary.get("id")
            if not chat_id:
                continue
            full = get_full_chat(chat_id)
            if full is None:
                continue
            chats_fetched += 1
            # Match file UUIDs against the known file-id set. This avoids
            # picking up unrelated UUIDs (model ids, message ids, etc.).
            haystack = json.dumps(full)
            for uid_match in UUID_RE.findall(haystack):
                if uid_match in file_id_set:
                    referenced_ids.add(uid_match)

    log(f"chats_scanned_for_refs={chats_fetched}")
    log(f"files_referenced={len(referenced_ids)}")

    # Candidate orphans: unreferenced AND older than grace window
    now = int(time.time())
    grace_cutoff = now - ORPHAN_GRACE_SECONDS
    orphans = [
        f
        for f in files
        if f["id"] not in referenced_ids and f.get("created_at", 0) < grace_cutoff
    ]
    files_in_grace = sum(
        1
        for f in files
        if f["id"] not in referenced_ids and f.get("created_at", 0) >= grace_cutoff
    )
    log(f"files_in_grace={files_in_grace}")
    log(f"files_orphan={len(orphans)}")

    orphan_deleted = 0
    orphan_errors = 0
    if DRY_RUN:
        log(f"files_would_delete={len(orphans)}")
    else:
        for f in orphans:
            if delete_file(f["id"]):
                orphan_deleted += 1
            else:
                orphan_errors += 1
        log(f"files_deleted={orphan_deleted}")
        if orphan_errors > 0:
            log(f"files_errors={orphan_errors}")
            fail(f"{orphan_errors} orphan file deletion(s) failed")

    log("status=ok")


if __name__ == "__main__":
    main()
