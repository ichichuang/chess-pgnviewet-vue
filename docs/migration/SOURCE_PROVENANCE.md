# Source Provenance

Status: `ACTIVE_AUTHORITY`

## Scope-specific precedence

1. `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue` is the reconciled target
   implementation and active documentation authority.
2. `/Users/cc/Work/neobv/Chess/pgnViewer-new` is the read-only authority for
   board, PGN, annotations, AI, teaching workspace, layout, motion, visual
   behavior, and framework-free chess domains.
3. `/Users/cc/Work/neobv/Chess/pgnViewer` and
   `/Users/cc/Work/neobv/Chess/chess-main-overseas` are the co-equal read-only
   authorities for Web API bases, endpoint paths, methods, payloads, response
   consumers, authentication, request behavior, environments, and production
   evidence.

`/Users/cc/Work/neobv/Chess/chess-pgnviewer`, Mini Program documents,
`wx.request`, `openid` login flows, derived API inventories, and their inferred
hosts/session designs are non-authoritative for Web API work.

Conflicts resolve only through compatible evidence from the allowed source
scope or direct no-credential verification. Unknown or conflicting fields stay
blocked. Security rules cannot be overridden by a legacy implementation.

## Web API reconciliation

The active Web API authority is:

- `docs/architecture/WEB_API_SOURCE_AUTHORITY.md`
- `docs/architecture/WEB_API_ENDPOINT_INVENTORY.json`
- `docs/architecture/WEB_API_CONTRACT_COVERAGE_MATRIX.json`
- `docs/architecture/WEB_REQUEST_ARCHITECTURE_BASELINE.md`
- `docs/migration/WEB_API_MIGRATION_BASELINE.json`
- `docs/architecture/WEB_API_READINESS_MATRIX.json`

Earlier P1G/P1G1/P1H API artifacts and reports remain historical evidence. They
do not authorize `/api/ksl`, a BFF, an opaque cookie session, browser Bearer
injection, URL-token absorption, or use of `chess-pgnviewer` as an API source.

## Migration safety

- Source roots are read-only and are never imported by runtime code.
- No environment file, credential, certificate, key, database, browser state,
  log, dependency store, build output, cache, or generated Serena cache is a
  migration source.
- No source credential-like value is copied into documentation, reports, code,
  command output summaries, or browser configuration.
- Endpoint adoption is field-level and repository-owned; runtime files are not
  bulk-copied.
- No mock, fixture, sample, demo, synthetic success, or fake live/replay data is
  used to close a contract gap.

## Package and runtime authority

pnpm remains the sole package manager. The target retains one Vue root, Router,
Pinia, QueryClient, token registry, application shell, Axios owner, and Vite
root. The accepted board/PGN/annotation/AI/UI runtime is not replaced by this
API correction.

The no-automated-test owner policy remains active. Validation uses governance,
formatting, lint, Knip, secret/mock scans, JSON parsing, typecheck, production
build, dependency audits, and narrow real-browser runtime evidence.

## Inventories

- Documents: `docs/migration/DOCUMENT_INVENTORY.json`
- Assets: `docs/migration/ASSET_INVENTORY.json`
- Canonical runtime closure: `docs/migration/CANONICAL_RUNTIME_CLOSURE.json`
- Capabilities: `docs/migration/CAPABILITY_MATRIX.json`
- Web API migration: `docs/migration/WEB_API_MIGRATION_BASELINE.json`
- Web API authority compatibility entrypoint:
  `docs/migration/API_AUTHORITY_MAP.json`
