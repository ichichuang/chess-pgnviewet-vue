---
name: project-ui
description: Govern UI implementation and validation for the single-runtime Vue chess workspace.
---

# Project UI Authority

## Trigger

Use this skill for every UI design, implementation, refactor, review, or browser-validation task in this repository.

## Required pre-reads

Before editing UI code, read and obey:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `.ai/skills/project-ui/SKILL.md`
4. relevant `docs/product/**`
5. relevant `docs/ui/**`
6. relevant `docs/architecture/**`
7. relevant implementation-gate reports under `.ai/reports/**`

## Ownership

- Token ownership: `src/styles/tokens.css` owns all global visual values and namespaces.
- Component ownership: project-owned Vue adapters in `src/ui/` own reusable UI boundaries; feature containers own orchestration.
- State ownership: Pinia stores are feature-owned; presentational components are store-free.
- Server-state ownership: TanStack Vue Query repositories are the only server-state boundary.
- Domain ownership: framework-free domain modules own chess, PGN, annotation, and analysis rules.
- Layout ownership: the application shell owns viewport geometry; each module owns exactly one declared scroll region.
- Toolchain ownership: pnpm is the sole package manager; `package-lock.json`, npm dependency management, Yarn, and Bun are forbidden.
- Validation ownership: automated test files and automated test infrastructure are forbidden by P0E owner policy; type checking, production build, and narrow real-browser runtime validation remain mandatory.

## UI contract

- Use explicit Vue props/emits and small component boundaries.
- Preserve canonical behavior and interaction from `pgnViewer-new`; do not redesign during migration.
- Spacing, typography, control heights, radius, elevation, focus, motion, responsive geometry, board states, and status colors resolve through tokens.
- Raw hex/rgb/hsl/oklch/named colors and parallel feature token files are forbidden.
- No feature-local reset, theme provider, or second component system.
- The page root uses `100dvh`; `html` and `body` do not scroll.
- Workspace panels declare min/max geometry, collapse order, scroll ownership, and persisted size behavior.
- Overlays use project-owned adapters with focus trap, escape behavior, return-focus, stacking, and scroll-lock contracts.
- Touch targets are at least 44×44 CSS pixels where interactive.
- Board, keyboard navigation, dialogs, menus, and panels meet WCAG 2.1 AA and expose accessible names.
- Motion clarifies state, uses GSAP or Vue transitions only where canonical behavior requires it, cleans up on unmount, and honors `prefers-reduced-motion`.
- Responsive modes preserve one component system; mobile drawers and big-screen composition are variants, not forks.
- Page and mode transitions preserve outer geometry and user intent.

## Feature gate

Before implementing a feature, require:

- an approved product mode/source and target phase;
- a canonical closure entry with imports, consumers, assets, styles, and tests;
- confirmed asset license/provenance;
- typed domain and repository boundaries;
- confirmed API/persistence/security contract or an explicit blocked state;
- no duplicate implementation already present in the target;
- a narrow validation plan using typecheck, production build, and real-browser runtime evidence without automated test files, fixtures, snapshots, or scripted E2E suites.

P0 authorizes only the neutral bootstrap and token-registry foundation. It authorizes no product UI.

P1 feature migration is blocked only until P0E UI-first/no-automated-test governance closure passes. After P0E, P1 must prioritize mechanical migration of the canonical visible interface from `pgnViewer-new`, preserving canonical layout, interaction, density, board focus, panel geometry, keyboard behavior, and motion before refactoring. Stable latest versions are preferred, but dependency selection is evaluated as one complete compatible architecture graph. Exceptions from independent package maxima require upstream evidence, explicit recording, owner, review trigger, and removal condition; silent or unexplained downgrades remain forbidden.

The authoritative Vue compiler is the newest stable official TypeScript 6.x package while stable Vue TypeScript 7 integration is unavailable. This follows official TypeScript guidance for Vue and other embedded-language projects. `@typescript/typescript6` is not used because the current stable Volar and `vue-tsc` stack cannot consume its shim. TypeScript 7 is not an active dependency during this compatibility period; adoption is a future gated upgrade only after stable TypeScript programmatic API support, stable Vue Language Tools support, stable `vue-tsc` support, full typecheck/build/browser validation, and owner acceptance.

## Owner delivery policy

- The project prioritizes visible, user-facing interface delivery after P0E governance closure.
- No automated unit, component, integration, snapshot, visual-regression, or E2E test files may be created or retained.
- Vitest, Vue Test Utils, jsdom test environments, Playwright, Cypress, Jest, Testing Library, snapshots, coverage tools, test setup files, fixtures, test utilities, and `test` package scripts are forbidden in the active target.
- Real production APIs are the only product data path. Mock data, fixtures, fake records, fake replay, fake live messages, fake AI output, sample tournaments, and silent fallback success states are forbidden.
- API failures must render truthful scoped loading, empty, permission, unavailable, retry, or error states.
- The absence of automated tests does not permit weakening type checking, production build validation, API contracts, security, browser runtime validation, accessibility, focus, reduced-motion, token, scroll-ownership, or architecture boundaries.
- Source projects remain permanently read-only.

## Browser validation

Future rendered UI changes must validate the intended route and flow in a real browser when available. Required evidence includes page identity, nonblank DOM, no Vite error overlay, no console-breaking errors, keyboard/focus behavior when affected, one real interaction state change when the slice includes interaction, reduced-motion behavior when motion changes, and responsive checks at affected profiles. Browser validation must not generate test files, test fixtures, snapshots, scripted E2E suites, screenshot loops, or pixel measurements.

## Final acceptance

Do not declare UI acceptance until the relevant `docs/ui/UI_ACCEPTANCE_CHECKLIST.md` items pass, canonical behavior is preserved, no raw visual values or parallel tokens exist, accessibility checks pass, and the browser evidence is recorded in the implementation report.
