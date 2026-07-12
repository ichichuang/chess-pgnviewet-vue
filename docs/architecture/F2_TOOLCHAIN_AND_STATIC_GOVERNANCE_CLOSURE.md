# F2 Toolchain And Static Governance Closure

Status: `F2_TOOLCHAIN_AND_STATIC_GOVERNANCE_COMPLETE`
Phase: `F2E_TOOLCHAIN_AND_STATIC_GOVERNANCE_FINAL_CLOSURE`
Target: `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue`
Closure date: `2026-07-12`

## Final F2 Status

F2 is complete for toolchain and static governance only. This closure does not complete the overall foundation, does not authorize F3 implementation, and does not open product UI migration.

Next required phase: `F3A_CANONICAL_TOKEN_THEME_INVENTORY_AND_TARGET_DESIGN`.

Remaining foundation gaps include token/theme design, provider and UI adapter design, i18n, Dexie persistence, TanStack Vue Query setup, typed repositories, API/environment/security runtime boundaries, accessibility and responsive implementation, motion policy implementation, and product UI migration gates.

## Accepted Phase Sequence

| Phase                                                        | Accepted verdict                                                   | Report                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `F2A_TOOLCHAIN_TARGET_DESIGN_AND_DEPENDENCY_GRAPH`           | `F2A_TOOLCHAIN_DESIGN_PASS_READY_FOR_IMPLEMENTATION`               | `.ai/reports/F2A_TOOLCHAIN_TARGET_DESIGN_AND_DEPENDENCY_GRAPH_REPORT.json`           |
| `F2B_TOOLCHAIN_DEPENDENCY_AND_CONFIGURATION_IMPLEMENTATION`  | `F2B_TOOLCHAIN_CONFIG_PASS_READY_FOR_FORMATTING_DEBT_REMEDIATION`  | `.ai/reports/F2B_TOOLCHAIN_DEPENDENCY_AND_CONFIGURATION_IMPLEMENTATION_REPORT.json`  |
| `F2C_FORMATTING_DEBT_REMEDIATION`                            | `F2C_FORMATTING_DEBT_PASS_READY_FOR_STATIC_SCANNER_IMPLEMENTATION` | `.ai/reports/F2C_FORMATTING_DEBT_REMEDIATION_REPORT.json`                            |
| `F2D_PROJECT_OWNED_STATIC_GOVERNANCE_SCANNER_IMPLEMENTATION` | `F2D_STATIC_GOVERNANCE_PASS_READY_FOR_F2_CLOSURE`                  | `.ai/reports/F2D_PROJECT_OWNED_STATIC_GOVERNANCE_SCANNER_IMPLEMENTATION_REPORT.json` |
| `F2E_TOOLCHAIN_AND_STATIC_GOVERNANCE_FINAL_CLOSURE`          | `F2E_TOOLCHAIN_STATIC_GOVERNANCE_COMPLETE_READY_FOR_F3`            | `.ai/reports/F2E_TOOLCHAIN_AND_STATIC_GOVERNANCE_FINAL_CLOSURE_REPORT.json`          |

## Superseded Phase Names

The older implementation-slice sequence listed separate `F2E_STATIC_CHECK_INTEGRATION_AND_FAILURE_REMEDIATION` and `F2F_TOOLCHAIN_STATIC_GOVERNANCE_CLOSURE` phases. That sequence is superseded by the accepted F2D implementation and this F2E closure.

Rationale: F2D already implemented scanner integration, package-script integration, scanner failure remediation, controlled probes, and complete static validation. F2E is therefore the single final F2 closure phase. No F2F phase remains required unless a future correction phase is explicitly opened for a discovered blocker.

Replacement sequence:

1. `F2A_TOOLCHAIN_TARGET_DESIGN_AND_DEPENDENCY_GRAPH`
2. `F2B_TOOLCHAIN_DEPENDENCY_AND_CONFIGURATION_IMPLEMENTATION`
3. `F2C_FORMATTING_DEBT_REMEDIATION`
4. `F2D_PROJECT_OWNED_STATIC_GOVERNANCE_SCANNER_IMPLEMENTATION`
5. `F2E_TOOLCHAIN_AND_STATIC_GOVERNANCE_FINAL_CLOSURE`

## Dependency Graph And Exceptions

The active dependency graph is the exact `package.json` graph validated by `scripts/governance/policy.mjs` and `check-dependency-policy.mjs`.

Runtime dependencies:

- `@tanstack/vue-query@5.101.2`
- `chess.js@1.4.0`
- `dexie@4.4.4`
- `gsap@3.15.0`
- `naive-ui@2.44.1`
- `pinia@3.0.4`
- `vue@3.5.39`
- `vue-router@5.1.0`
- `zod@4.4.3`

Direct development dependencies:

- `@eslint/js@10.0.1`
- `@types/node@26.1.1`
- `@vitejs/plugin-vue@6.0.7`
- `@vue/tsconfig@0.9.1`
- `eslint@10.7.0`
- `eslint-config-prettier@10.1.8`
- `eslint-plugin-vue@10.9.2`
- `knip@6.26.0`
- `npm-run-all2@9.0.2`
- `postcss-html@1.8.1`
- `prettier@3.9.5`
- `stylelint@17.14.0`
- `stylelint-config-standard@40.0.0`
- `typescript@6.0.3`
- `typescript-eslint@8.63.0`
- `vite@8.1.4`
- `vue-eslint-parser@10.4.1`
- `vue-tsc@3.3.7`

Implemented version exceptions are owned by `scripts/governance/policy.mjs` and validated by `check-dependency-policy.mjs`:

| Package      | Selected version | Authority                                                       | Review trigger                                                              | Removal condition                                                                                |
| ------------ | ---------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `typescript` | `6.0.3`          | `docs/architecture/TOOLCHAIN_AND_STATIC_GOVERNANCE_BASELINE.md` | `typescript-eslint`, Vue Language Tools, and `vue-tsc` support TypeScript 7 | Full typecheck, production build, static governance, browser validation, and owner approval pass |
| `pnpm`       | `11.11.0`        | `docs/architecture/TOOLCHAIN_AND_STATIC_GOVERNANCE_BASELINE.md` | Owner approves a package-manager baseline update                            | Lockfile integrity and full static validation pass after the approved update                     |

The older proposed `docs/architecture/DEPENDENCY_VERSION_EXCEPTIONS.json` path is superseded and not required.

## Tool And Configuration Ownership

| Owner            | Active files                                            | Boundary                                                        |
| ---------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| pnpm             | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Sole package manager; no npm, Yarn, or Bun lockfiles            |
| mise             | `.mise.toml`                                            | Node `26.5.0`, pnpm `11.11.0`                                   |
| ESLint           | `eslint.config.mjs`                                     | JS, TS, Vue, and governance-script linting; no Prettier overlap |
| Prettier         | `prettier.config.mjs`, `.prettierignore`                | Authored formatting checks; `format:write` is explicit only     |
| Stylelint        | `stylelint.config.mjs`                                  | CSS and Vue style-block validity                                |
| Knip             | `knip.json`                                             | Unused dependencies, exports, and files                         |
| Project scanners | `scripts/governance/*.mjs`                              | Product-specific static governance                              |

`pnpm-lock.yaml` is owned only by pnpm and remains outside Prettier ownership. Historical `.ai/reports/` files are immutable machine evidence and remain outside Prettier ownership.

## Package Scripts

The implemented script inventory is:

- `check:deps`
- `check:architecture`
- `check:tokens`
- `check:mocks`
- `check:secrets`
- `check:governance`
- `lint`
- `lint:style`
- `format:check`
- `format:write`
- `check:unused`
- `audit:prod`
- `check:static`
- `typecheck`
- `build`

No `test` script exists. `check:governance` invokes each project-owned scanner exactly once. `check:static` remains read-only and does not invoke `format:write`, dependency mutation, automated tests, Vite development mode, preview mode, browser automation, or missing future commands. The normal `build` script writes `dist`; F2E production build validation used a temporary output directory outside the repository.

## Scanner Inventory

| Domain                  | Path                                                   | Script               | Blocking rules |
| ----------------------- | ------------------------------------------------------ | -------------------- | -------------: |
| Dependency policy       | `scripts/governance/check-dependency-policy.mjs`       | `check:deps`         |             12 |
| Architecture boundaries | `scripts/governance/check-architecture-boundaries.mjs` | `check:architecture` |             19 |
| Raw visual values       | `scripts/governance/check-raw-visual-values.mjs`       | `check:tokens`       |             10 |
| Mock product data       | `scripts/governance/check-forbidden-mock-data.mjs`     | `check:mocks`        |              9 |
| Secret patterns         | `scripts/governance/check-secret-patterns.mjs`         | `check:secrets`      |             11 |
| Shared invalid JSON     | `scripts/governance/utils.mjs`                         | shared               |              1 |

Total blocking rule inventory: 62.

Rule identifiers were derived from scanner source and reconciled with `docs/architecture/STATIC_GOVERNANCE_SCANNER_BASELINE.md`. No missing, duplicated, undocumented, renamed, or unreachable required rule was found.

## Scope, Exclusions, And Allowlists

Permanent scanner exclusions are `.git`, `node_modules`, `.pnpm-store`, `dist`, `.vite`, `coverage`, `.serena`, local logs, local databases, generated output, dependency stores, browser state, and read-only evidence-source repositories. The secret scanner additionally excludes `.ai/reports/`, `docs/archive/`, `pnpm-lock.yaml`, binary assets, and approved placeholder-only `.env.example` patterns.

Future exact-path ownership allowlists remain:

- Naive UI: `src/ui/`, `src/app/providers/`, `src/providers/`
- Icons: `src/ui/icons/`
- API/repositories: `src/api/`, `src/repositories/`
- Persistence/preferences: `src/persistence/`, `src/bootstrap/preferences/`
- Runtime config: `src/runtime/config/`

Secret findings must contain only path, line, stable rule id, category when applicable, redacted excerpt, and redacted fingerprint. Complete secret-like values must not be printed.

## Validation Evidence

| Surface                    | Command or method                                                                          | Result                                            |
| -------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Dependency scanner         | `mise exec -- pnpm run check:deps`                                                         | PASS                                              |
| Architecture scanner       | `mise exec -- pnpm run check:architecture`                                                 | PASS                                              |
| Raw visual scanner         | `mise exec -- pnpm run check:tokens`                                                       | PASS                                              |
| Mock-data scanner          | `mise exec -- pnpm run check:mocks`                                                        | PASS                                              |
| Secret scanner             | `mise exec -- pnpm run check:secrets`                                                      | PASS                                              |
| JSON scanner mode          | all five scanner entrypoints with `--json`                                                 | PASS, schema-valid, zero findings, zero skipped   |
| Controlled negative probes | temporary roots under `/tmp`                                                               | PASS, nonzero exits with expected stable rule ids |
| Controlled clean probes    | temporary roots under `/tmp`                                                               | PASS, zero findings                               |
| Redaction                  | synthetic secret probe                                                                     | PASS, complete synthetic value absent             |
| Governance aggregate       | `mise exec -- pnpm run check:governance`                                                   | PASS                                              |
| Prettier                   | `mise exec -- pnpm run format:check`                                                       | PASS                                              |
| ESLint                     | `mise exec -- pnpm run lint`                                                               | PASS                                              |
| Stylelint                  | `mise exec -- pnpm run lint:style`                                                         | PASS                                              |
| Knip                       | `mise exec -- pnpm run check:unused`                                                       | PASS                                              |
| Typecheck                  | `mise exec -- pnpm run typecheck`                                                          | PASS                                              |
| Production build           | `mise exec -- pnpm exec vite build --outDir <tmp>/dist --emptyOutDir`                      | PASS                                              |
| Production audit           | `mise exec -- pnpm run audit:prod`                                                         | PASS, no known vulnerabilities                    |
| Full audit                 | `mise exec -- pnpm audit`                                                                  | PASS, no known vulnerabilities                    |
| Installed dependency list  | `mise exec -- pnpm list --depth 0`                                                         | PASS                                              |
| Static aggregate           | `mise exec -- pnpm run check:static`                                                       | PASS                                              |
| Frozen lockfile            | `mise exec -- pnpm --dir <tmp> install --frozen-lockfile --lockfile-only --ignore-scripts` | PASS, copied lockfile byte-identical              |

Browser validation is not applicable because F2E changes only governance documents and reports and does not modify visible runtime behavior.

## Prohibitions Confirmed

- No dependency mutation.
- No lockfile change.
- No scanner implementation change.
- No runtime source change.
- No token-value change.
- No automated test infrastructure.
- No `test` script.
- No mock product runtime data.
- No React runtime.
- No duplicate Vue root, Router owner, or Pinia owner.
- No generated output tracked.
- No product UI work started.
- No force push.
- No evidence-source modification.

## Git And Remote State

F2E started from branch `main` with local `HEAD`, `origin/main`, and live remote `refs/heads/main` equal to `5cd34b298f7d1bbf9cb8cd6e56a510cfe229f733`.

Remote URL: `https://github.com/ichichuang/chess-pgnviewet-vue.git`.
Repository full name: `ichichuang/chess-pgnviewet-vue`.

The F2E report records a pending self-reference for the final closure commit SHA; the final execution response records the pushed closure commit and final remote SHA.
