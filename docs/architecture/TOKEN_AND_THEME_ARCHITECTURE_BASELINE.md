# Token And Theme Architecture Baseline

Status: `F3C_THEME_ENGINE_IMPLEMENTED_VALIDATED`
Phase: `F3C_THEME_ENGINE_PREFERENCE_AND_NO_FLASH_BOOTSTRAP_IMPLEMENTATION`
Generated: `2026-07-12T07:47:56.192Z`

## Decision

`src/styles/tokens.css` remains the only target token authority. Canonical visual values from `pgnViewer-new` are accepted as migration values, but canonical ownership patterns are not copied when they conflict with target governance. Raw canonical values currently in `src/app/styles.css`, `src/stores/themeStore.ts`, `src/app/theme.ts`, and feature component styles must be moved behind the target token authority and project-owned providers during later implementation.

Theme mode supports `light`, `dark`, and `system`. The root applies resolved mode through `html[data-theme="light|dark"]`; persisted intent is represented separately as `html[data-theme-mode="light|dark|system"]`. Board theme is independent from UI mode and is represented by `html[data-board-theme="green|wood|blue|gray|contrast"]`.

## Current Target

The target has a single token file, `src/styles/tokens.css`, imported through `src/styles/index.css`. F3B replaces the previous placeholder registry with the evidence-backed semantic token registry from `docs/architecture/CANONICAL_TOKEN_THEME_INVENTORY.json`.

Actual F3B registry status:

- Implemented entries: 86
- Deferred inventory entries: 0
- Shared declarations: 55
- Light declarations: 31
- Dark declarations: 31
- Governed compatibility aliases: 3
- Authority path: `src/styles/tokens.css`
- Active baseline: `docs/architecture/SEMANTIC_TOKEN_REGISTRY_BASELINE.md`

Canonical parity passed with the temporary inventory-to-CSS reconciliation script stored outside the repository. Current target consumer migration is complete for the neutral bootstrap: `src/styles/base.css` now consumes `--state-focus-ring`; existing `--bg`, `--text`, `--font-sans`, and `--fs-base` consumers already resolve through the registry.

F3C adds the project-owned theme preference engine without changing token values. Implemented runtime ownership:

- `index.html`: synchronous pre-Vue bootstrap and initial meta theme-color.
- `src/theme/constants.ts`: immutable preference, marker, media-query, and storage identifiers.
- `src/theme/types.ts`: typed preference, resolved-theme, and bootstrap snapshot contracts.
- `src/theme/runtime.ts`: validation, resolution, document marker synchronization, `color-scheme`, and token-derived meta theme-color synchronization.
- `src/bootstrap/preferences/themePreference.ts`: the only typed runtime owner of raw `localStorage` access for the non-sensitive `themeMode` key.
- `src/stores/theme.ts`: Pinia preference state, startup adoption, set/reset behavior, system listener, storage-event cross-tab listener, idempotency, and cleanup.
- `src/main.ts`: theme store initialization in the existing Pinia graph before router installation and before Vue mount.

There is still no Naive provider, Naive theme/themeOverrides, board-theme runtime, display-theme runtime, product theme control, reusable UI adapter layer, Dexie preference schema, query state, repository, API, or product UI migration.

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

## F3B Status

F3B implements only the global semantic token registry. It does not implement theme preference, system mode, persistence, no-flash startup, runtime document markers, runtime `color-scheme`, runtime `meta[name="theme-color"]`, Pinia theme state, Naive UI providers, Naive UI theme overrides, reusable UI adapters, product routes, or product UI.

The implemented domain counts are:

- `ui-chrome`: 31
- `radius`: 6
- `spacing`: 8
- `typography`: 8
- `control-geometry`: 4
- `board`: 13
- `annotation`: 6
- `annotation-geometry`: 6
- `evaluation`: 4

Raw-value governance, typecheck, static validation, production build, production/full audit, installed dependency listing, aggregate static validation, and real-browser `/pgnViewer/` token-loading validation passed for F3B.

## F3C Status

F3C implements the light/dark/system theme engine with:

- Preference identifiers: `light`, `dark`, `system`.
- Resolved theme identifiers: `light`, `dark`.
- Storage key: `themeMode`.
- Startup default: `system`; when `matchMedia` is unavailable, resolved theme falls back to `light` to match the token registry's static `:root` light scope.
- Marker contract: `html[data-theme-mode="light|dark|system"]` for intent and `html[data-theme="light|dark"]` for resolved runtime theme.
- Bootstrap order: `index.html` inline bootstrap reads the safe preference, applies markers, `color-scheme`, meta theme-color, and a minimal bootstrap snapshot before Vue; `src/main.ts` installs the existing Pinia graph, initializes `src/stores/theme.ts`, then installs router and mounts.
- System behavior: one `matchMedia('(prefers-color-scheme: dark)')` listener updates resolved theme only while preference is `system`; explicit modes ignore system changes.
- Cross-tab behavior: one `storage` listener accepts only valid external `themeMode` changes, ignores unrelated or malformed events, and does not write feedback.
- Failure behavior: corrupted values, denied storage reads/writes, missing meta element, and unavailable `matchMedia` do not block mount.
- Theme metadata: `documentElement.style.colorScheme` follows the resolved theme; runtime meta theme-color is derived from `--bg` after CSS is available. The inline bootstrap duplicates only the existing light/dark `--bg` values for pre-stylesheet no-flash metadata.
- Lifecycle: initialization is idempotent and `dispose()` removes owned listeners.

F3C validation passed with project scanners, formatting, linting, Stylelint, unused-code check, governance aggregate, TypeScript checking, temporary-output production build, production and full audits, installed dependency listing, aggregate static validation, and real-browser Google Chrome validation of clean, explicit, system, corrupted-storage, storage-failure, unavailable-`matchMedia`, two-tab cross-tab, repeated-initialization, route-mount, no-console-error, no-failed-request, and no-flash dark-startup cases.

## Gaps

Open gaps: Dexie structured preference ownership is still missing; Naive UI provider composition and token-derived `themeOverrides` are still missing; board-theme runtime and display-theme runtime are still missing; icon/link/disabled/connection/analysis/player-state roles are incomplete; motion/z-index/responsive/safe-area concrete scales are incomplete; panel, splitter, scroll-surface, line-height, and font-weight token domains remain unimplemented without approved inventory entries.

These gaps remain non-runtime findings. They do not claim any Naive UI provider, theme override, board-theme runtime, route, component, repository, API, Dexie schema, or product UI implementation already exists.

## Next Phase

Next required phase: `F3D_NAIVE_UI_THEME_PROVIDER_AND_TOKEN_OVERRIDE_IMPLEMENTATION`.

Superseded local alias: `F3B_TOKEN_AUTHORITY_IMPLEMENTATION`. The canonical replacement is `F3B_GLOBAL_SEMANTIC_TOKEN_REGISTRY_IMPLEMENTATION`.

Completed F3B scope: token authority only. Completed F3C scope: theme preference engine, synchronous no-flash bootstrap, Pinia theme store, document synchronization, system listener, approved cross-tab synchronization, and failure-safe non-sensitive bootstrap preference handling. Product UI, routes, Naive provider, Dexie schema, board runtime, API, auth, and feature components remain blocked until their own implementation slice is opened.

Remaining canonical slices:

1. `F3D_NAIVE_UI_THEME_PROVIDER_AND_TOKEN_OVERRIDE_IMPLEMENTATION`
2. `F3E_TOKEN_THEME_BROWSER_VALIDATION_AND_FINAL_CLOSURE`
