# Component System Specification

## Purpose

Define the unified component system that renders every workspace mode from the same core components, using source adapters and conditional rendering rather than separate page systems.

## Scope

This document governs:

- The component catalog and each component's responsibility.
- The conditional rendering matrix across mode, source, lifecycle, permission, and screen profile.
- Source adapter contracts.
- Presentation/component/state boundaries.
- Reuse of pure domain modules from `pgnViewer-new`.

## Non-goals

- Product surfaces and modes are defined in `docs/product/*`.
- Layout rules are defined in `docs/ui/LAYOUT_SYSTEM_SPEC.md`.
- Theme and style rules are defined in `docs/ui/THEME_SYSTEM_SPEC.md` and `docs/ui/PAGE_STYLE_SPEC.md`.
- Accessibility rules are defined in `docs/ui/ACCESSIBILITY_SPEC.md`.
- Persistence rules are defined in `docs/ui/PERSISTENCE_RECOVERY_SPEC.md`.

## Unified component system principle

The product must have one component system. Imported PGN, finished online games, live online games, hardware-board games, replay, and big-screen display all render through the same `WorkspaceShell`, `BoardContainer`, `PgnPanel`, `AnalysisPanel`, and `WorkspaceToolbar` families. Differences are handled by:

- Source adapters that translate remote/local data into domain models.
- Mode flags that select toolbar actions and panel visibility.
- Permission checks that gate editing features.
- Screen profile flags that adjust layout and touch behavior.

There must not be `AnalysisPage`, `LivePage`, `ReplayPage`, `BigScreenPage`, or `ImportedPgnPage` components that duplicate the workspace shell.

## Component catalog

| Component              | Responsibility                                                                 | Coupling rules                                    |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `WorkspaceShell`       | App chrome: header, toolbar, content grid, footer/status                       | Owns layout geometry, no domain logic             |
| `BoardContainer`       | Measures available space and renders `BoardViewAdapter` square                 | Layout-only                                       |
| `BoardViewAdapter`     | Project-owned Vue wrapper around the reusable board domain; handles input mode | Reads `BoardStatePort`, emits moves/shapes        |
| `PgnPanel`             | Move list, annotations, branch tree, coach notes                               | Reads PGN domain, dispatches move selection       |
| `AnalysisPanel`        | Evaluation chart, classification, engine output                                | Reads analysis state, dispatches analysis actions |
| `EvalBar`              | Current evaluation bar                                                         | Pure presentational                               |
| `WorkspaceToolbar`     | Mode-aware toolbar with tools, visibility toggles, file actions                | Reads workspace mode and permissions              |
| `CompetitionNavigator` | Tournament group/round/pairing/board tree                                      | Consumes `CompetitionPort`                        |
| `LiveInfoPanel`        | Connection status, player info, last move clock                                | Consumes `LiveBoardPort`                          |
| `ReplayPanel`          | Replay controls and import-to-analysis action                                  | Reads replay buffer                               |
| `DisplayLayout`        | Big-screen chrome: board, player names, status                                 | Uses same components, token overrides             |
| `AnnotationLayer`      | Renders arrows/square highlights on the board                                  | Reads brush/annotation state                      |
| `MoveList`             | Virtualized move list sub-component                                            | Pure presentational                               |

## Conditional rendering matrix

The matrix maps `mode × source × lifecycle × permission × screenProfile` to the visible regions and enabled actions.

| Mode                     | Source                  | Left panel            | Right top              | Right middle   | Right bottom          | Toolbar extras     |
| ------------------------ | ----------------------- | --------------------- | ---------------------- | -------------- | --------------------- | ------------------ |
| `analysis`               | `manual_pgn`            | PGN library           | Game info              | Move list      | Analysis              | Full editing       |
| `analysis`               | `cloud_pgn`             | PGN library           | Game info + cloud path | Move list      | Analysis              | Save/Save-as       |
| `analysis`               | `backend_handoff_pgn`   | PGN library           | Game info              | Move list      | Analysis              | Share              |
| `competition_commentary` | `competition_pairing`   | Competition navigator | Pairing/players        | Move list      | Analysis (if allowed) | Commentary tools   |
| `competition_commentary` | `electronic_board_live` | Competition navigator | Live status/players    | Live move list | Minimal eval          | Live pause/follow  |
| `live_spectator`         | `electronic_board_live` | Live board list       | Live status/players    | Live move list | Minimal eval          | Spectator-only     |
| `live_spectator`         | `online_game_live`      | Game list             | Live status/players    | Live move list | Minimal eval          | Spectator-only     |
| `replay`                 | `replay_only`           | Replay navigator      | Replay metadata        | Move list      | Analysis              | Import to analysis |

Permission gates:

- Cloud save/open requires signed-in user.
- Annotation editing requires teacher/internal role.
- Analysis panel can be hidden by user toggle or screen profile.

Lifecycle gates:

- Live sources show `connecting`, `live`, `stale`, `ended` states in `LiveInfoPanel`.
- Finished sources enable full move navigation.
- Replay sources show an explicit "Import to analysis" action instead of mutating the live buffer.

Screen profile gates:

- `mobile` collapses side panels into drawers.
- `big-screen` hides most chrome and uses display theme tokens.

## Source adapters

Source adapters translate external data into the domain models consumed by the workspace. They are repository-port consumers, not UI components.

| Adapter                     | Input                       | Output domain model        |
| --------------------------- | --------------------------- | -------------------------- |
| `pgnFileAdapter`            | File/string PGN             | `PgnGame`                  |
| `cloudPgnAdapter`           | Cloudreve file DTO          | `PgnGame` + cloud metadata |
| `sharePgnAdapter`           | Share UUID backend response | `PgnGame`                  |
| `competitionPairingAdapter` | Pairing DTO                 | `CompetitionPairing`       |
| `liveBoardAdapter`          | Live board stream/HTTP      | `LiveBoardSnapshot`        |
| `onlineGameAdapter`         | Online game info/moves      | `OnlineGameSnapshot`       |
| `replayAdapter`             | Historical game DTO         | `ReplayGame`               |

Adapters return plain domain objects. Vue container components expose those objects through the owning Pinia store or the approved TanStack Vue Query repository boundary.

## Presentation and state boundaries

- **Presentational components** in `ui/` receive props and emit events. They do not import stores.
- **Container components** in `features/` connect stores/ports to presentational components.
- **Domain logic** in `domains/` is framework-free.
- **Repository ports** in `api/` abstract all external I/O.

A component may not import a store outside its feature slice. Cross-feature needs are satisfied through:

- Public hooks/selectors from the owning feature.
- Explicit composable or service ports owned by the coordinating feature.
- Repository-port interfaces passed as props.

## Reuse boundaries from `pgnViewer-new`

The following framework-free domain modules are migration candidates after their closure, tests, and provenance are reviewed; this list is not authorization to copy runtime source during P0:

- `src/domains/board/{shapes,fenBoard,moveDiff,colors,pieces}`
- `src/domains/pgn/{parsePgn,serializePgn,types,moveRows,mutations,gameMeta,importers,pgnStorage}`
- `src/domains/annotations/ycdw.ts`
- `src/domains/analysis/{analysisResult,engine,search,classifyMove,moveAssessment,moveInsight,nag,report,analysisWorkerClient}`

The canonical Vue UI in `pgnViewer-new` is the visual and interaction authority. Later migration must preserve its behavior through project-owned Vue component boundaries while eliminating unsafe infrastructure; P0 copies no UI implementation.

## Rules

### R1. One workspace shell

All board-centric experiences render inside `/pgnViewer/` through `WorkspaceShell`.

### R2. Source adapters isolate external data

No UI component may consume raw API DTOs. Adapters map to domain models at the port boundary.

### R3. Conditional rendering by flags, not pages

Mode, source, lifecycle, permission, and screen profile are flags, not separate page components.

### R4. Presentational components are store-free

Components in `ui/` do not import Pinia stores or repository ports.

### R5. Live sources are read-only in the workspace

Live adapters must not write to PGN history. Import to analysis requires explicit user action.

### R6. Big-screen uses the same components

`DisplayLayout` composes the same board, move list, and info components with display theme overrides.

## Acceptance criteria

1. Component catalog lists every major workspace component and its responsibility.
2. Conditional rendering matrix covers all canonical mode/source combinations.
3. Source adapters are defined with input/output contracts.
4. Presentation/state boundary rules are documented and enforceable by import lint.
5. Reusable `pgnViewer-new` domain modules are listed.
6. No canonical mode/source combination is assigned a separate top-level page component.

## Open questions / risks

- The exact adapter DTOs depend on confirmed API contracts.
- Whether analysis panel should be available in `live_spectator` depends on product decision.

## Machine-readable summary

```json
{
  "document": "component-system-spec",
  "version": "1.0.0",
  "rules": [
    "one_workspace_shell",
    "source_adapters_isolate_external_data",
    "conditional_rendering_by_flags_not_pages",
    "presentational_components_store_free",
    "live_sources_read_only_in_workspace",
    "big_screen_uses_same_components"
  ],
  "components": [
    "WorkspaceShell",
    "BoardContainer",
    "BoardViewAdapter",
    "PgnPanel",
    "AnalysisPanel",
    "EvalBar",
    "WorkspaceToolbar",
    "CompetitionNavigator",
    "LiveInfoPanel",
    "ReplayPanel",
    "DisplayLayout",
    "AnnotationLayer",
    "MoveList"
  ],
  "adapters": [
    "pgnFileAdapter",
    "cloudPgnAdapter",
    "sharePgnAdapter",
    "competitionPairingAdapter",
    "liveBoardAdapter",
    "onlineGameAdapter",
    "replayAdapter"
  ],
  "related_docs": [
    "docs/product/PRODUCT_DEFINITION.md",
    "docs/product/WORKSPACE_MODES.md",
    "docs/ui/LAYOUT_SYSTEM_SPEC.md",
    "docs/ui/THEME_SYSTEM_SPEC.md",
    "docs/ui/PAGE_STYLE_SPEC.md",
    "docs/ui/ACCESSIBILITY_SPEC.md",
    "docs/ui/I18N_SPEC.md",
    "docs/ui/PERSISTENCE_RECOVERY_SPEC.md",
    "docs/architecture/FRONTEND_ARCHITECTURE_RFC.md"
  ],
  "next_doc": "docs/ui/PERSISTENCE_RECOVERY_SPEC.md"
}
```
