# Static Governance Scanner Baseline

Status: `ACTIVE_AUTHORITY`
Target: `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue`

## Ownership

Project-owned scanners live in `scripts/governance/` and run read-only with Node built-in modules only.

| Domain             | Owner                                                         | Package script       |
| ------------------ | ------------------------------------------------------------- | -------------------- |
| Dependency policy  | `scripts/governance/check-dependency-policy.mjs`              | `check:deps`         |
| Obsolete authority | `scripts/governance/check-obsolete-architecture-residue.mjs`  | `check:residue`      |
| Architecture       | `scripts/governance/check-architecture-boundaries.mjs`        | `check:architecture` |
| Raw visual values  | `scripts/governance/check-raw-visual-values.mjs`              | `check:tokens`       |
| Mock product data  | `scripts/governance/check-forbidden-mock-data.mjs`            | `check:mocks`        |
| Secret patterns    | `scripts/governance/check-secret-patterns.mjs`                | `check:secrets`      |
| Product copy       | `scripts/governance/check-user-visible-copy.mjs`              | `check:copy`         |
| Shared policy      | `scripts/governance/policy.mjs`                               | n/a                  |
| Shared utilities   | `scripts/governance/utils.mjs`                                | n/a                  |
| Aggregate boundary | all scanner entrypoints through `run-s` in `check:governance` | `check:governance`   |

ESLint owns import syntax and language correctness. Stylelint owns generic CSS validity. Knip owns unused graph drift. The project-owned scanners own product-specific repository topology, package-manager policy, token value governance, mock/fake runtime data indicators, redacted secret-pattern risk, and rendered-copy boundaries.

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

## Ownership Allowlists

Active ownership allowlists are exact paths or directories only:

- Naive UI: `src/ui/`, `src/app/providers/`
- API: `src/api/`
- Persistence/preferences: `src/persistence/`, `src/bootstrap/preferences/`
- Runtime config: `src/runtime/config/`

Reserved paths `src/providers/`, `src/ui/icons/`, and `src/repositories/` do not claim implemented directories and require an approved slice before use.

## Rule Inventory

Current inventory: 104 blocking rules. The current totals are dependency policy
12, obsolete authority residue 27, architecture boundaries 33, raw visual
values 10, mock product data 9, secret patterns 11, rendered product copy 1,
and shared invalid JSON handling 1.

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
- `ARCH_AUTH_STORAGE_KEY_OWNER`
- `ARCH_AUTH_LOCAL_STORAGE_OWNER`
- `ARCH_PASSWORD_PERSISTENCE`
- `ARCH_AUTH_DEXIE_PERSISTENCE`
- `ARCH_AUTH_QUERY_PERSISTENCE`
- `ARCH_PROTECTED_AUTH_OWNER`
- `ARCH_COMPATIBILITY_CONSTANT_OWNER`
- `ARCH_IMPORT_META_ENV_OUTSIDE_CONFIG`
- `ARCH_GENERIC_CALL_ENDPOINT`
- `ARCH_PROXY_REQUEST_USAGE`
- `ARCH_INTERNAL_API_PROXY`
- `ARCH_NODE_SERVER_RUNTIME`
- `ARCH_COOKIE_SESSION_AUTH`
- `ARCH_URL_TOKEN_AUTH`
- `ARCH_DEVICE_GUEST_IDENTITY`
- `ARCH_MINI_PROGRAM_TRANSPORT`
- `ARCH_SECRET_HEADER`
- `ARCH_MQTT_PUBLISH`
- `ARCH_BROWSER_SECRET_OWNERSHIP`
- `ARCH_WRITE_ADMIN_ENDPOINT`
- `ARCH_DUPLICATE_VUE_ROOT`
- `ARCH_DUPLICATE_ROUTER_OWNER`
- `ARCH_DUPLICATE_PINIA_OWNER`
- `ARCH_DUPLICATE_ROUTER_INSTALLATION`
- `ARCH_DUPLICATE_PINIA_INSTALLATION`

Obsolete authority residue:

- `RESIDUE_ACTIVE_UI_PHASE_GATE`
- `RESIDUE_CURRENT_API_AUTHORITY_PATH`
- `RESIDUE_DEXIE_PREPAINT_OWNER`
- `RESIDUE_QUERY_CACHE_PERSISTENCE_CLAIM`
- `RESIDUE_UNCONFIRMED_ADAPTER_DETAIL`
- `RESIDUE_BIG_SCREEN_FULL_TEACHING_SHELL`
- `RESIDUE_UNAPPROVED_RETENTION`
- `RESIDUE_NONEXISTENT_COMPONENT_MODEL`
- `RESIDUE_UNIMPLEMENTED_PERSISTENCE_MODEL`
- `RESIDUE_ONGOING_LIVE_AI_EVALUATION`
- `RESIDUE_REJECTED_API_PHASE`
- `RESIDUE_DELETED_AUTHORITY_ARTIFACT`
- `RESIDUE_REJECTED_HARDENING_PHASE`
- `RESIDUE_DELETED_SESSION_ADAPTER`
- `RESIDUE_AUTH_OWNER_VALIDATION_REQUIRED_MARKER`
- `RESIDUE_AUTH_LOGIN_SUCCESS_UNCLAIMED`
- `RESIDUE_AUTOMATED_TEST_REQUIREMENT`
- `RESIDUE_TEST_COMMAND_REQUIREMENT`
- `RESIDUE_MANDATORY_I18NEXT`
- `RESIDUE_STALE_PRODUCT_UI_GATE`
- `RESIDUE_IMPLEMENTED_OWNER_MARKED_FUTURE`
- `RESIDUE_STALE_PHASE_SUCCESSOR`
- `RESIDUE_STALE_IMPLEMENTED_STATUS`
- `RESIDUE_INTERNAL_PROXY`
- `RESIDUE_GENERIC_CALL`
- `RESIDUE_SECRET_AUTH_ARCHITECTURE`
- `RESIDUE_MINI_PROGRAM_AUTHORITY`

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

Rendered product copy:

- `COPY_INTERNAL_PRODUCT_WORDING`

The copy scanner reads Vue `<template>` blocks only. Development, audit,
contract, mock, fixture, test, debug, blocked, unconfirmed, CORS, endpoint,
token, DTO, Axios, stack, and source-authority wording is blocking unless
`scripts/governance/policy.mjs` contains an exact path, term, and phrase
approval as normal product copy.

## Failure Contract

Every finding is blocking. Exit code is zero only when no blocking findings and no unreadable in-scope files exist. Findings include stable rule id, file, line when available, redacted excerpt, reason, and remediation owner. `--json` emits machine-readable output to stdout and creates no repository artifact.

The scanners never modify package manifests, lockfiles, runtime source, assets, reports, or scanned files. They never run install, update, dedupe, prune, audit fix, formatter write, Vite, browser automation, or automated tests.

## Exceptions And False Positives

Exceptions must be encoded in `scripts/governance/policy.mjs` with exact file or directory scope, authority, rationale, risk, review trigger, and removal condition. Broad rule suppression is forbidden.

The immutable historical implementation report
`.ai/reports/WEB_LOGIN_TOKEN_AUTH_FLOW_IMPLEMENTATION_REPORT.json` is the sole
exact-path exception for pre-owner-validation status markers. Current
authorities and new reports receive no such exception.

Version exceptions currently cover:

- `typescript@6.0.3`
- `pnpm@11.11.0`

False positives are fixed only in the owning scanner, policy, package script, ESLint Node-context configuration, or this authority document.

## Security Responsibilities

The secret scanner prints only redacted fingerprints and redacted excerpts. It must never print complete suspected secrets. `VITE_` public configuration containing secret-like names and usable values is blocking.

## Validation

Required validation commands:

- `pnpm run check:deps`
- `pnpm run check:residue`
- `pnpm run check:architecture`
- `pnpm run check:tokens`
- `pnpm run check:mocks`
- `pnpm run check:secrets`
- `pnpm run check:copy`
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

Browser validation is not applicable to documentation/scanner-only changes because runtime UI behavior is unchanged.

Maintenance ownership remains active in `scripts/governance/policy.mjs`, `scripts/governance/utils.mjs`, and the seven scanner entrypoints. Subsequent false-positive changes must be made only through the owning scanner, policy, package script, ESLint Node-context configuration, or this authority document.

## Current maintenance gate

Every scanner must pass independently; controlled negative and clean probes must prove blocking and allowed behavior with redaction when scanner rules change. `check:governance`, `check:static`, typecheck, temporary-output production build, and audits remain required. Runtime, dependency, lockfile, token-value, and automated-test drift is forbidden unless separately authorized.
