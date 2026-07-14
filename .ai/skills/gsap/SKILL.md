---
name: gsap
description: Govern GSAP animation work for the Vue chess workspace.
---

# Project GSAP Skill

Use this skill for every GSAP animation, animated board interaction, and later
animated UI task in this repository.

## Required Pre-Reads

Before implementation or review, read and obey:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `.ai/skills/project-ui/SKILL.md`
4. `docs/architecture/BOARD_ADVANCED_CAPABILITY_ARCHITECTURE_BASELINE.md`
5. the relevant feature authority or implementation baseline

## Ownership

- Vue lifecycle owns animation setup and teardown. Create DOM-scoped GSAP work
  only after mount or after Vue has rendered the target DOM.
- Use `gsap.context` or an equivalent component-scoped ownership model whenever
  the animation has a stable DOM root.
- Keep explicit references for timelines and tweens that can outlive one call.
- Kill, revert, or complete active timelines and tweens on interruption,
  unmount, capability disablement, mode changes, position replacement,
  orientation changes, and reduced-motion changes.
- No animation may own chess state, PGN state, annotation state, workspace
  state, analysis state, Router state, Pinia ownership, or provider ownership.

## Board Animation Rules

- GSAP move animation observes position transitions only. Final board state,
  legal move handling, PGN selection, annotations, and analysis must be correct
  even if a tween is skipped, interrupted, killed, or disabled.
- Snapback animation must preserve drag-source integrity. Illegal moves,
  rejected move requests, cancelled drags, release outside the board, and touch
  cancellation must leave the authoritative position unchanged.
- Position replacement and rapid navigation must supersede older tweens without
  stale inline transforms or stale SVG attributes.
- Orientation changes and ResizeObserver updates must kill or reconcile tweens
  before new geometry is used.
- Prefer transform and opacity for ordinary DOM animation. SVG `attr.x` and
  `attr.y` tweening is allowed only where the canonical board move animation
  requires it.

## Motion Policy

- Durations, easings, z-indexes, geometry, colors, shadows, borders, radii, and
  control sizes must resolve through `src/styles/tokens.css` or typed constants
  explicitly backed by an accepted architecture baseline.
- Do not place unmanaged raw visual or motion values in feature implementation
  files.
- Honor `prefers-reduced-motion`. Reduced motion may skip or minimize motion,
  but must never change final state.
- Use `gsap.matchMedia` only when the component owns the corresponding cleanup.
- Use `quickTo` only for justified high-frequency pointer updates.
- Decorative animation is not allowed by default. Motion must clarify product
  behavior or preserve reviewed product interaction behavior.

## Selector And Cleanup Rules

- Do not use unmanaged global selectors. Query only from a component-owned root
  or a passed DOM reference.
- Use `overwrite: true` or an explicit kill policy when animating a target that
  may receive repeated tweens.
- Clean up on `onBeforeUnmount`.
- Validate in a real browser for animated UI changes: DOM is nonblank, no Vite
  overlay, no console-breaking errors, target interaction changes state, reduced
  motion is honored, and no stale tween state remains.
