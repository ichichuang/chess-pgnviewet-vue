# Theme System Specification

## Purpose

Define the design token layers, theme modes, accent color system, chessboard themes, large-screen themes, and the rules that prevent raw color values from appearing in feature code.

## Scope

This document governs:

- Semantic, component, chessboard, state, and data-visualization tokens.
- Light, dark, and system theme modes.
- User-selectable accent colors and future client-specific custom themes.
- Chessboard themes and large-screen display themes.
- Project-owned CSS registry integration and token lint rules.

## Non-goals

- Layout and scroll rules are defined in `docs/ui/LAYOUT_SYSTEM_SPEC.md`.
- Component APIs are defined in `docs/ui/COMPONENT_SYSTEM_SPEC.md`.
- Accessibility contrast requirements are defined in `docs/ui/ACCESSIBILITY_SPEC.md`.

## Token layers

All colors, shadows, borders, radii, spacing, and typography must come from the token system. Canonical values are declared once as CSS custom properties in `src/styles/tokens.css`. Typed metadata may reference that registry but must not duplicate or redefine its values.

### Semantic tokens

Semantic tokens describe the meaning of a value, not its concrete color.

| Token family | Examples                                                                        |
| ------------ | ------------------------------------------------------------------------------- |
| Background   | `--bg`, `--surface`, `--surface-2`, `--surface-3`                               |
| Text         | `--text`, `--text-2`, `--text-muted`, `--text-faint`, `--text-on-accent`        |
| Border       | `--border`, `--border-strong`, `--border-focus`                                 |
| Accent       | `--accent`, `--accent-strong`, `--accent-press`, `--accent-soft`, `--accent-bg` |
| State        | `--success`, `--warning`, `--danger`, `--info` and their `-bg` variants         |
| Shadow       | `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--ring-accent`     |
| Radius       | `--r-xs`, `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`, `--r-full`                    |
| Spacing      | `--s-1`, `--s-2`, `--s-3`, `--s-4`, `--s-5`, `--s-6`, `--s-8`, `--s-10`         |
| Typography   | `--font-sans`, `--font-mono`, `--fs-xs`...`--fs-2xl`                            |

### Component tokens

Component tokens map semantic tokens to specific components. They are optional aliases that make component code more readable and allow per-component theming without forking semantic tokens.

| Token family | Examples                                                                |
| ------------ | ----------------------------------------------------------------------- |
| Button       | `--button-primary-bg`, `--button-primary-text`, `--button-secondary-bg` |
| Input        | `--input-bg`, `--input-border`, `--input-focus-ring`                    |
| Card         | `--card-bg`, `--card-border`, `--card-radius`                           |
| Dialog       | `--dialog-bg`, `--dialog-backdrop`, `--dialog-shadow`                   |
| Tooltip      | `--tooltip-bg`, `--tooltip-text`                                        |

### Chessboard tokens

Chessboard tokens are scoped under `--cg-*` and are independent of the UI chrome theme so a board can keep its style in light or dark mode.

| Token family | Examples                                                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Squares      | `--cg-square-light`, `--cg-square-dark`                                                                                 |
| Highlights   | `--cg-last-move`, `--cg-selected`, `--cg-check`, `--cg-premove`                                                         |
| Annotations  | `--cg-arrow-red`, `--cg-arrow-green`, `--cg-arrow-yellow`, `--cg-arrow-orange`, `--cg-arrow-purple`, `--cg-arrow-black` |
| Pieces       | `--cg-piece-set` (identifier), `--cg-piece-outline`                                                                     |
| Coordinates  | `--cg-coord-light`, `--cg-coord-dark`                                                                                   |

### State tokens

State tokens describe interactive and feedback states.

| Token family   | Examples                                       |
| -------------- | ---------------------------------------------- |
| Hover          | `--state-hover`, `--state-hover-bg`            |
| Active/pressed | `--state-active`, `--state-active-bg`          |
| Focus          | `--state-focus-ring`, `--state-focus-border`   |
| Disabled       | `--state-disabled-bg`, `--state-disabled-text` |
| Loading        | `--state-loading-bg`, `--state-loading-text`   |

### Data visualization tokens

Data visualization tokens are used for evaluation charts, classification bars, and statistics.

| Token family | Examples                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Evaluation   | `--eval-white`, `--eval-black`, `--eval-advantage-line`                                                                                   |
| Move quality | `--eval-blunder`, `--eval-mistake`, `--eval-inaccuracy`, `--eval-good`, `--eval-excellent`, `--eval-best`, `--eval-book`, `--eval-forced` |
| Charts       | categorical palette tokens `--chart-1`...`--chart-8`                                                                                      |

## Theme modes

| Mode     | Behavior                                  |
| -------- | ----------------------------------------- |
| `light`  | Forces light semantic tokens              |
| `dark`   | Forces dark semantic tokens               |
| `system` | Matches `prefers-color-scheme` at runtime |

The active mode is stored as a durable user preference. The `html` element receives a `data-theme="light|dark"` attribute; `system` is resolved to the actual applied mode.

## Accent colors

Users may select an accent color from a curated palette. The default is **Kaisaile Green**.

| Accent name    | Token prefix        | Default role           |
| -------------- | ------------------- | ---------------------- |
| Kaisaile Green | `--accent-green-*`  | Default product accent |
| Royal Blue     | `--accent-blue-*`   | Alternative            |
| Deep Purple    | `--accent-purple-*` | Alternative            |
| Warm Orange    | `--accent-orange-*` | Alternative            |
| Neutral Slate  | `--accent-slate-*`  | Accessible/gray        |

When an accent is selected, the semantic `--accent` family is remapped to the chosen scale. Feature code always reads `--accent` and never the accent-specific prefix.

## Client-specific custom themes

Custom themes are an extension point, not a phase-one implementation. The token system must support:

- A JSON theme manifest that overrides semantic/component/chessboard token values.
- Runtime injection without recompiling the app.
- Validation against the token dictionary (Zod schema).
- A fallback to the default theme if validation fails.

## Chessboard themes

Each chessboard theme is a named set of `--cg-*` token values. At minimum the product supports:

- `wood` (default)
- `blue`
- `green`
- `gray`

Board themes are independent of UI light/dark mode and are stored as durable user preferences.

## Large-screen themes

Large-screen/display mode uses the same token system but scales typography and spacing for long viewing distances. It may override:

- `--fs-*` scale (larger minimums)
- `--control-h` and `--toolbar-h`
- `--s-*` spacing scale
- Contrast-enhanced board tokens

Display themes are selected automatically in `/competitions/:hdid/display` but may be toggled manually.

## Project-owned CSS integration

Vue SFCs and project-owned UI adapters consume semantic variables from `src/styles/tokens.css`. Feature styles may add selectors and layout rules, but values that belong to the token taxonomy must remain references such as `var(--surface)`, `var(--text)`, and `var(--border)`.

## No raw color rule

Feature code must not contain:

- Hex values (`#1f9d57`, `#fff`).
- `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()`.
- Named CSS colors (`red`, `white`).
- Utility or component classes that encode literal colors instead of registry tokens.
- Inline `style` color values on feature components.

The only places raw values are permitted:

- The token dictionary CSS file.
- Theme manifest JSON files validated by Zod.
- Legacy evidence documents.

## Token lint rules

A token lint pass must reject any new `.ts`, `.css`, or `.vue` file in `src/features/` or `src/ui/` that contains raw color values outside `src/styles/tokens.css` or an owner-approved validated theme manifest.

## Rules

### R1. Tokens are the single source of color truth

Every color, shadow, border, and background must reference a token. No ad hoc values.

### R2. Semantic tokens describe intent

Use `--text-muted` for secondary text, not `--gray-500`. Use `--danger` for errors, not `--red`.

### R3. Board tokens are independent of UI theme

The chessboard palette must remain stable when toggling light/dark mode unless the user explicitly changes board theme.

### R4. Accent selection remaps semantic tokens

Feature code reads `--accent`; accent-specific prefixes are resolved by the theme provider.

### R5. Custom themes are validated

Any runtime theme manifest must pass a Zod schema before being applied.

### R6. Display themes do not fork the component system

`/competitions/:hdid/display` uses the same components with token overrides, not a parallel component set.

## Acceptance criteria

1. Token layers (semantic, component, chessboard, state, data-viz) are enumerated.
2. Light/dark/system modes and user-selectable accent colors are defined.
3. Chessboard themes and large-screen themes are documented as token overrides.
4. Project-owned Vue styles consume the single CSS token registry without a parallel utility token system.
5. No-raw-color rule lists forbidden patterns and the only permitted exceptions.
6. Token lint rules are defined and referenced by `docs/ui/UI_ACCEPTANCE_CHECKLIST.md`.

## Open questions / risks

- The exact number of chart categorical colors depends on the final analysis report design.
- Client-specific custom theme manifest format needs owner approval before implementation.

## Machine-readable summary

```json
{
  "document": "theme-system-spec",
  "version": "1.0.0",
  "rules": [
    "tokens_single_source_of_color_truth",
    "semantic_tokens_describe_intent",
    "board_tokens_independent_of_ui_theme",
    "accent_selection_remaps_semantic_tokens",
    "custom_themes_validated",
    "display_themes_no_fork"
  ],
  "token_layers": [
    "semantic",
    "component",
    "chessboard",
    "state",
    "data_visualization"
  ],
  "theme_modes": ["light", "dark", "system"],
  "accent_colors": ["green", "blue", "purple", "orange", "slate"],
  "board_themes": ["wood", "blue", "green", "gray"],
  "forbidden_color_patterns": [
    "hex_values",
    "rgb_rgba_hsl_hsla_oklch",
    "named_colors",
    "literal_color_utility_classes",
    "inline_style_color_values"
  ],
  "related_docs": [
    "docs/ui/PAGE_STYLE_SPEC.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md",
    "docs/ui/LAYOUT_SYSTEM_SPEC.md",
    "docs/ui/ACCESSIBILITY_SPEC.md",
    "docs/ui/UI_ACCEPTANCE_CHECKLIST.md"
  ],
  "next_doc": "docs/ui/LAYOUT_SYSTEM_SPEC.md"
}
```
