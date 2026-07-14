# Page Style Specification

| Field   | Value                                                       |
| ------- | ----------------------------------------------------------- |
| Version | 1.2.1                                                       |
| Status  | `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`       |
| Gate    | `PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS` |

## Purpose

Define the visual language of product surfaces: typography, spacing, shape, elevation, controls, states, and copy rules. All values must come from the token system defined in `docs/ui/THEME_SYSTEM_SPEC.md`.

## Scope

This document governs:

- Typography, spacing, radii, shadows, and borders.
- Button, input, tab, badge, card, dialog, tooltip, and menu patterns.
- Loading, empty, and error state rendering.
- Scrollbar theming and avatar fallback rules.
- Product-name copy guard.

## Non-goals

- Color token definitions live in `docs/ui/THEME_SYSTEM_SPEC.md`.
- Layout and scroll rules live in `docs/ui/LAYOUT_SYSTEM_SPEC.md`.
- Component catalog and APIs live in `docs/ui/COMPONENT_SYSTEM_SPEC.md`.
- Accessibility requirements live in `docs/ui/ACCESSIBILITY_SPEC.md`.
- i18n requirements live in `docs/ui/I18N_SPEC.md`.

## Typography

The type scale is fluid so the UI remains usable on large classroom screens and projectors.

| Token      | Minimum | Viewport growth | Maximum |
| ---------- | ------- | --------------- | ------- |
| `--fs-xs`  | 11px    | 0.33vw + 7.4px  | 16px    |
| `--fs-sm`  | 12px    | 0.42vw + 7.2px  | 18px    |
| `--fs-md`  | 13px    | 0.50vw + 7.2px  | 20px    |
| `--fs-lg`  | 15px    | 0.67vw + 6.9px  | 24px    |
| `--fs-xl`  | 18px    | 0.84vw + 8.5px  | 30px    |
| `--fs-2xl` | 22px    | 1.15vw + 10px   | 38px    |

Body text uses `--fs-md`. Headings use `--fs-xl` and `--fs-2xl`. Captions, coordinates, and metadata use `--fs-xs` or `--fs-sm`.

## Spacing, radii, and shadows

Spacing is based on a 4px grid.

| Token    | Value |
| -------- | ----- |
| `--s-1`  | 4px   |
| `--s-2`  | 8px   |
| `--s-3`  | 12px  |
| `--s-4`  | 16px  |
| `--s-5`  | 20px  |
| `--s-6`  | 24px  |
| `--s-8`  | 32px  |
| `--s-10` | 40px  |

Radii:

| Token      | Value |
| ---------- | ----- |
| `--r-xs`   | 6px   |
| `--r-sm`   | 8px   |
| `--r-md`   | 12px  |
| `--r-lg`   | 16px  |
| `--r-xl`   | 24px  |
| `--r-full` | 999px |

Shadows are restricted to four elevations (`--shadow-xs` to `--shadow-lg`). Floating surfaces use `--shadow-md` or `--shadow-lg`; inline controls use `--shadow-xs` or none.

## Controls

### Buttons

- Primary: `--accent` background, `--text-on-accent` text.
- Secondary: `--surface-2` background, `--text` text.
- Ghost: transparent background, `--text-muted` text, `--hover` background on hover.
- Loading state must keep the button width stable; use a disabled state or a module-level loader.
- Focus ring uses `--ring-accent`.

### Inputs

- Background: `--input-bg` or `--surface`.
- Border: `--border`, focus border: `--border-focus`.
- Placeholder: `--text-faint`.
- Disabled: `--state-disabled-bg` and `--state-disabled-text`.

### Tabs

- Active indicator uses `--accent`.
- Inactive text uses `--text-muted`.
- Hover background uses `--hover`.

### Badges

Badges express status through token-backed variants: `accent`, `success`, `warning`, `danger`, `info`.

### Cards and dialogs

- Background: `--surface` or `--card-bg`.
- Border: `--border` or `--card-border`.
- Radius: `--r-md` or `--r-lg`.
- Padding: `--s-4` or `--s-5`.

## Loading, empty, and error states

- Loading, empty, and error states must render inside the affected module.
- They must not cause the outer chrome to shift or the body to scroll.
- Skeletons should match the final geometry of the content they replace.
- Error states must include a retry action when the failure is recoverable.

## Scrollbar theming

Scrollbars must respect the active theme and never appear bright white in dark mode.

- WebKit scrollbars use `--border-strong` for the thumb and `--surface-2` for the track.
- Firefox uses `scrollbar-color` with the same tokens.
- Hidden-scrollbar areas must reserve geometry so content does not shift.

## Avatar fallback

- Missing or failed avatars fall back to a local placeholder asset.
- Avatar containers must reserve stable width and height during loading and fallback.
- External avatar URLs are allowed only when returned by an API field.

## Product name guard

User-facing Chinese text must use "开赛了". Do not use the legacy Chinese homophone variant represented by `U+51EF U+8D5B U+4E50` or any other variant.

## Rules

### R1. All visual values are token-backed

Typography, spacing, radii, shadows, borders, and colors must reference tokens.

### R2. Controls use semantic component tokens

Buttons, inputs, tabs, badges, cards, and dialogs must use their component tokens, not raw semantic or base colors.

### R3. Loading states do not resize buttons

Button width must remain constant in loading state.

### R4. Module-level status states

Loading, empty, and error states live inside the module.

### R5. Scrollbars are themed

Scrollbars must follow the active theme.

### R6. Avatars reserve geometry

Avatar containers have fixed dimensions and a local fallback.

## Acceptance criteria

1. Typography, spacing, radii, and shadow scales are documented with token references.
2. Button, input, tab, badge, card, and dialog patterns use component tokens.
3. Loading-state rule preserves button geometry.
4. Module-level status states are required.
5. Scrollbar theming rules cover WebKit and Firefox.
6. Product-name guard is documented and referenced by `docs/ui/I18N_SPEC.md`.

## Open questions / risks

- Whether to add a compact mode that reduces spacing for small laptop screens.
- Whether animation duration tokens should be formalized.

## Machine-readable summary

```json
{
  "document": "page-style-spec",
  "version": "1.2.1",
  "status": "COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN",
  "page_design_gate": "PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS",
  "rules": [
    "all_visual_values_token_backed",
    "controls_use_component_tokens",
    "loading_states_do_not_resize_buttons",
    "module_level_status_states",
    "scrollbars_themed",
    "avatars_reserve_geometry"
  ],
  "type_scale": ["xs", "sm", "md", "lg", "xl", "2xl"],
  "spacing_scale": [1, 2, 3, 4, 5, 6, 8, 10],
  "radius_scale": ["xs", "sm", "md", "lg", "xl", "full"],
  "shadow_scale": ["xs", "sm", "md", "lg"],
  "product_name": "开赛了",
  "forbidden_homophone": "U+51EF U+8D5B U+4E50",
  "related_docs": [
    "docs/ui/THEME_SYSTEM_SPEC.md",
    "docs/ui/LAYOUT_SYSTEM_SPEC.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md",
    "docs/ui/ACCESSIBILITY_SPEC.md",
    "docs/ui/I18N_SPEC.md"
  ],
  "next_doc": "docs/ui/RESPONSIVE_SCREEN_SPEC.md"
}
```
