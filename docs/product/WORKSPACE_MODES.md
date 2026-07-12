# Workspace Modes

## Purpose

Define the canonical workspace modes, the sources allowed in each mode, the conditional rendering rules that adapt the unified workspace, and the persistence rules for mode transitions.

## Scope

This document governs:

- The `WorkspaceMode` discriminated union and its semantics.
- Allowed `WorkspaceSource` values per mode.
- The conditional rendering matrix across mode, source, lifecycle, permission, and screen profile.
- Mode transitions, URL state, and refresh recovery.

## Non-goals

- Product identity and routes are defined in `docs/product/PRODUCT_DEFINITION.md`.
- Component APIs are defined in `docs/ui/COMPONENT_SYSTEM_SPEC.md`.
- API contracts are defined in `docs/api/*`.
- Persistence details are defined in `docs/ui/PERSISTENCE_RECOVERY_SPEC.md`.

## Canonical modes

`WorkspaceMode` is a discriminated union. Each mode determines which adapters render inside the unified workspace shell.

| Mode | Purpose | Allowed sources |
| --- | --- | --- |
| `analysis` | Manual/cloud/share PGN analysis and teaching | `manual_pgn`, `cloud_pgn`, `backend_handoff_pgn` |
| `competition_commentary` | Teacher commentary anchored to a tournament pairing | `competition_pairing`, `electronic_board_live` |
| `live_spectator` | Read-only live viewing of a board or online game | `electronic_board_live`, `online_game_live` |
| `replay` | Historical game replay without live tie | `replay_only` |
| `future_extension` | Planned extension point for new sources or layouts | Owner-approved sources only |

`pairing_only` is allowed as a lightweight source state inside `competition_commentary` but is not a standalone product surface or mode.

## Business mode mapping

The core business modes from `docs/product/PRODUCT_DEFINITION.md` map to canonical modes and routes as follows:

| Business mode | Canonical mode(s) | Route / note |
| --- | --- | --- |
| `imported_pgn` teaching and analysis | `analysis` | `/pgnViewer/` with `manual_pgn`, `cloud_pgn`, or `backend_handoff_pgn` source. |
| `finished_online_game` replay and analysis | `replay`, then `analysis` on import | `/pgnViewer/?handoff=<id>`; explicit import-to-analysis action. |
| `live_online_game` viewing and explanation | `live_spectator` | `/pgnViewer/?handoff=<id>` with `online_game_live` source (owner confirmation required). |
| `live_hardware_board` viewing and explanation | `live_spectator` or `competition_commentary` | `/pgnViewer/?handoff=<id>` with `electronic_board_live` source. |
| `tournament_browser` | none (list/detail surface) | `/competitions`, `/competitions/:hdid`; hands off to `/pgnViewer/`. |
| `teacher_workspace` | `analysis` / `competition_commentary` | Permission-gated teaching toolbar and annotation editing. |
| `replay_workspace` | `replay` | `/pgnViewer/?handoff=<id>` with `replay_only` source. |
| `big_screen_display` | none (screen profile) | `/competitions/:hdid/display` using the `big-screen` profile. |
| `future_extension` mode | `future_extension` | Requires spec update and owner approval before implementation. |
| `read_only_internal_inspection` mode | any mode | Permission-gated diagnostic view; no write/admin endpoints. |

## Mode lifecycle

| Transition | Trigger | Behavior |
| --- | --- | --- |
| Default | User opens bare `/pgnViewer/` | `analysis` mode with `manual_pgn` source |
| Handoff | Tournament detail selects pairing/board | Navigate to `/pgnViewer/?handoff=<id>`; resolved mode is `competition_commentary` or `live_spectator` |
| Source switch | User picks a different source in the same mode | Preserve mode, swap source adapter, keep layout geometry |
| Mode switch | User explicitly changes mode | Re-render adapters, preserve user layout if compatible, reset source-specific transient state |
| Replay import | User imports a replay into analysis | Requires explicit user action; creates a new `analysis` session |
| Future extension | Owner-approved new source or layout | Requires spec update; starts in `future_extension` mode with restricted adapters |
| Internal inspection | Internal staff enables diagnostic view | Permission-aware overlay; does not change mode or source |

## Conditional rendering matrix

The workspace shell renders the same structural components for every mode. The content of each region is selected by a `WorkspaceAdapterResolver`.

| Region | `analysis` | `competition_commentary` | `live_spectator` | `replay` |
| --- | --- | --- | --- | --- |
| Left panel | PGN list / file library | Competition navigator | Live board list / game list | Replay navigator |
| Center | Board | Board | Board | Board |
| Right top | PGN info / headers | Player / pairing info | Live status / players | Replay metadata |
| Right middle | Move list / annotations | Move list / annotations (read-only or annotated) | Move list (live) | Move list |
| Right bottom | Analysis panel | Analysis panel (if enabled) | Minimal eval / status | Analysis panel |
| Toolbar | Full teaching toolbar | Commentary toolbar | Spectator toolbar | Replay toolbar |

Specific visibility is further gated by:

- **Permission**: internal staff see diagnostic toggles; students do not see cloud save.
- **Source lifecycle**: live sources show connection/stale state; replay sources show import-to-analysis action.
- **Screen profile**: big-screen display collapses most side panels and maximizes the board.

## Mode and URL state

The active mode and source are part of the workspace session state. They are persisted in IndexedDB (see `docs/ui/PERSISTENCE_RECOVERY_SPEC.md`) and optionally reflected in URL query parameters for shareability.

Rules:

- A handoff query parameter resolves once and is removed from the URL after resolution to avoid accidental resharing of mutable context.
- Mode and source are serialized as URL-shareable state only when the source is explicitly shareable (e.g., `share/:uuid`, `cloud/:fileid`).
- Live spectator mode must not leak board credentials or MQTT topics in the URL.

## Persistence and recovery

- Selected mode and source are workspace session state and must survive refresh.
- Mode transition history is not persisted; only the current mode/source is restored.
- When the persisted source is no longer available after refresh (e.g., a live board finished), the workspace falls back to a safe mode (`analysis` with a blank game or the last loaded PGN) and surfaces a non-blocking notification.

## Rules

### R1. No mode-specific page components

Mode differences must be implemented inside the unified workspace shell. There must not be `AnalysisPage`, `CommentaryPage`, `LivePage`, or `ReplayPage` components that duplicate the shell.

### R2. Source determines adapter, mode determines chrome

The mode selects which adapters are available and how the toolbar/status bar behave. The source provides the data stream and domain model.

### R3. Preserve geometry on mode switch

Switching mode must not change the outer chrome geometry. Only the content of panels may change.

### R4. Permission-aware adapter visibility

Adapters may declare required permissions. If the current user lacks permission, the adapter region renders an access-denied state instead of the feature.

### R5. Live mode is read-only

`live_spectator` and live sources inside `competition_commentary` must not write to PGN history or call any write/admin endpoint. Importing a live game into analysis requires explicit user action after the live session ends or is paused.

### R6. Future extension mode is gated

`future_extension` mode is a placeholder. No feature may use it without updating `docs/product/PRODUCT_DEFINITION.md`, `docs/product/WORKSPACE_MODES.md`, and `docs/ui/COMPONENT_SYSTEM_SPEC.md`.

### R7. Internal inspection is read-only and permission-gated

The read-only internal inspection view is a permission-aware overlay. It must not grant access to write/admin endpoints or expose sensitive session material.

## Acceptance criteria

1. The canonical modes are enumerated and each maps to at least one allowed source.
2. The ten core business modes from `docs/product/PRODUCT_DEFINITION.md` are mapped to canonical modes and routes.
3. No canonical mode introduces a separate top-level page component outside `/pgnViewer/`.
4. The conditional rendering matrix is documented and referenced by `docs/ui/COMPONENT_SYSTEM_SPEC.md`.
5. Mode and source are classified as workspace session state in `docs/ui/PERSISTENCE_RECOVERY_SPEC.md`.
6. Live mode rules explicitly forbid write/admin endpoints and PGN history mutation.
7. Future extension mode and read-only internal inspection mode are documented and gated.
8. Mode transitions preserve outer layout geometry per `docs/ui/LAYOUT_SYSTEM_SPEC.md`.

## Open questions / risks

- Whether `competition_commentary` will need a distinct layout preset from `analysis` once live commentary features mature.
- Whether `online_game_live` will be approved as a source for `live_spectator`.
- Whether big-screen mode should be modeled as a screen profile or a distinct mode.

## Machine-readable summary

```json
{
  "document": "workspace-modes",
  "version": "1.0.0",
  "rules": [
    "no_mode_specific_page_components",
    "source_determines_adapter_mode_determines_chrome",
    "preserve_geometry_on_mode_switch",
    "permission_aware_adapter_visibility",
    "live_mode_is_read_only",
    "future_extension_mode_is_gated",
    "internal_inspection_is_read_only_and_permission_gated"
  ],
  "modes": ["analysis", "competition_commentary", "live_spectator", "replay", "future_extension"],
  "allowed_sources_by_mode": {
    "analysis": ["manual_pgn", "cloud_pgn", "backend_handoff_pgn"],
    "competition_commentary": ["competition_pairing", "electronic_board_live"],
    "live_spectator": ["electronic_board_live", "online_game_live"],
    "replay": ["replay_only"],
    "future_extension": []
  },
  "business_mode_mapping": [
    {"business_mode": "imported_pgn_teaching_and_analysis", "canonical_mode": "analysis"},
    {"business_mode": "finished_online_game_replay_and_analysis", "canonical_mode": "replay"},
    {"business_mode": "live_online_game_viewing_and_explanation", "canonical_mode": "live_spectator"},
    {"business_mode": "live_hardware_board_viewing_and_explanation", "canonical_mode": "live_spectator_or_competition_commentary"},
    {"business_mode": "tournament_browser", "canonical_mode": "none_list_detail_surface"},
    {"business_mode": "teacher_workspace", "canonical_mode": "analysis_or_competition_commentary"},
    {"business_mode": "replay_workspace", "canonical_mode": "replay"},
    {"business_mode": "big_screen_display", "canonical_mode": "none_screen_profile"},
    {"business_mode": "future_extension_mode", "canonical_mode": "future_extension"},
    {"business_mode": "read_only_internal_inspection_mode", "canonical_mode": "permission_aware_overlay"}
  ],
  "non_mode_surfaces": ["pairing_only", "big_screen_display", "tournament_browser"],
  "related_docs": [
    "docs/product/PRODUCT_DEFINITION.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md",
    "docs/ui/PERSISTENCE_RECOVERY_SPEC.md",
    "docs/ui/LAYOUT_SYSTEM_SPEC.md"
  ],
  "next_doc": "docs/architecture/TECH_STACK_DECISION.md"
}
```
