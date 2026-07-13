# P1 Canonical Product Migration Sequence

Status: `ACTIVE_AUTHORITY`
Gate: `PRODUCT_UI_MIGRATION_READY`
Starts with: `P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION`

## Source Hierarchy

1. `pgnViewer-new` is the canonical Vue runtime, visual, interaction, layout,
   motion, board, PGN, annotation, and teaching workspace migration authority.
2. `chess-pgnviewer` is the product, UI-governance, API, security, and
   implementation-evidence authority.
3. `pgnViewer` is secondary legacy capability evidence only.
4. The React runtime is not target architecture authority.

All source projects are read-only. Do not write to, format, install into,
delete from, stage, commit, or push from an evidence-source directory.

## Migration Rule

P1 migration is mechanical before refactoring. Each slice must preserve the
canonical layout, interaction, density, board focus, panel geometry, keyboard
behavior, responsive behavior, and motion that belongs to that slice before any
local simplification is considered.

No redesign is allowed during mechanical migration. Token translation may adapt
canonical concrete values into the target semantic token system, but it must not
invent a new visual language or introduce feature-local raw values.

## Real Data Rule

Real production APIs and confirmed contracts are the only product data path.
Mock product data, fixtures, fake games, fake PGNs, fake replay, fake live
messages, fake AI output, sample tournaments, and silent fallback success states
are forbidden.

When a real capability is not yet confirmed, the slice must render a truthful
blocked, unavailable, empty, loading, permission, retry, or error state inside
the owning module. It must not imitate real product data.

## Phase Sequence

1. `P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION`
2. `P1B_CANONICAL_BOARD_RENDERING_AND_INTERACTION_MIGRATION`
3. `P1C_REAL_PGN_LOADING_NAVIGATION_AND_VARIATION_MIGRATION`
4. `P1D_CANONICAL_ANNOTATION_RUNTIME_MIGRATION`
5. `P1E_CANONICAL_WORKSPACE_PANELS_TOOLBARS_AND_SPLITTER_COMPLETION`
6. `P1F_CANONICAL_AI_ANALYSIS_AND_WORKER_MIGRATION`
7. `P1B2_CANONICAL_BOARD_ADVANCED_CAPABILITY_AUDIT_AND_COMPONENT_CONTRACT_DESIGN`
8. `P1B3_CANONICAL_BOARD_ADVANCED_CAPABILITY_IMPLEMENTATION_AND_GSAP_SKILL`
9. `P1B4_REUSABLE_CHESSBOARD_COMPONENT_ARCHITECTURE_AND_PUBLIC_API`
10. `P1G_REAL_AUTHENTICATION_AND_PRODUCTION_API_PRODUCT_CAPABILITIES`
11. `P1G1_AXIOS_HTTP_CLIENT_AND_VITE_LOCAL_PROXY_CORRECTION`
12. `P1H_PRODUCT_COMPLETE_USABLE_INTEGRATION_AND_ACCEPTANCE`

## P1A

Expected visible outcome:

- `/pgnViewer/` renders the canonical workspace shell geometry without real
  board, PGN, analysis, auth, API, or product data behavior.
- The shell owns viewport height, body-scroll prevention, top-level grid,
  left navigation/list region, board stage region, right panel region,
  shell-required splitters, panel visibility, board alignment placeholder, and
  responsive shell collapse behavior.
- Unimplemented regions render truthful neutral structural labels only when the
  canonical shell requires that region.

Canonical source areas:

- `pgnViewer-new/src/app/App.vue`
- `pgnViewer-new/src/app/router/index.ts`
- `pgnViewer-new/src/features/workspace-mode/WorkspaceModeController.vue`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeContext.ts`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeQuery.ts`
- `pgnViewer-new/src/features/workspace-mode/workspaceModeTypes.ts`
- `pgnViewer-new/src/features/teaching-workspace/TeachingWorkspace.vue`
- `pgnViewer-new/src/stores/layoutStore.ts`

Target ownership:

- route-level workspace shell;
- shell layout state if needed for panel visibility and board alignment;
- semantic-token-backed shell styles;
- route and layout contract documentation;
- no domain, repository, product data, or board runtime ownership.

Forbidden P1A scope:

- self-developed board runtime;
- move interaction;
- PGN parsing, loading, navigation, variation tree, or replay;
- annotation runtime or drawing layer;
- AI analysis and worker migration;
- authentication or production API calls;
- QueryClient, repository frameworks, generalized error framework, broad
  accessibility program, settings pages, persistence frameworks, or product
  records;
- mock data, fake APIs, fake games, fake PGNs, fake replay, fake live transport,
  fake analysis output, or placeholder success states.

Required validation:

- `mise exec -- pnpm run check:deps`
- `mise exec -- pnpm run check:architecture`
- `mise exec -- pnpm run check:tokens`
- `mise exec -- pnpm run check:mocks`
- `mise exec -- pnpm run check:secrets`
- `mise exec -- pnpm run format:check`
- `mise exec -- pnpm run lint`
- `mise exec -- pnpm run lint:style`
- `mise exec -- pnpm run check:unused`
- `mise exec -- pnpm run check:governance`
- `mise exec -- pnpm run typecheck`
- production build with authoritative Vue SFC type checking and a temporary
  output directory outside the repository;
- `mise exec -- pnpm run audit:prod`
- `mise exec -- pnpm audit`
- `mise exec -- pnpm list --depth 0`
- `mise exec -- pnpm run check:static`
- narrow real-browser validation of `/pgnViewer/` from the temporary production
  build.

Git closure:

- stage only files owned by the slice;
- inspect the full staged diff;
- commit with an evidence-backed implementation report;
- push normally to `origin main` or to the owner-approved branch;
- verify final local `HEAD`, upstream, remote, clean tracked worktree, no
  unauthorized untracked files, no temporary output, and no source-project
  modification.

Implementation result:

- Status:
  `P1A_CANONICAL_SHELL_PASS_READY_FOR_BOARD_MIGRATION`.
- Report:
  `.ai/reports/P1A_CANONICAL_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_MIGRATION_REPORT.json`.
- Baseline:
  `docs/architecture/P1A_APPLICATION_SHELL_AND_WORKSPACE_GEOMETRY_BASELINE.md`.
- Implementation commit:
  `bccfd01054575b9789e0559f4ca1aae897902767`.
- `/pgnViewer/` now renders the canonical application shell and structural
  teaching-workspace geometry.
- Static checks, typecheck, temporary-output production build, audits,
  dependency listing, aggregate static check, and production-bundle browser
  validation passed.
- Board, PGN, annotations, complete panel/splitter behavior, AI analysis,
  authentication, production APIs, settings, persistence, and later P1 runtime
  remain unimplemented.
- Next phase:
  `P1B_CANONICAL_BOARD_RENDERING_AND_INTERACTION_MIGRATION`.

## P1B

Expected visible outcome:

- `/pgnViewer/` renders the accepted P1A workspace shell with the real
  self-developed canonical chessboard in the board stage.
- The board renders 64 squares, canonical Merida piece assets, coordinates,
  legal move markers, capture markers, selected/focused/last-move/check states,
  drag ghost state, and the four-choice promotion chooser.
- Board interaction supports click-to-select, click-to-move, drag-to-move,
  keyboard movement, invalid move rejection, legal captures, check display, and
  promotion resolution.

Canonical source areas:

- `pgnViewer-new/src/features/board/BoardView.vue`
- `pgnViewer-new/src/features/board/boardCells.ts`
- `pgnViewer-new/src/features/board/PromotionDialog.vue`
- `pgnViewer-new/src/domains/board/fenBoard.ts`
- `pgnViewer-new/src/domains/board/shapes.ts`
- `pgnViewer-new/src/domains/board/pieces.ts`
- `pgnViewer-new/src/domains/pgn/mutations.ts`
- `pgnViewer-new/src/stores/pgnStore.ts`
- `pgnViewer-new/src/assets/pieces/merida/*.png`

Target ownership:

- board-local position state until P1C supplies a real PGN owner;
- board rendering and board interaction components;
- framework-free FEN, square geometry, piece asset, and chess-rule helpers;
- semantic-token-backed board geometry, overlay, promotion, and piece visuals;
- public position/orientation contract for the later PGN owner.

Forbidden P1B scope:

- PGN loading, parsing, navigation, variation tree, or replay;
- annotation runtime, arrows, square drawing, board editor, or free setup;
- AI analysis and worker migration;
- authentication, production API calls, QueryClient/repository frameworks,
  settings, persistence, or product records;
- mock data, fake APIs, fake games, fake PGNs, fake replay, fake live transport,
  fake analysis output, or placeholder success states;
- automated test files, automated test infrastructure, dependency changes, or
  package-manager changes.

Implementation result:

- Status:
  `P1B_CANONICAL_BOARD_PASS_READY_FOR_P1C_PGN_MIGRATION`.
- Report:
  `.ai/reports/P1B_CANONICAL_BOARD_RENDERING_AND_INTERACTION_MIGRATION_REPORT.json`.
- Baseline:
  `docs/architecture/P1B_CANONICAL_BOARD_RUNTIME_BASELINE.md`.
- Implementation commit:
  `48c99fd670d476437b17481c523d95a1f8120d42`.
- `/pgnViewer/` now renders the real canonical self-developed board runtime in
  the P1A workspace.
- Static checks, typecheck, temporary-output production build, audits,
  dependency listing, aggregate static check, and production-bundle browser
  validation passed.
- PGN loading/navigation, annotations, complete panels/toolbars/splitters, AI
  analysis, authentication, production APIs, settings, persistence, and later P1
  runtime remain unimplemented.
- Next phase:
  `P1C_REAL_PGN_LOADING_NAVIGATION_AND_VARIATION_MIGRATION`.

## P1C

Expected visible outcome:

- `/pgnViewer/` renders the accepted P1A workspace shell and P1B board with real
  local PGN loading, PGN list, notation navigation, FEN replay, comments, NAGs,
  variation display, and board-driven branch creation.
- The PGN owner is Pinia state. Board moves are controlled by the PGN move tree
  and never mutate the board independently from the selected node.
- Illegal PGN input is rejected without replacing the previous valid state.

Canonical source areas:

- `pgnViewer-new/src/domains/pgn/types.ts`
- `pgnViewer-new/src/domains/pgn/parsePgn.ts`
- `pgnViewer-new/src/domains/pgn/moveRows.ts`
- `pgnViewer-new/src/domains/pgn/mutations.ts`
- `pgnViewer-new/src/domains/pgn/pgnStorage.ts`
- `pgnViewer-new/src/stores/pgnStore.ts`
- `pgnViewer-new/src/features/pgn-panel/PgnPanel.vue`
- `pgnViewer-new/src/features/pgn-library/PgnList.vue`
- `pgnViewer-new/src/features/teaching-workspace/TeachingWorkspace.vue`

Target ownership:

- real PGN domain types, parser, move-row projection, legal move mutation, and
  storage helpers;
- Pinia PGN store for selected game, selected node, current FEN, errors,
  promotion, and pending branch state;
- PGN list, notation panel, file import, drag/drop, and controlled board handoff;
- branch creation and duplicate prevention.

Forbidden P1C scope:

- annotation runtime, arrows, square drawing, free setup, board editor, complete
  toolbars/splitters, AI analysis, Web Workers, authentication, production APIs,
  settings, structured persistence, live/replay transport, mock data, fixtures,
  automated tests, package changes, or dependency changes.

Implementation result:

- Status:
  `P1C_REAL_PGN_RUNTIME_PASS_READY_FOR_P1D_ANNOTATION_MIGRATION`.
- Report:
  `.ai/reports/P1C_REAL_PGN_LOADING_NAVIGATION_AND_VARIATION_MIGRATION_REPORT.json`.
- Baseline:
  `docs/architecture/P1C_REAL_PGN_RUNTIME_BASELINE.md`.
- Implementation commit:
  `7dd3c1e974c6b172e6fe3ca7887a4542f169c77c`.
- `/pgnViewer/` now loads real local PGN files, rejects illegal PGNs without
  state corruption, navigates the move tree, synchronizes board FEN to the
  selected node, displays comments/NAGs/FEN-start games, and creates board-driven
  variations with duplicate prevention.
- Static checks, typecheck, temporary-output production build, audits,
  dependency listing, aggregate static check, and production-bundle browser
  validation passed.
- Annotations, complete panels/toolbars/splitters, AI analysis, authentication,
  production APIs, settings, persistence, live/replay import, and later P1
  runtime remain unimplemented.
- Next phase:
  `P1D_CANONICAL_ANNOTATION_RUNTIME_MIGRATION`.

## P1D

Implementation result:

- Status:
  `P1D_CANONICAL_ANNOTATION_PASS_READY_FOR_WORKSPACE_COMPLETION`.
- Report:
  `.ai/reports/P1D_CANONICAL_ANNOTATION_RUNTIME_MIGRATION_REPORT.json`.
- Baseline:
  `docs/architecture/P1D_CANONICAL_ANNOTATION_RUNTIME_BASELINE.md`.
- Implementation commit:
  `4d0860fb3bf4116c8e35f02258c66be7b145b405`.
- `/pgnViewer/` now supports canonical board annotation runtime over the P1B
  board and P1C PGN owner: arrows, square outlines, filled highlights, six
  semantic annotation colors, pointer/touch drawing, duplicate-toggle removal,
  outside-release cancellation, PGN-node ownership, variation isolation, YCDW
  comment-tag parsing, unknown-field preservation, and cleanup.
- Product-route validation passed in white orientation from a temporary
  production build. Black orientation passed through the actual board public
  contract in an external temporary Vite harness that imported the target board,
  annotation, PGN, token, and provider runtime directly.
- Product-facing orientation control remains deferred to P1E; P1D adds no
  permanent debug hook, route parameter, DOM command, validation route, browser
  dependency, or automated test infrastructure.
- Complete panels/toolbars/splitters, clear/undo controls, AI analysis,
  authentication, production APIs, persistence, settings, live/replay import,
  and later P1 runtime remain unimplemented.
- Next phase:
  `P1E_CANONICAL_WORKSPACE_PANELS_TOOLBARS_AND_SPLITTER_COMPLETION`.

## Later Phase Dependencies

P1B depends on the P1A shell. It is implemented and must not be expanded in
place to add PGN navigation, annotation, AI, authentication, or API behavior.

P1C depends on P1B. It is implemented and must not be expanded in place to add
annotations, AI, authentication, production APIs, settings, persistence, or later
product behavior.

P1D depends on P1C and owns canonical annotation runtime only.

P1E is now implemented and browser validated:

- Result:
  `P1E_CANONICAL_WORKSPACE_PASS_READY_FOR_AI_MIGRATION`.
- Report:
  `.ai/reports/P1E_CANONICAL_WORKSPACE_PANELS_TOOLBARS_AND_SPLITTER_COMPLETION_REPORT.json`.
- Baseline:
  `docs/architecture/P1E_CANONICAL_WORKSPACE_CONTROL_RUNTIME_BASELINE.md`.
- Implementation commit:
  `3e70e0bd990fe96a9d49b08bcf6d6f66e5d4373c`.
- `/pgnViewer/` now owns the canonical workspace toolbar layer, production
  board-orientation control, PGN navigation controls, annotation mode and six
  semantic color controls, current-node annotation undo/redo/clear behavior,
  right panel tabs, panel visibility state, lower structural analysis region,
  project-owned splitter pointer lifecycle, and responsive workspace behavior.
- Static checks, typecheck, temporary-output production build, audits,
  dependency listing, aggregate static check, and production-bundle Chrome CDP
  browser validation passed.
- AI analysis, Web Workers, authentication, production APIs, generalized
  persistence, settings, live/replay import, final integration, and later P1
  runtime remain unimplemented.
- Next phase:
  `P1F_CANONICAL_AI_ANALYSIS_AND_WORKER_MIGRATION`.

P1F is now implemented and browser validated:

- Result:
  `P1F_CANONICAL_AI_ANALYSIS_WORKER_RUNTIME_PASS_READY_FOR_P1G`.
- Report:
  `.ai/reports/P1F_CANONICAL_AI_ANALYSIS_AND_WORKER_MIGRATION_REPORT.json`.
- Baseline:
  `docs/architecture/P1F_CANONICAL_AI_ANALYSIS_WORKER_RUNTIME_BASELINE.md`.
- Implementation commit:
  `45c5ff50a0917f423d1fb3a528fe6fadb509aec0`.
- `/pgnViewer/` now runs the canonical local AI analysis runtime with module Web
  Workers, current-node request identity, stale-result rejection, cancellation,
  retry, evaluation rail, lower analysis panel, compact right-panel status, PV
  legality validation, candidate lines, and YCDW:A analysis serialization with
  boundary validation.
- Static checks, typecheck, temporary-output production build, production audit,
  aggregate static check, and production-bundle browser validation passed.
- Authentication, production APIs, cloud persistence, settings, live/replay
  import, tournament integration, report export, final integration, and later P1
  runtime remain unimplemented.
- Next phase:
  `P1B2_CANONICAL_BOARD_ADVANCED_CAPABILITY_AUDIT_AND_COMPONENT_CONTRACT_DESIGN`.

P1B2 is now design complete:

- Result:
  `P1B2_BOARD_ADVANCED_CAPABILITY_DESIGN_PASS_READY_FOR_IMPLEMENTATION`.
- Report:
  `.ai/reports/P1B2_CANONICAL_BOARD_ADVANCED_CAPABILITY_AUDIT_AND_COMPONENT_CONTRACT_DESIGN_REPORT.json`.
- Inventory:
  `docs/architecture/CANONICAL_BOARD_ADVANCED_CAPABILITY_INVENTORY.json`.
- Baseline:
  `docs/architecture/BOARD_ADVANCED_CAPABILITY_ARCHITECTURE_BASELINE.md`.
- P1B2 traces the canonical GSAP move and snapback animation, radial menu,
  free-placement/editor mode, and wheel navigation from `pgnViewer-new`; defines
  one parameter-controlled reusable board contract; records state ownership,
  interaction priority, GSAP dependency and plugin decisions, future project
  GSAP Skill requirements, token and asset boundaries, planned implementation
  files, and browser gates.
- P1B2 changes no runtime code, package file, lockfile, asset, scanner, semantic
  token, style, Router, Pinia, provider, PGN, annotation, or analysis runtime.
- Next phase:
  `P1B3_CANONICAL_BOARD_ADVANCED_CAPABILITY_IMPLEMENTATION_AND_GSAP_SKILL`.

P1B3 owns implementation of the owner-mandated advanced reusable board runtime:

- GSAP move animation and snapback animation;
- canonical radial menu;
- canonical free-placement/editor mode;
- canonical wheel navigation;
- project-owned `.ai/skills/gsap/SKILL.md`;
- explicit `/pgnViewer/` product enablement and validation.

Implementation result:

- Status:
  `P1B3_CANONICAL_BOARD_ADVANCED_CAPABILITY_RUNTIME_PASS_READY_FOR_P1G`.
- Report:
  `.ai/reports/P1B3_CANONICAL_BOARD_ADVANCED_CAPABILITY_IMPLEMENTATION_REPORT.json`.
- Baseline:
  `docs/architecture/P1B3_CANONICAL_BOARD_ADVANCED_CAPABILITY_RUNTIME_BASELINE.md`.
- Implementation commit:
  `9db1bbef6e1b0cbe0c99d41a62a7baf76a5a046e`.
- `/pgnViewer/` now enables the parameter-controlled advanced board runtime:
  GSAP move animation, snapback and drag-settle animation, radial menu, editor
  mode, wheel navigation, and project GSAP Skill ownership.
- Static checks, typecheck, production build, aggregate static check, and
  production-bundle browser validation passed.
- Authentication, production APIs, cloud persistence, settings, live/replay
  import, tournament integration, report export, final integration, and later P1
  runtime remain unimplemented.
- Next phase:
  `P1B4_REUSABLE_CHESSBOARD_COMPONENT_ARCHITECTURE_AND_PUBLIC_API`.

P1B4 closes the reusable public component boundary over the accepted P1B-P1B3
runtime:

- Result:
  `P1B4_BOARD_COMPONENT_FULLY_PARAMETERIZED_REUSABLE_TYPESAFE_AND_MOTION_READY`.
- Report:
  `.ai/reports/P1B4_REUSABLE_CHESSBOARD_COMPONENT_IMPLEMENTATION_REPORT.json`.
- Baseline:
  `docs/architecture/P1B4_REUSABLE_CHESSBOARD_COMPONENT_BASELINE.md`.
- Public API:
  `docs/ui/CHESSBOARD_COMPONENT_API.md`.
- Implementation commit:
  `22f9cddc191b4f7cb4e91f466526918a08e165b0`.
- The project now exposes one strictly typed position-driven board and one
  isolated PGN-driven wrapper with controlled state boundaries, per-instance
  appearance and pieces, typed events and commands, dynamic PGN lifecycle,
  multiple-instance isolation, and scoped motion/listener cleanup.
- Full static gates, temporary-outDir production build, and real Chrome
  capability, responsive, theme, reduced-motion, isolation, and unload/remount
  validation passed.
- P1G is now implemented and browser validated. Next phase:
  `P1H_PRODUCT_COMPLETE_USABLE_INTEGRATION_AND_ACCEPTANCE`.

P1G owns real authentication and production API product capabilities through
confirmed same-origin boundaries. It started after
`P1B4_REUSABLE_CHESSBOARD_COMPONENT_ARCHITECTURE_AND_PUBLIC_API` closed and now
records:

- Result:
  `P1G_REAL_AUTHENTICATION_AND_PRODUCTION_API_PASS_READY_FOR_P1H`.
- Report:
  `.ai/reports/P1G_REAL_AUTHENTICATION_AND_PRODUCTION_API_PRODUCT_CAPABILITIES_REPORT.json`.
- Contract inventory:
  `docs/architecture/P1G_PRODUCTION_API_CONTRACT_INVENTORY.json`.
- Implementation commit:
  `d0c47a60bfc00e0028d2f9fbe597eb322cb7440d`.
- Implemented runtime:
  real login submission boundary, session restore/logout, production
  tournament list/groups/rounds/pairings, big-screen pairing display,
  sanitized compatibility/live handoffs, and authenticated replay handoff into
  the canonical workspace.
- Validation:
  static gates, typecheck, production audit, temporary-output production build,
  and real-browser validation passed against `/pgnViewer/`, `/competitions`,
  `/competitions/:hdid`, replay handoff, and `/match/:key`.
- Remaining credential-dependent evidence:
  successful owner-account login and protected replay success were not run
  without credentials; the unauthenticated protected replay path is blocked in
  UI before issuing a protected request.

P1G1 corrects the P1G browser transport and local-development proxy boundary
without starting P1H:

- Result:
  `P1G1_AXIOS_HTTP_CLIENT_AND_VITE_PROXY_PASS_READY_FOR_P1H`.
- Report:
  `.ai/reports/P1G1_AXIOS_HTTP_CLIENT_AND_VITE_LOCAL_PROXY_CORRECTION_REPORT.json`.
- Baseline:
  `docs/architecture/P1G1_AXIOS_HTTP_CLIENT_AND_VITE_PROXY_BASELINE.md`.
- Implementation commit and push:
  `0751fc1f10a47ca21ebdf3d7ff50dac589a9f6cf`.
- Implemented correction:
  one private Axios XHR client, request-time session authentication,
  cancellation/timeout/error taxonomy, strict direct-transport ownership, and
  the fixed Vite `/api/ksl` proxy to `https://wxapi.kaisaile.org`.
- Validation:
  the full static ladder, TypeScript, production build, local development
  proxy, real API, production-bundle XHR, responsive, theme, reduced-motion,
  interaction, error, timeout, and cancellation browser evidence passed.
- Residual boundary:
  production hosting must provide the same restricted same-origin route or an
  approved browser-readable HTTPS API base; successful login and protected
  replay remain unclaimed without owner credentials.

P1H integrates the product into `PRODUCT_COMPLETE_USABLE` with real data, real
APIs, and accepted browser evidence. P1H has not started.

## Feature-Owned Minimum Safety

If a slice requires data access, persistence, error handling, security, or
accessibility before the comprehensive foundation exists, implement only the
smallest feature-owned boundary needed by that real slice. Record the boundary
and the later consolidation owner. Do not add a generalized framework without
real product evidence.

## Deferred Post-Product Foundations

After `PRODUCT_COMPLETE_USABLE`, review and complete or explicitly reject the
deferred comprehensive foundations: TanStack Vue Query policy, repository and
DTO layering, security runtime and headers, runtime environment configuration,
global error and feedback framework, accessibility foundation, Dexie structured
persistence, UI adapters and overlays, broad responsive/motion systems,
foundation preview, and final broad browser integration.
