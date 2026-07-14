# Claude project context

## Current authority

开赛了 is one Vue 3 + strict TypeScript chess workspace for local PGN teaching, tournament commentary, completed-game replay/import, read-only live viewing, explicit local AI analysis, and a readability-first venue display.

The product-design baseline is `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`; the completed page-design documentation package is now active authority. The active implementation gate is `PRODUCT_PAGE_DESIGN_DOCUMENTATION_READY_FOR_IMPLEMENTATION`; `OD-01` through `OD-11` remain open. The governing product authority is `docs/product/PRODUCT_DESIGN_BLUEPRINT.zh-CN.md`, with owner origin in `docs/product/OWNER_PRODUCT_REQUIREMENT_BASELINE.zh-CN.md`.

Before UI or feature work, read `AGENTS.md`, `.ai/skills/project-ui/SKILL.md`, the product blueprint, the owner baseline, `docs/design/PRODUCT_UI_DESIGN_INDEX.zh-CN.md`, `docs/design/PRODUCT_UI_IMPLEMENTATION_HANDOFF.zh-CN.md`, the relevant target page specification under `docs/design/pages/**`, the global design documents it links, and `docs/design/PRODUCT_IMPLEMENTATION_CORRECTION_BACKLOG.zh-CN.md`. Then consult the relevant current product, UI, architecture, and source-provenance authorities. Historical `.ai/reports/**` files are evidence only.

## Product surfaces

- `/` — unified board-centric workspace
- `/competitions` — anonymous public tournament list
- `/competitions/:hdid` — anonymous public tournament detail and handoff actions
- `/competitions/:hdid/display` — independent read-only venue display
- `/login` — approved account session and safe return

Compatibility routes resolve a sanitized typed handoff or a truthful unavailable state. They never render a second board, PGN, annotation, analysis, or workspace shell.

## Runtime and ownership

pnpm, Vue 3, strict TypeScript, Vite, Vue Router, Pinia, TanStack Vue Query, one Axios owner, project-owned Vue UI adapters, limited Naive UI providers/adapters, GSAP/Vue transitions, chess.js plus framework-free chess domains, Dexie, and Zod define the current stack.

- One Vite/Vue/Router/Pinia/Query/token/application-shell topology.
- One unified workspace and one board/PGN/annotation/analysis runtime.
- Pinia owns client state; Query owns in-memory server-read state.
- Repositories/source adapters own transport, Zod validation, DTO mapping, permissions, and error translation.
- Presentational components are store-free, repository-free, and persistence-free.
- `src/styles/tokens.css` is the only global visual-value authority.
- `pgnViewer-new` is read-only behavior evidence, not a migration phase, closure gate, or code-copy authority.

## Product truth and blocked capabilities

Only real confirmed contracts are available. Ongoing live content is read-only and AI/evaluation-free. Cloud, share, protected replay, hardware snapshot/history, live credential/subscription, and authoritative clock adapters remain abstract until real contracts exist. No mocks, fixtures, fake/sample data, synthesized records, or fallback success states.

Loading, empty, permission, authentication, unavailable, stale, retry, and contract-error states remain inside the owning page/module and preserve outer geometry.

## Authentication and security

`src/api/legacyWebCompatibility.ts` alone owns the approved tracked browser compatibility signer and fixed compatibility identity. The only approved persisted account record is the strict 43,200-second `kaisaile.auth.v1` record owned by `src/persistence/auth/authPersistence.ts`.

Passwords/digests, signing secrets, duplicate auth records, URL/router/Dexie/Query/workspace/PGN/annotation/AI auth values, shared credentials, MQTT credentials, secret URLs, generic `/CALL`, `proxyRequest`, write/admin endpoints, MQTT publish, and invented contracts are forbidden.

## Page implementation workflow

Page UI implementation must begin from `docs/design/PRODUCT_UI_DESIGN_INDEX.zh-CN.md` and `docs/design/PRODUCT_UI_IMPLEMENTATION_HANDOFF.zh-CN.md`, then consume the target page specification, its linked global design authorities, and the relevant `COR-*` correction backlog entries. For each slice:

1. identify the page family and design-surface IDs;
2. read the target page spec and linked global documents;
3. list affected `COR-*` items and required shared prerequisites;
4. classify every capability as `CURRENT_IMPLEMENTED`, `APPROVED_TARGET`, `CONTRACT_BLOCKED`, `OPEN_OWNER_DECISION`, or `PROHIBITED`;
5. keep `OD-01` through `OD-11` open and use only provisional values approved by the owning decision;
6. implement the slice and its prerequisites only;
7. run governance, format, lint, Stylelint, Knip, static checks, typecheck, production build, and the page-specific narrow browser acceptance path;
8. close a `COR-*` item only with the evidence and verification path required by the handoff and correction backlog.

## Page-design and validation rules

Each page design must identify its responsibility, user task, current versus target capability, information hierarchy, owned components, real data states, responsive and scroll behavior, accessibility, focus, reduced motion, token use, persistence, security, and browser acceptance.

No automated test files, runners, fixtures, snapshots, coverage, scripted E2E suites, or `test` package script may exist. Required validation uses repository governance, formatting, lint, Stylelint, Knip, static checks, TypeScript checking, production build, audits, and narrow real-browser inspection for visible changes. Do not run `pnpm test`.

pnpm is the sole package manager. `package-lock.json`, npm dependency management, Yarn, and Bun are forbidden. Source repositories listed in `AGENTS.md` remain read-only.
