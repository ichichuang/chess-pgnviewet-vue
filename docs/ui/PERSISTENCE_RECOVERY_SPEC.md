# Persistence and Recovery Specification

## Purpose

Define how user preferences, workspace session state, draft state, URL state, API cache, live transient state, auth state, and never-persist state are stored, versioned, migrated, expired, secured, recovered, reset, and validated.

## Scope

This document governs:

- Persistence categories and ownership.
- Storage technology per category.
- Refresh recovery sequence.
- Security constraints for sensitive data.
- Migration and versioning rules.
- Validation requirements.

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
| Validation       | Static ownership scan, Zod schema inspection, TypeScript checking, and storage/reset/reload inspection in a real browser    |

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
| Validation       | Static ownership scan, TypeScript checking, refresh/reload inspection, and logout public/private-state inspection in a real browser                                                                                                                                                 |

### 3. Recoverable draft state

| Attribute        | Value                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Storage          | Dexie `drafts` table                                                                                                                     |
| Example fields   | `gameTeachingNoteDraft`, `pendingNodeAnnotationEdits`, `unsavedLocalPgnMutations`; lesson/session notes only after `OD-02` approval      |
| Versioning       | Schema version per draft type                                                                                                            |
| Migration        | Validate against draft schema; discard unrecoverable drafts                                                                              |
| Expiration       | 7 days or until explicitly saved/discarded                                                                                               |
| Security         | Non-sensitive local-copy data only; no protected source payload, remote write target, auth value, or credential reference                |
| Refresh recovery | Restored only with the same validated local teaching-game/node owner; conflicts prompt user                                              |
| Reset behavior   | Discard on explicit local commit/discard or when its owning local copy is deleted                                                        |
| Validation       | Zod schema inspection, TypeScript checking, and manual restore/conflict/discard validation in a real browser without creating test files |

### 4. URL-shareable state

| Attribute        | Value                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Storage          | URL query parameters                                                                                                |
| Example fields   | `handoff`, `mode`, `source` (only when shareable), `moveIndex`, `panelVisible`                                      |
| Versioning       | Project-owned handoff context identifiers and URL params are versioned by app                                       |
| Migration        | Unknown params ignored; deprecated params mapped once                                                               |
| Expiration       | Lives with URL                                                                                                      |
| Security         | Must not contain tokens, MQTT credentials, or PII                                                                   |
| Refresh recovery | Re-read safe URL state; resolve a local handoff context when present                                                |
| Reset behavior   | Browser back/forward updates URL state                                                                              |
| Validation       | Static URL-secret scan, TypeScript checking, manual URL round-trip/handoff resolution, and contract-evidence review |

### 5. API query cache

| Attribute        | Value                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Storage          | TanStack Query cache in memory only                                                                                           |
| Example fields   | Competition list, pairing data, game info, PGN history, user profile                                                          |
| Versioning       | Query key includes endpoint version tag                                                                                       |
| Migration        | Invalidate keys on schema version change                                                                                      |
| Expiration       | Per-query `staleTime`/`gcTime`; typically minutes to hours                                                                    |
| Security         | May contain user data; no Query authentication data or server response is persisted                                           |
| Refresh recovery | Re-fetched from validated URL/source selection; no Query cache rehydration                                                    |
| Reset behavior   | Logout evicts authenticated/private entries and replay reads; public tournament queries remain and must revalidate            |
| Validation       | Static ownership scan, TypeScript checking, production build, and manual refresh/re-fetch/logout inspection in a real browser |

### 6. Live stream transient state

| Attribute        | Value                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Storage          | In-memory Pinia state and explicit service/composable state only                                                                       |
| Example fields   | Current live board FEN, last move, clock, connection status, pending moves                                                             |
| Versioning       | Not persisted                                                                                                                          |
| Migration        | Not applicable                                                                                                                         |
| Expiration       | Cleared when leaving live mode or on disconnect                                                                                        |
| Security         | May contain live credentials; never persisted                                                                                          |
| Refresh recovery | Re-establish stream from persisted selection; replay recent moves from API history if available                                        |
| Reset behavior   | Clear on disconnect, mode switch, or logout                                                                                            |
| Validation       | Static no-persistence scan, TypeScript checking, contract-evidence review, and manual disconnect/recovery inspection in a real browser |

### 7. Sensitive session/auth state

| Attribute        | Value                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Storage          | `localStorage` key `kaisaile.auth.v1`, owned only by `src/persistence/auth/authPersistence.ts`; never Dexie, URL, or persisted Query cache |
| Example fields   | `token`, `uid`, `accountLabel`, and `expiresAt` plus the literal schema `version: 1`                                                       |
| Versioning       | Strict Zod version 1 record; unknown fields are rejected                                                                                   |
| Migration        | Legacy token/user-info keys are not restored                                                                                               |
| Expiration       | 43,200 seconds from successful login, matching the tracked browser source                                                                  |
| Security         | No password/digest, signing input, URL token, or duplicated compatibility constant                                                         |
| Refresh recovery | Restore only when the record is valid and unexpired; otherwise remove it and remain anonymous                                              |
| Reset behavior   | Local logout, expiry, or HTTP 401 clears auth and private state; HTTP 403 preserves the session                                            |
| Validation       | Secret scan, storage inspection, typecheck, production build, and narrow browser evidence                                                  |

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
| Validation       | Static ownership/no-persistence scan and manual reload inspection                                                   |

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
5. **Initialize Query cache** — start an empty in-memory TanStack Query cache; restore no authentication data or server response.
6. **Fetch required data** — TanStack Query triggers fetches using restored query keys.
7. **Render workspace** — components receive fresh data without resetting user selections.
8. **Handle stale source** — if the persisted source is unavailable, fall back safely and notify.

## Notes, annotations, and source ownership

- PGN-node comments and PGN-node annotations follow the validated PGN node.
- Game-level teaching notes follow the local teaching-game record.
- Lesson/session-level notes remain unimplemented owner decision `OD-02`.
- Protected source metadata and payloads remain read-only and are not converted into editable drafts.
- Explicit import creates a distinct local copy. No note, comment, annotation, or PGN mutation writes back to a remote source without a separately confirmed write contract.

## Rules

### R1. Categorize every persisted field

Every field stored on the client must belong to one of the eight categories above.

### R2. Auth state is narrowly owned

Only the strict 43,200-second `kaisaile.auth.v1` compatibility record owned by
`src/persistence/auth/authPersistence.ts` is accepted in `localStorage`. Its
data fields are `token`, `uid`, `accountLabel`, and `expiresAt`; the schema also
requires literal `version: 1`. Cookie sessions, BFFs, refresh endpoints, and
alternate browser stores are not invented. Passwords, password digests,
signing inputs, complete profiles or responses, and URL credentials never
touch client storage.

### R3. Version and migrate every persisted table

Dexie tables have schema versions and Zod-validated migrations.

### R4. URL state must not leak secrets

URL query parameters must not contain tokens, MQTT credentials, PII, or live board secrets.

### R5. Live state is transient

Live stream data is in-memory only. Recovery re-establishes the stream, not a snapshot.

### R6. Reset behavior is explicit

Each category documents what clears it: logout, new workspace, explicit reset, or expiry. Logout clears auth/private caches, protected handoffs, replay, and active analysis while preserving public local PGN work, public tournament context, and non-sensitive layout preferences.

## Acceptance criteria

1. Eight persistence categories are defined with storage location, example fields, versioning, migration, expiration, security, refresh recovery, reset behavior, and explicit validation evidence.
2. The list of fields preserved across refresh matches the user requirement.
3. Dexie table design and refresh recovery sequence are documented.
4. Auth data is excluded from Dexie, persisted Query cache, and URL; only the strict `kaisaile.auth.v1` record is accepted in `localStorage`.
5. URL state security constraints are documented.
6. Live stream state is classified as transient and in-memory only.

## Open questions / risks

- Whether 30-day inactivity expiration for workspace session is acceptable to users.

## Machine-readable summary

```json
{
  "document": "persistence-recovery-spec",
  "version": "1.0.0",
  "rules": [
    "categorize_every_persisted_field",
    "only_strict_kaisaile_auth_v1_may_persist_in_local_storage",
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
    "local_storage_kaisaile_auth_v1": ["sensitive_session_auth_state"]
  },
  "refresh_recovery_sequence": [
    "prepaint_preferences",
    "hydrate_workspace_session",
    "validate_and_migrate",
    "restore_drafts",
    "initialize_empty_query_cache",
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
