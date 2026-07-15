# Workspace Modes

| Field                      | Value                                                                   |
| -------------------------- | ----------------------------------------------------------------------- |
| Version                    | 1.2.1                                                                   |
| Status                     | `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`                   |
| Product baseline           | `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`                   |
| Page-design gate           | `PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS (completed)` |
| Active implementation gate | `PRODUCT_PAGE_DESIGN_DOCUMENTATION_READY_FOR_IMPLEMENTATION`            |

## Authority and scope

This document owns only the technical workspace mode/source model, transitions, adapter selection, and persistence behavior. Product identity, product modes, journeys, page responsibilities, priorities, requirements, and acceptance concepts are owned by [《开赛了融合产品全量需求与中文设计蓝图》](./PRODUCT_DESIGN_BLUEPRINT.zh-CN.md). The concise product boundary is in [Product Definition](./PRODUCT_DEFINITION.md).

This document does not create product modes, routes, permissions, API contracts, or user-facing diagnostic capabilities.

## Current runtime types

The current target type in `src/features/workspace-mode/workspaceModeTypes.ts` is authoritative:

```ts
type WorkspaceMode =
  | 'analysis'
  | 'competition_commentary'
  | 'live_spectator'
  | 'replay'
  | 'unknown'
```

`unknown` is a fail-closed parsing sentinel. It is not an active product mode, selectable UI state, route, permission, or extension point.

The current `WorkspaceSource` values are:

- `manual_pgn`
- `cloud_pgn`
- `backend_handoff_pgn`
- `competition_pairing`
- `electronic_board_live`
- `online_game_live`
- `replay_only`
- `unknown` as a fail-closed parsing sentinel

Local PGN, manual position, cloud PGN, imported replay, and electronic-board live are sources or lifecycle states; they are not additional runtime enum values. A future mode requires an explicit product-authority and runtime-type change and is not a current mode, route, or surface.

## Mode/source contract

| Technical mode           | Allowed source/state                                                                                        | Runtime responsibility                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `analysis`               | `manual_pgn`; contract-ready `cloud_pgn` or `backend_handoff_pgn`; explicit local copy imported from replay | Editable local teaching session and explicitly enabled AI                                  |
| `competition_commentary` | `competition_pairing`; `electronic_board_live` only when the live contract is confirmed                     | Tournament navigation plus local commentary; ongoing source remains read-only              |
| `live_spectator`         | `electronic_board_live` or `online_game_live` only when contract-ready                                      | Ongoing read-only board, moves, players, connection, freshness, and confirmed clock status |
| `replay`                 | `replay_only` after a confirmed completed-game read                                                         | Read-only replay with explicit import-to-analysis action                                   |
| `unknown`                | `unknown`                                                                                                   | Fail closed to a truthful unavailable state                                                |

`cloud_pgn`, shared content, replay, hardware history/latest snapshots, live credentials/subscriptions, and clocks remain unavailable until their real contracts are confirmed. No cloud save or write capability is implied.

## Conditional composition

The outer geometry remains one left source navigator, one central board, and one right context workspace in every technical mode.

| Region  | `analysis`                                                                     | `competition_commentary`                                                                  | `live_spectator`                                                                          | `replay`                                                          |
| ------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Left    | Local collection/source picker                                                 | Tournament → group → round → pairing                                                      | Live board/game list                                                                      | Replay navigator                                                  |
| Center  | Editable local board when permitted                                            | Board; ongoing source read-only                                                           | Read-only board                                                                           | Read-only board                                                   |
| Right   | Notation, node comments/annotations, game note, information, explicit analysis | Pairing information, notation, local commentary; analysis only for non-ongoing local copy | Players, move list, connection, freshness, confirmed clock status; no AI/evaluation panel | Metadata and move list; analysis only after explicit local import |
| Toolbar | Teaching and local editing                                                     | Commentary controls respecting source lifecycle                                           | Navigation/view/follow only                                                               | Replay and explicit import                                        |

Ongoing live states prohibit AI, engine evaluation, editable variations, editable PGN, annotations on the source, and any source write-back. A completed replay may expose one explicit action that creates an editable local analysis copy.

## Adapter selection and transitions

| Transition                    | Trigger                                    | Result                                                                                |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Bare workspace                | Open router path `/`                       | `analysis` with `manual_pgn`                                                          |
| Local source change           | Import/select PGN or apply manual position | Stay in `analysis`; replace the local source adapter and preserve compatible geometry |
| Tournament commentary handoff | Select a pairing and enter commentary      | Sanitized typed handoff resolves to `competition_commentary`                          |
| Live handoff                  | Select confirmed ongoing live content      | Sanitized typed handoff resolves to read-only `live_spectator`                        |
| Replay handoff                | Open a confirmed completed game            | Resolve to read-only `replay`                                                         |
| Replay import                 | User explicitly chooses import to analysis | Create a new local copy and enter `analysis`; never mutate the remote source          |
| Invalid/unsupported input     | Mode/source parsing or contract fails      | Resolve to `unknown` and render a truthful unavailable state                          |

Mode changes preserve one outer geometry. Source-specific transient state is cleared; compatible local teaching work and layout remain with their owning records.

## Default round selection

An explicit valid URL-selected round always wins.

- Teacher tournament commentary: latest completed round; if none, current ongoing round; otherwise the nearest upcoming or first valid round.
- Live spectator and big-screen operation: current ongoing round; if none, latest completed round; otherwise the first valid round.

These are separate product rules. The current runtime's source-current/first fallback is partial implementation evidence and does not replace the owner-confirmed rule.

## Persistence

- URL owns non-sensitive shareable tournament/group/round/pairing selection, search, pagination, and view state.
- Current project-owned persistence owns only verified records: the synchronous `themeMode` theme bootstrap, Dexie `workspaceSession/current` workspace-layout record, sanitized `pgnViewer.workspaceHandoff.v1` handoff with memory fallback, strict `kaisaile.auth.v1` account session, in-memory TanStack Vue Query cache, and memory-only active analysis/live state.
- Teaching collection, current game/node, node comments, annotations, game-level notes, locale, and broader structured preferences are approved target persistence only until a versioned owner, schema, recovery behavior, reset behavior, security classification, and retention rule exist.
- The approved `kaisaile.auth.v1` record remains solely owned by `src/persistence/auth/authPersistence.ts`; mode/source persistence never contains authentication data.
- Live connections, live payloads, credentials, clocks, running AI tasks, and transient errors remain memory-only.
- A missing or invalid source returns to a truthful source picker or unavailable state. No blank-game success fallback is fabricated.
- Protected source data stays read-only. Import produces a local copy; notes and annotations never write back without a separately confirmed write contract.

## Content ownership

- PGN-node comment and PGN-node annotation follow the PGN node.
- A game-level teaching note follows the local teaching-game record.
- A lesson/session-level note is not implemented and remains owner decision `OD-02`.
- Source metadata remains attached to the source adapter and is read-only when protected.
- Imported teaching or analysis content is a distinct local copy with its own local ownership.

## Rules

1. No mode-specific workspace shell or duplicated board/PGN/annotation/AI runtime.
2. Source chooses the adapter; technical mode chooses permitted composition and controls.
3. Permissions come only from confirmed contracts, never role labels or legacy buttons.
4. Ongoing live is read-only and AI/evaluation-free.
5. Future modes require explicit product-authority and runtime updates.
6. Internal diagnostics are not a product mode, normal workspace state, or permission-based user surface.

## Machine-readable summary

```json
{
  "document": "workspace-modes",
  "version": "1.2.1",
  "status": "COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN",
  "pageDesignGate": "PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS",
  "activeImplementationGate": "PRODUCT_PAGE_DESIGN_DOCUMENTATION_READY_FOR_IMPLEMENTATION",
  "technicalModes": [
    "analysis",
    "competition_commentary",
    "live_spectator",
    "replay"
  ],
  "failClosedSentinel": "unknown",
  "futureModeIsCurrent": false,
  "internalInspectionIsProductMode": false,
  "ongoingLive": {
    "readonly": true,
    "ai": false,
    "evaluation": false,
    "sourceWrite": false
  },
  "currentImplementedPersistence": {
    "themeBootstrap": "localStorage:themeMode",
    "workspaceLayout": "Dexie:chess-pgnviewer-vue/workspaceSession/current",
    "workspaceHandoff": "sessionStorage:pgnViewer.workspaceHandoff.v1_with_memory_fallback",
    "accountSession": "localStorage:kaisaile.auth.v1",
    "queryCache": "memory_only",
    "analysisAndLive": "memory_only"
  },
  "approvedTargetPersistence": [
    "teaching_collection",
    "current_game_and_node",
    "node_comments_and_annotations",
    "game_level_note",
    "locale",
    "broader_structured_preferences"
  ],
  "authority": "docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md",
  "openOwnerDecisions": [
    "OD-01",
    "OD-02",
    "OD-03",
    "OD-04",
    "OD-05",
    "OD-06",
    "OD-07",
    "OD-08",
    "OD-09",
    "OD-10",
    "OD-11"
  ]
}
```
