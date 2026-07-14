# Persistence and Recovery Specification

| Field   | Value                                                       |
| ------- | ----------------------------------------------------------- |
| Version | 1.2.1                                                       |
| Status  | `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`       |
| Gate    | `PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS` |

## Purpose

Define the verified persistence and recovery behavior of the current runtime, distinguish approved target requirements from implementation, preserve unresolved owner decisions, and prohibit sensitive or transient state from being persisted.

## Authority

Current behavior is derived from tracked runtime owners. Product requirements come from `docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md`; technical persistence rules come from `docs/architecture/PERSISTENCE_ADR.md`. Active Web API authority is:

- `docs/architecture/WEB_API_SOURCE_AUTHORITY.md`
- `docs/architecture/WEB_REQUEST_ARCHITECTURE_BASELINE.md`
- `docs/architecture/API_BOUNDARY_ADR.md`
- `docs/architecture/WEB_API_READINESS_MATRIX.json`
- `docs/architecture/WEB_API_ENDPOINT_INVENTORY.json`
- `docs/architecture/WEB_API_CONTRACT_COVERAGE_MATRIX.json`

## Current implemented persistence

### Synchronous theme bootstrap preference

| Attribute | Current implementation                                                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner     | `index.html`, `src/bootstrap/preferences/themePreference.ts`, `src/theme/constants.ts`, `src/theme/runtime.ts`, and `src/stores/theme.ts`                                                                                         |
| Storage   | `localStorage` key `themeMode`                                                                                                                                                                                                    |
| Values    | `light`, `dark`, or `system`                                                                                                                                                                                                      |
| Startup   | `index.html` reads the narrow preference synchronously before Vue mounts, applies `data-theme-mode`, resolved `data-theme`, `color-scheme`, and the theme-color metadata, then exposes the bootstrap snapshot to the theme store. |
| Failure   | Invalid or inaccessible storage falls back to the project default without blocking mount.                                                                                                                                         |

This record contains no accent, board appearance, locale, sound, or AI preference. Dexie does not own current prepaint theme recovery.

### Workspace-layout record

| Attribute  | Current implementation                                                                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner      | `src/persistence/workspace/workspaceLayoutPersistence.ts`                                                                                                                                                   |
| Storage    | Dexie database `chess-pgnviewer-vue`, version 1, table `workspaceSession`, record id `current`                                                                                                              |
| Validation | Strict Zod record with schema version 1                                                                                                                                                                     |
| Fields     | `showLeftSidebar`, `showAnalysisRegion`, `toolbarCollapsed`, `boardAlignment`, `boardOrientation`, `activeRightTab`, and `rightPgnHeightPx`                                                                 |
| Startup    | `src/main.ts` awaits the validated layout record before mounting the application.                                                                                                                           |
| Cleanup    | The current adapter removes invalid, unknown-version, or code-defined stale records. That existing maximum-age behavior is implementation evidence, not a general retention policy for future product data. |

The current table does not contain mode/source selection, teaching collections, games, nodes, notes, locale, board appearance, sound, analysis defaults, live payloads, or protected source data.

### Sanitized workspace handoff

| Attribute | Current implementation                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner     | `src/persistence/workspace/workspaceHandoff.ts`                                                                                               |
| Storage   | `sessionStorage` key `pgnViewer.workspaceHandoff.v1`, with an in-memory fallback when storage is unavailable                                  |
| Purpose   | Carries sanitized non-sensitive source selection and return context between route surfaces and the unified workspace.                         |
| Security  | Rejects unknown and secret-like fields; never carries credentials, auth tokens, cookies, passwords, signing material, or secret-bearing URLs. |

The handoff is not a teaching-record store, draft store, live-message store, or authentication store.

### Account session

| Attribute        | Current implementation                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Owner            | `src/persistence/auth/authPersistence.ts`                                                         |
| Storage          | `localStorage` key `kaisaile.auth.v1`                                                             |
| Schema           | Strict Zod version 1; unknown fields rejected                                                     |
| Data fields      | `token`, `uid`, `accountLabel`, and `expiresAt`                                                   |
| Maximum lifetime | 43,200 seconds                                                                                    |
| Recovery         | Restore only when valid and unexpired; otherwise remove the record and remain anonymous.          |
| Reset            | Logout, expiry, or HTTP 401 clears the session and private state; HTTP 403 preserves the session. |

This is the sole approved account-session record. It is not a blanket authorization for other browser authentication records.

### TanStack Vue Query cache

| Attribute       | Current implementation                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Owner           | `src/api/queryClient.ts`                                                                                                          |
| Storage         | Memory only                                                                                                                       |
| Reload behavior | Starts empty after page reload; public and protected reads refetch from validated route/source selection.                         |
| Logout behavior | `clearPrivateProductQueries()` removes private queries; public tournament queries may remain in memory until normal invalidation. |
| Persistence     | No dehydrate, hydrate, storage persister, Dexie cache, encrypted cache, authentication cache, or raw-response persistence exists. |

Query freshness settings control in-memory refetch behavior; they are not persisted retention rules.

### Active analysis and live state

Running analysis, progress, cancellation, transient errors, live connection state, last received live snapshot, clock interpolation, and live credentials are memory-only. They are cleared or re-established by their owning feature; they are not recovered as completed work after reload.

## Approved target persistence requirements

The following are confirmed product requirements but are not claims about current tables or adapters:

- A local teaching collection with its current game and current node.
- PGN-node comments and PGN-node annotations owned by their PGN node.
- A game-level teaching note owned by a local teaching-game record.
- Validated local copies created by explicit import from completed or protected read-only sources.
- Approved non-sensitive layout and display preferences.
- Structured application preferences after mount, once their fields and schema are approved.
- A future locale preference after a project-owned Vue i18n runtime exists.

Target structured persistence must use project-owned versioned adapters and Zod validation. Page or feature design must define an owner, schema, recovery behavior, reset behavior, security classification, and approved retention rule before adding a field. This document does not predeclare table names or a database interface for unimplemented records.

## Owner-decision or feature-gated persistence

| Candidate                                                                              | Boundary                                                                                                                   |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Lesson/session-level notes                                                             | `OD-02`; no current entity or persistence.                                                                                 |
| AI setting scope                                                                       | `OD-03`; current running analysis remains memory-only.                                                                     |
| AI first-use resource defaults, including depth/time/concurrency                       | `OD-04`; no concrete persisted defaults are approved.                                                                      |
| Sound default                                                                          | `OD-11`; no current sound preference is persisted.                                                                         |
| Board appearance, coordinate display, piece set, accent, and other display preferences | Approved only as product-setting candidates until page design and a versioned persistence owner are accepted.              |
| Locale                                                                                 | Target-only until the project-owned Vue i18n runtime and locale synchronization contract exist.                            |
| Cloud, shared content, replay, hardware history, and live snapshots                    | Contract-blocked; remote payloads do not become editable persistence without explicit import and an approved local schema. |

No feature receives an invented expiry duration. Explicit reset/deletion is always supported; any time-based expiry must be defined by the owning feature after approval. The existing account-session lifetime remains the explicit exception above.

## Never-persist state

The following never enter Dexie, Query persistence, workspace handoff, PGN, annotations, URL state, or alternate browser records:

- passwords and password digests;
- arbitrary or duplicate authentication records;
- auth values in URLs or router state;
- signing secrets and duplicate signing inputs;
- shared upstream credentials, MQTT credentials, and secret-bearing URLs;
- complete sensitive API responses and protected raw payloads;
- running AI tasks, intermediate engine state, and transient analysis errors;
- live credentials, subscriptions, messages, and transient connection state;
- protected source payloads disguised as local drafts;
- clipboard contents and ephemeral notification/tool state.

## Notes, annotations, drafts, and source ownership

- PGN-node comments and annotations follow their validated PGN node.
- Game-level teaching notes follow a local teaching-game record.
- Lesson/session notes remain `OD-02` and are not implemented.
- No general draft adapter or draft table currently exists.
- Protected sources remain read-only. Explicit import creates a distinct validated local copy.
- No local comment, annotation, note, or PGN change writes back to a remote source without a separately confirmed write contract.

## Current refresh-recovery sequence

1. `index.html` synchronously resolves the narrow `themeMode` preference and applies no-flash markers.
2. `src/main.ts` creates the application and Pinia graph.
3. The validated Dexie workspace-layout record is awaited and restored when available.
4. The theme store adopts the synchronous bootstrap state and installs runtime synchronization.
5. The auth store restores only a valid, unexpired `kaisaile.auth.v1` record.
6. The in-memory QueryClient and Router are installed.
7. Route/source selection resolves a current local context, a truthful source picker, or an unavailable/recovery state.
8. Required server reads refetch into the empty in-memory Query cache.

Current recovery does not restore a teaching collection, current game/node, game note, node comments/annotations, locale, AI defaults, analysis task, live connection, or general draft because no accepted current persistence owner exists for those records.

## Approved target recovery

Once their owners and schemas are implemented, recovery should restore the local teaching collection, current game/node, game-level note, node comments/annotations, and approved display preferences. Locale recovery starts only after the Vue i18n boundary exists. A missing or invalid source resolves to a truthful source picker, a validated existing local game, or an unavailable/recovery state; it never fabricates a successful blank game.

## Rules

1. Current and target persistence must remain explicitly separated.
2. Every new persisted field requires one owner, one category, one versioned schema, one reset path, one security classification, and an approved retention rule.
3. Presentational components never access browser storage or persistence adapters.
4. Query server state remains memory-only and refetches after reload.
5. Ongoing live and running AI state remain transient and memory-only.
6. The strict `kaisaile.auth.v1` record is the only approved account-session persistence.
7. Invalid or unknown records fail closed without fabricated fallback data.

## Acceptance criteria

1. Every current persistence claim resolves to tracked runtime code.
2. The current workspace-layout schema lists only implemented fields.
3. Dexie ownership of theme prepaint is forbidden; the synchronous `themeMode` bootstrap owns it.
4. Locale is explicitly unimplemented and is not claimed as restored before mount.
5. Query cache starts empty after reload and is never described as persisted.
6. Target teaching records and preferences are not presented as current tables.
7. `OD-02`, `OD-03`, `OD-04`, and `OD-11` remain unresolved.
8. Authentication, protected source, live, and AI sensitive/transient boundaries remain intact.

## Machine-readable summary

```json
{
  "document": "persistence-recovery-spec",
  "version": "1.2.1",
  "status": "COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN",
  "page_design_gate": "PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS",
  "current_implemented": {
    "theme_bootstrap": "localStorage:themeMode",
    "workspace_layout": "Dexie:chess-pgnviewer-vue/workspaceSession/current",
    "workspace_handoff": "sessionStorage:pgnViewer.workspaceHandoff.v1_with_memory_fallback",
    "account_session": "localStorage:kaisaile.auth.v1",
    "query_cache": "memory_only",
    "active_analysis_and_live": "memory_only"
  },
  "current_general_preferences_table": false,
  "current_drafts_table": false,
  "current_locale_runtime": false,
  "query_cache_persisted": false,
  "open_owner_decisions": ["OD-02", "OD-03", "OD-04", "OD-11"],
  "related_docs": [
    "docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md",
    "docs/architecture/PERSISTENCE_ADR.md",
    "docs/architecture/WEB_API_SOURCE_AUTHORITY.md",
    "docs/ui/THEME_SYSTEM_SPEC.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md"
  ]
}
```
