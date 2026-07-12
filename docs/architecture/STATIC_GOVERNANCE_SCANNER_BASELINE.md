# Static Governance Scanner Baseline

Status: `ACTIVE_AUTHORITY`
Phase: `F2D_PROJECT_OWNED_STATIC_GOVERNANCE_SCANNER_IMPLEMENTATION`
Target: `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue`

## Ownership

Project-owned scanners live in `scripts/governance/` and run read-only with Node built-in modules only.

| Domain             | Owner                                                         | Package script       |
| ------------------ | ------------------------------------------------------------- | -------------------- |
| Dependency policy  | `scripts/governance/check-dependency-policy.mjs`              | `check:deps`         |
| Architecture       | `scripts/governance/check-architecture-boundaries.mjs`        | `check:architecture` |
| Raw visual values  | `scripts/governance/check-raw-visual-values.mjs`              | `check:tokens`       |
| Mock product data  | `scripts/governance/check-forbidden-mock-data.mjs`            | `check:mocks`        |
| Secret patterns    | `scripts/governance/check-secret-patterns.mjs`                | `check:secrets`      |
| Shared policy      | `scripts/governance/policy.mjs`                               | n/a                  |
| Shared utilities   | `scripts/governance/utils.mjs`                                | n/a                  |
| Aggregate boundary | all scanner entrypoints through `run-s` in `check:governance` | `check:governance`   |

ESLint owns import syntax and language correctness. Stylelint owns generic CSS validity. Knip owns unused graph drift. The project-owned scanners own product-specific repository topology, package-manager policy, token value governance, mock/fake runtime data indicators, and redacted secret-pattern risk.

## Scope

All scanners use deterministic sorted path traversal or tracked Git inventory. They refuse symbolic scanner roots and refuse read-only evidence-source roots.

Permanent exclusions:

- `.git`
- `node_modules`
- `.pnpm-store`
- `dist`
- `.vite`
- `coverage`
- `.serena`
- local logs, local databases, and `.local` files
- read-only evidence-source repositories

The secret scanner additionally excludes `.ai/reports/`, `docs/archive/`, `pnpm-lock.yaml`, binary assets, and approved placeholder-only `.env.example` patterns.

## Future Allowlists

Future ownership allowlists are exact paths or directories only. They authorize future adapter ownership without creating placeholder runtime files:

- Naive UI: `src/ui/`, `src/app/providers/`, `src/providers/`
- Icons: `src/ui/icons/`
- API/repositories: `src/api/`, `src/repositories/`
- Persistence/preferences: `src/persistence/`, `src/bootstrap/preferences/`
- Runtime config: `src/runtime/config/`

## Rule Inventory

Dependency policy:

- `DEP_PACKAGE_MANAGER_PIN`
- `DEP_ENGINE_PIN`
- `DEP_TEST_SCRIPT_FORBIDDEN`
- `DEP_DUPLICATE_DIRECT_DEPENDENCY`
- `DEP_FORBIDDEN_DIRECT_DEPENDENCY`
- `DEP_DIRECT_VERSION_NOT_EXACT_STABLE`
- `DEP_PRERELEASE_DIRECT_DEPENDENCY`
- `DEP_APPROVED_VERSION_DRIFT`
- `DEP_REQUIRED_DIRECT_DEPENDENCY_MISSING`
- `DEP_VERSION_EXCEPTION_INCOMPLETE`
- `DEP_PNPM_LOCKFILE_REQUIRED`
- `DEP_COMPETING_LOCKFILE_FORBIDDEN`

Architecture boundaries:

- `ARCH_REACT_RUNTIME_IMPORT`
- `ARCH_DIRECT_NAIVE_UI_IMPORT`
- `ARCH_DIRECT_ICON_IMPORT`
- `ARCH_RAW_HTTP_CLIENT`
- `ARCH_EVIDENCE_SOURCE_IMPORT`
- `ARCH_RAW_FETCH_OUTSIDE_API`
- `ARCH_RAW_XMLHTTPREQUEST_OUTSIDE_API`
- `ARCH_RAW_BROWSER_STORAGE`
- `ARCH_IMPORT_META_ENV_OUTSIDE_CONFIG`
- `ARCH_GENERIC_CALL_ENDPOINT`
- `ARCH_PROXY_REQUEST_USAGE`
- `ARCH_MQTT_PUBLISH`
- `ARCH_BROWSER_SECRET_OWNERSHIP`
- `ARCH_WRITE_ADMIN_ENDPOINT`
- `ARCH_DUPLICATE_VUE_ROOT`
- `ARCH_DUPLICATE_ROUTER_OWNER`
- `ARCH_DUPLICATE_PINIA_OWNER`
- `ARCH_DUPLICATE_ROUTER_INSTALLATION`
- `ARCH_DUPLICATE_PINIA_INSTALLATION`

Raw visual values:

- `VISUAL_RAW_HEX_COLOR`
- `VISUAL_RAW_RGB_COLOR`
- `VISUAL_RAW_HSL_COLOR`
- `VISUAL_RAW_MODERN_COLOR`
- `VISUAL_RAW_NAMED_COLOR`
- `VISUAL_RAW_SHADOW`
- `VISUAL_RAW_RADIUS`
- `VISUAL_RAW_Z_INDEX`
- `VISUAL_RAW_MOTION_DURATION`
- `VISUAL_RAW_SPACING`

Mock product data:

- `MOCK_API_MODE`
- `MOCK_FAKE_DATA_GENERATOR`
- `MOCK_RUNTIME_FIXTURE_FALLBACK`
- `MOCK_SAMPLE_PRODUCT_RECORD`
- `MOCK_FAKE_TRANSPORT_OR_ANALYSIS`
- `MOCK_PLACEHOLDER_SUCCESS`
- `MOCK_INVENTED_ENDPOINT`
- `MOCK_INVENTED_DTO_FIELD`
- `MOCK_HARDCODED_PRODUCT_RECORD`

Secret patterns:

- `SECRET_PRIVATE_KEY`
- `SECRET_AUTHORIZATION_HEADER`
- `SECRET_PASSWORD_ASSIGNMENT`
- `SECRET_SIGNING_OR_HMAC_SECRET`
- `SECRET_ACCESS_TOKEN`
- `SECRET_COOKIE`
- `SECRET_CLOUD_CREDENTIAL`
- `SECRET_REGISTRY_CREDENTIAL`
- `SECRET_BEARING_URL`
- `SECRET_UNSAFE_VITE_EXPOSURE`
- `SECRET_API_KEY`

Shared invalid JSON findings use `GOVERNANCE_CONFIG_INVALID_JSON`.

## Failure Contract

Every finding is blocking. Exit code is zero only when no blocking findings and no unreadable in-scope files exist. Findings include stable rule id, file, line when available, redacted excerpt, reason, and remediation owner. `--json` emits machine-readable output to stdout and creates no repository artifact.

The scanners never modify package manifests, lockfiles, runtime source, assets, reports, or scanned files. They never run install, update, dedupe, prune, audit fix, formatter write, Vite, browser automation, or automated tests.

## Exceptions And False Positives

Exceptions must be encoded in `scripts/governance/policy.mjs` with exact file or directory scope, authority, rationale, risk, review trigger, and removal condition. Broad rule suppression is forbidden.

Version exceptions currently cover:

- `typescript@6.0.3`
- `pnpm@11.11.0`

False positives are fixed only in the owning scanner, policy, package script, ESLint Node-context configuration, or this authority document.

## Security Responsibilities

The secret scanner prints only redacted fingerprints and redacted excerpts. It must never print complete suspected secrets. `VITE_` public configuration containing secret-like names and usable values is blocking.

## Validation

Required F2D validation commands:

- `pnpm run check:deps`
- `pnpm run check:architecture`
- `pnpm run check:tokens`
- `pnpm run check:mocks`
- `pnpm run check:secrets`
- `pnpm run check:governance`
- `pnpm run format:check`
- `pnpm run lint`
- `pnpm run lint:style`
- `pnpm run check:unused`
- `pnpm run typecheck`
- temporary-outDir production build
- `pnpm run audit:prod`
- full `pnpm audit`
- `mise exec -- pnpm list --depth 0`
- `pnpm run check:static`

Controlled negative and clean scanner probes must be created only in an operating-system temporary directory and removed after validation. They are execution-time scanner validation, not automated tests.

Browser validation is not applicable to F2D because no runtime UI behavior changes.

## F2 Completion Gate

F2D passes only when every scanner passes independently, negative and clean probes prove blocking and allowed behavior with redaction, `check:governance` and `check:static` pass, static tool validation passes, audits pass, no dependency or lockfile change occurs, no automated test infrastructure exists, no runtime source or token value changes, and the implementation and governance evidence commits are pushed normally.

The next phase after a passing F2D is `F2E_TOOLCHAIN_AND_STATIC_GOVERNANCE_FINAL_CLOSURE`.
