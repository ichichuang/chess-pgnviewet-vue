# Layout System Specification

| Field   | Value                                                       |
| ------- | ----------------------------------------------------------- |
| Version | 1.2.0                                                       |
| Status  | `ACTIVE_PAGE_DESIGN_AUTHORITY`                              |
| Gate    | `PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS` |

## Purpose

Freeze the global layout law: the app body must never be the main scroll container, every surface must fit the viewport, and each module must own its internal overflow behavior.

## Scope

This document governs:

- Page and workspace shell structure.
- Scroll ownership and overflow rules.
- Panel resizing, collapsing, and persistence.
- Board-size calculation by container.
- Layout contract comments for root components.

## Non-goals

- Theme tokens are defined in `docs/ui/THEME_SYSTEM_SPEC.md`.
- Component APIs are defined in `docs/ui/COMPONENT_SYSTEM_SPEC.md`.
- Responsive breakpoints are defined in `docs/ui/RESPONSIVE_SCREEN_SPEC.md`.

## Core law

The entire page must never scroll. `html` and `body` must have `overflow: hidden` (or equivalent) and the app root must occupy `100dvh` (or `100vh` with fallback). Every scrollable region is an explicit module with its own `overflow: auto` or `overflow: scroll`.

## Module taxonomy

Every full-screen surface is divided into explicit modules:

| Module        | Typical height       | Scroll allowed | Example                         |
| ------------- | -------------------- | -------------- | ------------------------------- |
| Header        | Fixed                | No             | App title, account menu         |
| Toolbar       | Fixed                | No             | Workspace tools, mode switcher  |
| Filter/search | Fixed or collapsible | No             | Tournament filters              |
| Content       | Flexible             | Yes            | Board + side panels             |
| Side panel    | Flexible             | Yes            | Move list, analysis, navigator  |
| Footer/status | Fixed                | No             | Connection status, current move |

Each root component must document which modules it contains and which module owns scrolling.

## Layout primitives

### CSS grid / flex with `min-height: 0`

All layout modules must use CSS Grid or Flexbox. Any flex child that may shrink below its intrinsic size must declare `min-height: 0` and `min-width: 0`.

```css
.workspace-shell {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  height: 100dvh;
}

.workspace-content {
  display: grid;
  grid-template-columns: 260px 1fr 320px;
  min-height: 0;
}
```

### One scroll owner per area

A visual area must have exactly one vertical scroll owner. Nested vertical scrollbars inside the same visual column are forbidden unless justified and documented.

### Scrollbar gutter strategy

To prevent layout jumps when scrollbars appear:

- Use `scrollbar-gutter: stable` on scrollable modules.
- Or use hidden scrollbar styles (`scrollbar-width: none`, `-ms-overflow-style: none`, `::-webkit-scrollbar { display: none }`) when the design intentionally hides scrollbars.
- Or reserve a fixed gutter width.

## Resizable panels

The workspace uses project-owned Vue layout components. Any later layout dependency must preserve this contract and must never own product state or tokens.

| Requirement      | Rule                                                                                                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current recovery | Only `showLeftSidebar`, `showAnalysisRegion`, `toolbarCollapsed`, `boardAlignment`, `boardOrientation`, `activeRightTab`, and `rightPgnHeightPx` are persisted by `src/persistence/workspace/workspaceLayoutPersistence.ts`. |
| Target recovery  | Additional panel sizes or collapsed states require an approved persistence field and owner before they are treated as recoverable.                                                                                           |
| Min/max sizes    | Enforced by the owning component; never allow zero-width panels silently.                                                                                                                                                    |
| Keyboard resize  | Resize handles are keyboard focusable and operable.                                                                                                                                                                          |
| Touch            | Collapse/expand controls work with pointer and touch.                                                                                                                                                                        |

### Layout adapter contract

Each current or future layout control:

- accepts typed size and collapse inputs appropriate to its verified API;
- emits typed resize/collapse events rather than owning product state;
- reads only fields exposed by the owning layout store;
- Does not cause body scroll or layout shift when panels resize.

## Board-size calculation

The board must remain square and fully visible. The board container measures its available space and sets the board size to `min(width, height)` of the container minus coordinate gutters.

```
boardSize = min(containerWidth, containerHeight) - coordinateGutter
```

- Coordinate gutter is part of the board component and uses clamp/container queries.
- Board resizing must not trigger full-page reflow.
- Board geometry is stable when side panels collapse or expand.

## Stable chrome

Header, toolbar, filter, pagination, and status bars must remain stable when data loads. Loading, empty, and error states must render inside the affected module.

### Geometry preservation rules

- Switching group, round, board, mode, theme, or login state must not change the outer shell geometry.
- Round/pairing headers keep stable height and action placement across loading, empty, expanded, and selected states.
- Expanding a round may reveal content but must not create a second vertical scrollbar in the same side panel.

## Layout contract comment

Every root page or workspace component must include a layout contract comment at the top of its file:

```vue
/**
 * Layout contract: docs/ui/LAYOUT_SYSTEM_SPEC.md
 * - Page height: 100dvh
 * - Modules: header (fixed), toolbar (fixed), content (scroll), footer (fixed)
 * - Scroll owner: .workspace-content only
 * - Panels: left (collapsible), center (board), right (collapsible)
 */
```

## Rules

### R1. No body scroll

`html`/`body` must not scroll. The app root owns the viewport height.

### R2. Explicit modules

Every page must declare its modules and scroll owner.

### R3. Modules own internal overflow

Only designated content modules scroll. Header, toolbar, filter, pagination, and status bars do not scroll.

### R4. Layout geometry is preserved across context switches

Changing group, round, board, mode, theme, or login state must not shift the outer chrome.

### R5. Implemented panel state is recoverable

Only the layout fields implemented by the current Dexie adapter are persisted and restored. Page design must not assume broader panel recovery.

### R6. Board is square and fully visible

The board container must calculate a square size that fits within the available viewport module.

## Acceptance criteria

1. The no-body-scroll rule is stated and referenced by every root component contract comment.
2. Module taxonomy and scroll-ownership rules are documented.
3. Current persisted layout fields and the target gate for additional fields are explicit.
4. Board-size calculation formula is documented.
5. Geometry preservation rules cover loading, empty, error, and context-switch states.
6. Layout contract comment template is provided and required.

## Open questions / risks

- Long lists require runtime evidence before virtualization or another heavy list strategy is selected.

## Machine-readable summary

```json
{
  "document": "layout-system-spec",
  "version": "1.2.0",
  "status": "ACTIVE_PAGE_DESIGN_AUTHORITY",
  "page_design_gate": "PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS",
  "rules": [
    "no_body_scroll",
    "explicit_modules",
    "modules_own_internal_overflow",
    "preserve_geometry_across_context_switches",
    "implemented_panel_state_recoverable",
    "board_square_and_fully_visible"
  ],
  "modules": [
    "header",
    "toolbar",
    "filter",
    "content",
    "side_panel",
    "footer"
  ],
  "scroll_ownership": "one_scroll_owner_per_area",
  "panel_library": "project_owned_vue_layout_adapters",
  "board_sizing": "min_container_dimension_minus_gutter",
  "related_docs": [
    "docs/ui/THEME_SYSTEM_SPEC.md",
    "docs/ui/RESPONSIVE_SCREEN_SPEC.md",
    "docs/ui/COMPONENT_SYSTEM_SPEC.md",
    "docs/ui/PERSISTENCE_RECOVERY_SPEC.md"
  ],
  "next_doc": "docs/ui/PAGE_STYLE_SPEC.md"
}
```
