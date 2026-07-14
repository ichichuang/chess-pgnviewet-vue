---
name: project-ui
description: Govern page-by-page product design, Vue UI implementation, review, and browser validation for the 开赛了 chess workspace.
---

# Project UI Authority

## Trigger and current gate

Use this skill for every product page design, UI implementation, refactor, review, or browser-validation task in this repository.

The product design status is `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`. Work may proceed only under `PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS`. `OD-01` through `OD-11` remain open; no page slice may silently resolve them.

## Required pre-reads

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md`
4. `docs/product/OWNER_PRODUCT_REQUIREMENT_BASELINE.zh-CN.md`
5. relevant current `docs/product/**`, `docs/ui/**`, and `docs/architecture/**`
6. `docs/migration/SOURCE_PROVENANCE.md` when source evidence is needed
7. `.ai/skills/gsap/SKILL.md` for animation or animated interaction

Historical `.ai/reports/**` files provide evidence only and cannot govern current page design.

## Page-by-page design contract

Before implementation, the page authority or design must state:

- route, page responsibility, intended user, and primary task;
- current implemented behavior, approved target behavior, blocked contracts, and open OD dependencies;
- information hierarchy and stable board focus where the board is present;
- existing component owners, new conceptual responsibilities, props/emits, and container boundaries;
- real loading, refresh, empty, permission, authentication, unavailable, stale, retry, and error states;
- desktop, tablet, mobile, and venue-display behavior where applicable;
- viewport and scroll ownership, panel geometry, overlay/focus return, and safe-area behavior;
- keyboard, screen-reader, touch, contrast, visible-focus, and reduced-motion behavior;
- token use, persistence category, security classification, and source read/write policy;
- typecheck/build/static validation plus one narrow real-browser acceptance path for visible UI.

The main surfaces are the unified workspace (`/`), tournament list, tournament detail, independent venue display, login, and fail-closed compatibility entries. Big-screen is never the teaching workspace at a larger size. Compatibility entries never create a second workspace.

## Ownership

- `src/styles/tokens.css` owns all global visual values and namespaces.
- Project-owned Vue components/adapters own reusable presentation boundaries; feature containers own orchestration.
- Pinia stores are feature-owned; presentational components do not import stores.
- TanStack Vue Query repositories are the sole server-read boundary.
- Framework-free domain modules own chess, PGN, annotation, and analysis rules.
- The application shell owns viewport geometry; each module owns one declared scroll region.
- Persistence adapters own only implemented, versioned records. Target persistence is not current behavior until a tracked owner exists.
- `src/api/legacyWebCompatibility.ts` alone owns the approved tracked browser compatibility signer.

## UI rules

- Use explicit typed props and emits with small responsibility-based boundaries.
- Preserve one unified workspace and one board/PGN/annotation/analysis runtime.
- Keep the board square, visible, and dominant in board-centric teaching and commentary contexts.
- Spacing, typography, control height, radius, elevation, focus, motion, responsive geometry, board states, and status colors resolve through project tokens.
- Product and feature code contains no raw governed visual values or parallel token files.
- Low-level validated appearance overrides do not exempt product feature code from token governance and do not establish a current board-theme setting.
- The page root uses dynamic viewport sizing; `html` and `body` are not the main scroll owner.
- Panels declare min/max geometry, collapse order, scroll ownership, and only actually implemented persisted behavior.
- Overlays use project-owned adapters with focus trap, Escape behavior, return focus, stacking, and scroll lock.
- Core controls have keyboard and touch equivalents and accessible names. Interactive touch targets are at least 44 by 44 CSS pixels unless a stricter token applies.
- Motion clarifies state, cleans up on interruption/unmount, and honors `prefers-reduced-motion`.
- Responsive variants share one component system. Drawers, sheets, and display grids are compositions, not forks.

## Data, API, and security rules

- Real confirmed production contracts are the only product data path.
- Mock, fixture, fake, sample, synthesized, and fallback success data are forbidden.
- External data is mapped and Zod-validated before UI consumption.
- Cloud/share/protected replay/hardware/live adapters remain abstract and unavailable until real contracts exist.
- Ongoing live is read-only and exposes no AI, engine evaluation, editable PGN/variations, annotations on the source, or source write-back.
- Protected or live content becomes editable only through an explicit import that creates a local copy.
- API failures render truthful scoped states without exposing DTOs, endpoints, protocols, stacks, or secrets.

## Validation

No automated unit, component, integration, snapshot, visual-regression, or E2E test files or infrastructure may be created or retained. Vitest, Vue Test Utils, jsdom test environments, Playwright, Cypress, Jest, Testing Library, fixtures, snapshots, coverage, test setup, scripted suites, and `test` package scripts are forbidden.

For each implementation slice, run the applicable governance checks, formatting, lint, Stylelint, Knip, static aggregate, TypeScript checking, production build, and audits. Visible UI changes additionally require one narrow real-browser validation of page identity, nonblank DOM, absence of Vite error overlay and console-breaking errors, affected keyboard/focus behavior, reduced motion when relevant, and one real interaction state change when applicable. Do not generate test artifacts, screenshot loops, or pixel measurements.

Do not declare acceptance until the relevant `docs/ui/UI_ACCEPTANCE_CHECKLIST.md` items and the page-specific acceptance path pass, all OD dependencies remain truthful, and no current-versus-target or contract claim is overstated.
