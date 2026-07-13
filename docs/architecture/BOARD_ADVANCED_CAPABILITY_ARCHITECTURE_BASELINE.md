# Board Advanced Capability Architecture Baseline

Status: `P1B2_BOARD_ADVANCED_CAPABILITY_DESIGN_COMPLETE_PENDING_IMPLEMENTATION`
Phase: `P1B2_CANONICAL_BOARD_ADVANCED_CAPABILITY_AUDIT_AND_COMPONENT_CONTRACT_DESIGN`
Target route: `/pgnViewer/`
Next phase: `P1B3_CANONICAL_BOARD_ADVANCED_CAPABILITY_IMPLEMENTATION_AND_GSAP_SKILL`

## Owner Requirement

The migrated self-developed board component must become a complete reusable board
runtime with parameter-controlled canonical capabilities:

- GSAP move animation and GSAP snapback animation;
- canonical radial menu;
- canonical free-placement/editor mode;
- canonical wheel navigation.

P1B2 is design-first and read-only for runtime code. It changes no runtime
source, package file, lockfile, asset, scanner, style, token, Router, Pinia,
provider, PGN, annotation, or analysis implementation. `P1G_REAL_AUTHENTICATION_AND_PRODUCTION_API_PRODUCT_CAPABILITIES`
is paused until the advanced board component implementation closes.

## Provenance Findings

The active local target is `main` at
`ba6cba1ece649d985438713b4583bfa36f008518`, matching `origin/main` and live
remote `refs/heads/main` on
`https://github.com/ichichuang/chess-pgnviewet-vue.git`.

Accepted P1B board provenance remains
`BOARD_MOSTLY_MIGRATED_WITH_JUSTIFIED_ADAPTATIONS`: P1B implemented the
self-developed board slice and explicitly excluded free setup/board editor.
P1C through P1F implemented PGN, annotations, workspace controls, and AI
analysis without adding the four advanced board capabilities.

## Canonical Source Inventory

Canonical evidence is from `/Users/cc/Work/neobv/Chess/pgnViewer-new`.

| Capability            | Canonical owner                                                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GSAP move animation   | `src/features/board/BoardView.vue`, `src/domains/board/moveDiff.ts`                                                                                                                                       |
| GSAP snapback/settle  | `src/features/board/BoardView.vue`                                                                                                                                                                        |
| Radial menu           | `src/features/board/BoardView.vue`, `src/features/board/RadialMenu.vue`, `src/stores/brushStore.ts`                                                                                                       |
| Free-placement/editor | `src/features/board/BoardView.vue`, `src/features/board-editor/BoardEditorPanel.vue`, `src/stores/boardEditorStore.ts`, `src/stores/pgnStore.ts`, `src/features/teaching-workspace/TeachingWorkspace.vue` |
| Wheel navigation      | `src/features/board/BoardView.vue`, `src/features/teaching-workspace/composables/useTeachingWorkspaceBoardSource.ts`                                                                                      |

## Current Target Gaps

`src/features/board/BoardView.vue` and `src/features/board/useBoardView.ts`
currently support rendering, pointer/click/keyboard movement, annotations, hover
state, drag ghost, resize measurement, and context-menu prevention. They do not
import GSAP, do not call `detectMoves`, do not render a radial menu, do not own
editor/free-placement state, and do not listen for wheel navigation.

`src/stores/pgn.ts` owns PGN collection, current node, FEN, legal destinations,
branching, promotion, navigation, and annotations. It does not yet expose the
canonical FEN insertion path needed by editor finish. P1B3 must add that as an
explicit PGN acceptance boundary, not as hidden board mutation.

## GSAP Dependency Decision

`gsap` is already an approved exact runtime dependency:

- `package.json`: `gsap: 3.15.0`;
- `pnpm-lock.yaml`: importer `specifier: 3.15.0`, `version: 3.15.0`, package
  `gsap@3.15.0`.

No install, reinstall, upgrade, or lockfile change is required for P1B3.

## GSAP Plugin Decision

Canonical source imports only `import { gsap } from 'gsap'`. No canonical
advanced-board file imports Draggable, Observer, Flip, MotionPathPlugin,
InertiaPlugin, or any other GSAP plugin. P1B3 must use GSAP core only unless new
owner-approved evidence changes this baseline. Premium or Club GSAP plugins are
not authorized.

## Future GSAP Skill Contract

P1B3 must create `.ai/skills/gsap/SKILL.md`. P1B2 does not create it.

The Skill must require reading `.ai/skills/project-ui/SKILL.md` and this
baseline before animation work. It must define Vue `onMounted` and
`onBeforeUnmount` ownership, `gsap.context` or equivalent scoped ownership,
timeline/tween cleanup, kill/revert behavior, interruption and overwrite policy,
transform/opacity preference, no unmanaged global selectors, semantic
motion-token ownership, reduced-motion behavior, responsive `matchMedia`
behavior, ResizeObserver coordination, justified `quickTo` usage only for
high-frequency pointer updates, snapback state integrity, no raw durations or
easings in feature files, no decorative animation unrelated to product behavior,
and mandatory real-browser validation. It is reusable guidance and must not
become a second project UI authority.

## Unified Parameter Model

P1B3 must add one coherent typed contract, tentatively:

```ts
interface BoardAdvancedCapabilities {
  animation?: {
    move?: BoardMoveAnimationOptions
    snapback?: BoardSnapbackAnimationOptions
  }
  radialMenu?: BoardRadialMenuOptions
  editor?: BoardEditorCapabilityOptions
  wheelNavigation?: BoardWheelNavigationOptions
}
```

The actual implementation may rename types, but it must remain one normalized
advanced-capability object rather than scattered booleans.

Current consumers that omit the object must keep current behavior. The canonical
product route may explicitly enable canonical move animation, snapback, radial
menu, editor availability, and wheel navigation. Reusable board consumers default
all advanced groups off.

## Default Behavior

| Consumer                                      | Move animation | Snapback | Radial menu | Editor available | Editor active | Wheel navigation |
| --------------------------------------------- | -------------- | -------- | ----------- | ---------------- | ------------- | ---------------- |
| Reusable board default                        | off            | off      | off         | off              | false         | off              |
| Canonical `/pgnViewer/` analysis route        | on             | on       | on          | on               | false         | on               |
| Future read-only live/electronic board source | on             | off      | off         | off              | false         | off              |

Disabling animation changes only presentation timing. It must never change final
FEN, legality, selected PGN node, branch creation, promotion, annotations, or
analysis state.

## State Ownership

- Animation observes position transitions and DOM targets; it never owns chess
  state.
- Radial menu owns temporary open, pointer, and selected-command state only.
- Editor mode may own a temporary editable position draft only while active.
  The PGN tree changes only when the consumer explicitly accepts and commits the
  generated FEN.
- Wheel navigation owns throttling only. It emits or calls a navigation boundary
  and never owns the current PGN node.
- `src/stores/pgn.ts` remains the single PGN current-node, FEN, branch,
  promotion, annotation, and navigation owner.
- `src/stores/workspace.ts` remains the single orientation, toolbar,
  annotation-mode, panel, and splitter owner.
- `src/stores/analysis.ts` remains the single AI analysis owner.

## Interaction Priority

The deterministic priority order is:

1. workspace splitter drag;
2. editor pointer mode;
3. radial-menu interaction;
4. annotation drawing gesture;
5. normal move drag;
6. click movement;
7. touch movement;
8. wheel navigation;
9. board keyboard navigation.

This model prevents duplicate move dispatch, stuck pointer capture, ghost clicks,
accidental annotations, accidental editor mutations, and wheel navigation during
an incompatible active gesture.

## Animation Architecture

P1B3 must add a board animation controller under `src/features/board`. It should
mechanically port `moveDiff.ts`, observe old and new FEN values after Vue
renders, and animate only canonical single-ply transitions. Multi-ply jumps snap.

Canonical move animation:

- target: SVG `image[data-square="${to}"]`;
- from/to: display coordinates from `squareToDisplay`;
- tween: SVG `attr.x` and `attr.y`;
- duration: canonical `0.28s` translated to a governed token or typed constant;
- ease: canonical `power3.out` translated through the motion contract;
- interruption: `gsap.killTweensOf(el)` before each new tween.

Canonical snapback:

- target: fixed drag ghost;
- destination: `squareCenterPx(from)`;
- duration: canonical `0.22s`;
- ease: `power3.out`;
- cleanup: `clearMoveDrag` only after completion, or immediately when disabled
  or reduced motion resolves duration to zero.

Successful drag settle suppresses the next move slide, fades the ghost to target
over canonical `0.18s power2.out`, and fades the rendered piece in over canonical
`0.15s power1.out`.

## Radial-Menu Architecture

P1B3 must migrate the canonical menu mechanically but adapt it to target
ownership:

- `BoardView` or `useBoardRadialMenu` owns open/pointer tracking;
- the menu component is store-free and receives active command state through
  props;
- commands are emitted to the workspace annotation owner or an injected command
  callback;
- disabled radial menu removes listeners and rendering;
- close on pointerup commits selected command, blur cancels, and context-menu
  suppression remains scoped.

Canonical geometry is recorded in the inventory and must become semantic tokens
or typed constants backed by this baseline.

## Editor Architecture

P1B3 must add editor mode without duplicating PGN ownership:

- editor draft stores editable grid, selected piece, side to move, and castling
  rights;
- board editor pointer mode supports placement, replacement, pickup, right-click
  removal, drag-outside removal, clear board, reset, finish, and cancel;
- generated FEN is the boundary output;
- `TeachingWorkspace` may accept the FEN through a PGN store method equivalent
  to canonical `insertPgnFromFen`;
- invalid FEN restores editor mode and surfaces a scoped error through the
  workspace, not through board-owned global state.

Enabling editor availability must not activate editor mode. Activating editor
mode must not mutate the authoritative PGN tree until explicit consumer accept.

## Wheel-Navigation Architecture

P1B3 must add a board wheel composable:

- event target: board wrapper;
- direction: `deltaY > 0` next, `deltaY < 0` previous;
- ignore `abs(deltaY) < 1`;
- throttle canonical `60ms`;
- disabled mode removes listener and does not consume wheel;
- active editor, radial menu, splitter drag, annotation gesture, and move drag
  block wheel navigation;
- board emits navigation intent or calls an injected callback; it never imports
  `usePgnStore`.

## Token And Asset Ownership

`src/styles/tokens.css` remains the only global token registry. P1B3 must add
only evidence-backed tokens for canonical durations/easings, radial geometry,
editor geometry, wheel threshold/throttle, z-index, shadows, borders, radii,
colors, spacing, and control sizes. Feature files must not retain raw governed
values.

No broad asset copy is planned. The existing Merida piece assets under
`src/assets/chess/pieces/merida` are already byte-identical to canonical
`pgnViewer-new/src/assets/pieces/merida`. Radial menu and editor use no new
assets beyond those pieces.

## Component Boundaries

Planned implementation files:

- `src/features/board/domain/boardCapabilities.ts`
- `src/features/board/domain/moveDiff.ts`
- `src/features/board/useBoardCapabilityOptions.ts`
- `src/features/board/useBoardAnimationController.ts`
- `src/features/board/useBoardRadialMenu.ts`
- `src/features/board/radial-menu/BoardRadialMenu.vue`
- `src/features/board/editor/boardEditorDraft.ts`
- `src/features/board/editor/BoardEditorPanel.vue`
- `src/features/board/useBoardWheelNavigation.ts`
- `.ai/skills/gsap/SKILL.md`

Do not create a general UI adapter library. Do not scatter board internals into
workspace feature files beyond explicit integration wiring.

## Integration Boundaries

Allowed P1B3 integration changes:

- refactor `CanonicalChessBoard.vue` only enough to expose the unified
  capability contract and compose controllers;
- refactor `BoardView.vue`/`useBoardView.ts` only enough to compose canonical
  feature controllers and the interaction arbiter;
- let `TeachingWorkspace.vue` explicitly enable canonical product capabilities;
- let PGN integration provide wheel previous/next and editor FEN acceptance;
- preserve existing orientation, annotation, toolbar, splitter, and analysis
  contracts.

## Forbidden Scope

P1B3 must not implement authentication, production APIs, cloud persistence,
settings, tournament APIs, live/replay import, report export, generic adapters,
new global state unrelated to board capability ownership, automated test files,
test infrastructure, mock data, fake runtime fallbacks, package-manager changes,
or independent reimplementation of canonical algorithms.

## Implementation Sequence

1. Create `.ai/skills/gsap/SKILL.md` from this contract.
2. Add capability types and normalization with all advanced groups defaulting off
   for reusable consumers.
3. Port `moveDiff.ts` and implement GSAP animation/snapback controller.
4. Migrate radial menu component and controller with token adaptation.
5. Add editor draft, editor panel, board pointer integration, and explicit PGN
   acceptance.
6. Add wheel navigation composable and PGN command boundary.
7. Explicitly enable canonical product capabilities in `/pgnViewer/`.
8. Validate and report.

## Browser Gates

P1B2 requires no browser validation because it changes design documents and
reports only. P1B3 must validate desktop, large desktop, tablet portrait, tablet
landscape, mobile portrait, and mobile landscape `844x390` in light, dark, and
system themes.

The P1B3 browser plan must cover move animation, snapback, radial menu, editor,
wheel navigation, reduced motion, cleanup, and capability-combination behavior
as detailed in
`docs/architecture/CANONICAL_BOARD_ADVANCED_CAPABILITY_INVENTORY.json`.

## Git Boundaries

P1B2 stages only:

- `docs/architecture/CANONICAL_BOARD_ADVANCED_CAPABILITY_INVENTORY.json`
- `docs/architecture/BOARD_ADVANCED_CAPABILITY_ARCHITECTURE_BASELINE.md`
- `.ai/reports/P1B2_CANONICAL_BOARD_ADVANCED_CAPABILITY_AUDIT_AND_COMPONENT_CONTRACT_DESIGN_REPORT.json`
- `docs/architecture/FOUNDATION_READINESS_MATRIX.json`
- `docs/migration/P1_CANONICAL_PRODUCT_MIGRATION_SEQUENCE.md`
- `docs/architecture/PRODUCT_FIRST_DELIVERY_REBASE.md`

No runtime code or dependency file belongs to this phase.

## Completion Gate

P1B2 is complete only when the canonical evidence is traced, the GSAP dependency
and plugin decisions are documented, the future GSAP Skill contract is complete,
the unified parameter model and interaction ownership are unambiguous, no
independent reimplementation is accepted, implementation files and browser gates
are defined, validation passes, the design commit is pushed normally, final
local `HEAD` equals remote `main`, and the worktree is clean.
