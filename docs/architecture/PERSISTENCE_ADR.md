# Persistence ADR

Status: `ACTIVE_AUTHORITY`  
Runtime implementation: `NOT_IN_P0`

## Decision

Dexie is the single structured browser-persistence boundary. Pinia owns active client state; TanStack Vue Query owns server reads; explicit adapters serialize approved non-secret records to Dexie. Zod validates every persisted version before hydration.

## Categories

1. Durable preferences.
2. Workspace session.
3. Recoverable drafts.
4. URL-shareable state.
5. API query cache.
6. Live transient state.
7. Sensitive auth/session state.
8. Never-persist state.

Every new field must name exactly one category, owner, schema version, expiration, recovery behavior, reset behavior, and security classification before implementation.

## Rules

- Auth tokens, upstream credentials, HMAC secrets, MQTT material, cookies, and sensitive response fields never enter Dexie, localStorage, sessionStorage, URLs, reports, screenshots, or persisted query caches.
- The browser owns no credential vault; authentication uses an opaque HttpOnly same-origin cookie.
- Live stream state is memory-only. Refresh reconnects from a non-secret selection; it does not persist a live payload or credential.
- Workspace mode/source, selections, PGN position, panel geometry, theme/language, analysis preferences, drafts, and display configuration recover after refresh when their contracts are approved.
- Logout clears auth/private caches and secrets while preserving non-sensitive public tournament selection, workspace layout, and public replay context.
- Invalid or unknown persisted versions fail closed, retain no secret material, and surface a recoverable reset path.
- P0 installs Dexie/Zod only; it creates no database, tables, localStorage fallback, or sample state.

## Migration gate

Any legacy storage import requires an explicit allowlist, versioned parser, Zod schema, dry-run evidence, rollback behavior, and tests. Raw browser databases and profiles are never migration sources.

