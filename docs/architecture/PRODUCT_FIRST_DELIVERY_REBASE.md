# Product First Delivery Rebase

Status: `ACTIVE_AUTHORITY`
Decision date: `2026-07-12`
Owner decision: `PRODUCT_COMPLETE_USABLE`

## Decision

The primary delivery objective is now `PRODUCT_COMPLETE_USABLE`.

The product must reach a fully implemented and usable real product through
mechanical migration of the canonical Vue runtime, board, PGN, annotation,
analysis, workspace, and real production API capabilities as early as safely
possible.

The former rule that every generalized foundation capability must be complete
before any product UI migration is superseded. The former status
`FOUNDATION_COMPLETE_READY_FOR_PRODUCT_UI` is no longer an active prerequisite
gate for beginning product UI migration.

Historical reports that recorded the former rule remain immutable evidence. This
document supersedes that rule for active roadmap and gate decisions because the
owner has prioritized usable product delivery over completing every generalized
foundation program first.

## Replacement Gate

The minimum pre-product gate is now `PRODUCT_UI_MIGRATION_READY`.

`PRODUCT_UI_MIGRATION_READY` requires only the foundation capabilities that
would otherwise cause broad product UI rewrites or prevent the canonical Vue
runtime from operating correctly:

- accepted F0, F1, and F2 repository and governance baseline;
- accepted F3A and F3B token architecture and semantic token registry;
- F3C light, dark, and system theme preference runtime with startup restoration
  and no-flash behavior;
- F3D single Naive UI root provider and project-token-based theme mapping;
- one Vue application root;
- one Router;
- one Pinia graph;
- existing static governance, no-secret, no-mock, no-React,
  no-duplicate-runtime, package-manager, token, and architecture scanners;
- typecheck, static checks, production build, and narrow real-browser
  validation for every visible runtime phase.

The current live repository already records F3C as implemented and validated.
Therefore the remaining active pre-product implementation phase is
`F3D_NAIVE_UI_THEME_PROVIDER_AND_TOKEN_OVERRIDE_IMPLEMENTATION`.

No full generalized server-state, repository, security-runtime, global-error,
accessibility, or broad final integration program is required to open product UI
migration.

## Immediate Sequence

The owner-approved sequence is:

1. `F3C_THEME_ENGINE_PREFERENCE_AND_NO_FLASH_BOOTSTRAP_IMPLEMENTATION`
2. `F3D_NAIVE_UI_THEME_PROVIDER_AND_TOKEN_OVERRIDE_IMPLEMENTATION`
3. `PRODUCT_UI_MIGRATION_GATE_REVIEW`
4. `P1_CANONICAL_PRODUCT_RUNTIME_AND_UI_MIGRATION`

Because F3C is already accepted in the live target, F3D is the next required
implementation phase. This document does not reopen F3C and does not authorize
F3D, product UI migration, or P1 implementation during F3R.

`F3E_TOKEN_THEME_BROWSER_VALIDATION_AND_FINAL_CLOSURE` is superseded as a
separate pre-product gate. Narrow theme browser validation remains mandatory
inside F3C and F3D. Broad token-theme and cross-feature integration closure moves
to post-product hardening.

## P1 Product Migration Program

P1 is a vertical, usable, canonical-runtime migration program rather than
another long generalized-foundation program. It must prioritize visible and
operational delivery in this order unless canonical dependency evidence requires
a narrower adjustment:

1. application shell and canonical workspace geometry;
2. canonical self-developed board rendering and interaction;
3. real PGN loading, parsing, navigation, variation, and replay runtime;
4. canonical annotation runtime;
5. canonical panels, toolbars, splitters, responsive workspace behavior, and
   persisted user layout only when directly required by the workspace;
6. canonical AI analysis runtime and Web Worker behavior;
7. real production authentication and API-backed product capabilities;
8. real product error, unavailable, loading, permission, and retry behavior only
   as required by implemented product flows;
9. final complete product flow integration.

P1 must use `/Users/cc/Work/neobv/Chess/pgnViewer-new` as the canonical runtime
authority and migrate working behavior mechanically before refactoring. It must
use `/Users/cc/Work/neobv/Chess/chess-pgnviewer` as the product,
UI-governance, API, security, and implementation-evidence authority. The old
React runtime is not target architecture authority.

## Deferred Domains

The following comprehensive generalized foundation programs are deferred until
`PRODUCT_COMPLETE_USABLE` unless a specific real product feature cannot operate
without a narrow part of them:

- comprehensive TanStack Vue Query server-state architecture;
- general QueryClient policy and query-key framework;
- general repository abstraction across the whole product;
- general DTO and domain repository layering unrelated to the current feature
  slice;
- comprehensive security-runtime architecture and security-header program;
- comprehensive environment and runtime-configuration architecture beyond what
  an active real feature requires;
- comprehensive global error and feedback framework;
- comprehensive accessibility foundation and product-wide accessibility
  remediation;
- comprehensive final cross-feature browser-integration closure;
- comprehensive foundation preview or design-system preview;
- generalized responsive, motion, persistence, and adapter frameworks that are
  not required by the current canonical product slice.

Deferred capabilities remain tracked in
`docs/architecture/FOUNDATION_READINESS_MATRIX.json` with
`DEFERRED_UNTIL_PRODUCT_COMPLETE`. They are not deleted, marked implemented,
marked unnecessary, or rejected.

## Feature-Owned Minimum Rule

When an active real product feature requires data access, error handling,
safety, persistence, or accessibility behavior, implement only the smallest
feature-owned boundary required for that real feature.

A feature-owned implementation must:

- use real production APIs and confirmed contracts;
- preserve same-origin browser boundaries;
- keep upstream credentials, tokens, signing secrets, HMAC secrets, MQTT
  credentials, and private cookies out of browser code and browser persistence;
- validate untrusted runtime responses when required for safe operation;
- normalize enough error state to provide truthful loading, empty, permission,
  unavailable, retry, and failure behavior for that feature;
- avoid fake success fallbacks;
- avoid unnecessary generalized frameworks before real product evidence requires
  them.

Feature-owned implementations may later be consolidated during post-product
hardening.

## Non-Deferrable Controls

The following controls remain active throughout product development:

- no secrets in the repository;
- no browser ownership of upstream credentials or signing secrets;
- no direct imports from evidence-source projects;
- no React runtime;
- no duplicate Vue root, Router, or Pinia graph;
- no competing package manager or lockfile;
- no mock or fake product data;
- no invented API contracts;
- no generic `/CALL`;
- no `proxyRequest`;
- no MQTT publish;
- no unauthorized write or administration endpoints;
- no raw visual values outside the semantic token authority;
- no direct Naive UI imports outside approved provider or `src/ui` ownership;
- no arbitrary `localStorage`, `sessionStorage`, or `IndexedDB` use outside
  approved owners;
- no direct `import.meta.env` use outside approved runtime configuration
  ownership;
- no automated test framework or test script;
- no force push;
- no source-project modification.

Existing project-owned scanner rules remain blocking and must not be weakened,
removed, bypassed, or broadly allowlisted.

## Validation Policy

Every runtime phase must continue to run the applicable project-owned validation
ladder:

- `mise exec -- pnpm run check:deps`
- `mise exec -- pnpm run check:architecture`
- `mise exec -- pnpm run check:tokens`
- `mise exec -- pnpm run check:mocks`
- `mise exec -- pnpm run check:secrets`
- `mise exec -- pnpm run format:check`
- `mise exec -- pnpm run lint`
- `mise exec -- pnpm run lint:style`
- `mise exec -- pnpm run check:unused`
- `mise exec -- pnpm run check:governance`
- `mise exec -- pnpm run typecheck`
- production build with authoritative Vue SFC type checking;
- `mise exec -- pnpm run audit:prod`
- `mise exec -- pnpm audit`
- `mise exec -- pnpm list --depth 0`
- `mise exec -- pnpm run check:static`

Dependency-changing phases also require the full dependency and audit evidence
owned by the phase. Visible runtime phases require narrow real-browser
validation of the implemented feature. F3R itself changes only governance
documents and reports, so browser validation is not applicable.

## Git And Source Policy

The only writable product directory is
`/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue`.

The permanent read-only evidence directories are:

- `/Users/cc/Work/neobv/Chess/pgnViewer-new`
- `/Users/cc/Work/neobv/Chess/pgnViewer`
- `/Users/cc/Work/neobv/Chess/chess-pgnviewer`

The authorized remote is
`https://github.com/ichichuang/chess-pgnviewet-vue.git` with repository full name
`ichichuang/chess-pgnviewet-vue`. Preserve the spelling `viewet`.

Git operations must use normal non-force push only. Do not stage unrelated
paths. Do not reset, restore, stash, clean, amend, delete branches, or force
push unless an explicit later owner instruction authorizes that operation.

## Final Milestones

`PRODUCT_UI_MIGRATION_READY` means F3C and F3D have passed, theme and Naive UI
provider ownership are stable, static checks pass, narrow browser checks pass,
local `HEAD` equals remote `main`, and the worktree is clean.

`PRODUCT_COMPLETE_USABLE` means the canonical product runtime and user-facing
product flows are implemented with real data and real APIs, the primary
workspace and critical product actions operate successfully, narrow browser
validation has passed for every delivered slice, local `HEAD` equals remote
`main`, and the worktree is clean.

`POST_PRODUCT_FOUNDATION_HARDENING_COMPLETE` means the deferred server-state,
repository, security-runtime, global-error, accessibility, broad responsive and
motion, foundation preview, and final broad browser-integration programs have
been reviewed and completed or explicitly rejected with evidence after the
usable product milestone.

`FOUNDATION_COMPLETE_READY_FOR_PRODUCT_UI` is not an active future milestone.

## Review Triggers

Review this decision when:

- F3D passes and the controller evaluates `PRODUCT_UI_MIGRATION_READY`;
- a P1 slice cannot operate without an earlier narrow implementation from a
  deferred domain;
- a scanner rule blocks real product migration and the proposed resolution would
  alter the scanner contract;
- `PRODUCT_COMPLETE_USABLE` is reached and post-product hardening begins;
- a dependency, source authority, or production API contract materially changes.

## Risks

- Deferred generalized foundations can create local inconsistencies if product
  slices implement overlapping feature-owned boundaries. Mitigation: keep each
  boundary narrow, real-contract-backed, and recorded for later consolidation.
- Product-first migration can expose missing API or source-contract evidence
  earlier. Mitigation: blocked real capabilities must render truthful unavailable
  states rather than fake success.
- F3E no longer serving as a pre-product gate can hide broad integration gaps.
  Mitigation: narrow browser validation remains mandatory in every visible slice,
  and broad closure moves to post-product hardening rather than disappearing.
