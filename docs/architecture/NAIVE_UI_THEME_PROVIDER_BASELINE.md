# Naive UI Theme Provider Baseline

Status: `F3D_NAIVE_UI_THEME_PROVIDER_IMPLEMENTED_PENDING_VALIDATION`
Phase: `F3D_NAIVE_UI_THEME_PROVIDER_AND_TOKEN_OVERRIDE_IMPLEMENTATION`

## Scope

F3D installs the minimum project-owned Naive UI root provider boundary needed before
`PRODUCT_UI_MIGRATION_GATE_REVIEW`. It does not implement product UI, reusable UI
adapters, icon adapters, i18n, Dexie, QueryClient, repositories, generalized error
handling, accessibility hardening, foundation previews, or broad final integration.

## Provider Files

- `src/app/providers/AppProviders.vue`
- `src/app/providers/naiveTheme.ts`
- `src/app/providers/naiveThemeOverrides.ts`

`src/App.vue` imports only the project-owned provider component and wraps the
existing neutral bootstrap shell. `src/main.ts`, Router, and Pinia installation
remain unchanged.

## Composition Contract

The root composition order is:

1. `NConfigProvider`
2. `NGlobalStyle`
3. default application slot

`NConfigProvider` is owned only by `src/app/providers/AppProviders.vue` and is
rendered exactly once in the normal Vue application root. It uses Naive UI's
supported `abstract` prop so no provider DOM wrapper changes application geometry.

`NGlobalStyle` is owned only by `src/app/providers/AppProviders.vue` and is
rendered exactly once inside the config provider.

Message, dialog, notification, loading-bar, locale, date-locale, and discrete API
owners are deferred. Canonical `pgnViewer-new` uses message and dialog providers,
but the active product-first F3D gate requires only the single config provider,
global style ownership, and token-based theme mapping before the gate review.

## Theme Store Consumption

The provider consumes the existing F3C Pinia theme store through `useThemeStore()`.
It reads only `resolvedTheme`. It does not create another theme preference state,
resolved-theme computation, media-query listener, storage listener, or document
marker owner.

Resolved mapping:

- `light` maps to Naive UI's official light behavior: `theme = null`.
- `dark` maps to Naive UI's official `darkTheme` object.

The provider does not read `localStorage`, `sessionStorage`, IndexedDB, cookies,
URL parameters, environment variables, credentials, or product state.

## Theme Overrides

`src/app/providers/naiveThemeOverrides.ts` owns one `GlobalThemeOverrides` object.
Every value is a project semantic token reference through `var(--project-token)`.
No raw visual values, parallel token namespaces, or duplicated canonical literals
are permitted in the mapping.

Mapped common roles:

- Primary roles: `primaryColor`, `primaryColorHover`, `primaryColorPressed`,
  `primaryColorSuppl`
- Status roles: `infoColor`, `successColor`, `warningColor`, `errorColor`
- Text roles: `textColorBase`, `textColor1`, `textColor2`, `textColor3`,
  `textColorDisabled`, `placeholderColor`, `placeholderColorDisabled`
- Icon roles: `iconColor`, `iconColorHover`, `iconColorPressed`,
  `iconColorDisabled`
- Surface roles: `baseColor`, `bodyColor`, `cardColor`, `modalColor`,
  `popoverColor`, `tableColor`, `inputColor`, `inputColorDisabled`,
  `actionColor`, `tagColor`, `avatarColor`, `buttonColor2`
- State roles: `hoverColor`, `pressedColor`, `tableColorHover`,
  `tableColorStriped`, `buttonColor2Hover`, `buttonColor2Pressed`
- Border roles: `borderColor`, `dividerColor`
- Elevation roles: `boxShadow1`, `boxShadow2`, `boxShadow3`
- Typography and geometry roles: `fontFamily`, `fontFamilyMono`, `fontSize`,
  `fontSizeSmall`, `fontSizeMedium`, `fontSizeLarge`, `borderRadius`,
  `borderRadiusSmall`, `heightSmall`, `heightMedium`

Mapped component roles:

- `Button`: primary text, secondary surfaces, radius, font size, and medium/small
  height roles
- `Card`: surface, text, border, action, radius, padding, and elevation roles
- `Dialog`: surface, text, icon status, and radius roles
- `Dropdown`: surface, divider, option state, text, active, and radius roles
- `Input`: surface, disabled, text, placeholder, caret, loading, and focus-shadow
  roles
- `Menu`: surface, divider, hover, active, text, icon, arrow, group text, radius,
  and font-size roles
- `Modal`: surface, text, and elevation roles
- `Popover`: surface, divider, text, elevation, radius, and font-size roles
- `Slider`: rail, fill, hover, and focus-shadow roles
- `Switch`: rail, active rail, and focus-shadow roles
- `Tabs`: text, active, hover, disabled, segment, border, radius, pane, bar, and
  close-state roles

Consumed project tokens:

- `--accent`, `--accent-strong`, `--accent-press`, `--accent-bg`,
  `--accent-bg-2`
- `--bg`, `--surface`, `--surface-2`, `--surface-3`
- `--text`, `--text-2`, `--text-muted`, `--text-faint`,
  `--text-on-accent`
- `--border`, `--border-strong`
- `--success`, `--warning`, `--danger`, `--info`
- `--state-hover-bg`, `--state-active-bg`, `--state-focus-ring`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- `--font-sans`, `--font-mono`, `--fs-sm`, `--fs-base`, `--fs-lg`
- `--r-xs`, `--r-sm`, `--r-md`
- `--s-4`
- `--control-h-sm`, `--control-h`

## Canonical Evidence

Canonical evidence comes from `pgnViewer-new/src/app/App.vue` and
`pgnViewer-new/src/app/theme.ts`. F3D translates the canonical provider and
theme-role evidence into the target token system without copying canonical raw
values or product-feature imports.

## Deliberately Unmapped Roles

The following remain intentionally unmapped in F3D:

- Naive message, dialog, notification, loading-bar, and discrete API consumers
- Locale and date-locale providers
- Tooltip-specific inverted color pairing, because no target tooltip tokens exist
- Full border shorthand overrides such as `Input.borderFocus`, because F3B has
  focus-border color but no border-width token
- Z-index, motion duration, easing, safe-area, splitter, responsive, scroll
  surface, line-height, font-weight, overlay stacking, and focus-trap domains
- Broad component-by-component Naive UI theming not backed by canonical F3A/F3D
  evidence

## Static Governance Relationship

Direct Naive UI imports are allowed only under the approved provider boundary
or future `src/ui` adapters. Product feature files must not import
`NConfigProvider`, `NGlobalStyle`, `darkTheme`, `GlobalThemeOverrides`, theme
contexts, or theme override objects directly.

The provider count contract is exactly one `NConfigProvider` and exactly one
`NGlobalStyle` in authored target runtime files. The Vue root, Router owner,
Router installation, Pinia owner, and Pinia installation remain singular.

## Layout Neutrality

`NConfigProvider` uses `abstract`, and `NGlobalStyle` emits global styles only.
The provider boundary must not introduce height, width, flex, grid, scroll,
overflow, stacking, or body-scroll changes. Browser validation must prove the
neutral bootstrap remains visually and geometrically stable.

Overlay and z-index ownership remains limited: F3D does not add overlay
providers or z-index mappings.

## Validation Contract

F3D validation requires project scanners, formatting checks, lint, Stylelint,
unused-code checks, governance aggregate checks, typecheck, a temporary-output
production build, production and full pnpm audits, installed dependency listing,
aggregate static validation, source reconciliation, and narrow real-browser
validation.

Browser validation must cover `/pgnViewer/`, clean startup, explicit light,
explicit dark, system-light, system-dark, runtime light/dark switching,
runtime system-resolution switching, explicit modes ignoring system changes,
two-tab synchronization, no visible flash, provider and global-style instance
counts, semantic-token agreement, Naive theme agreement, console/network
cleanliness, layout neutrality, and process cleanup.

## Completion Gate

F3D is complete only when the provider exists once, `NGlobalStyle` exists once,
the F3C resolved theme controls Naive light/dark behavior, every override value
uses an existing semantic token, no raw visual value or parallel namespace is
introduced, Router/Pinia/Vue root ownership stays singular, static/build
validation passes, real-browser provider validation passes, implementation and
governance commits are pushed, local `HEAD` equals remote `main`, and the
tracked worktree is clean.

Next required phase: `PRODUCT_UI_MIGRATION_GATE_REVIEW`.
