# Source Provenance

Status: `ACTIVE_AUTHORITY`

## Precedence

1. `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue` owns the reconciled
   implementation and active documentation.
2. `/Users/cc/Work/neobv/Chess/pgnViewer-new` is the read-only authority for
   board, PGN, annotation, AI, workspace, layout, motion, UI behavior, and
   framework-free chess domains.
3. `/Users/cc/Work/neobv/Chess/pgnViewer` and
   `/Users/cc/Work/neobv/Chess/chess-main-overseas` are the co-equal
   read-only authorities for Web API bases, endpoints, payloads, response
   consumers, authentication, request behavior, and production evidence.

Source conflicts remain blocked until compatible evidence resolves them.
Security invariants cannot be overridden by a legacy implementation.

## Web API authority set

Only the following target files own active API decisions:

- `docs/architecture/WEB_API_SOURCE_AUTHORITY.md`
- `docs/architecture/WEB_REQUEST_ARCHITECTURE_BASELINE.md`
- `docs/architecture/API_BOUNDARY_ADR.md`
- `docs/architecture/PRODUCTION_DEPLOYMENT_BOUNDARY.md`
- `docs/architecture/WEB_API_ENDPOINT_INVENTORY.json`
- `docs/architecture/WEB_API_CONTRACT_COVERAGE_MATRIX.json`
- `docs/architecture/WEB_API_READINESS_MATRIX.json`
- this document;
- `docs/product/PRODUCT_DEFINITION.md` for product scope only.

No migration ledger, phase report, archive, source-project document, or
generated inventory is API authority.

## Safety

- Source roots are never imported or modified.
- Environment files, credentials, certificates, keys, databases, browser
  state, logs, dependency stores, build output, caches, and generated Serena
  caches are excluded.
- Credential-like values are never copied into the target or command output.
- Endpoint adoption is field-level and repository-owned.
- No mock, fixture, sample, demo, or synthetic success data closes a contract
  gap.

## Runtime invariants

The target retains one Vue root, Router, Pinia, QueryClient, token registry,
application shell, Axios owner, and Vite root. pnpm remains the sole package
manager. Automated-test infrastructure remains prohibited; validation uses
static governance, typecheck, production build, and narrow real-browser
evidence.

Product and page decisions are governed by
`docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md` under
`PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS`. Source evidence
does not impose an implementation phase, closure node, or mechanical migration
sequence.
