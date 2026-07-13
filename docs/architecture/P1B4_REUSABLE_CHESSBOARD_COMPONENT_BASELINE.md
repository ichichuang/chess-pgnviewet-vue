# P1B4 Reusable Chessboard Component Baseline

Status: `P1B4_IMPLEMENTED_BROWSER_VALIDATED_GOVERNANCE_CLOSED`
Phase: `P1B4_REUSABLE_CHESSBOARD_COMPONENT_ARCHITECTURE_AND_PUBLIC_API`
Implementation commit: `22f9cddc191b4f7cb4e91f466526918a08e165b0`
Target route: `/pgnViewer/`
Previous authority: `docs/architecture/P1B3_CANONICAL_BOARD_ADVANCED_CAPABILITY_RUNTIME_BASELINE.md`
Next phase: `P1G_REAL_AUTHENTICATION_AND_PRODUCTION_API_PRODUCT_CAPABILITIES`
P1G status: `NOT_STARTED`

## Result

P1B4 closes the gap between a TeachingWorkspace-enabled board and one reusable,
strictly typed Vue component architecture. The accepted renderer now has public
position-driven and PGN-driven entrypoints, one coherent capability object,
per-instance appearance and piece resolution, controlled annotation support,
isolated PGN ownership, and scoped GSAP/listener cleanup.

Final verdict:
`P1B4_BOARD_COMPONENT_FULLY_PARAMETERIZED_REUSABLE_TYPESAFE_AND_MOTION_READY`.

## Public boundary

- Components: `CanonicalChessBoard`, `PgnChessBoard`.
- Runtime exports: `@/ui`.
- Type exports: `@/types` and `@/features/board`.
- Consumer authority: `docs/ui/CHESSBOARD_COMPONENT_API.md`.
- Default piece set: project-owned Merida assets through
  `meridaPieceResolver`.

Consumers do not import `BoardView`, board composables, PGN controller internals,
TeachingWorkspace, Pinia stores, or renderer DOM modules.

## Ownership invariants

1. `BoardView` remains the only board renderer.
2. Each `CanonicalChessBoard` has one FEN owner: its local runtime or an explicit
   controlled consumer.
3. Each `PgnChessBoard` has one cloned, instance-local PGN tree owner.
4. Each annotation model has one owner: local board history, the PGN node, or an
   explicit controlled consumer.
5. Pinia remains product-workspace state only; reusable components are store-free.
6. Animation observes state and DOM but never mutates chess or PGN authority.
7. Appearance overrides are root-scoped and never mutate theme state or create a
   second token registry.

## Capability contract

`ChessboardCapabilities` owns independently configurable position visibility,
playability, read-only state, click, drag, touch, keyboard, coordinates,
orientation, promotion, move/snapback animation, reduced motion, annotations,
drawing tools/colors/model events/history commands, radial menu and typed custom
items, editor state/palette/validation/accept/cancel/FEN, wheel navigation,
responsive fit, accessibility labels/announcements, interaction priority,
appearance, and piece resolution.

No public capability uses `any`, untyped emits, string command bags, unsafe
public casts, or duplicated store ownership.

## PGN wrapper contract

`PgnChessBoard` accepts text or cloned parsed `PgnItem` data, supports initial and
post-mount replacement/removal, main-line and variation selection, game/node
models, typed immutable snapshots, position-only fallback, and truthful errors.
Invalid data preserves the last valid runtime by default. It does not import the
route or TeachingWorkspace stores.

## Interaction boundary

Pointer and touch drawing, overlay projection, cancellation, orientation mapping,
resize mapping, pointer capture, move click/drag, radial selection, editor input,
promotion, wheel navigation, and keyboard focus are contained inside the board.
The normalized priority list arbitrates conflicts. Read-only state suppresses
move input regardless of individual interaction flags.

## Appearance and assets

Per-instance appearance supports square, coordinate, selection, legal-target,
capture, last-move, check, hover, focus, annotation, border, radius, shadow,
radial-menu, and editor-palette roles. Values pass a constrained CSS property
map and `CSS.supports` before root-scoped application.

`BoardPieceResolver` receives a typed semantic descriptor and returns an asset
URL. Merida remains the default. No global asset map or theme state is mutated by
consumer overrides.

## Motion ownership

GSAP `3.15.0` remains the sole JavaScript motion dependency. Board move,
capture/castling/en-passant transitions, snapback, overlays, promotion chooser,
radial menu, editor palette, toolbar, workspace panels, analysis panel, and
evaluation rail use lifecycle-scoped contexts or explicit target tween cleanup.
Interruption kills stale tweens; unmount reverts contexts and clears transforms.
Reduced motion resolves to final visual state with zero active tweens.

## Browser evidence

Real system Chrome validation covered:

- all board capabilities disabled, independently enabled, and enabled together;
- keyboard, click, drag, touch-compatible pointer paths, promotion, drawing,
  typed custom radial command, editor accept/cancel, wheel boundaries,
  orientation, animation runtime changes, and read-only rejection;
- text and parsed PGN input, dynamic replacement/removal, invalid PGN
  preservation, nested variations, position-only fallback, and annotation
  undo/redo/clear;
- two simultaneous PGN boards plus a capability-matrix board with independent
  sources, orientation, appearance, annotations, menus, resolver, state, and
  event counters;
- 1920x1080, 1600x900, 1024x768, 768x1024, 390x844, and 844x390 viewports;
- light, dark, system-dark, and reduced-motion modes;
- component unmount, route unload/remount, pointer state, GSAP children, long
  tasks, layout shifts, overflow, console/page errors, and failed requests.

Clean-run results were zero Vite overlays, console errors, page errors, failed
requests, long tasks, layout-shift entries, active pointer interactions, active
GSAP children, and document overflow.

## Static and build gate

The implementation passed every dependency, architecture, token, mock, secret,
format, ESLint, Stylelint, unused-code, governance, TypeScript, production audit,
full audit, dependency listing, and aggregate static gate. The production build
used a verified temporary outDir and left repository `dist/` absent.

## Deferred and forbidden scope

P1B4 does not start P1G, authentication, production APIs, cloud persistence,
settings, tournament/live transport, report export, a second UI system, a second
board renderer, mock product data, or automated test infrastructure. Those
boundaries remain governed by their existing phases.
