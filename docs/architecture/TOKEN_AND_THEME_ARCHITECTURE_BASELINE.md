# Token And Theme Architecture Baseline

Status: `F3A_CANONICAL_TOKEN_THEME_INVENTORY_AND_TARGET_DESIGN_COMPLETE`
Phase: `F3A_CANONICAL_TOKEN_THEME_INVENTORY_AND_TARGET_DESIGN`
Generated: `2026-07-12T07:47:56.192Z`

## Decision

`src/styles/tokens.css` remains the only target token authority. Canonical visual values from `pgnViewer-new` are accepted as migration values, but canonical ownership patterns are not copied when they conflict with target governance. Raw canonical values currently in `src/app/styles.css`, `src/stores/themeStore.ts`, `src/app/theme.ts`, and feature component styles must be moved behind the target token authority and project-owned providers during later implementation.

Theme mode supports `light`, `dark`, and `system`. The root applies resolved mode through `html[data-theme="light|dark"]`; persisted intent is represented separately as `html[data-theme-mode="light|dark|system"]`. Board theme is independent from UI mode and is represented by `html[data-board-theme="green|wood|blue|gray|contrast"]`.

## Current Target

The target has a single token file, `src/styles/tokens.css`, imported through `src/styles/index.css`. It is mostly a placeholder registry. Concrete P0 values are limited to browser system colors, system font aliases, `--fs-base: 1rem`, focus values, and reduced-motion placeholders. There is no implemented theme store, prepaint script, meta theme-color, system preference listener, cross-tab listener, Naive provider, board-theme runtime, or tokenized component adapter layer.

The existing scanner evidence is valid but narrow: `mise exec -- pnpm run check:tokens --json` returned zero findings. That proves governed forbidden values are absent outside accepted scope; it does not prove the theme system is complete.

## Canonical Values

Accepted canonical value sources are:

- `pgnViewer-new/src/app/styles.css` for UI chrome light/dark semantic tokens, type, control height, spacing, radius, elevation, scrollbar styling, and aliases.
- `pgnViewer-new/src/stores/themeStore.ts` for board palettes, board theme persistence behavior, and board CSS variable application.
- `pgnViewer-new/src/app/theme.ts` for Naive UI override mapping evidence.
- `pgnViewer-new/src/features/board/BoardView.vue` for board token consumers, state overlays, legal move markers, selected/check/last-move roles, coordinate geometry, and GSAP motion behavior.
- `pgnViewer-new/src/domains/board/colors.ts` and `src/domains/board/shapes.ts` for YCDW annotation colors, widths, opacities, and style modes.
- `pgnViewer-new/src/features/analysis/EvalBar.vue` for evaluation bar values and state roles.

The detailed inventory is recorded in `docs/architecture/CANONICAL_TOKEN_THEME_INVENTORY.json`.

## Target Architecture

Future implementation must keep all concrete visual values in `src/styles/tokens.css` or in an explicitly generated token manifest derived from that authority. Feature components may consume tokens but must not define parallel palettes, raw Naive themes, or local token registries.

Compatibility aliases are allowed only inside the token authority: `--hover`, `--active-bg`, `--ring-accent`, `--panel`, `--input`, `--fg`, `--muted`, `--cg-light`, and `--cg-dark`. New feature code should use semantic/state/component/board tokens.

Naive UI may be installed only through a project-owned provider/adapter. Its theme overrides must derive from target tokens, not duplicate canonical literals in feature files.

The target semantic registry is the sole runtime visual-value authority. `pgnViewer-new` remains canonical runtime and visual evidence; `chess-pgnviewer` governance remains product and security authority. Naive UI is only a consumer and mapping layer, not a second authority or semantic namespace.

F3B must register canonical values without redesign. Component-specific, board, move, annotation, evaluation, player, responsive, safe-area, panel, splitter, typography, spacing, geometry, shadow, elevation, z-index, duration, and easing values must either resolve through `src/styles/tokens.css` or remain an explicit documented gap with owner, review trigger, and no invented value.

F3C owns light, dark, and system preference identifiers, applied light/dark resolution, truthful startup default, pre-Vue no-flash bootstrap, HTML marker synchronization, `color-scheme`, `meta[name="theme-color"]`, system `matchMedia`, runtime system-preference changes, persistence failure fallback, cross-tab synchronization, future synchronous non-sensitive bootstrap preference ownership, and the later Dexie relationship. Feature code must not own raw `localStorage`, `sessionStorage`, or `IndexedDB` preference behavior.

F3C also owns future Pinia theme-store boundaries, reduced-motion behavior, and theme-transition behavior. F3D owns future Naive UI `NConfigProvider` installation, light/dark Naive theme selection, and project-token-based `themeOverrides`. Overlay and z-index relationships, accessibility/contrast validation, browser validation requirements, exact proposed implementation files, Git boundaries, review triggers, removal conditions, remaining unresolved decisions, and completion gates remain phase-gated and unimplemented in F3A.

## Gaps

Open gaps: canonical values are not implemented in the target; system mode is not implemented in canonical or target runtime; Dexie preference bootstrap is missing; meta theme-color and no-flash startup are missing; board tokens are placeholders; icon/link/disabled/connection/analysis/player-state roles are incomplete; motion/z-index/responsive/safe-area concrete scales are incomplete.

These gaps are non-runtime F3A design findings. They do not claim any theme provider, preference store, prepaint script, persistence, document marker, Naive UI provider, browser behavior, route, component, or product UI implementation already exists.

## Next Phase

Next required phase: `F3B_GLOBAL_SEMANTIC_TOKEN_REGISTRY_IMPLEMENTATION`.

Superseded local alias: `F3B_TOKEN_AUTHORITY_IMPLEMENTATION`. The canonical replacement is `F3B_GLOBAL_SEMANTIC_TOKEN_REGISTRY_IMPLEMENTATION`.

Allowed scope for F3B: implement the token authority only. Do not migrate product UI, routes, providers, stores, persistence, board runtime, Naive provider, API, auth, or feature components until their own implementation slice is opened.

Canonical later slices:

1. `F3B_GLOBAL_SEMANTIC_TOKEN_REGISTRY_IMPLEMENTATION`
2. `F3C_THEME_ENGINE_PREFERENCE_AND_NO_FLASH_BOOTSTRAP_IMPLEMENTATION`
3. `F3D_NAIVE_UI_THEME_PROVIDER_AND_TOKEN_OVERRIDE_IMPLEMENTATION`
4. `F3E_TOKEN_THEME_BROWSER_VALIDATION_AND_FINAL_CLOSURE`
