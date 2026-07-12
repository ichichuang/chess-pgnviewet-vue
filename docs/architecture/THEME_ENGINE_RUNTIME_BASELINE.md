# Theme Engine Runtime Baseline

Status: `F3C_THEME_ENGINE_IMPLEMENTED_VALIDATED`
Phase: `F3C_THEME_ENGINE_PREFERENCE_AND_NO_FLASH_BOOTSTRAP_IMPLEMENTATION`

## Scope

F3C implements the project-owned UI theme preference engine only. It owns light,
dark, and system preference resolution, synchronous pre-Vue startup restoration,
runtime document synchronization, Pinia state ownership, failure-safe
non-sensitive persistence, system preference response, approved storage-event
cross-tab synchronization, listener cleanup, and no-flash startup behavior.

F3C does not implement Naive UI providers, Naive UI theme objects,
themeOverrides, reusable UI adapters, theme controls, Dexie database ownership,
i18n, QueryClient state, repositories, APIs, board-theme runtime, product routes,
or product UI migration.

## Ownership Files

- `index.html` owns the unavoidable inline pre-Vue bootstrap boundary.
- `src/theme/constants.ts` owns immutable identifiers shared by typed runtime
  code.
- `src/theme/types.ts` owns the typed preference, resolved-theme, and bootstrap
  snapshot contracts.
- `src/theme/runtime.ts` owns preference validation, resolution, document marker
  synchronization, `color-scheme`, and computed token-backed meta theme-color
  synchronization.
- `src/bootstrap/preferences/themePreference.ts` is the only typed runtime owner
  allowed to read or write `localStorage`.
- `src/stores/theme.ts` owns Pinia theme preference state, startup snapshot
  adoption, set/reset behavior, system media listener lifecycle, storage-event
  cross-tab listener lifecycle, idempotent initialization, and cleanup.
- `src/main.ts` initializes the Pinia theme store before router installation and
  before Vue mount while preserving the existing single Vue root and single
  Pinia graph.

## Contract

Preference identifiers: `light`, `dark`, `system`.

Resolved theme identifiers: `light`, `dark`.

Storage key: `themeMode`. It stores only the non-sensitive preference identifier.
No passwords, tokens, authorization headers, signing secrets, HMAC secrets, MQTT
credentials, cookies, private session data, URLs, or unrelated browser data are
stored.

Startup default: `system`. When no valid stored preference exists, system mode is
used and resolves through `prefers-color-scheme`. If `matchMedia` is unavailable
or throws, system resolves to `light`, matching the token registry's static
`:root` light scope.

System media query: `(prefers-color-scheme: dark)`.

Markers:

- `html[data-theme-mode="light|dark|system"]` records user intent.
- `html[data-theme="light|dark"]` records the resolved runtime theme.

Board and display markers remain out of F3C runtime scope.

## Bootstrap Order

1. `index.html` inline bootstrap runs in the document head before Vue app
   creation and before the application surface can mount.
2. The bootstrap safely reads `localStorage["themeMode"]`, normalizes invalid or
   unavailable storage to the `system` default without persisting a replacement,
   resolves the applied theme, sets the root markers, sets
   `documentElement.style.colorScheme`, updates `meta[name="theme-color"]`, and
   publishes `window.__KAISAILE_THEME_BOOTSTRAP__`.
3. `src/main.ts` creates the Vue app, installs the existing Pinia instance,
   creates the theme store in that graph, and calls `themeStore.initialize()`
   before router installation and before `app.mount`.
4. The store adopts the bootstrap snapshot, applies the same markers without
   clearing them first, attaches one system media listener and one storage-event
   listener, clears the bootstrap snapshot, and lets the app mount.

The inline bootstrap duplicates only immutable identifiers, a small deterministic
resolution algorithm, and the two existing `--bg` token values required for
pre-stylesheet meta theme-color. Typed runtime code derives meta theme-color
from `--bg` through computed styles after CSS is available.

## Runtime Behavior

`setPreference()` accepts only `light`, `dark`, or `system`, writes only the
approved storage key, updates markers, synchronizes `color-scheme`, and derives
meta theme-color from `--bg`. Write failures update runtime state without
throwing and without storing any fallback value.

`resetPreference()` removes the approved key when storage is available and
returns to the `system` default. Remove failures do not prevent runtime fallback.

System changes update the internal resolved system theme. They synchronize the
document only when preference is `system`; explicit `light` and `dark`
preferences ignore system changes.

Cross-tab synchronization uses the browser `storage` event and only the
`themeMode` key. Valid external values update the receiving tab without writing
back. Malformed values and unrelated keys are ignored. Key removal resets the
receiving tab to the `system` default without a feedback loop.

Initialization is idempotent. Repeated `initialize()` calls reapply the current
document state without adding duplicate listeners. `dispose()` removes both
listener owners and clears initialization state.

## Failure Boundaries

Storage denial, corrupted stored values, unavailable `matchMedia`, missing meta
theme-color, and recoverable DOM limitations do not prevent application mount.
Corrupted values are rejected and normalized to the startup default in memory
without overwriting the stored value.

No theme-transition animation is implemented in F3C. Reduced-motion users
receive no additional theme animation.

## Validation

F3C validation passed on 2026-07-12 against the production build served from an
operating-system temporary directory under the configured `/pgnViewer/` base.
Browser validation used installed Google Chrome with a temporary profile and a
temporary CDP harness outside the repository.

Validated cases:

- clean profile with no stored preference
- stored explicit `light`
- stored explicit `dark`
- stored `system` while the browser reports light
- stored `system` while the browser reports dark
- runtime system-preference changes light to dark and dark to light
- explicit `light` and `dark` ignoring system changes
- runtime preference changes to `light`, `dark`, and `system`
- corrupted stored preference
- storage read failure
- storage write failure
- unavailable `matchMedia`
- two-tab storage-event synchronization
- unrelated and malformed storage events ignored
- repeated initialization without duplicate listener state
- `/pgnViewer/` route mount, nonblank bootstrap DOM, no Vite overlay, no console
  errors, no failed asset requests, no Naive UI provider DOM
- no-flash probes for persisted explicit dark and persisted system-dark, with
  the resolved marker present before the Vue surface and at first paint

Required validation for F3C remains:

- project scanners: `check:deps`, `check:architecture`, `check:tokens`,
  `check:mocks`, `check:secrets`
- formatting and static checks: `format:check`, `lint`, `lint:style`,
  `check:unused`, `check:governance`, `typecheck`
- temporary-output production build
- `audit:prod`, `pnpm audit`, `pnpm list --depth 0`, `check:static`
- real-browser validation of clean, explicit, system, corrupted-storage,
  storage-failure, cross-tab, listener-idempotency, no-console-error,
  no-failed-asset, and no-flash startup cases on `/pgnViewer/`

## Current Limitations

F3C intentionally leaves Naive UI provider composition, token-derived
themeOverrides, product-visible controls, board-theme runtime, display-theme
runtime, Dexie-backed structured preferences, i18n, QueryClient setup,
repositories, APIs, accessibility implementation beyond the neutral bootstrap,
responsive product layout, motion tokens, foundation preview, and product UI to
later phases.

## Completion Gate

F3C is complete only while the implementation remains limited to the ownership
files above, all static and build validation passes, real-browser no-flash
startup restoration passes, no dependency or token-registry value changes are
introduced, no Naive UI provider or product UI appears, and the next phase
remains `F3D_NAIVE_UI_THEME_PROVIDER_AND_TOKEN_OVERRIDE_IMPLEMENTATION`.

## Next Phase

Next required phase:
`F3D_NAIVE_UI_THEME_PROVIDER_AND_TOKEN_OVERRIDE_IMPLEMENTATION`.
