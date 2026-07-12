# Accessibility Specification

## Purpose

Define accessibility requirements so the chess workspace is usable by keyboard-only users, screen-reader users, people with low vision, and people who prefer reduced motion.

## Scope

This document governs:

- WCAG target level.
- Keyboard navigation and shortcuts.
- Focus management and focus indicators.
- ARIA roles, labels, and live regions.
- Screen-reader strategy for the board, move list, and live updates.
- Reduced motion and animation rules.
- Color-contrast requirements tied to the token system.
- Real-browser accessibility validation without automated test files or suites.

## Non-goals

- Component APIs are defined in `docs/ui/COMPONENT_SYSTEM_SPEC.md`.
- Theme tokens are defined in `docs/ui/THEME_SYSTEM_SPEC.md`.
- Page style rules are defined in `docs/ui/PAGE_STYLE_SPEC.md`.

## WCAG target

The product targets **WCAG 2.1 Level AA** for all canonical surfaces. Big-screen display mode targets at least AA for text contrast and keyboard operability, with AAA encouraged for large text.

## Keyboard navigation

### Global shortcuts

| Shortcut                   | Action                                                    |
| -------------------------- | --------------------------------------------------------- |
| `Tab` / `Shift+Tab`        | Move focus between focusable chrome elements              |
| `ArrowLeft` / `ArrowRight` | Previous/next move when move list or board is focused     |
| `ArrowUp` / `ArrowDown`    | Navigate lists, menus, and tree items                     |
| `Enter` / `Space`          | Activate focused control                                  |
| `Escape`                   | Close dialogs, popovers, drawers, and cancel inline edits |
| `Ctrl+Z`                   | Undo last drawing annotation or move (in analysis mode)   |
| `?`                        | Open keyboard shortcut help                               |

### Board keyboard operation

- The board is a single tab stop. Once focused, arrow keys move a focus indicator across squares.
- `Enter` selects the focused square; a second `Enter` on a legal destination square commits the move.
- Focused square is visually indicated with a token-backed focus ring (`--state-focus-ring`).
- Screen readers announce the coordinate of the focused square and the piece occupying it.

### Panel navigation

- Resizable panel handles are focusable and operable with arrow keys.
- Collapsed panels expose a focusable expand button.
- Drawers and sheets trap focus while open and restore focus on close.

## Focus management

- Focus indicators must be visible in both light and dark modes using `--state-focus-ring`.
- Modals, dialogs, and drawers trap focus and return focus to the triggering element on close.
- After async operations (e.g., loading a cloud PGN), focus moves to the board or to a status announcement, not to an arbitrary element.
- No element may have `tabindex` greater than `0` except transient focus management helpers.

## ARIA roles and labels

### Board

- Board container: `role="grid"`, `aria-label="Chessboard"`.
- Ranks/files: `role="row"` / `role="gridcell"`.
- Squares: `role="gridcell"`, `aria-label="{piece} on {coordinate}"` or `"Empty {coordinate}"`.
- Pieces inside squares: `role="img"`, `aria-label="{color} {piece}"`.
- Selected square: `aria-selected="true"`.
- Check indicator: `aria-live="polite"` announcement.

### Move list

- Move list: `role="listbox"`, `aria-label="Move list"`.
- Current move: `aria-selected="true"`.
- Annotation icons: `aria-label` describing the annotation type.

### Toolbars and controls

- Toolbar: `role="toolbar"`, `aria-label="Workspace toolbar"`.
- Toggle buttons: `aria-pressed`.
- Grouped controls: `role="group"` with `aria-label`.
- Icons without visible text: `aria-label` or `aria-labelledby`.

### Live updates

- Live status region: `aria-live="polite"`.
- New move announcements: concise, e.g., "Black played e5. White to move."

## Screen-reader strategy

- Board interaction is exposed as a virtual grid; alternative text describes the current position on demand.
- Move list provides the primary narrative: users can step through moves and hear SAN plus annotations.
- Coach notes and annotations are announced when the associated move becomes current.
- Evaluation changes are announced only when the analysis panel is focused or when the user explicitly requests a summary.

## Reduced motion

- All animations respect `prefers-reduced-motion`.
- When reduced motion is preferred:
  - Transitions become instantaneous or opacity-only.
  - Board piece animations are disabled.
  - Live update flashes are replaced with text announcements.
  - GSAP timelines are skipped or simplified.
- `matchMedia('(prefers-reduced-motion: reduce)')` is checked before running any motion.

## Color and contrast

- Text contrast must meet WCAG AA (4.5:1 for normal text, 3:1 for large text).
- UI controls and icons must meet 3:1 against adjacent colors.
- Board themes must provide sufficient contrast between light/dark squares and pieces.
- Information must not be conveyed by color alone; combine with text, icons, or patterns.

## Accessibility validation

- Accessibility acceptance uses focused review and narrow real-browser runtime validation for the affected route and interaction.
- Validation must confirm nonblank rendered DOM, no Vite error overlay, no console-breaking errors, reachable keyboard paths for affected controls, visible focus, reduced-motion behavior when motion changes, and contrast compliance for changed surfaces.
- Browser validation must not generate automated test files, fixtures, snapshots, scripted E2E suites, screenshot loops, or pixel measurements.
- Accessibility regressions block release.

## Rules

### R1. All interactive elements are keyboard reachable

No feature is pointer-only. Every interactive element has a keyboard path.

### R2. Focus is visible

Focus indicators use project tokens and are visible in light and dark modes.

### R3. ARIA labels are mandatory

Icons, icon-only buttons, and custom widgets must have accessible names.

### R4. Motion is optional

Animations respect `prefers-reduced-motion` and never block input.

### R5. Color is not the sole indicator

Status, errors, and selections use text or icons in addition to color.

### R6. Accessibility regressions block release

Focused accessibility review and required real-browser runtime validation must pass for affected canonical surfaces.

## Acceptance criteria

1. WCAG 2.1 AA target is stated.
2. Keyboard shortcuts for board, move list, panels, and dialogs are documented.
3. ARIA roles and labels for board, move list, toolbars, and live regions are defined.
4. Screen-reader announcement strategy covers moves, annotations, and live updates.
5. Reduced motion rules are documented.
6. Contrast requirements are tied to the token system.
7. Accessibility validation is defined without automated test files or scripted E2E suites.

## Open questions / risks

- Whether to support a high-contrast theme for low-vision users.
- Whether board drag-and-drop needs alternative single-click interaction on touch devices.

## Machine-readable summary

```json
{
  "document": "accessibility-spec",
  "version": "1.0.0",
  "rules": [
    "all_interactive_elements_keyboard_reachable",
    "focus_visible",
    "aria_labels_mandatory",
    "motion_optional",
    "color_not_sole_indicator",
    "accessibility_regressions_block_release"
  ],
  "wcag_target": "2.1 AA",
  "required_validation": [
    "focused accessibility review",
    "narrow real-browser route validation",
    "keyboard and focus behavior for affected interactions",
    "contrast compliance for changed surfaces"
  ],
  "related_docs": [
    "docs/ui/THEME_SYSTEM_SPEC.md",
    "docs/ui/PAGE_STYLE_SPEC.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md",
    "docs/ui/UI_ACCEPTANCE_CHECKLIST.md"
  ],
  "next_doc": "docs/ui/I18N_SPEC.md"
}
```
