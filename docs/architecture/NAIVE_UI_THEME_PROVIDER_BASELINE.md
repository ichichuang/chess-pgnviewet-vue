# Naive UI Theme Provider Baseline

Status: `ACTIVE_RUNTIME_AUTHORITY`

## Current ownership

- `src/app/providers/AppProviders.vue` is the only runtime owner of `NConfigProvider` and `NGlobalStyle`.
- `src/app/providers/naiveTheme.ts` maps the resolved project theme to Naive UI light or dark behavior.
- `src/app/providers/naiveThemeOverrides.ts` owns the single `GlobalThemeOverrides` object.
- `src/stores/theme.ts` owns theme preference and resolved-theme state. The provider creates no second theme state or persistence owner.

`src/App.vue` imports the project-owned provider and renders it once around the application. `NConfigProvider` uses its abstract composition so the provider adds no layout wrapper. `NGlobalStyle` appears once inside it.

## Token mapping

Every override value is a `var(--project-token)` reference to `src/styles/tokens.css`. Naive UI is a consumer and mapping layer, not a product-component system or token authority.

The current mapping covers the common surface, text, icon, border, status, focus, elevation, typography, control-size, and radius roles required by the implemented Button, Card, Dialog, Dropdown, Input, Menu, Modal, Popover, Slider, Switch, and Tabs adapters.

Feature files must not import provider types, theme objects, global styles, or Naive UI components directly. Direct Naive UI imports remain limited to `src/app/providers/` and `src/ui/`.

## Current boundaries

- Message, notification, loading-bar, discrete API, locale, and date-locale owners are not currently implemented.
- Tooltip-specific inverted roles, full border shorthands without token support, and broad component-by-component theming remain unowned.
- The provider owns no layout, scroll, Router, Pinia installation, Query, persistence, API, or product state.
- No current board-theme, accent, locale, sound, or AI-default setting is created by this provider.
- Any new Naive UI role requires an existing project token and a real component owner; raw override literals and parallel token namespaces are forbidden.

## Layout and lifecycle

The provider must not introduce height, width, flex, grid, overflow, stacking, or body-scroll ownership. Theme changes update the provider mapping without remounting the application shell. Provider composition stays singular across routes.

## Validation contract

Changes require the relevant project scanners, formatting, lint, Stylelint, Knip, static aggregate, TypeScript checking, temporary-output production build, audits, and narrow real-browser validation of provider count, light/dark mapping, semantic-token agreement, console errors, layout neutrality, and any affected interaction. Visible behavior must honor reduced motion and focus requirements.
