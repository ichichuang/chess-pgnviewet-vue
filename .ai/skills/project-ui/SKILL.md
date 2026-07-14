---
name: project-ui
description: Govern page-by-page product design, Vue UI implementation, review, and browser validation for the 开赛了 chess workspace.
---

# Project UI Authority

## Trigger and current gate

Use this skill for every product page design, UI implementation, refactor, review, or browser-validation task in this repository.

The product-design baseline is `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`; the completed page-design documentation package is now active authority. Work may proceed only under `PRODUCT_PAGE_DESIGN_DOCUMENTATION_READY_FOR_IMPLEMENTATION`. `OD-01` through `OD-11` remain open; no page slice may silently resolve them.

## Required pre-reads

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md`
4. `docs/product/OWNER_PRODUCT_REQUIREMENT_BASELINE.zh-CN.md`
5. `docs/design/PRODUCT_UI_DESIGN_INDEX.zh-CN.md`
6. `docs/design/PRODUCT_UI_IMPLEMENTATION_HANDOFF.zh-CN.md`
7. the relevant target page specification under `docs/design/pages/**`
8. the global design documents linked by that page (`PRODUCT_UI_DESIGN_SYSTEM.zh-CN.md`, `PRODUCT_GLOBAL_LAYOUT_SPEC.zh-CN.md`, `PRODUCT_GLOBAL_INTERACTION_SPEC.zh-CN.md`, `PRODUCT_GLOBAL_STATE_SPEC.zh-CN.md`, `PRODUCT_RESPONSIVE_SPEC.zh-CN.md`, `PRODUCT_COMPONENT_RESPONSIBILITY_SPEC.zh-CN.md`, `PRODUCT_NAIVE_UI_MAPPING.zh-CN.md`, `PRODUCT_COMMON_OVERLAYS_AND_DIALOGS_SPEC.zh-CN.md`)
9. `docs/design/PRODUCT_IMPLEMENTATION_CORRECTION_BACKLOG.zh-CN.md`
10. relevant current `docs/product/**`, `docs/ui/**`, and `docs/architecture/**`
11. `docs/migration/SOURCE_PROVENANCE.md` when source evidence is needed
12. `.ai/skills/gsap/SKILL.md` for animation or animated interaction

Historical `.ai/reports/**` files provide evidence only and cannot govern current page design.

## Page implementation contract

This skill must no longer independently invent page layout, state, interaction, or responsive rules when the design package already owns those decisions. Resolve implementation details only inside the flexibility explicitly allowed by `docs/design/PRODUCT_UI_IMPLEMENTATION_HANDOFF.zh-CN.md`.

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

Every page slice must:

1. identify the page family and design-surface IDs from `docs/design/PRODUCT_SCREEN_INVENTORY.zh-CN.md`;
2. read the target page specification under `docs/design/pages/**` and all global design documents it links;
3. identify all affected `COR-*` entries in `docs/design/PRODUCT_IMPLEMENTATION_CORRECTION_BACKLOG.zh-CN.md`;
4. classify every capability as `CURRENT_IMPLEMENTED`, `APPROVED_TARGET`, `CONTRACT_BLOCKED`, `OPEN_OWNER_DECISION`, or `PROHIBITED`;
5. preserve `OD-01` through `OD-11` as open and use only provisional values allowed by the owning decision;
6. implement only the selected page slice and required shared prerequisites;
7. avoid unrelated refactors, reformatting, or renaming;
8. run the applicable governance checks, formatting, lint, Stylelint, Knip, static checks, TypeScript checking, production build, and the page-specific narrow browser acceptance path; and
9. close a `COR-*` item only with the evidence required by the implementation handoff and correction backlog.

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

For each implementation slice, run the applicable governance checks, formatting, lint, Stylelint, Knip, static aggregate, TypeScript checking, production build, and audits. Visible UI changes additionally require one narrow real-browser validation of page identity, nonblank DOM, absence of Vite error overlay and console-breaking errors, affected keyboard/focus behavior, reduced motion when relevant, and one real interaction state change when applicable. Do not generate test artifacts, screenshot loops, pixel measurements, or preview images.

Do not declare acceptance until the page-specific acceptance criteria in the relevant `docs/design/pages/**` specification and the page-specific browser path pass, all affected `COR-*` items have the required evidence, all OD dependencies remain truthful, and no current-versus-target or contract claim is overstated.
