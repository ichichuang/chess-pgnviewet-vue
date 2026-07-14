# UI Acceptance Checklist

## Purpose

Consolidate the acceptance criteria from every UI specification into a single verification checklist so future agents, reviewers, and QA can confirm compliance before moving to the next phase.

## Scope

This document covers all `docs/ui/*` specifications. Each item includes the verification method and the source spec.

## Non-goals

- Product rules live in `docs/product/*`.
- Architecture rules live in `docs/architecture/*`.
- API contract rules live in the active authority set named by
  `docs/migration/SOURCE_PROVENANCE.md`.

## How to use this checklist

- Each item must pass before a feature is considered complete.
- Verification methods: `lint`, `unit`, `component`, `e2e`, `axe`, `manual`.
- Failed items block merge unless an explicit exception is documented.

## Theme system

| #   | Check                                                                                                                        | Source            | Method         |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------- |
| T1  | All colors in feature code come from approved tokens; no raw hex/rgb/hsl/oklch/named colors or literal-color utility classes | THEME_SYSTEM_SPEC | lint           |
| T2  | Light, dark, and system modes render correctly                                                                               | THEME_SYSTEM_SPEC | component, e2e |
| T3  | User-selectable accent colors remap the `--accent` token family                                                              | THEME_SYSTEM_SPEC | component      |
| T4  | Chessboard theme remains independent of UI light/dark mode                                                                   | THEME_SYSTEM_SPEC | e2e            |
| T5  | Large-screen display uses display theme token overrides, not a forked component set                                          | THEME_SYSTEM_SPEC | e2e            |
| T6  | Token lint passes for all new `.tsx`/`.ts`/`.css` files in `src/features/` and `src/ui/`                                     | THEME_SYSTEM_SPEC | lint           |

## Layout system

| #   | Check                                                                                   | Source             | Method          |
| --- | --------------------------------------------------------------------------------------- | ------------------ | --------------- |
| L1  | The app body is never the main scroll container; `html`/`body` have no visible overflow | LAYOUT_SYSTEM_SPEC | e2e             |
| L2  | Every root component includes a layout contract comment                                 | LAYOUT_SYSTEM_SPEC | lint            |
| L3  | Scrollable areas have `min-height: 0` and a single scroll owner per area                | LAYOUT_SYSTEM_SPEC | lint, component |
| L4  | Header/toolbar/status bars remain stable when data loads                                | LAYOUT_SYSTEM_SPEC | e2e             |
| L5  | Panel sizes and collapsed state are persisted and restored after refresh                | LAYOUT_SYSTEM_SPEC | e2e             |
| L6  | The board is square, fully visible, and not clipped by panels                           | LAYOUT_SYSTEM_SPEC | e2e, manual     |

## Page style

| #   | Check                                                                  | Source          | Method         |
| --- | ---------------------------------------------------------------------- | --------------- | -------------- |
| P1  | Typography, spacing, radii, and shadows use project tokens             | PAGE_STYLE_SPEC | lint           |
| P2  | Buttons in loading state do not change width                           | PAGE_STYLE_SPEC | component      |
| P3  | Loading/empty/error states render inside the affected module           | PAGE_STYLE_SPEC | component, e2e |
| P4  | Scrollbars are themed in light and dark modes                          | PAGE_STYLE_SPEC | e2e            |
| P5  | Avatars reserve stable geometry and use the local fallback             | PAGE_STYLE_SPEC | component      |
| P6  | User-facing Chinese copy uses "开赛了" and not the forbidden homophone | PAGE_STYLE_SPEC | lint           |

## Responsive screen

| #   | Check                                                                    | Source                 | Method       |
| --- | ------------------------------------------------------------------------ | ---------------------- | ------------ |
| R1  | Workspace is usable on laptop, desktop, tablet, and big-screen profiles  | RESPONSIVE_SCREEN_SPEC | e2e, manual  |
| R2  | Board remains visible and square across all profiles                     | RESPONSIVE_SCREEN_SPEC | e2e, manual  |
| R3  | Panels collapse in the documented order on narrow viewports              | RESPONSIVE_SCREEN_SPEC | e2e          |
| R4  | Touch targets are at least 44×44 CSS pixels                              | RESPONSIVE_SCREEN_SPEC | lint, manual |
| R5  | Big-screen display uses the same components with display theme overrides | RESPONSIVE_SCREEN_SPEC | e2e          |

## Component system

| #   | Check                                                                                    | Source                | Method         |
| --- | ---------------------------------------------------------------------------------------- | --------------------- | -------------- |
| C1  | No canonical mode/source has a separate top-level page component                         | COMPONENT_SYSTEM_SPEC | lint           |
| C2  | Presentational components in `src/ui/` do not import stores                              | COMPONENT_SYSTEM_SPEC | lint           |
| C3  | Source adapters map DTOs to domain models before UI consumption                          | COMPONENT_SYSTEM_SPEC | unit           |
| C4  | Live sources are read-only in the workspace; import to analysis requires explicit action | COMPONENT_SYSTEM_SPEC | e2e            |
| C5  | Conditional rendering matrix covers all canonical modes and sources                      | COMPONENT_SYSTEM_SPEC | component, e2e |

## Persistence and recovery

| #   | Check                                                                                                                                                | Source                    | Method      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------- |
| PR1 | All persisted fields are categorized in one of the eight persistence categories                                                                      | PERSISTENCE_RECOVERY_SPEC | manual      |
| PR2 | Refresh preserves workspace tabs, mode, source, selections, layout, theme, language, analysis state, drafts, and display config                      | PERSISTENCE_RECOVERY_SPEC | e2e         |
| PR3 | Auth data is absent from Dexie, persisted Query cache, and URLs; only the strict 43,200-second `kaisaile.auth.v1` record is stored in `localStorage` | PERSISTENCE_RECOVERY_SPEC | lint, audit |
| PR4 | Dexie tables have schema versions and Zod-validated migrations                                                                                       | PERSISTENCE_RECOVERY_SPEC | unit        |
| PR5 | Stale sources fall back safely after refresh without data loss                                                                                       | PERSISTENCE_RECOVERY_SPEC | e2e         |

## Accessibility

| #   | Check                                                                           | Source             | Method         |
| --- | ------------------------------------------------------------------------------- | ------------------ | -------------- |
| A1  | All interactive elements are reachable and operable by keyboard                 | ACCESSIBILITY_SPEC | e2e            |
| A2  | Focus indicators are visible in light and dark modes                            | ACCESSIBILITY_SPEC | e2e, manual    |
| A3  | Board, move list, toolbars, and live regions have correct ARIA roles and labels | ACCESSIBILITY_SPEC | component, axe |
| A4  | Animations respect `prefers-reduced-motion`                                     | ACCESSIBILITY_SPEC | e2e            |
| A5  | Text and icon contrast meet WCAG AA                                             | ACCESSIBILITY_SPEC | axe            |
| A6  | axe-core passes in component and E2E tests for canonical surfaces               | ACCESSIBILITY_SPEC | axe            |

## Internationalization

| #   | Check                                                                                     | Source    | Method     |
| --- | ----------------------------------------------------------------------------------------- | --------- | ---------- |
| I1  | All new user-facing strings use i18next keys                                              | I18N_SPEC | lint       |
| I2  | Chinese translations use "开赛了" and not the forbidden homophone                         | I18N_SPEC | lint       |
| I3  | Translation files pass Zod validation and have no missing keys across supported languages | I18N_SPEC | lint       |
| I4  | Dates, numbers, and plurals use `Intl` formatters                                         | I18N_SPEC | lint, unit |

## Cross-cutting

| #   | Check                                                                          | Source                               | Method      |
| --- | ------------------------------------------------------------------------------ | ------------------------------------ | ----------- |
| X1  | No forbidden write/admin endpoint appears in feature code or ports             | PRODUCT_DEFINITION, ARCHITECTURE_RFC | lint, audit |
| X2  | `proxyRequest` and old PC `/CALL` transport are not used as default transport  | PRODUCT_DEFINITION, ARCHITECTURE_RFC | lint, audit |
| X3  | Every UI spec file contains acceptance criteria and a machine-readable summary | This checklist                       | lint        |

## Sign-off

| Spec                      | Reviewer | Date | Status |
| ------------------------- | -------- | ---- | ------ |
| THEME_SYSTEM_SPEC         |          |      |        |
| LAYOUT_SYSTEM_SPEC        |          |      |        |
| PAGE_STYLE_SPEC           |          |      |        |
| RESPONSIVE_SCREEN_SPEC    |          |      |        |
| COMPONENT_SYSTEM_SPEC     |          |      |        |
| PERSISTENCE_RECOVERY_SPEC |          |      |        |
| ACCESSIBILITY_SPEC        |          |      |        |
| I18N_SPEC                 |          |      |        |

## Rules

### R1. Checklist items are blocking

A feature is not complete until all relevant checklist items pass.

### R2. Failed items require documented exceptions

Any failure must be tracked as a risk or open question in the relevant spec.

### R3. Verification methods are mandatory

Every item must specify at least one verification method.

## Acceptance criteria

1. Every `docs/ui/*` spec is represented by at least one checklist item.
2. Each item includes a verification method.
3. Cross-cutting rules cover forbidden endpoints and transport assumptions.
4. A sign-off table is provided for spec-level review.

## Open questions / risks

- Some checks (e.g., color contrast of custom board themes) may require manual verification.
- The token lint and i18n lint rules must be implemented before the checklist can run automatically.

## Machine-readable summary

```json
{
  "document": "ui-acceptance-checklist",
  "version": "1.0.0",
  "rules": [
    "checklist_items_blocking",
    "failed_items_require_documented_exceptions",
    "verification_methods_mandatory"
  ],
  "covered_specs": [
    "THEME_SYSTEM_SPEC",
    "LAYOUT_SYSTEM_SPEC",
    "PAGE_STYLE_SPEC",
    "RESPONSIVE_SCREEN_SPEC",
    "COMPONENT_SYSTEM_SPEC",
    "PERSISTENCE_RECOVERY_SPEC",
    "ACCESSIBILITY_SPEC",
    "I18N_SPEC"
  ],
  "verification_methods": ["lint", "unit", "component", "e2e", "axe", "manual"],
  "related_docs": [
    "docs/ui/THEME_SYSTEM_SPEC.md",
    "docs/ui/LAYOUT_SYSTEM_SPEC.md",
    "docs/ui/PAGE_STYLE_SPEC.md",
    "docs/ui/RESPONSIVE_SCREEN_SPEC.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md",
    "docs/ui/PERSISTENCE_RECOVERY_SPEC.md",
    "docs/ui/ACCESSIBILITY_SPEC.md",
    "docs/ui/I18N_SPEC.md"
  ],
  "next_doc": "docs/ai/PROJECT_UI_SKILL_SPEC.md"
}
```
