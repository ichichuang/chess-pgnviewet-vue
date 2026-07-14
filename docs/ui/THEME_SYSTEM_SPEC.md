# Theme System Specification

| Field   | Value                                                       |
| ------- | ----------------------------------------------------------- |
| Version | 1.2.1                                                       |
| Status  | `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`       |
| Gate    | `PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS` |

## Purpose

Define the single token and theme ownership model, distinguish the current theme runtime from approved product-setting targets, and prevent feature code from creating parallel visual values.

## Current implementation

- `src/styles/tokens.css` is the only global token registry.
- `src/theme/constants.ts`, `src/theme/runtime.ts`, `src/bootstrap/preferences/themePreference.ts`, and `src/stores/theme.ts` own the current theme runtime.
- The current preference is only `light`, `dark`, or `system` under the synchronous `localStorage` key `themeMode`.
- `index.html` reads that narrow preference before Vue mounts and applies `data-theme-mode`, resolved `data-theme`, `color-scheme`, and theme-color metadata.
- Project-owned Vue UI adapters consume the registry; Naive UI is not the token or product-component authority.

No current persistence owner exists for accent selection, board appearance selection, locale, sound, or AI defaults.

## Token layers

All feature values that belong to the design system reference the global registry.

| Layer              | Responsibility                                                       | Examples                                                                  |
| ------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Semantic           | Surface, text, border, accent, feedback, focus, and elevation intent | `--surface`, `--text`, `--border`, `--accent`, `--danger`                 |
| Component          | Project-owned control and container roles                            | button, input, card, dialog, tooltip aliases when present in the registry |
| Chessboard         | Board squares, coordinates, pieces, move state, and annotations      | current `--cg-*` families                                                 |
| State              | Hover, active, focus, disabled, loading, blocked, and stale states   | semantic state tokens                                                     |
| Data visualization | Evaluation and analysis visualization roles                          | current evaluation and classification tokens                              |
| Layout and type    | Spacing, radius, typography, control sizing, and motion              | current registry values                                                   |

Examples describe semantic ownership; they do not authorize adding an undeclared token outside `src/styles/tokens.css`.

## Current theme modes

| Mode     | Behavior                                                                    |
| -------- | --------------------------------------------------------------------------- |
| `light`  | Applies light semantic tokens.                                              |
| `dark`   | Applies dark semantic tokens.                                               |
| `system` | Resolves against `prefers-color-scheme` and follows runtime system changes. |

The stored preference and resolved applied theme remain separate. Cross-tab and system changes are reconciled by the current theme owner.

## Approved target setting roles

The product blueprint permits future settings for board appearance, layout, accessibility, sound, locale, and AI default policy. These are target responsibilities, not current fields:

- Accent selection may remap semantic accent roles only after a curated accessible set and a persistence owner are approved.
- Board appearance may select a named token-backed board style without changing the UI light/dark preference.
- Display appearance may apply route-scoped typography, spacing, contrast, and board-role overrides for viewing distance.
- A custom theme manifest is not an active contract. Any later manifest requires an owner-approved schema, security boundary, registry mapping, and failure behavior.
- Locale belongs to the future project-owned Vue i18n boundary, not the theme bootstrap record.
- Sound default remains `OD-11`; AI setting scope and resource defaults remain `OD-03` and `OD-04`.

No target setting is persisted until `docs/ui/PERSISTENCE_RECOVERY_SPEC.md` records an implemented owner.

## Big-screen theming

The independent `/competitions/:hdid/display` route reuses the single token registry and canonical chessboard visual roles. It may compose approved display-specific player/status primitives and route-scoped token aliases. It does not import the complete teaching workspace, teaching right panel, teaching toolbar, or analysis panel.

## No raw visual-value rule

Feature code must not create raw color values, parallel token registries, literal-color utility classes, or inline color values. Raw registry values are owned only by `src/styles/tokens.css` and other explicit governance allowlists. A future validated theme manifest does not become an exception until its contract is approved and the scanner policy is updated.

## Rules

1. `src/styles/tokens.css` is the only global token registry.
2. Semantic tokens describe intent; feature code does not consume palette literals.
3. Current theme persistence contains only `light`, `dark`, or `system` under `themeMode`.
4. Board appearance remains independent of UI light/dark preference when implemented.
5. Target accent, board, locale, sound, and AI settings are not described as current runtime fields.
6. Big-screen uses the same token authority and canonical board; importing the complete teaching composition is forbidden.

## Acceptance criteria

1. Current theme modes work through the tracked synchronous bootstrap and theme-store owners.
2. Feature code consumes registry tokens and introduces no parallel value source.
3. Current and target theme/settings behavior remain explicit and separate.
4. Big-screen display uses shared token and board authorities without importing teaching-only panels.
5. `OD-03`, `OD-04`, and `OD-11` remain unresolved.

## Machine-readable summary

```json
{
  "document": "theme-system-spec",
  "version": "1.2.1",
  "status": "COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN",
  "page_design_gate": "PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS",
  "current_theme_modes": ["light", "dark", "system"],
  "current_storage": "localStorage:themeMode",
  "current_accent_selector": false,
  "current_board_appearance_selector": false,
  "current_locale_owner": false,
  "target_setting_roles": [
    "accent",
    "board_appearance",
    "display_appearance",
    "accessibility",
    "sound",
    "locale",
    "ai_default_policy"
  ],
  "global_token_registry": "src/styles/tokens.css",
  "big_screen_reuses_full_teaching_composition": false,
  "open_owner_decisions": ["OD-03", "OD-04", "OD-11"]
}
```
