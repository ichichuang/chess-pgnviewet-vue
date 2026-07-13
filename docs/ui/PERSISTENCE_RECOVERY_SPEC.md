# Persistence and Recovery Specification

## Purpose

Define how user preferences, workspace session state, draft state, URL state, API cache, live transient state, auth state, and never-persist state are stored, versioned, migrated, expired, secured, recovered, reset, and tested.

## Scope

This document governs:

- Persistence categories and ownership.
- Storage technology per category.
- Refresh recovery sequence.
- Security constraints for sensitive data.
- Migration and versioning rules.
- Test requirements.

## Non-goals

- Domain model definitions live in `docs/architecture/FRONTEND_ARCHITECTURE_RFC.md`.
- API contracts live in `docs/api/*`.
- Theme tokens live in `docs/ui/THEME_SYSTEM_SPEC.md`.

## Persistence categories

### 1. Durable user preferences

| Attribute        | Value                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Storage          | Dexie `preferences` table                                                                                                   |
| Example fields   | `themeMode`, `accentColor`, `boardTheme`, `language`, `defaultAnalysisDepth`, `pieceSet`, `showCoordinates`, `soundEnabled` |
| Versioning       | Schema version per table; migration function per version bump                                                               |
| Migration        | Zod schema validates stored record; invalid records reset to defaults                                                       |
| Expiration       | None; persisted indefinitely                                                                                                |
| Security         | Non-sensitive; may be read by app                                                                                           |
| Refresh recovery | Rehydrated before first paint; theme mode applied to `html`                                                                 |
| Reset behavior   | Reset to defaults via settings; clears table rows                                                                           |
| Tests            | Rehydration test, migration test, reset test                                                                                |

### 2. Workspace session state

| Attribute        | Value                                                                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storage          | Dexie `workspaceSession` table                                                                                                                                                                                                                                                      |
| Example fields   | `selectedMode`, `selectedSource`, `workspaceTabs`, `selectedTournamentId`, `selectedRoundId`, `selectedPairingId`, `selectedGameId`, `selectedBoardId`, `selectedPgnPosition`, `currentMoveIndex`, `panelLayout`, `collapsedPanels`, `splitSizes`, `displayMode`, `bigScreenConfig` |
| Versioning       | Schema version per table                                                                                                                                                                                                                                                            |
| Migration        | Zod migration pipeline; drop unknown fields; preserve known fields                                                                                                                                                                                                                  |
| Expiration       | Cleared by explicit workspace reset or after 30 days of inactivity (configurable)                                                                                                                                                                                                   |
| Security         | Non-sensitive; auth-bound private references are forbidden and must live in a separate private cache                                                                                                                                                                                |
| Refresh recovery | Rehydrated before workspace render; stale sources fall back safely                                                                                                                                                                                                                  |
| Reset behavior   | New workspace clears non-pinned tabs; logout retains public selections/layout while clearing auth-bound private state                                                                                                                                                               |
| Tests            | Refresh recovery E2E, fallback test, logout public-state-retention/private-state-clear test                                                                                                                                                                                         |

### 3. Recoverable draft state

| Attribute        | Value                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Storage          | Dexie `drafts` table                                                                        |
| Example fields   | `teachingNotesDraft`, `pendingAnnotationEdits`, `unsavedPgnMutations`, `cloudSavePathDraft` |
| Versioning       | Schema version per draft type                                                               |
| Migration        | Validate against draft schema; discard unrecoverable drafts                                 |
| Expiration       | 7 days or until explicitly saved/discarded                                                  |
| Security         | Non-sensitive; may reference cloud paths                                                    |
| Refresh recovery | Restored when the same PGN/source is reopened; conflicts prompt user                        |
| Reset behavior   | Discard on successful save or explicit discard                                              |
| Tests            | Draft restore test, conflict prompt test, discard test                                      |

### 4. URL-shareable state

| Attribute        | Value                                                                          |
| ---------------- | ------------------------------------------------------------------------------ |
| Storage          | URL query parameters                                                           |
| Example fields   | `handoff`, `mode`, `source` (only when shareable), `moveIndex`, `panelVisible` |
| Versioning       | Handoff token versioned by backend; URL params versioned by app                |
| Migration        | Unknown params ignored; deprecated params mapped once                          |
| Expiration       | Lives with URL                                                                 |
| Security         | Must not contain tokens, MQTT credentials, or PII                              |
| Refresh recovery | Re-read from URL on load; handoff resolved and removed                         |
| Reset behavior   | Browser back/forward updates URL state                                         |
| Tests            | URL round-trip test, handoff resolution test, no-secret-in-URL audit           |

### 5. API query cache

| Attribute        | Value                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Storage          | TanStack Query cache (in-memory with optional persistence)                                                     |
| Example fields   | Competition list, pairing data, game info, PGN history, user profile                                           |
| Versioning       | Query key includes endpoint version tag                                                                        |
| Migration        | Invalidate keys on schema version change                                                                       |
| Expiration       | Per-query `staleTime`/`gcTime`; typically minutes to hours                                                     |
| Security         | May contain user data; persistence disabled for sensitive queries unless encrypted                             |
| Refresh recovery | Re-fetched automatically using restored query keys; cache rehydration optional                                 |
| Reset behavior   | Logout evicts authenticated/private entries; public tournament and replay reads may remain but must revalidate |
| Tests            | Cache invalidation test, re-fetch on refresh test                                                              |

### 6. Live stream transient state

| Attribute        | Value                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Storage          | In-memory Pinia state and explicit service/composable state only                                |
| Example fields   | Current live board FEN, last move, clock, connection status, pending moves                      |
| Versioning       | Not persisted                                                                                   |
| Migration        | Not applicable                                                                                  |
| Expiration       | Cleared when leaving live mode or on disconnect                                                 |
| Security         | May contain live credentials; never persisted                                                   |
| Refresh recovery | Re-establish stream from persisted selection; replay recent moves from API history if available |
| Reset behavior   | Clear on disconnect, mode switch, or logout                                                     |
| Tests            | Disconnect recovery test, no-persistence audit                                                  |

### 7. Sensitive session/auth state

| Attribute        | Value                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| Storage          | No accepted auth persistence until the Web login lifecycle is verified; never Dexie, URL, or Query cache |
| Example fields   | Future minimum source-confirmed token and identity fields only                                           |
| Versioning       | Project-owned strict schema after contract approval                                                      |
| Migration        | Legacy token/user-info keys are cleanup inputs, never restoration authority                              |
| Expiration       | Verified token/server expiry when present; otherwise no durable restoration                              |
| Security         | No password/digest, HMAC, shared credential, URL token, or duplicated compatibility key                  |
| Refresh recovery | Anonymous until an approved minimum record and expiry contract exist                                     |
| Reset behavior   | Local logout or HTTP 401 clears private state; no remote endpoint is invented                            |
| Validation       | Secret scan, storage audit, typecheck, production build, and narrow browser evidence                     |

### 8. Never-persist state

| Attribute        | Value                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Storage          | In-memory only                                                                                                      |
| Example fields   | Temporary tool state (active drawing color), ephemeral UI toggles, transient notification queue, clipboard contents |
| Versioning       | Not applicable                                                                                                      |
| Migration        | Not applicable                                                                                                      |
| Expiration       | Cleared on page unload                                                                                              |
| Security         | Must not contain secrets                                                                                            |
| Refresh recovery | Reset to defaults on refresh                                                                                        |
| Reset behavior   | Always resets                                                                                                       |
| Tests            | No-persistence audit                                                                                                |

## Fields preserved across refresh

Refreshing the page must NOT reset:

- Workspace tabs and selected tab.
- Selected workspace mode and source.
- Selected tournament, group, round, pairing, game, board.
- Selected PGN position and current move index.
- Panel layout, collapsed panels, split sizes.
- Theme mode, accent color, board theme, language preference.
- Analysis panel state (visible, engine depth, chart mode).
- Teaching notes draft and selected annotation layer.
- Display mode and big-screen configuration.

After refresh, the app must re-call required APIs and re-render fresh data while preserving the above UI state.

## Dexie table design

```ts
interface AppDatabase {
  preferences: {
    key: string;
    value: unknown;
    updatedAt: number;
  };
  workspaceSession: {
    id: 'current';
    mode: WorkspaceMode;
    source: WorkspaceSource;
    selections: SelectionState;
    layout: LayoutState;
    updatedAt: number;
  };
  drafts: {
    id: string;
    scope: string;
    payload: unknown;
    createdAt: number;
    updatedAt: number;
  };
}
```

Each table has a `schemaVersion` constant. Migrations run inside Dexie `upgrade` callbacks and validate with Zod.

## Refresh recovery sequence

1. **Prepaint preferences** — read `themeMode`, `accentColor`, and `language` from Dexie and apply them to `html` before Vue mounts.
2. **Hydrate workspace session** — read `workspaceSession` and restore mode/source/selections/layout.
3. **Validate and migrate** — run Zod schemas; drop or reset invalid fields.
4. **Restore drafts** — load teaching notes and pending annotations for the current scope.
5. **Rehydrate query cache** — if persisted cache is enabled, restore non-sensitive TanStack Query entries.
6. **Fetch required data** — TanStack Query triggers fetches using restored query keys.
7. **Render workspace** — components receive fresh data without resetting user selections.
8. **Handle stale source** — if the persisted source is unavailable, fall back safely and notify.

## Rules

### R1. Categorize every persisted field

Every field stored on the client must belong to one of the eight categories above.

### R2. Auth state is contract-gated

No auth persistence is accepted until a Web-only lifecycle is verified. Cookie
sessions, BFFs, refresh endpoints, and browser token storage are not invented.
Passwords, digests, HMAC material, shared credentials, and URL tokens never
touch client storage.

### R3. Version and migrate every persisted table

Dexie tables have schema versions and Zod-validated migrations.

### R4. URL state must not leak secrets

URL query parameters must not contain tokens, MQTT credentials, PII, or live board secrets.

### R5. Live state is transient

Live stream data is in-memory only. Recovery re-establishes the stream, not a snapshot.

### R6. Reset behavior is explicit

Each category documents what clears it: logout, new workspace, explicit reset, or expiry. Logout clears auth/private caches and secrets but preserves non-sensitive public workspace selections, layout, and public tournament context.

## Acceptance criteria

1. Eight persistence categories are defined with storage location, example fields, versioning, migration, expiration, security, refresh recovery, reset behavior, and tests.
2. The list of fields preserved across refresh matches the user requirement.
3. Dexie table design and refresh recovery sequence are documented.
4. Auth secrets are explicitly excluded from Dexie, localStorage, and URL.
5. URL state security constraints are documented.
6. Live stream state is classified as transient and in-memory only.

## Open questions / risks

- Whether TanStack Query cache should be persisted to IndexedDB for offline resilience; if so, sensitive queries must be excluded or encrypted.
- Whether 30-day inactivity expiration for workspace session is acceptable to users.

## Machine-readable summary

```json
{
  "document": "persistence-recovery-spec",
  "version": "1.0.0",
  "rules": [
    "categorize_every_persisted_field",
    "auth_secrets_never_touch_client_storage",
    "version_and_migrate_every_persisted_table",
    "url_state_no_secrets",
    "live_state_is_transient",
    "reset_behavior_is_explicit"
  ],
  "categories": [
    "durable_user_preferences",
    "workspace_session_state",
    "recoverable_draft_state",
    "url_shareable_state",
    "api_query_cache",
    "live_stream_transient_state",
    "sensitive_session_auth_state",
    "never_persist_state"
  ],
  "storage_technologies": {
    "dexie": ["durable_user_preferences", "workspace_session_state", "recoverable_draft_state"],
    "url_query_params": ["url_shareable_state"],
    "tanstack_query_cache": ["api_query_cache"],
    "in_memory": ["live_stream_transient_state", "never_persist_state"],
    "contract_gated_auth_adapter": ["sensitive_session_auth_state"]
  },
  "refresh_recovery_sequence": [
    "prepaint_preferences",
    "hydrate_workspace_session",
    "validate_and_migrate",
    "restore_drafts",
    "rehydrate_query_cache",
    "fetch_required_data",
    "render_workspace",
    "handle_stale_source"
  ],
  "related_docs": [
    "docs/architecture/FRONTEND_ARCHITECTURE_RFC.md",
    "docs/ui/THEME_SYSTEM_SPEC.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md",
    "docs/ui/LAYOUT_SYSTEM_SPEC.md"
  ],
  "next_doc": "docs/ui/ACCESSIBILITY_SPEC.md"
}
```
