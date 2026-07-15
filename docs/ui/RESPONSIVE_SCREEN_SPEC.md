# Responsive Screen Specification

| Field                      | Value                                                                   |
| -------------------------- | ----------------------------------------------------------------------- |
| Version                    | 1.2.1                                                                   |
| Status                     | `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`                   |
| Product baseline           | `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`                   |
| Page-design gate           | `PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS` (completed) |
| Active implementation gate | `PRODUCT_PAGE_DESIGN_DOCUMENTATION_READY_FOR_IMPLEMENTATION`            |

## Purpose

Define responsive responsibilities for the unified teaching workspace, public tournament surfaces, and independent big-screen display without pre-resolving open device and layout decisions.

## Screen contexts

| Context        | Primary use                                           | Required behavior                                                                                       |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Narrow mobile  | Review, navigation, share entry, and light annotation | Board first; contextual regions switch without body scroll; full editing scope remains `OD-09`.         |
| Tablet         | Portable teaching and review                          | Preserve a complete square board; reveal one contextual region at a time when width is constrained.     |
| Laptop/desktop | Primary teaching and commentary                       | Maintain left source navigation, dominant center board, and right context workspace when space permits. |
| Venue display  | Independent read-only public/operator surface         | Optimize board and status readability, paging, focus, and failure states for viewing distance.          |

Exact breakpoint values are implementation-owned and must be derived from the existing layout and real content rather than copied into this product specification as universal guarantees.

## Teaching-workspace adaptation

When space narrows:

1. Preserve the board as a complete square and keep core navigation reachable.
2. Convert the right contextual area to a controlled drawer, sheet, or context switcher.
3. Convert the left source navigation to a controlled drawer or hierarchical selector.
4. Keep each visual area to one scroll owner; the document body remains fixed.
5. Preserve focus and return it to the invoking control when overlays close.

Collapsed and resized state is recovered only where a current persistence field exists. The current tracked layout record is listed in `docs/ui/PERSISTENCE_RECOVERY_SPEC.md`; page design must not assume additional per-profile persistence.

## Board sizing

The board host owns measurable geometry. A board fits the smaller available dimension and remains square:

```text
boardSize = min(availableWidth, availableHeight) - requiredGutters
```

No universal minimum for teaching, mobile, or display boards is accepted here. Big-screen minimum and preferred board sizes remain `OD-05`. Multi-board spacing, margin, and rotation timing remain `OD-06`. Page design may use provisional values only when they stay explicitly tracked against those decisions.

## Independent big-screen composition

The `/competitions/:hdid/display` route:

- is read-only and independent from the teaching-workspace shell;
- reuses the canonical chessboard, the single token registry, and approved display player/status primitives;
- supports the target single-focus and multi-board grid responsibilities;
- rejects a candidate grid that would violate the tracked minimum-readable-size decision and pages instead;
- keeps operator controls, paging, focus, freshness, disconnection, completion, and unavailable states stable;
- contains no teaching PGN panel, analysis panel, editing toolbar, AI, or evaluation for ongoing games.

The current route renders public pairing information. Multi-board live positions remain contract-blocked; the specification does not imply that they are implemented.

## Touch, pointer, and keyboard

- Every core action has keyboard and touch equivalents.
- Touch targets are at least 44 by 44 CSS pixels unless a stricter project token applies.
- Hover-only discovery is forbidden for essential controls.
- Drag operations provide an alternative control path.
- Reduced-motion preferences disable nonessential travel, spring, and automatic motion; display rotation remains pausable.
- Mobile full-position editing remains `OD-09` and is not silently enabled by responsive layout.

## Safe areas and viewport ownership

- Use dynamic viewport sizing for the application root with an appropriate fallback.
- Respect safe-area insets on devices that expose them.
- The body is not the main scroll container.
- Module-local overflow follows `docs/ui/LAYOUT_SYSTEM_SPEC.md`.

## Acceptance criteria

1. The board remains square, visible, and dominant in every teaching context.
2. Narrow layouts preserve context through accessible drawers, sheets, or switchers without body scroll.
3. Big-screen is validated as an independent display composition, not the teaching shell at a larger width.
4. Ongoing live display contains no AI or evaluation.
5. `OD-05`, `OD-06`, and `OD-09` remain tracked rather than converted into final constants.
6. Current pairing display and contract-blocked multi-board live target are clearly separated.

## Machine-readable summary

```json
{
  "document": "responsive-screen-spec",
  "version": "1.2.1",
  "status": "COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN",
  "page_design_gate": "PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS",
  "active_implementation_gate": "PRODUCT_PAGE_DESIGN_DOCUMENTATION_READY_FOR_IMPLEMENTATION",
  "contexts": ["mobile", "tablet", "laptop_desktop", "venue_display"],
  "board_sizing": "min_available_dimension_minus_required_gutters",
  "fixed_board_minimums_approved": false,
  "big_screen_independent_route_composition": true,
  "big_screen_reuses_full_teaching_workspace": false,
  "multi_board_live_currently_implemented": false,
  "ongoing_live_ai_or_evaluation": false,
  "open_owner_decisions": ["OD-05", "OD-06", "OD-09"]
}
```
