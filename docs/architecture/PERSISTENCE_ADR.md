# Persistence ADR

Status: `ACTIVE_AUTHORITY`

## Decision

Pinia owns active client state. TanStack Vue Query owns server-read cache in memory. Project-owned persistence adapters own only their explicitly versioned records. Zod validates persisted and transport data at their boundaries.

Dexie is the approved structured browser-persistence boundary for non-secret product records, but a target requirement is not an implemented table. Current and target ownership must remain separate.

## Current implemented owners

| Category             | Current owner                                                                                                                         | Storage and scope                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Theme bootstrap      | `index.html`, `src/bootstrap/preferences/themePreference.ts`, `src/theme/constants.ts`, `src/theme/runtime.ts`, `src/stores/theme.ts` | Synchronous `localStorage` key `themeMode`; values are `light`, `dark`, or `system`.                                                                               |
| Workspace layout     | `src/persistence/workspace/workspaceLayoutPersistence.ts`                                                                             | Dexie database `chess-pgnviewer-vue`, version 1, table `workspaceSession`, record `current`; only the strict implemented layout fields.                            |
| Workspace handoff    | `src/persistence/workspace/workspaceHandoff.ts`                                                                                       | Sanitized selection context in `sessionStorage` key `pgnViewer.workspaceHandoff.v1`, with memory fallback.                                                         |
| Account session      | `src/persistence/auth/authPersistence.ts`                                                                                             | Sole approved `localStorage` record `kaisaile.auth.v1`; strict Zod version 1, maximum 43,200 seconds, data fields `token`, `uid`, `accountLabel`, and `expiresAt`. |
| Server reads         | `src/api/queryClient.ts`                                                                                                              | TanStack Vue Query cache in memory only; no dehydrate, hydrate, or storage persister.                                                                              |
| Active analysis/live | Owning feature state                                                                                                                  | Memory only.                                                                                                                                                       |

The current runtime has no general preferences table, draft table, teaching-collection record, locale record, persisted Query cache, live-message record, or AI-default record.

## Approved target categories

Structured target persistence may cover:

1. Local teaching collection and current game/node.
2. PGN-node comments and annotations.
3. Game-level teaching notes.
4. Approved non-sensitive display and application preferences.
5. Explicitly imported local copies of completed/read-only content.

Each new record requires an accepted owner, schema, version, reset/recovery behavior, security classification, and retention rule before implementation. No conceptual database interface or table name is authoritative until code exists.

Lesson/session notes remain `OD-02`. AI setting scope and resource defaults remain `OD-03` and `OD-04`. Sound default remains `OD-11`. Locale remains target-only until a project-owned Vue i18n runtime exists.

## Rules

- Passwords and password digests are never persisted.
- Authentication values never enter URLs, router state, Dexie, persisted Query data, workspace handoffs, PGN, annotations, AI state, or duplicate account records.
- Signing secrets, shared upstream credentials, MQTT credentials, secret-bearing URLs, protected raw payloads, and complete sensitive responses are never persisted.
- Invalid or expired `kaisaile.auth.v1` records are removed. No cookie, BFF, or alternate session architecture is introduced.
- Private Query entries are removed on logout; public tournament queries may remain in memory until normal invalidation.
- Workspace handoffs accept only sanitized non-sensitive source selection context.
- Live payloads, live credentials, running AI tasks, and transient errors remain memory-only.
- Protected sources remain read-only. Explicit import creates a distinct validated local copy.
- Invalid or unknown records fail closed to a reset, picker, validated existing local game, or unavailable state; they never fabricate successful content.

## Recovery

Current recovery order is synchronous theme bootstrap, validated workspace-layout restoration, theme-store initialization, auth restoration, Router/source resolution, and Query refetch into an empty memory cache. Target teaching records and locale preferences join this sequence only after their persistence owners exist.

Detailed field and recovery truth is owned by `docs/ui/PERSISTENCE_RECOVERY_SPEC.md`.
