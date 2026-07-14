# Toolchain and Static Governance Baseline

Status: `ACTIVE_CURRENT_STATE_AUTHORITY`

Effective date: `2026-07-14`

## Current toolchain

The repository is one pnpm-managed Vue application. Current versions are exact and are enforced by `package.json`, `.mise.toml`, `pnpm-lock.yaml`, and `scripts/governance/policy.mjs`.

| Owner             | Current selection                                                                                                                                           | Responsibility                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Runtime manager   | mise                                                                                                                                                        | Node `26.5.0`, pnpm `11.11.0`                                          |
| Package manager   | `pnpm@11.11.0`                                                                                                                                              | sole dependency and lockfile owner                                     |
| Vue runtime       | Vue `3.5.39`, Vue Router `5.1.0`, Pinia `3.0.4`                                                                                                             | application, routing, and client state                                 |
| Server reads      | TanStack Vue Query `5.101.2`, Axios `1.18.1`, Zod `4.4.3`                                                                                                   | query, transport, and boundary validation                              |
| Product runtime   | chess.js `1.4.0`, Dexie `4.4.4`, GSAP `3.15.0`, Naive UI `2.44.1`, js-md5 `0.8.3`                                                                           | approved domain, persistence, motion, adapter, and compatibility roles |
| Build/typecheck   | Vite `8.1.4`, plugin-vue `6.0.7`, TypeScript `6.0.3`, vue-tsc `3.3.7`, `@vue/tsconfig` `0.9.1`                                                              | production bundling and authoritative Vue SFC checking                 |
| Lint              | ESLint `10.7.0`, `@eslint/js` `10.0.1`, typescript-eslint `8.63.0`, eslint-plugin-vue `10.9.2`, vue-eslint-parser `10.4.1`, eslint-config-prettier `10.1.8` | JS/TS/Vue and governance-script validation                             |
| CSS validation    | Stylelint `17.14.0`, stylelint-config-standard `40.0.0`, postcss-html `1.8.1`                                                                               | CSS and Vue style-block validation                                     |
| Formatting        | Prettier `3.9.5`                                                                                                                                            | authored text formatting; check is read-only, write is explicit        |
| Unused graph      | Knip `6.26.0`                                                                                                                                               | unused files, exports, dependencies, and entry drift                   |
| Aggregate scripts | npm-run-all2 `9.0.2`                                                                                                                                        | deterministic read-only command composition                            |

## Package-manager and lockfile rules

- pnpm is the sole package manager. `package-lock.json`, `npm-shrinkwrap.json`, Yarn lockfiles, and Bun lockfiles are forbidden.
- `pnpm-lock.yaml` is generated and owned only by the pinned pnpm version. It is outside Prettier ownership and must not be manually edited.
- Direct dependency versions are exact stable versions. Prerelease versions require explicit authorization.
- Dependency mutation, automatic audit fixes, package-manager migration, and lockfile regeneration require a separate approved task.
- The repository is one application, not a package monorepo. `pnpm-workspace.yaml` exists only for pnpm project policy and declares no workspace packages.

## Current version exceptions

| Package    | Selected  | Newer stable observed | Rationale                                                                                                                                       | Review trigger                                                                                                               | Removal condition                                                                                                         |
| ---------- | --------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| TypeScript | `6.0.3`   | `7.0.2`               | Stable Vue embedded-language tooling and typescript-eslint require the TypeScript 6 programmatic API and cannot consume the compatibility shim. | Stable TypeScript programmatic API plus Vue Language Tools, vue-tsc, and ESLint TypeScript integration support TypeScript 7. | Static governance, Vue SFC typecheck, production build, audits, required browser validation, and owner approval all pass. |
| pnpm       | `11.11.0` | `11.12.0`             | The repository pins Node and pnpm as one reproducible toolchain contract.                                                                       | Owner authorizes a package-manager baseline update.                                                                          | Lockfile integrity and the full current validation set pass after the authorized update.                                  |

TypeScript 7 is not an active dependency. Do not patch package exports, edit `node_modules`, patch Vue tooling, bypass `vue-tsc`, replace Vue SFC checking with plain `tsc`, or add a custom compiler wrapper.

## Configuration ownership

| Owner              | Files                                                   | Boundary                                                              |
| ------------------ | ------------------------------------------------------- | --------------------------------------------------------------------- |
| mise               | `.mise.toml`                                            | runtime versions                                                      |
| pnpm               | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | dependencies, scripts, lockfile, build policy                         |
| ESLint             | `eslint.config.mjs`                                     | JS, TS, Vue, config, and governance scripts                           |
| Prettier           | `prettier.config.mjs`, `.prettierignore`                | authored formatting; embedded fenced-code formatting remains disabled |
| Stylelint          | `stylelint.config.mjs`                                  | CSS and Vue style blocks                                              |
| Knip               | `knip.json`                                             | unused graph                                                          |
| Project governance | `scripts/governance/*.mjs`                              | product-specific repository policy                                    |

Historical `.ai/reports/**` files are immutable JSON evidence and are outside Prettier and active-authority rewriting. Generated output, dependency stores, caches, local databases, logs, browser state, and read-only evidence-source repositories are excluded from authored validation.

## Package scripts

Current scripts are:

- `dev`, `preview`
- `typecheck`, `typecheck:vue`, `build`
- `lint`, `lint:style`
- `format:check`, `format:write`
- `check:deps`, `check:architecture`, `check:residue`, `check:tokens`, `check:mocks`, `check:secrets`, `check:copy`
- `check:governance`, `check:unused`, `audit:prod`, `check:static`

No `test` script exists or is permitted. `check:governance` invokes each project-owned scanner once. `check:static` is read-only and must not run formatter writes, dependency mutation, automated tests, Vite development/preview servers, or browser automation.

## Scanner contracts

Project-owned scanners are deterministic, read-only Node scripts:

| Domain                      | Owner                                                           | Script               |
| --------------------------- | --------------------------------------------------------------- | -------------------- |
| Dependency policy           | `scripts/governance/check-dependency-policy.mjs`                | `check:deps`         |
| Architecture boundaries     | `scripts/governance/check-architecture-boundaries.mjs`          | `check:architecture` |
| Active-authority residue    | `scripts/governance/check-obsolete-architecture-residue.mjs`    | `check:residue`      |
| Raw visual values           | `scripts/governance/check-raw-visual-values.mjs`                | `check:tokens`       |
| Mock/fake product data      | `scripts/governance/check-forbidden-mock-data.mjs`              | `check:mocks`        |
| Secret patterns             | `scripts/governance/check-secret-patterns.mjs`                  | `check:secrets`      |
| Rendered product copy       | `scripts/governance/check-user-visible-copy.mjs`                | `check:copy`         |
| Shared policy and traversal | `scripts/governance/policy.mjs`, `scripts/governance/utils.mjs` | shared               |

Scanner findings are blocking and contain stable rule ids, paths, line numbers when available, redacted excerpts, reasons, and remediation owners. Secret-like values are never printed in full. Exceptions must be exact-path or exact-directory entries with an authority, rationale, risk, review trigger, and removal condition; broad suppression is forbidden.

The residue scanner protects current authorities while allowing immutable historical reports and explicit prohibition text. It blocks deleted phase documents, stale gates, phase histories, obsolete migration requirements, source-derived testing language, blanket rejection of the approved compatibility signer, raw product-facing board API examples, nonexistent components, wrong persistence/API/auth claims, and current-versus-target confusion.

## No-automated-test policy

Automated unit, component, integration, snapshot, visual-regression, and E2E test files and infrastructure are forbidden. This includes test runners, test environments, fixtures, snapshots, coverage, setup files, scripted browser suites, and `test` package scripts.

This policy does not weaken static governance, TypeScript checking, production build validation, dependency audits, contract evidence, accessibility, or the narrow real-browser validation required for visible UI changes. Controlled scanner probes may exist only in an operating-system temporary directory during validation and must be removed; they are not repository test files.

## Required validation

Run the narrowest applicable check first, then the complete set required by the change:

- every project scanner independently and `pnpm run check:governance`;
- `pnpm run format:check`;
- `pnpm run lint`;
- `pnpm run lint:style`;
- `pnpm run check:unused`;
- `pnpm run check:static`;
- `pnpm run typecheck`;
- `pnpm exec vite build --outDir <temporary-directory-outside-repository> --emptyOutDir` after authoritative Vue SFC type checking;
- `pnpm run audit:prod` and full `pnpm audit`;
- `pnpm list --depth 0` when dependency identity is part of the task;
- `git diff --check` for an authorized Git workflow.

Documentation/scanner-only changes do not require browser validation because runtime UI behavior is unchanged. Visible UI changes require the narrow browser contract defined by `AGENTS.md` and `.ai/skills/project-ui/SKILL.md`.
