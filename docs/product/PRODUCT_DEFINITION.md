# Product Definition

## Purpose

Define what the rebuilt chess workspace is, who it serves, which surfaces are canonical, and what is explicitly out of scope. This document is the product-level contract for the single-runtime Vue PGN analysis, teaching, tournament viewing, live board, replay, and big-screen workspace.

## Scope

This document governs:

- Product identity and user roles.
- Canonical routes and page shells.
- Workspace source taxonomy and handoff behavior.
- In-scope and out-of-scope capabilities.
- Non-goals and boundaries that the architecture and UI specs must enforce.

It applies to all new code in the rebuilt product. `pgnViewer-new` is the canonical visual, interaction, and active-runtime migration source for the teaching workspace; its runtime source is not copied during P0 and must pass later dependency-closure gates before reuse.

## Non-goals

- Implementation phases and gates are defined in `docs/PROJECT_REBUILD_BASELINE_DRAFT.md` and `docs/architecture/FRONTEND_ARCHITECTURE_RFC.md`.
- API contracts are defined in `docs/api/*`.
- Detailed UI tokens, layout, and component rules are defined in `docs/ui/*`.
- Agent workflow rules are defined in `docs/ai/PROJECT_UI_SKILL_SPEC.md` and `.ai/skills/project-ui/SKILL.md`.

## Product identity

The product is a **unified chess teaching, PGN analysis, tournament viewing, live board, replay, AI analysis, electronic-board live, online-game live, and big-screen display workspace**. It is a read-heavy, workspace-centric web application built for classroom, club, tournament venue, and personal study use.

User-facing product name in Chinese: **开赛了**. Technical identifiers may use `kaisaile`.

## Core business modes

The following business modes must be recognizable in product and UI planning. They map to the technical `WorkspaceMode` values defined in `docs/product/WORKSPACE_MODES.md` and to canonical routes defined below.

| Business mode                                 | What it covers                                                        | Technical mapping                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `imported_pgn` teaching and analysis          | Load, annotate, present, and share imported or manually created PGNs. | `analysis` mode with `manual_pgn`, `cloud_pgn`, or `backend_handoff_pgn` source.       |
| `finished_online_game` replay and analysis    | Replay finished online games and import them into analysis.           | `replay` mode; explicit user action imports to `analysis`.                             |
| `live_online_game` viewing and explanation    | Spectate a live online game as a coach or audience member.            | `live_spectator` mode with `online_game_live` source (owner-confirmation dependent).   |
| `live_hardware_board` viewing and explanation | Spectate a live electronic-board stream from a tournament venue.      | `live_spectator` or `competition_commentary` mode with `electronic_board_live` source. |
| `tournament_browser`                          | Search tournaments, browse groups/rounds/pairings/boards.             | `/competitions` and `/competitions/:hdid` surfaces; hands off to `/pgnViewer/`.        |
| `teacher_workspace`                           | Coach/teacher view with full teaching toolbar and annotation editing. | `analysis` or `competition_commentary` mode with teacher permission gates.             |
| `replay_workspace`                            | Historical replay with import-to-analysis action.                     | `replay` mode with `replay_only` source.                                               |
| `big_screen_display`                          | Venue/projector display of a selected board.                          | `/competitions/:hdid/display` surface using the `big-screen` profile.                  |
| `future_extension` mode                       | Planned extension point for new sources or layouts.                   | Documented as an extension point; requires spec update before implementation.          |
| `read_only_internal_inspection` mode          | Internal staff read-only diagnostics and system annotations.          | Permission-aware view inside any mode; no write/admin endpoints.                       |

## User roles

| Role              | Primary need                                       | Typical permissions                                    |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Teacher / coach   | Load, annotate, and present PGNs in class          | Full workspace UI, annotation editing, cloud save/open |
| Part-time teacher | Lightweight lesson and replay access               | Same UI with reduced cloud/admin privileges            |
| Tournament staff  | Run tournament detail pages and big-screen display | Competition navigator, live board list, display mode   |
| Student           | Follow lessons, replay games, review analysis      | Read/analysis workspace, limited editing               |
| Parent            | View shared games and tournament results           | Read-only share/workspace access                       |
| Audience member   | Spectate live boards and big-screen display        | Live spectator and display surfaces                    |
| Internal staff    | Maintain teaching content and diagnose issues      | Extended settings, system annotations                  |

Permissions are enforced by the backend and reflected in the UI through conditional rendering. The UI must never assume a role grants access to a write/admin endpoint.

## Canonical product surfaces

| Surface            | Route                         | Purpose                                     |
| ------------------ | ----------------------------- | ------------------------------------------- |
| Unified workspace  | `/pgnViewer/`                 | Analysis, teaching, live spectator, replay  |
| Tournament list    | `/competitions`               | Search/filter list of tournaments           |
| Tournament detail  | `/competitions/:hdid`         | Group, round, pairing, and board navigation |
| Big-screen display | `/competitions/:hdid/display` | Venue/projector display of a selected board |

## Compatibility surfaces

These routes exist only to preserve external links and deep-sharing behavior. They must redirect or hand off to the unified workspace rather than render standalone legacy UI.

| Surface               | Route                      | Behavior                                                                         |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| Legacy live bridge    | `/competitions/:hdid/live` | Create a sanitized workspace handoff and replace into `/pgnViewer/?handoff=<id>` |
| Backend match handoff | `/match/:key`              | Resolve shared match PGN and open in workspace                                   |
| Share handoff         | `/share/:uuid`             | Resolve shared PGN and open in workspace                                         |
| Cloud handoff         | `/cloud/:fileid`           | Resolve Cloudreve PGN and open in workspace                                      |

## Workspace source taxonomy

A `WorkspaceSource` describes where the current board state comes from. The same workspace shell renders all sources.

| Source                  | Description                                     | Example origin                          |
| ----------------------- | ----------------------------------------------- | --------------------------------------- |
| `manual_pgn`            | User-created or imported PGN                    | Local file paste, FEN setup, blank game |
| `cloud_pgn`             | PGN loaded from Cloudreve-compatible storage    | `/cloud/:fileid`                        |
| `backend_handoff_pgn`   | Shared PGN resolved through backend match/share | `/match/:key`, `/share/:uuid`           |
| `competition_pairing`   | A pairing selected from a tournament            | Tournament detail page handoff          |
| `electronic_board_live` | Live electronic-board stream                    | Tournament venue hardware board         |
| `online_game_live`      | Live online game stream                         | Optional future live spectator source   |
| `replay_only`           | Historical game replay without live tie         | Replay mode from a finished game        |

## Workspace handoff

`/pgnViewer/` is the final unified workspace. Tournament pages must not render their own board panels. Instead they create a sanitized, versioned handoff context and navigate to `/pgnViewer/?handoff=<id>`. The workspace controller resolves the handoff, reconstructs the source and selection state, and renders the appropriate adapters.

A bare `/pgnViewer/` route with no handoff or source query always renders the default analysis workspace.

## In scope

- PGN loading, parsing, replay, editing, annotation, and sharing.
- Interactive board with legal moves, free setup, arrows, square highlights, and drawing layer.
- Local AI analysis via UCI/Web Worker engines.
- Competition list/detail/group/round/pairing/board navigation (read-only).
- Live electronic-board spectator stream (read-only, contract-confirmation mode).
- Historical replay of finished games.
- Big-screen/projector display mode.
- Cloud save/open behind a typed storage-provider abstraction.
- Deep links and QR sharing.
- Light/dark/system themes, user accent color, board themes, and large-screen themes.
- Refresh recovery of workspace state and user preferences.
- Accessibility (keyboard, screen reader, reduced motion, contrast).
- Chinese and English i18n.

## Out of scope

| Capability                                 | Status       | Rationale                                                                                                                                                         |
| ------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin console replacement                  | OUT_OF_SCOPE | The product consumes data; it does not manage tournaments, users, or organizations                                                                                |
| Mini-program replacement                   | OUT_OF_SCOPE | The mini program remains a separate product surface                                                                                                               |
| Write/admin tooling                        | FORBIDDEN    | All 871 write/admin endpoints identified in `docs/api/API_FORBIDDEN_WRITE_ADMIN.md` are excluded unless an owner explicitly approves a product-specific exception |
| 3D-first or WebGL live room                | OUT_OF_SCOPE | The product is board-first; any 3D/QMLive work is reference-only until a separate contract is approved                                                            |
| Online game lobby / real-time play         | OUT_OF_SCOPE | Game creation/join/start endpoints are forbidden                                                                                                                  |
| Personal results / `ShowScoreList` runtime | RETIRED      | Removed from PC runtime scope                                                                                                                                     |
| Generic dashboard                          | OUT_OF_SCOPE | The product is a chess-specific workspace, not a generic dashboard                                                                                                |
| Generic PGN viewer only                    | OUT_OF_SCOPE | The product is a teaching, tournament, live, replay, and big-screen workspace, not a standalone generic PGN viewer                                                |
| Generic `proxyRequest` tunnel              | FORBIDDEN    | Replaced by explicit, confirmed repository methods                                                                                                                |
| Old PC `/CALL`-equivalent transport        | UNTRUSTED    | Requires owner approval per endpoint before use                                                                                                                   |

## Rules

### R1. Unified workspace only

All board-centric experiences must render inside `/pgnViewer/`. No separate page component may duplicate the board/PGN/analysis chrome for a specific source type.

### R2. Read-first product

The product is read-first. Any write path must be explicitly scoped, user-initiated, and backed by an approved non-admin endpoint.

### R3. Source adapters, not source pages

Differences between sources are handled by source adapters inside the workspace, not by separate top-level routes or page components.

### R4. Handoff is the canonical navigation path

Tournament detail pages save a sanitized handoff and navigate to `/pgnViewer/`. Legacy `/competitions/:hdid/live` must use the same bridge.

### R5. Preserve user intent across refresh

Refreshing the page must preserve user selections and UI state. See `docs/ui/PERSISTENCE_RECOVERY_SPEC.md`.

### R6. API contract-confirmation mode

Implementation must not assume unconfirmed API contracts. Confirmed production reads use typed repositories behind the same-origin server boundary; every unconfirmed capability remains explicitly unavailable. Runtime mock or fixture fallbacks are forbidden.

## Acceptance criteria

1. A future agent can read this document and list the canonical routes, compatibility routes, core business modes, and retired capabilities.
2. Every workspace source maps to a rendering adapter in `docs/ui/COMPONENT_SYSTEM_SPEC.md`, not to a separate top-level page.
3. Every core business mode maps to a canonical mode, route, or screen profile in `docs/product/WORKSPACE_MODES.md`.
4. No canonical surface duplicates board/PGN/analysis chrome for a single source type.
5. Out-of-scope and forbidden capabilities are absent from architecture, component, and API planning documents.
6. Workspace handoff behavior is defined and referenced by `docs/ui/COMPONENT_SYSTEM_SPEC.md` and `docs/architecture/FRONTEND_ARCHITECTURE_RFC.md`.
7. The product name "开赛了" is used consistently in user-facing copy defined in `docs/ui/I18N_SPEC.md`.

## P1H usable-product journeys

P1H closes the first usable product delivery. The supported consumer journeys
are:

1. Open `/pgnViewer/`, import or create a PGN, make legal moves and variations,
   annotate the board, and inspect local Worker analysis in the single canonical
   workspace.
2. Open `/competitions`, commit a search, select a real production competition,
   choose group and round filters, and open a pairing in the workspace.
3. Open `/competitions/:hdid/display` for the read-only venue display of the
   selected production round.
4. Follow `/match/:key`, `/share/:uuid`, `/cloud/:fileid`, or
   `/competitions/:hdid/live` through a sanitized handoff into the canonical
   workspace. Unconfirmed or unavailable sources remain visibly unavailable;
   they never fall back to fabricated data.
5. Sign in through `/login` when owner credentials are available. Protected
   replay data is private Query state and is removed with protected handoffs,
   analysis work, and protected PGN state on logout or authentication failure.

Public competition filters are URL-owned so refresh and browser navigation
preserve the selected group and round. Non-sensitive workspace layout is stored
through the narrow Dexie layout owner. Live payloads, API responses, auth
credentials, protected replay payloads, and board annotations are not written
to that layout record.

The MQTT/electronic-board live transport remains intentionally unavailable
until an owner approves a read-only contract. Successful authenticated replay
is credential-dependent and is not claimed without owner credentials. These
truthful unavailable states are part of the accepted product behavior.

Production deployment requirements are defined in
`docs/architecture/PRODUCTION_DEPLOYMENT_BOUNDARY.md`.

## Open questions / risks

- When the legacy `/competitions/:hdid/live` bridge can be retired depends on external link analytics.
- Whether online game live (`online_game_live`) becomes a confirmed source depends on owner approval of a read-only live contract.
- Client-specific custom themes are an extension point; the first client theme must not break the token system.

## Machine-readable summary

```json
{
  "document": "product-definition",
  "version": "1.0.0",
  "rules": [
    "unified_workspace_only",
    "read_first_product",
    "source_adapters_not_source_pages",
    "handoff_is_canonical_navigation",
    "preserve_user_intent_across_refresh",
    "api_contract_confirmation_mode"
  ],
  "canonical_surfaces": [
    "/pgnViewer/",
    "/competitions",
    "/competitions/:hdid",
    "/competitions/:hdid/display"
  ],
  "compatibility_surfaces": [
    "/competitions/:hdid/live",
    "/match/:key",
    "/share/:uuid",
    "/cloud/:fileid"
  ],
  "workspace_sources": [
    "manual_pgn",
    "cloud_pgn",
    "backend_handoff_pgn",
    "competition_pairing",
    "electronic_board_live",
    "online_game_live",
    "replay_only"
  ],
  "core_business_modes": [
    "imported_pgn_teaching_and_analysis",
    "finished_online_game_replay_and_analysis",
    "live_online_game_viewing_and_explanation",
    "live_hardware_board_viewing_and_explanation",
    "tournament_browser",
    "teacher_workspace",
    "replay_workspace",
    "big_screen_display",
    "future_extension_mode",
    "read_only_internal_inspection_mode"
  ],
  "out_of_scope": [
    "admin_console_replacement",
    "mini_program_replacement",
    "write_admin_tooling",
    "3d_first_or_webgl_live_room",
    "online_game_lobby_realtime_play",
    "showscorelist_personal_results_runtime",
    "generic_dashboard",
    "generic_pgn_viewer_only",
    "generic_proxyrequest_tunnel",
    "old_pc_call_transport_without_approval"
  ],
  "related_docs": [
    "docs/product/WORKSPACE_MODES.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md",
    "docs/ui/PERSISTENCE_RECOVERY_SPEC.md",
    "docs/architecture/FRONTEND_ARCHITECTURE_RFC.md",
    "docs/PROJECT_REBUILD_BASELINE_DRAFT.md"
  ],
  "next_doc": "docs/product/WORKSPACE_MODES.md"
}
```
