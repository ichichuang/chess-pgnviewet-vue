# Responsive Screen Specification

## Purpose

Define screen profiles, breakpoints, container-query strategy, board sizing per profile, panel behavior, and touch/pointer rules so the workspace works on laptops, tablets, mobile devices, and large venue displays.

## Scope

This document governs:

- Screen profiles and breakpoints.
- Board sizing algorithm per profile.
- Panel collapse order and stacking behavior.
- Big-screen display mode rules.
- Touch and pointer interaction differences.
- Safe-area and viewport unit usage.

## Non-goals

- Token values are defined in `docs/ui/THEME_SYSTEM_SPEC.md`.
- Layout law is defined in `docs/ui/LAYOUT_SYSTEM_SPEC.md`.
- Component APIs are defined in `docs/ui/COMPONENT_SYSTEM_SPEC.md`.

## Screen profiles

| Profile      | Typical viewport       | Primary input   | Use case                     |
| ------------ | ---------------------- | --------------- | ---------------------------- |
| `mobile`     | < 640px                | Touch           | Quick review, share links    |
| `tablet`     | 640px – 1024px         | Touch + pointer | Coaching on portable devices |
| `laptop`     | 1024px – 1440px        | Pointer         | Teacher desk, personal study |
| `desktop`    | 1440px – 2560px        | Pointer         | Classroom presentation       |
| `big-screen` | > 1920px or projection | Pointer/remote  | Venue/projector display      |

Breakpoints are minimum-width. The layout adapts upward using container queries where possible.

## Breakpoint tokens

```css
--bp-mobile: 640px;
--bp-tablet: 1024px;
--bp-laptop: 1440px;
--bp-desktop: 1920px;
```

Project-owned responsive CSS maps these values directly:

```css
@media (width < 640px) { /* mobile profile */ }
@media (640px <= width < 1024px) { /* tablet profile */ }
@media (1024px <= width < 1440px) { /* laptop profile */ }
@media (1440px <= width) { /* desktop profile */ }
```

## Board sizing per profile

The board container uses container queries to determine board size:

```
boardSize = min(availableWidth, availableHeight) - coordinateGutter
```

| Profile      | Minimum board size | Panel default behavior                                         |
| ------------ | ------------------ | -------------------------------------------------------------- |
| `mobile`     | 280px              | Single column; side panels become bottom sheets or drawers     |
| `tablet`     | 420px              | One side panel visible by default; second panel collapses      |
| `laptop`     | 520px              | Two side panels visible with default widths                    |
| `desktop`    | 640px              | Two side panels visible; board scales with viewport            |
| `big-screen` | 800px+             | Side panels may collapse; board maximized for distance viewing |

The board must never be clipped by the viewport or by a panel.

## Panel behavior

### Collapse order

When viewport shrinks, panels collapse in this order:

1. Right auxiliary panel (analysis, info).
2. Left library/navigator panel.
3. Board remains visible until the absolute minimum size is reached.

### Stacking

On `mobile` and narrow `tablet`, the workspace switches to a single-column stacked layout:

- Board first.
- Move list / PGN panel second.
- Navigator / library third (collapsible).

### Drawer behavior

Collapsed panels on touch profiles reopen as drawers or sheets with a visible scrim. They do not push the board; they overlay it.

## Big-screen display mode

`/competitions/:hdid/display` targets venue projectors:

- Uses the `big-screen` profile by default.
- Hides most chrome; shows board, player names, result, and live status.
- Typography and spacing scale up via display theme overrides.
- Board occupies the largest available square.
- Optional side/info overlays are semi-transparent and auto-hide.
- Phase one is single-board focus. Multi-board rotation is a future extension.

## Touch vs. pointer

| Interaction   | Pointer               | Touch                                   |
| ------------- | --------------------- | --------------------------------------- |
| Piece move    | Drag or click-to-move | Drag or tap-to-move                     |
| Arrows/shapes | Click-drag            | Two-finger or long-press gesture        |
| Context menu  | Right-click           | Long-press                              |
| Panel resize  | Drag handle           | Swipe edge or button toggle             |
| Toolbar       | Hover tooltips        | No hover; icons self-evident or labeled |

Touch targets must be at least 44×44 CSS pixels.

## Safe areas and viewport units

- Use `100dvh` for the app root to handle mobile dynamic toolbars.
- Respect `env(safe-area-inset-*)` on mobile browsers.
- Avoid `100vh` except as a `dvh` fallback.

## Rules

### R1. Mobile is supported but secondary

The workspace is optimized for laptop/desktop teaching. Mobile supports review and share flows; complex editing is deferred.

### R2. Board must remain visible and square

No profile may clip the board or allow non-square board distortion.

### R3. Panel collapse preserves user intent

Collapsed state is persisted per profile and restored on return.

### R4. Display mode uses the same components

Big-screen display does not fork the component catalog; it uses token overrides and conditional visibility.

### R5. Touch targets meet minimum size

All interactive touch targets are at least 44×44 CSS pixels.

## Acceptance criteria

1. Screen profiles and breakpoints are documented.
2. Board sizing algorithm and minimum sizes are defined per profile.
3. Panel collapse order and stacking behavior are documented.
4. Big-screen display mode rules are defined.
5. Touch/pointer differences are documented with minimum touch-target size.
6. Viewport units and safe-area rules are documented.

## Open questions / risks

- Whether mobile editing features are ever required.
- Whether multi-board rotation in big-screen mode needs a separate mode or only a screen profile.

## Machine-readable summary

```json
{
  "document": "responsive-screen-spec",
  "version": "1.0.0",
  "rules": [
    "mobile_supported_secondary",
    "board_visible_and_square",
    "panel_collapse_preserves_intent",
    "display_mode_same_components",
    "touch_targets_minimum_size"
  ],
  "profiles": ["mobile", "tablet", "laptop", "desktop", "big-screen"],
  "breakpoints": {
    "sm": "640px",
    "md": "1024px",
    "lg": "1440px",
    "xl": "1920px"
  },
  "board_min_sizes": {
    "mobile": "280px",
    "tablet": "420px",
    "laptop": "520px",
    "desktop": "640px",
    "big-screen": "800px"
  },
  "panel_collapse_order": ["right_auxiliary", "left_library", "board_last"],
  "touch_target_min": "44px",
  "related_docs": [
    "docs/ui/LAYOUT_SYSTEM_SPEC.md",
    "docs/ui/THEME_SYSTEM_SPEC.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md"
  ],
  "next_doc": "docs/ui/COMPONENT_SYSTEM_SPEC.md"
}
```
