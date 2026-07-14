# Persistence ADR

Status: `ACTIVE_AUTHORITY`

## Decision

Dexie is the single structured browser-persistence boundary for approved
non-secret product records. Pinia owns active client state; TanStack Vue Query
owns server reads; explicit adapters serialize versioned records. Zod validates
every persisted version before hydration.

Authentication is not a Dexie or Query-persistence category. No cookie session
or BFF is assumed. The confirmed compatibility lifecycle uses one project-owned
local-storage adapter with a strict Zod schema and a 43,200-second expiry. It
retains only the account token, uid, and display label.

## Categories

1. Durable public preferences.
2. Workspace layout/session metadata.
3. Recoverable local drafts.
4. Sanitized URL-shareable selection state.
5. Memory-only API Query cache.
6. Memory-only live state.
7. Minimum accepted auth state, only after a Web contract is verified.
8. Never-persist state.

Every new field names exactly one category, owner, schema version, expiration,
recovery behavior, reset behavior, and security classification.

## Rules

- Passwords and password digests are never persisted.
- URL/query tokens, upstream shared credentials, HMAC secrets, MQTT material,
  cookies, raw API responses, and credential-bearing URLs are never persisted.
- Obsolete identity and guest-credential keys are not restored or recreated.
- Initialization restores only `kaisaile.auth.v1` after schema and expiry
  validation; invalid or expired records are removed.
- Live payloads and replay API data are memory-only. Private Query entries are
  never dehydrated or written to Dexie.
- Workspace handoffs reject token-like fields and store only sanitized source
  selection context.
- Logout/auth loss clears private Query entries, protected replay, protected
  handoffs, and active analysis. It preserves local/public PGN work, theme,
  language, layout, and public tournament selection.
- Invalid or unknown persisted versions fail closed and expose a recoverable
  reset path without fabricating state.

## Existing approved persistence

- theme preference through the project preference adapter;
- non-sensitive workspace layout through the versioned Dexie adapter;
- sanitized short-lived workspace handoff context through its project adapter.

Any new cloud/share persistence remains blocked by
`WEB_API_ENDPOINT_INVENTORY.json` until its credential and response contracts
are verified.
