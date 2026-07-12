# F2A Toolchain And Static Governance Baseline

Status: `ACTIVE_DESIGN_AUTHORITY`
Phase: `F2A_TOOLCHAIN_TARGET_DESIGN_AND_DEPENDENCY_GRAPH`
Created: `2026-07-12T04:30:22Z`
Target: `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue`

## Current Baseline

The accepted starting point is branch `main` at local and remote SHA `8b16c0bbc17a9fd489ccb55731959add5139353f`, subject `docs(governance): 记录 F1 建仓与首次推送验收证据`, with tracked worktree clean and remote `https://github.com/ichichuang/chess-pgnviewet-vue.git`.

F2A is a design and dependency-graph phase only. It does not install packages, change manifests or lockfiles, create tool configs, add scanners, start Vite, create automated tests, migrate product UI, or implement runtime foundations.

Prerequisite report hashes:

| File                                                                                                   | SHA-256                                                            | Accepted State                                                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `.ai/reports/F0_FOUNDATION_READINESS_AUDIT_DEPENDENCY_INVENTORY_AND_REMOTE_GIT_SAFETY_REPORT.json`     | `c39756d5805618e57ceb781ce932b12e3041c74ebe778a49889bc4052c0d8bee` | `F0_FOUNDATION_AUDIT_PASS_READY_FOR_GIT_BASELINE`                 |
| `.ai/reports/F0A_FOUNDATION_AUDIT_SIDE_EFFECT_CLEANUP_AND_EVIDENCE_RECONCILIATION_REPORT.json`         | `cf1843fc5635352e1adf2621dfc08d1edad53cb344e8e57f7edbcf348cc26935` | historical `F0A_CORRECTION_BLOCKED` by active target Vite process |
| `.ai/reports/F0B_ACTIVE_VITE_PROCESS_RESOLUTION_AND_F0_AUDIT_CLOSURE_REPORT.json`                      | `6415e58ee7f3acc677a7b3588afd58a6d59014cee641c45034af6ccdd49d755b` | `F0B_CLOSURE_PASS_F0_READY_FOR_GIT_BASELINE`                      |
| `.ai/reports/F1_LOCAL_GIT_INITIALIZATION_GITIGNORE_P0_BASELINE_COMMIT_AND_FIRST_SAFE_PUSH_REPORT.json` | `678df86a4d5805034f5f78121a6df33b966d911b5544bceb6e59c2d9ba694e7a` | `F1_BASELINE_PUSH_PASS_READY_FOR_TOOLCHAIN_CLOSURE`               |
| `docs/architecture/FOUNDATION_READINESS_MATRIX.json`                                                   | `741488505c36626068f4eb52d6d76feedc330bc6ba92f60524be59a26e6b24df` | records F2 static-governance gaps as missing or partial           |

Known F1 warning: `git diff --cached --check` reported pre-existing Markdown whitespace. Current tracked debt is limited to trailing two-space hard-break lines at line 3 in `docs/architecture/API_BOUNDARY_ADR.md`, `docs/architecture/PERSISTENCE_ADR.md`, `docs/architecture/SOURCE_ADAPTER_ADR.md`, and `docs/architecture/TECH_STACK_DECISION.md`.

## Selected Future Tooling

F2 selects a non-overlapping graph for later installation:

| Owner                       | Future Packages                                                                                                 | Recommended Compatible Versions                            | Responsibility                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| ESLint validation           | `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-vue`, `vue-eslint-parser`, `eslint-config-prettier` | `10.7.0`, `10.0.1`, `8.63.0`, `10.9.2`, `10.4.1`, `10.1.8` | JS/TS/Vue correctness, import restrictions, runtime-global restrictions, unused variables, Vue macro handling, no-fix validation |
| Formatting                  | `prettier`                                                                                                      | `3.9.5`                                                    | Stable formatting for supported text files in check and explicit write modes                                                     |
| CSS validation              | `stylelint`, `stylelint-config-standard`, `postcss-html`                                                        | `17.14.0`, `40.0.0`, `1.8.1`                               | CSS and Vue style-block correctness, selector/declaration policy, custom-property discipline                                     |
| Unused-code analysis        | `knip`                                                                                                          | `6.26.0`                                                   | Single owner for unused dependencies, exports, files, and package-entry drift                                                    |
| Aggregate script runner     | `npm-run-all2`                                                                                                  | `9.0.2`                                                    | Deterministic read-only aggregate command composition                                                                            |
| Product governance scanners | project-owned Node scripts                                                                                      | no external package selected                               | Architecture, dependency policy, raw visual values, mock/fake fallback, and secret-pattern checks                                |

Current runtime graph remains `vue 3.5.39`, `vite 8.1.4`, `@vitejs/plugin-vue 6.0.7`, `vue-tsc 3.3.7`, `typescript 6.0.3`, Node `26.5.0`, and pnpm `11.11.0`.

## Compatibility Decision

Official npm registry metadata and owner-maintained docs show:

- ESLint `10.7.0` supports Node `^20.19.0 || ^22.13.0 || >=24`; Node `26.5.0` satisfies it.
- `typescript-eslint 8.63.0` supports ESLint `^8.57.0 || ^9.0.0 || ^10.0.0` and TypeScript `>=4.8.4 <6.1.0`.
- TypeScript package `latest` is `7.0.2`, but it is rejected for this graph because `typescript-eslint` excludes it and the active Vue tooling baseline already records TypeScript 7 as a future gated upgrade.
- `eslint-plugin-vue 10.9.2` supports ESLint `^8.57.0 || ^9.0.0 || ^10.0.0` and `vue-eslint-parser ^10.3.0`.
- Stylelint `17.14.0` and `stylelint-config-standard 40.0.0` share the Stylelint 17 line and Node `>=20.19.0`.
- Knip `6.26.0` supports Node `^20.19.0 || >=22.12.0`.
- `npm-run-all2 9.0.2` supports Node `^22.22.2 || ^24.15.0 || >=26.0.0`.

Version exception: `typescript` stays at `6.0.3` although registry `latest` is `7.0.2`. Removal condition: stable Vue Language Tools, `vue-tsc`, and `typescript-eslint` support TypeScript 7, full typecheck/build/static/browser validation passes, and the owner approves the upgrade.

## Rejected Tools And Approaches

| Rejected                                                  | Reason                                                                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript `7.0.2`                                        | Independent latest is incompatible with `typescript-eslint <6.1.0` range and current Vue TypeScript bridge policy.                        |
| Biome or oxc formatter/linter replacement                 | Overlaps ESLint, Prettier, and Stylelint without satisfying Vue/project-specific governance better.                                       |
| dependency-cruiser or madge as primary architecture owner | Too broad for current need; focused ESLint restrictions plus small project-owned scanners cover the contract with lower operational cost. |
| depcheck or multiple unused-code tools                    | Overlaps Knip; F2 selects one maintained unused-code owner.                                                                               |
| secretlint or generic secret scanner package              | Project must redact findings and encode product-specific VITE/MQTT/HMAC rules; use a small project-owned scanner first.                   |
| blanket Markdown exclusion from formatting                | Would hide new documentation drift; only the four known legacy lines may be handled by a dedicated remediation slice.                     |
| automated tests or test runners                           | Explicitly forbidden by P0E/F1 governance for the active target.                                                                          |

## ESLint Ownership

Future `eslint.config.mjs` owns lint validation for `src/**/*.{ts,vue}`, root JS/MJS/CJS config files, and project-owned tooling scripts. It must ignore dependency stores, generated output, caches, `.git`, evidence sources, browser profiles, coverage, and local agent state.

Required policy:

- Flat config using `@eslint/js`, `typescript-eslint`, `eslint-plugin-vue`, and `vue-eslint-parser`.
- Type-aware linting for project TypeScript and Vue files after configuration proves acceptable runtime cost.
- Browser globals only for browser source blocks; Node globals only for config/tooling blocks.
- Vue compiler macros handled explicitly.
- Unused variables reject unused bindings while allowing conventional ignored prefixes only if documented.
- No formatting rules that overlap Prettier; `eslint-config-prettier` terminates stylistic overlap.
- No fix in validation scripts.
- Restricted imports enforce no React runtime, no duplicate Vue roots, no duplicate Router/Pinia installation, no direct Naive UI imports outside approved provider/adapter files, no arbitrary icon-library imports outside the icon adapter, no imports from read-only source projects, no raw browser storage outside approved adapters, no raw `fetch` outside API boundary, and no direct `import.meta.env` outside runtime configuration ownership.

## Prettier Ownership

Prettier owns whitespace and formatting for supported text files: `.ts`, `.vue`, `.css`, `.json`, `.md`, `.mjs`, `.cjs`, `.js`, `.html`, and `.yml` where present. It must ignore `.git`, `node_modules`, `.pnpm-store`, `dist`, `.vite`, caches, coverage, browser profiles, local databases, `.serena`, and read-only evidence directories.

Prettier check mode is read-only. Prettier write mode is explicit and never part of aggregate verification. Markdown governance documents remain in scope. Markdown document structure remains under Prettier ownership, but embedded fenced-code contents remain under document-author and domain-governance ownership. `embeddedLanguageFormatting` is permanently `off`; Prettier must not reformat JSON, YAML, JavaScript, TypeScript, CSS, HTML, shell, or other content embedded inside Markdown fenced-code blocks.

## F2BR2 Formatting Ownership Correction

Correction date: `2026-07-12`

The original four-line formatting finding was incomplete. It remains true that line 3 in `docs/architecture/API_BOUNDARY_ADR.md`, `docs/architecture/PERSISTENCE_ADR.md`, `docs/architecture/SOURCE_ADAPTER_ADR.md`, and `docs/architecture/TECH_STACK_DECISION.md` contains known trailing two-space Markdown hard-break debt, but that finding no longer defines the full formatting scope.

The authoritative F2BR2 Prettier scan reported the exact count recorded in `docs/architecture/PRETTIER_FORMATTING_DEBT_BASELINE.json`. Historical `.ai/reports` files are permanently outside Prettier ownership because they are immutable machine evidence validated by strict JSON parsing, report-specific checks, redacted secret scanning, and Git review.

`pnpm-lock.yaml` is permanently outside Prettier ownership because it is generated and structurally owned exclusively by the project-pinned pnpm package manager. Prettier must never format, rewrite, normalize, or directly validate `pnpm-lock.yaml`; manual editing of `pnpm-lock.yaml` remains forbidden. Lockfile integrity is governed by package-manager pinning, package-manager exclusivity checks, manifest and lockfile diff review after authorized dependency operations, security audit, frozen-lockfile validation where authorized, and Git review.

Every other existing authored formatting violation is exact-path temporary debt. The temporary debt list expires in `F2C_FORMATTING_DEBT_REMEDIATION`; F2 remains incomplete until those paths are formatted, reviewed, removed from `.prettierignore`, and the active authored-file format check passes without temporary debt exclusions.

## F2C Embedded-Code Policy Correction And Debt Closure

Correction date: `2026-07-12`

The blocked F2C attempt discovered that default Prettier embedded-language formatting changed governed fenced-code examples in Markdown documents. F2C therefore restores the clean pre-format content, disables Prettier embedded-language formatting, and validates byte-for-byte fenced-code preservation before accepting Markdown formatting.

The exact 30-path temporary formatting debt recorded in `docs/architecture/PRETTIER_FORMATTING_DEBT_BASELINE.json` is remediated. The temporary exact-path `.prettierignore` allowlist is removed. Historical `.ai/reports/` and `pnpm-lock.yaml` retain permanent non-Prettier ownership.

New authored files must pass formatting immediately. Project-owned architecture, raw-value, mock-data, secret, and dependency-policy scanners were implemented and validated in `F2D_PROJECT_OWNED_STATIC_GOVERNANCE_SCANNER_IMPLEMENTATION`; final F2 closure validation is recorded by `F2E_TOOLCHAIN_AND_STATIC_GOVERNANCE_FINAL_CLOSURE`.

## Stylelint Ownership

Future `stylelint.config.mjs` owns `src/**/*.css` and Vue style blocks via `postcss-html`. It extends `stylelint-config-standard`, applies Vue overrides only where needed, and ignores generated/external paths.

Stylelint enforces CSS validity, duplicate properties, selector sanity, custom-property patterns, and fixable CSS hygiene. It does not own product-specific raw visual-value policy beyond generic CSS correctness; the raw visual-value scanner owns cross-language value governance.

## Static Governance Scanner Contracts

Project-owned scanners live under `scripts/governance/` and run read-only by default.

Architecture scanner:

- Blocks React runtime, duplicate Vue roots, duplicate Router or Pinia installation, direct Naive UI imports outside approved provider/adapter files, direct icon-library imports outside icon adapter, direct raw `fetch` outside API boundary, raw browser storage outside approved persistence/bootstrap-preference adapters, direct `import.meta.env` outside runtime config, browser ownership of upstream credentials, generic `/CALL`, `proxyRequest`, MQTT publish, write/admin endpoint implementation, and imports from read-only source projects.

Raw visual-value scanner:

- Allows canonical raw values only in `src/styles/tokens.css`, approved validated theme manifests, and documented Naive UI token override ownership.
- Blocks raw hex, rgb/hsl/oklch/lab/lch/color-mix, named colors, hard-coded shadows, radii, spacing scales, z-index scales, durations, and literal color utility classes in product implementation paths.
- Excludes comments, Markdown prose, generated output, dependency stores, and external SVG/image assets unless an SVG is imported as implementation source.
- Admits canonical migration values only through token registry review without parallel token namespaces.

Mock-data scanner:

- Targets runtime and product implementation paths, not documentation prose.
- Detects mock API modes, fake data, fixtures as product fallback, sample tournaments/games/PGNs, fake replay/live transport, fake AI output, placeholder success states, invented endpoints, invented DTO fields, and silent fallback responses.
- Allows neutral development-only foundation preview labels that are not product records.

Secret scanner:

- Excludes dependency stores, `.git`, generated output, caches, approved placeholder-only `.env.example`, and documentation examples with no usable credential.
- Detects likely private keys, tokens, Authorization headers, passwords, signing secrets, HMAC secrets, cookies, MQTT credentials, registry/cloud credentials, secret-bearing URLs, and unsafe `VITE_` exposure.
- Reports only path, line, rule id, and redacted fingerprint; it never prints complete secret values.

Dependency-policy scanner:

- Owns package-manager exclusivity, lockfile integrity, prerelease detection, forbidden dependencies, dependency version exceptions, package-manager lockfile duplicates, dependency audit command ownership, and compatibility review triggers.
- It never runs automatic audit fixes.

## F2D Project-Owned Scanner Implementation

Implementation status: `IMPLEMENTED_VALIDATED_F2_CLOSED`

The active scanner authority is `docs/architecture/STATIC_GOVERNANCE_SCANNER_BASELINE.md`.

Implemented project-owned files:

| Domain             | Path                                                        | Script               |
| ------------------ | ----------------------------------------------------------- | -------------------- |
| Dependency policy  | `scripts/governance/check-dependency-policy.mjs`            | `check:deps`         |
| Architecture       | `scripts/governance/check-architecture-boundaries.mjs`      | `check:architecture` |
| Raw visual values  | `scripts/governance/check-raw-visual-values.mjs`            | `check:tokens`       |
| Mock product data  | `scripts/governance/check-forbidden-mock-data.mjs`          | `check:mocks`        |
| Secret patterns    | `scripts/governance/check-secret-patterns.mjs`              | `check:secrets`      |
| Shared policy      | `scripts/governance/policy.mjs`                             | n/a                  |
| Shared utilities   | `scripts/governance/utils.mjs`                              | n/a                  |
| Governance wrapper | all scanner entrypoints through `run-s check:*` composition | `check:governance`   |

`check:static` includes `format:check`, `check:governance`, `check:unused`, `lint`, `lint:style`, and `audit:prod`. It remains read-only.

Final F2E validation confirmed all five scanner domains, JSON mode, controlled negative and clean probes, redacted secret handling, `check:governance`, `check:static`, typecheck, temporary-output production build, production audit, full audit, and isolated frozen-lockfile validation.

Permanent scanner exclusions are `.git`, `node_modules`, `.pnpm-store`, `dist`, `.vite`, `coverage`, `.serena`, local logs, local databases, generated output, dependency stores, browser state, and read-only evidence-source repositories. Secret scanning additionally excludes immutable historical reports, archived evidence, generated lockfile content, binary assets, and approved placeholder-only `.env.example` values.

Future allowlists are exact paths or directories only and do not create placeholder runtime files. The current future ownership paths are `src/ui/`, `src/app/providers/`, `src/providers/`, `src/ui/icons/`, `src/api/`, `src/repositories/`, `src/persistence/`, `src/bootstrap/preferences/`, and `src/runtime/config/`.

All scanner findings are blocking and include a stable rule id, file, line when available, redacted excerpt, reason, and remediation owner. JSON mode emits to stdout and creates no repository artifact. Secret findings include redacted fingerprints only.

## Future Package Scripts

| Script               | Responsibility                           | Expected Command Shape                                                                                                            | Read-only                                                                                                                                                        |
| -------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`                | Existing Vite dev server                 | `vite`                                                                                                                            | no                                                                                                                                                               |
| `preview`            | Existing Vite preview                    | `vite preview`                                                                                                                    | no                                                                                                                                                               |
| `typecheck`          | Existing Vue SFC type check              | `pnpm run typecheck:vue`                                                                                                          | yes                                                                                                                                                              |
| `typecheck:vue`      | Existing `vue-tsc` invocation            | `vue-tsc --noEmit`                                                                                                                | yes                                                                                                                                                              |
| `build`              | Existing typecheck plus production build | `pnpm run typecheck:vue && vite build`                                                                                            | writes `dist` unless temporary outDir is used by validation                                                                                                      |
| `lint`               | ESLint validation                        | `eslint . --max-warnings=0`                                                                                                       | yes                                                                                                                                                              |
| `lint:style`         | Stylelint validation                     | `stylelint "src/**/*.{css,vue}"`                                                                                                  | yes                                                                                                                                                              |
| `format:check`       | Prettier check                           | `prettier . --check`                                                                                                              | yes                                                                                                                                                              |
| `format:write`       | Explicit formatting write                | `prettier . --write`                                                                                                              | no                                                                                                                                                               |
| `check:deps`         | Dependency policy                        | `node scripts/governance/check-dependency-policy.mjs`                                                                             | yes                                                                                                                                                              |
| `check:unused`       | Knip unused analysis                     | `knip --no-progress`                                                                                                              | yes                                                                                                                                                              |
| `check:architecture` | Architecture boundaries                  | `node scripts/governance/check-architecture-boundaries.mjs`                                                                       | yes                                                                                                                                                              |
| `check:tokens`       | Raw visual values                        | `node scripts/governance/check-raw-visual-values.mjs`                                                                             | yes                                                                                                                                                              |
| `check:mocks`        | Mock/fake fallback                       | `node scripts/governance/check-forbidden-mock-data.mjs`                                                                           | yes                                                                                                                                                              |
| `check:secrets`      | Redacted secret patterns                 | `node scripts/governance/check-secret-patterns.mjs`                                                                               | yes                                                                                                                                                              |
| `audit:prod`         | Production dependency security audit     | `pnpm audit --prod`                                                                                                               | yes                                                                                                                                                              |
| `check:static`       | Static governance aggregate              | `run-s lint lint:style format:check check:deps check:unused check:architecture check:tokens check:mocks check:secrets audit:prod` | yes                                                                                                                                                              |
| `verify:foundation`  | Full foundation gate                     | `run-s typecheck build check:static`                                                                                              | yes except normal `build` writes `dist`; CI/local gate should use the established temporary build-output method when strict no-repo-write validation is required |

No `test` script is permitted.

## Proposed Files For Later Phases

| Path                                                   | Phase      | Owner                   |
| ------------------------------------------------------ | ---------- | ----------------------- |
| `eslint.config.mjs`                                    | F2B        | ESLint validation       |
| `prettier.config.mjs`                                  | F2B        | Prettier formatting     |
| `.prettierignore`                                      | F2B or F2C | Prettier scope          |
| `stylelint.config.mjs`                                 | F2B        | Stylelint validation    |
| `knip.json`                                            | F2B        | unused-code analysis    |
| `scripts/governance/check-dependency-policy.mjs`       | F2D        | dependency policy       |
| `scripts/governance/check-architecture-boundaries.mjs` | F2D        | architecture scanner    |
| `scripts/governance/check-raw-visual-values.mjs`       | F2D        | token/raw-value scanner |
| `scripts/governance/check-forbidden-mock-data.mjs`     | F2D        | mock-data scanner       |
| `scripts/governance/check-secret-patterns.mjs`         | F2D        | secret scanner          |
| `docs/architecture/DEPENDENCY_VERSION_EXCEPTIONS.json` | superseded | dependency exceptions   |

The proposed `docs/architecture/DEPENDENCY_VERSION_EXCEPTIONS.json` path is superseded by the implemented `versionExceptions` authority in `scripts/governance/policy.mjs`. The active exceptions for `typescript@6.0.3` and `pnpm@11.11.0` record authority, rationale, risk, review trigger, removal condition, selected version, and compatibility evidence through `policy.mjs` and this baseline.

## Implementation Slices

1. `F2B_TOOLCHAIN_DEPENDENCY_AND_CONFIGURATION_IMPLEMENTATION`: install selected dev dependencies, create standard configs, add scripts without product/runtime changes.
2. `F2C_FORMATTING_DEBT_REMEDIATION`: remediate the exact 30-path temporary Prettier debt, disable embedded-language formatting for Markdown fenced-code preservation, and remove the temporary exact-path ignore allowlist.
3. `F2D_PROJECT_OWNED_STATIC_GOVERNANCE_SCANNER_IMPLEMENTATION`: implement read-only project scanners, dependency exception records, package-script integration, controlled probes, failure remediation, and complete static validation.
4. `F2E_TOOLCHAIN_AND_STATIC_GOVERNANCE_FINAL_CLOSURE`: reconcile active authorities, rerun final read-only validation, record closure evidence, and hand off to F3A design.

Superseded on `2026-07-12` by accepted F2D and F2E evidence: the older `F2E_STATIC_CHECK_INTEGRATION_AND_FAILURE_REMEDIATION` plus `F2F_TOOLCHAIN_STATIC_GOVERNANCE_CLOSURE` sequence. Rationale: scanner integration and failure remediation were completed during accepted F2D, leaving F2E as the single final closure phase. No F2F phase remains required unless a future F2E blocker requires a separately named correction phase.

## F2 Completion Gate

F2 is complete: selected dependencies are installed intentionally, configs and scripts exist, read-only static checks pass, typecheck passes, temporary-output production build passes, production and full audits pass, frozen-lockfile validation passes, Markdown debt disposition is resolved, no automated test infrastructure exists, no product UI/runtime migration occurred, only authorized files changed in each slice, and `.ai/reports/F2E_TOOLCHAIN_AND_STATIC_GOVERNANCE_FINAL_CLOSURE_REPORT.json` records final evidence.

Final F2 status: `F2_TOOLCHAIN_AND_STATIC_GOVERNANCE_COMPLETE`.

Next required phase: `F3A_CANONICAL_TOKEN_THEME_INVENTORY_AND_TARGET_DESIGN`.
