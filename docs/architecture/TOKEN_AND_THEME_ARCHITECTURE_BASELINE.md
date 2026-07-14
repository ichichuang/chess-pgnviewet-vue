# Token And Theme Architecture Baseline

Status: `F3D_NAIVE_UI_THEME_PROVIDER_IMPLEMENTED_VALIDATED`
Phase: `F3D_NAIVE_UI_THEME_PROVIDER_AND_TOKEN_OVERRIDE_IMPLEMENTATION`
Generated: `2026-07-12T07:47:56.192Z`

## Decision

`src/styles/tokens.css` remains the only target token authority. Canonical visual values from `pgnViewer-new` have been reconciled into that registry, while conflicting canonical ownership patterns remain excluded. Current target feature components and project-owned providers consume the registry rather than owning raw canonical values.

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

F3D adds the project-owned Naive UI provider boundary without changing token values. Implemented provider ownership:

- `src/app/providers/AppProviders.vue`: the only runtime owner of `NConfigProvider` and `NGlobalStyle`; it uses Naive UI `abstract` provider behavior and wraps the existing neutral bootstrap slot.
- `src/app/providers/naiveTheme.ts`: maps F3C resolved `light` to Naive UI's official `null` light behavior and resolved `dark` to `darkTheme`.
- `src/app/providers/naiveThemeOverrides.ts`: owns the single `GlobalThemeOverrides` object, with every visual override value expressed as an existing `src/styles/tokens.css` semantic token reference.
- `docs/architecture/NAIVE_UI_THEME_PROVIDER_BASELINE.md`: records the active F3D provider contract, mapped roles, deliberately unmapped roles, validation contract, and next gate.
- `src/App.vue`: imports only `AppProviders` and wraps the existing neutral bootstrap shell without changing route, copy, layout, or product behavior.

The current runtime includes product routes and workspace UI, reusable UI boundaries, board and display appearance, QueryClient state, typed repositories, API/auth boundaries, and product theme behavior. A project-owned Vue i18n runtime package, locale/date-locale synchronization, and generalized locale UI remain unimplemented until a dedicated phase selects them.

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

Continuing implementation must keep all concrete visual values in `src/styles/tokens.css` or in an explicitly generated token manifest derived from that authority. Feature components may consume tokens but must not define parallel palettes, raw Naive themes, or local token registries.

Compatibility aliases are allowed only inside the token authority: `--hover`, `--active-bg`, `--ring-accent`, `--panel`, `--input`, `--fg`, `--muted`, `--cg-light`, and `--cg-dark`. New feature code should use semantic/state/component/board tokens.

Naive UI may be installed only through a project-owned provider/adapter. Its theme overrides must derive from target tokens, not duplicate canonical literals in feature files.

The target semantic registry is the sole runtime visual-value authority. `pgnViewer-new` remains canonical runtime and visual evidence; `chess-pgnviewer` governance remains product and security authority. Naive UI is only a consumer and mapping layer, not a second authority or semantic namespace.

F3B must register canonical values without redesign. Component-specific, board, move, annotation, evaluation, player, responsive, safe-area, panel, splitter, typography, spacing, geometry, shadow, elevation, z-index, duration, and easing values must either resolve through `src/styles/tokens.css` or remain an explicit documented gap with owner, review trigger, and no invented value.

F3C owns light, dark, and system preference identifiers, applied light/dark resolution, truthful startup default, pre-Vue no-flash bootstrap, HTML marker synchronization, `color-scheme`, `meta[name="theme-color"]`, system `matchMedia`, runtime system-preference changes, persistence failure fallback, cross-tab synchronization, and synchronous non-sensitive bootstrap preference ownership. Any later Dexie relationship requires a separately approved persistence contract. Feature code must not own raw `localStorage`, `sessionStorage`, or `IndexedDB` preference behavior.

F3C owns the current Pinia theme-store boundary, reduced-motion behavior, and theme-transition behavior. F3D owns Naive UI `NConfigProvider` installation, `NGlobalStyle` ownership, light/dark Naive theme selection, and project-token-based `themeOverrides`. The project-owned Vue i18n boundary and locale/date-locale synchronization remain phase-gated and unimplemented.

## F3B Status

The F3B phase implemented only the global semantic token registry. Accepted F3C, F3D, and product phases subsequently implemented theme preference, system mode, no-flash startup, runtime document markers, `color-scheme`, `meta[name="theme-color"]`, Pinia theme state, Naive UI providers and overrides, reusable UI boundaries, product routes, and product UI.

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

## F3D Status

F3D implements the single project-owned Naive UI root provider and token-derived
theme override mapping with:

- Provider path: `src/app/providers/AppProviders.vue`.
- Theme mapping path: `src/app/providers/naiveTheme.ts`.
- Override mapping path: `src/app/providers/naiveThemeOverrides.ts`.
- Baseline authority: `docs/architecture/NAIVE_UI_THEME_PROVIDER_BASELINE.md`.
- Root composition: exactly one `NConfigProvider`, exactly one `NGlobalStyle`,
  then the default application slot.
- Layout neutrality: `NConfigProvider` uses `abstract`; browser validation
  confirmed the neutral bootstrap DOM remained wrapper-free and body/document
  scroll was not introduced.
- Theme store consumption: the provider reads the existing F3C Pinia
  `resolvedTheme`; it owns no preference state, storage access, media listener,
  storage listener, or document marker behavior.
- Resolved mapping: `light -> null`; `dark -> darkTheme`.
- Override inventory: 53 common override roles and 103 component override roles,
  all using `var(--...)` references to 37 existing semantic tokens.
- Component-specific mappings: Button, Card, Dialog, Dropdown, Input, Menu,
  Modal, Popover, Slider, Switch, and Tabs, limited to canonical and
  product-enabling roles that can be expressed through existing tokens.
- Deliberately unmapped roles: message/dialog/notification/loading-bar
  consumers, discrete API, locale/date-locale, tooltip-specific inverted token
  pairing, full border shorthand values without border-width tokens, z-index,
  motion, safe-area, splitter, responsive, scroll-surface, line-height,
  font-weight, overlay stacking, focus-trap, and broad component theming.

F3D validation passed with source reconciliation, project scanners, formatting,
linting, Stylelint, unused-code check, governance aggregate, TypeScript checking,
temporary-output production build, production and full audits, installed
dependency listing, aggregate static validation, and real-browser Google Chrome
validation of clean system light, explicit light, explicit dark, system-light,
system-dark, runtime light/dark switching, runtime system-resolution switching,
explicit modes ignoring system changes, two-tab synchronization, no-flash
dark-startup probes, provider/global-style counts, semantic-token mapping,
console/network cleanliness, and layout neutrality.

## Gaps

Remaining token additions require canonical source evidence and an approved inventory entry. The project-owned Vue i18n package and locale synchronization remain unimplemented; this baseline does not select them.

## Current Development Gate

`PRODUCT_UI_DEVELOPMENT_BASELINE_PASS`

Narrow browser validation remains mandatory for visible theme changes. Broad token-theme and cross-feature integration remains governed by `docs/architecture/PRODUCT_FIRST_DELIVERY_REBASE.md`.
