# Component System Specification

| Field   | Value                                                |
| ------- | ---------------------------------------------------- |
| Version | 1.1.0                                                |
| Status  | `COMPLETE_ACTIVE_PRODUCT_UI_SPEC_RESIDUE_PURGE_PASS` |

## Purpose

Define the accepted component ownership for the current product, the shared composition roles required by page design, and the adapter boundaries that remain blocked by unconfirmed contracts.

## Scope

This document governs:

- Current implemented component owners and their responsibilities.
- Conceptual composition roles that are approved requirements but are not yet implementation identifiers.
- Route-level composition boundaries for the teaching workspace and independent big-screen surface.
- Presentational, feature-container, domain, repository, and source-adapter ownership.
- Mode, source, lifecycle, permission, and screen-profile composition rules.

Product modes and page responsibilities remain owned by `docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md`. Layout, persistence, theme, accessibility, and internationalization remain owned by their corresponding `docs/ui/` specifications.

## Architecture principles

- The teaching product has one unified board-centric workspace, one reusable chessboard runtime, one PGN runtime, one annotation runtime, and one AI runtime.
- Source differences enter through typed repository/source adapters and conditional composition. They do not create source-specific copies of the teaching workspace.
- Big-screen is an independent route-level read-only display composition. It shares approved primitives, not the complete teaching workspace.
- Presentational components receive typed props and emit events. They do not import Pinia stores, repositories, or persistence adapters.
- Feature containers coordinate their own stores, domain contracts, and repositories.
- Chess, PGN, annotation, and analysis domain logic remains framework-free.
- External data is mapped and Zod-validated at repository/source-adapter boundaries before entering domain or UI code.

## Current implemented component owners

Every identifier in this table is a tracked target file or a verified public export.

| Implemented owner             | Tracked path                                                     | Current responsibility                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `TeachingWorkspace`           | `src/features/teaching-workspace/TeachingWorkspace.vue`          | Owns the unified teaching-workspace composition, mode-aware interaction gates, board/PGN/analysis coordination, and workspace geometry.      |
| `WorkspaceToolbar`            | `src/features/teaching-workspace/WorkspaceToolbar.vue`           | Renders current workspace actions and emits typed toolbar commands.                                                                          |
| `WorkspaceRightPanel`         | `src/features/teaching-workspace/WorkspaceRightPanel.vue`        | Composes the current notation, comments, annotations, and analysis tabs for the teaching workspace.                                          |
| `WorkspaceSplitter`           | `src/features/teaching-workspace/WorkspaceSplitter.vue`          | Provides the project-owned accessible splitter primitive used by the workspace.                                                              |
| `CanonicalChessBoard`         | `src/features/board/CanonicalChessBoard.vue`                     | Implements the reusable position-driven chessboard renderer and typed interaction boundary. It is publicly re-exported by `src/ui/index.ts`. |
| `PgnChessBoard`               | `src/features/board/pgn/PgnChessBoard.vue`                       | Composes the canonical board with an isolated PGN controller for public consumers. It is publicly re-exported by `src/ui/index.ts`.          |
| `PgnGameList`                 | `src/features/pgn/components/PgnGameList.vue`                    | Renders and selects games from the current local PGN collection.                                                                             |
| `AnalysisPanel`               | `src/features/analysis/components/AnalysisPanel.vue`             | Renders the current explicit analysis controls, progress, result, and cancellation states.                                                   |
| `EvalBar`                     | `src/features/analysis/components/EvalBar.vue`                   | Renders the current evaluation bar when analysis is permitted.                                                                               |
| `CompetitionListView`         | `src/features/product-api/views/CompetitionListView.vue`         | Owns the current public tournament-list route composition.                                                                                   |
| `CompetitionDetailView`       | `src/features/product-api/views/CompetitionDetailView.vue`       | Owns the current public tournament detail, group, round, and pairing composition.                                                            |
| `CompetitionDisplayView`      | `src/features/product-api/views/CompetitionDisplayView.vue`      | Owns the current independent public pairing-display route; it is not the teaching workspace.                                                 |
| `CompetitionLiveRedirectView` | `src/features/product-api/views/CompetitionLiveRedirectView.vue` | Owns the current compatibility handoff from a tournament live route into the unified workspace.                                              |
| `CompatibilityEntryView`      | `src/features/product-api/views/CompatibilityEntryView.vue`      | Resolves supported compatibility routes into a sanitized workspace handoff or truthful unavailable state.                                    |
| `LoginView`                   | `src/features/product-api/views/LoginView.vue`                   | Owns the current login route composition and safe return flow.                                                                               |

`CanonicalChessBoard`, `PgnChessBoard`, and `meridaPieceResolver` are the verified public board exports from `src/ui/index.ts`. Feature-internal files are not additional public entrypoints.

## Approved conceptual composition roles

The following names describe design responsibilities only. They are not claims that components with those names exist:

| Conceptual role                 | Approved responsibility                                                                     | Composition boundary                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Contextual source navigation    | Select local teaching content or a contract-ready source and preserve source hierarchy.     | Left region of the unified teaching workspace.                                                        |
| Tournament source navigator     | Select tournament, group, round, pairing, and permitted game context.                       | Tournament surfaces or the left workspace region; it does not own a second board runtime.             |
| Live status presentation        | Show connection, freshness, last trusted update, players, and confirmed clock state.        | Read-only ongoing-live composition; no AI or evaluation.                                              |
| Replay import control           | Navigate a confirmed completed game and create an explicit local analysis copy.             | Source remains read-only until import.                                                                |
| Display grid primitive          | Arrange confirmed display boards with readable sizing, paging, focus, and fault states.     | Independent big-screen route only.                                                                    |
| Display player/status primitive | Present player, board, result, freshness, and availability information at viewing distance. | Reusable by the display route without importing teaching panels.                                      |
| Product settings surface        | Edit approved non-sensitive preferences.                                                    | Presentation form remains a page-design decision; persistence follows `PERSISTENCE_RECOVERY_SPEC.md`. |

Page design may choose final component identifiers only after confirming a real implementation owner and avoiding duplication of the current board, PGN, annotation, analysis, or workspace runtime.

## Contract-blocked adapter roles

The following are the only approved adapter descriptions at this stage:

- contract-ready cloud-record adapter;
- contract-ready shared-content adapter;
- confirmed tournament-pairing adapter;
- contract-ready live-snapshot adapter;
- confirmed completed-game replay adapter.

These descriptions define responsibilities, not providers, protocols, endpoints, topics, payloads, or DTO shapes. A blocked adapter must render a truthful unavailable state until its Web contract is confirmed. UI code must never consume raw transport data.

## Composition matrix

| Product context                    | Route composition                                                             | Left/context source                                | Center                                                                          | Right/context area                                                                         | Permission rule                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Local teaching and manual position | Unified teaching workspace                                                    | Local teaching collection or manual-position entry | Canonical board                                                                 | Notation, comments, annotations, notes target, information, explicit analysis              | Local editable state only.                                        |
| Tournament commentary              | Tournament detail handoff into the unified teaching workspace                 | Tournament hierarchy                               | Canonical board                                                                 | Pairing information, notation, local commentary; analysis only on a non-ongoing local copy | Remote source remains read-only.                                  |
| Ongoing live spectator             | Unified teaching workspace in read-only composition after a confirmed handoff | Live board/game selection                          | Canonical board in read-only profile                                            | Players, moves, connection, freshness, and confirmed clock status                          | No AI, evaluation, source annotation, PGN editing, or write-back. |
| Completed replay                   | Unified teaching workspace in replay composition after a confirmed read       | Replay navigation                                  | Canonical board in read-only profile                                            | Metadata, moves, and explicit import action                                                | Analysis and editing require a distinct local copy.               |
| Public tournament browsing         | Separate tournament list/detail routes                                        | Tournament filters and hierarchy                   | No teaching-board requirement                                                   | Public tournament information                                                              | Confirmed public reads only.                                      |
| Big-screen display                 | Independent display route                                                     | Operator display controls                          | One or more canonical board instances when their source contracts are confirmed | Display player/status primitives                                                           | Read-only; never imports the teaching right panel or analysis UI. |

`unknown` mode/source input fails closed to a source picker, validated local game, or truthful unavailable/recovery state. It never fabricates a successful blank game.

## Big-screen composition

`src/features/product-api/views/CompetitionDisplayView.vue` is the current independent route owner. The approved target display composition:

- reuses `CanonicalChessBoard`, the single semantic token registry, and approved player/status/display primitives;
- owns its own read-only grid, paging, focus, and operator-control composition;
- does not reuse `TeachingWorkspace`, `WorkspaceRightPanel`, `AnalysisPanel`, or `WorkspaceToolbar` as its page shell;
- does not render teaching notation, teaching analysis, or editing controls merely because those features exist elsewhere;
- does not duplicate the chessboard renderer, PGN domain, annotation domain, or analysis runtime;
- keeps ongoing games free of AI and engine evaluation.

The current display route renders confirmed public pairing data. Multi-board live chess positions remain contract-blocked until the required read and live-snapshot contracts are confirmed.

## Presentation and state boundaries

1. Presentational components receive typed props and emit typed events; they remain store-free and repository-free.
2. Feature containers may connect their owning Pinia stores, composables, framework-free domains, and typed repositories.
3. Cross-feature coordination uses public typed contracts, not direct cross-store mutation.
4. Repositories and source adapters own transport calls, Zod validation, DTO-to-domain mapping, permissions, and error translation.
5. Persistence adapters are consumed by owning stores/bootstrap modules, never by presentational components.
6. Live and protected remote content is read-only. Explicit import creates a distinct local copy before editing or analysis.

## Acceptance criteria

1. Every component named as implemented resolves to a tracked target path and has a verified responsibility.
2. Conceptual roles are clearly separated from implementation identifiers.
3. Blocked adapters remain abstract and contain no unconfirmed provider, protocol, endpoint, topic, payload, or DTO detail.
4. The unified teaching workspace owns board-centric teaching compositions without source-specific duplicate shells.
5. The independent big-screen route reuses the canonical board and shared primitives without importing the full teaching shell.
6. Ongoing live composition is read-only and contains no AI or evaluation.
7. Presentational, container, domain, repository, source-adapter, and persistence boundaries are explicit.

## Machine-readable summary

```json
{
  "document": "component-system-spec",
  "version": "1.1.0",
  "status": "COMPLETE_ACTIVE_PRODUCT_UI_SPEC_RESIDUE_PURGE_PASS",
  "current_implemented_owners": [
    "TeachingWorkspace",
    "WorkspaceToolbar",
    "WorkspaceRightPanel",
    "WorkspaceSplitter",
    "CanonicalChessBoard",
    "PgnChessBoard",
    "PgnGameList",
    "AnalysisPanel",
    "EvalBar",
    "CompetitionListView",
    "CompetitionDetailView",
    "CompetitionDisplayView",
    "CompetitionLiveRedirectView",
    "CompatibilityEntryView",
    "LoginView"
  ],
  "conceptual_roles_are_implementation_identifiers": false,
  "blocked_adapter_contracts_are_abstract": true,
  "big_screen": {
    "independent_route_composition": true,
    "reuses_canonical_board": true,
    "reuses_full_teaching_workspace": false,
    "ongoing_live_ai_or_evaluation": false
  },
  "related_docs": [
    "docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md",
    "docs/product/WORKSPACE_MODES.md",
    "docs/ui/LAYOUT_SYSTEM_SPEC.md",
    "docs/ui/PERSISTENCE_RECOVERY_SPEC.md",
    "docs/architecture/FRONTEND_ARCHITECTURE_RFC.md"
  ]
}
```
