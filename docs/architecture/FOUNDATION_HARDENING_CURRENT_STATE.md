# Foundation Hardening Current State

Status: `HISTORICAL_SUPERSEDED_FOR_WEB_API_AUTHORITY`

Superseded by `docs/architecture/WEB_API_SOURCE_AUTHORITY.md` for Web API,
authentication, request, environment, and production decisions. The recovered
H0 observations remain preserved; its proposed BFF/cookie-session or
`/api/ksl` direction is not active authority.

Phase: `H0_FOUNDATION_HARDENING_CURRENT_STATE_CANONICALIZATION`

Audited commit: `d4a09957457ece39e57d6bed3a802a378480aa16`

Product status: `PRODUCT_COMPLETE_USABLE`

Foundation status: `PARTIAL`

Next required phase: `H1_AUTHENTICATION_AND_PRODUCTION_BOUNDARY_HARDENING`

## Audit scope

This is the canonical read-only current-state baseline for
`/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue`. It reconciles live source,
configuration, governance, Git, GitHub metadata, current architecture documents,
and active reports at the audited commit. Historical phase reports remain evidence
of what was true when written; they do not override live source.

H0 changes documentation only. It does not implement, refactor, repair, remove, or
redesign runtime behavior. Broad new product development remains `BLOCKED` until
the H1-H10 foundation sequence is resolved. The current Vue root, Router, Pinia
graph, QueryClient, Axios owner, board, PGN runtime, annotation runtime, AI Workers,
token registry, theme engine, persistence boundaries, and workspace must not be
rebuilt.

Real production APIs are mandatory. Product mock, fixture, fake, sample, demo,
fallback, or synthetic tournament, game, replay, live, and AI data remain
forbidden.

## Provenance recovery result

The three H0 outputs pre-existed as untracked files. Before reading or changing
them, H0 captured metadata, copied each file byte-for-byte to
`/tmp/chess-pgnviewer-vue-h0-preexisting-recovery/20260713T142901Z`, and verified
matching SHA-256 hashes. Their phase, repository, branch, remote spelling, and
audited SHAs all matched this H0 and no active writer or file mutation was found.
They were therefore classified `SAME_H0_PARTIAL_RECOVERABLE` and taken over as
abandoned drafts. They were partial because the recovery provenance fields and
the contradictions discovered during the recovery audit were not yet recorded.

| Existing output                                                                  |   Bytes | Mode / inode         | Original UTC mtime and ctime | Original and backup SHA-256                                        |
| -------------------------------------------------------------------------------- | ------: | -------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `docs/architecture/FOUNDATION_HARDENING_CURRENT_STATE.md`                        |  45,152 | `0644` / `315972685` | `2026-07-13T12:48:20Z`       | `c53bd3ea61a4b7eab171d85f872a2f89f7d64b858b8a4b17fc8e48c42018c1fa` |
| `docs/architecture/FOUNDATION_HARDENING_REMAINING_MATRIX.json`                   | 109,540 | `0644` / `315975068` | `2026-07-13T12:49:10Z`       | `d4a143e554295299c2048b181c296658d7ec07d051a69c0fcd2b98b2a4d9d60a` |
| `.ai/reports/H0_FOUNDATION_HARDENING_CURRENT_STATE_CANONICALIZATION_REPORT.json` |  17,782 | `0644` / `315975405` | `2026-07-13T12:51:19Z`       | `a23bf39865afd7b235fb6c7b74bb0c3bc9ffb7b6b7f4df505e395a65a0b4fe38` |

The Markdown source was `Unicode text, UTF-8 text, with very long lines`; both
JSON sources were `JSON data`. Backup copies preserve the same repository-relative
paths, sizes, modes, modification times, and hashes. Backup verification passed
before the first repository write.

## Safety baseline

| Check                               | Evidence                                                                                                         | Result                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Target directory                    | `pwd -P` returned `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue`                                               | `IMPLEMENTED_VALIDATED` |
| Branch                              | `main`                                                                                                           | `IMPLEMENTED_VALIDATED` |
| Origin                              | `https://github.com/ichichuang/chess-pgnviewet-vue.git`                                                          | `IMPLEMENTED_VALIDATED` |
| Fetch                               | `git fetch --prune origin`, exit 0                                                                               | `IMPLEMENTED_VALIDATED` |
| Commit equality                     | local `HEAD`, `origin/main`, and live `git ls-remote` all resolved to `d4a09957457ece39e57d6bed3a802a378480aa16` | `IMPLEMENTED_VALIDATED` |
| Ahead / behind                      | `0 / 0`                                                                                                          | `IMPLEMENTED_VALIDATED` |
| Worktree and index before H0 writes | no staged or tracked changes; exactly the three authorized pre-existing untracked H0 paths                       | `IMPLEMENTED_VALIDATED` |
| Git locks                           | none                                                                                                             | `IMPLEMENTED_VALIDATED` |
| Repository writers                  | no writable repository file descriptors; editor/tool processes held read-only cwd handles only                   | `IMPLEMENTED_VALIDATED` |
| Evidence repositories               | not accessed by this recovery run; no command targeted them                                                      | `IMPLEMENTED_VALIDATED` |

## GitHub and Git state

| Fact                   | Current value                                                    |
| ---------------------- | ---------------------------------------------------------------- |
| Repository path        | `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue`                 |
| GitHub repository      | `ichichuang/chess-pgnviewet-vue`                                 |
| Visibility             | public                                                           |
| Default/current branch | `main` / `main`                                                  |
| Local HEAD             | `d4a09957457ece39e57d6bed3a802a378480aa16`                       |
| Parent commit          | `99c4f3383f7ec469eaee9aed813620dc2758acf4`                       |
| `origin/main`          | `d4a09957457ece39e57d6bed3a802a378480aa16`                       |
| Live remote main       | `d4a09957457ece39e57d6bed3a802a378480aa16`                       |
| Latest subject         | `docs(governance): 记录 P1H 完整产品验收证据`                    |
| Open pull requests     | 0                                                                |
| Open issues            | 0                                                                |
| Branch protection      | GitHub API returned `404 Branch not protected`                   |
| Repository rulesets    | none                                                             |
| GitHub metadata path   | authenticated read-only `gh` was available; no fallback required |

The last observed accepted implementation commit
`99c4f3383f7ec469eaee9aed813620dc2758acf4` is the parent of the current
documentation/governance commit. The live remote, not the provisional prompt,
is authoritative.

## Package and toolchain state

- Package manager: `pnpm@11.11.0`; pnpm is the sole project manager.
- Node policy: exact `26.5.0` in `package.json` and `.mise.toml`.
- pnpm policy: exact `11.11.0` in `package.json` and `.mise.toml`.
- Vite base: `/pgnViewer/`; local development proxy only:
  `/api/ksl -> https://wxapi.kaisaile.org`.
- TypeScript: strict, `noUncheckedIndexedAccess`, and
  `exactOptionalPropertyTypes`.
- Production dependencies:
  `@tanstack/vue-query@5.101.2`, `axios@1.18.1`, `chess.js@1.4.0`,
  `dexie@4.4.4`, `gsap@3.15.0`, `naive-ui@2.44.1`, `pinia@3.0.4`,
  `vue@3.5.39`, `vue-router@5.1.0`, and `zod@4.4.3`.
- Development dependencies:
  `@eslint/js@10.0.1`, `@types/node@26.1.1`,
  `@vitejs/plugin-vue@6.0.7`, `@vue/tsconfig@0.9.1`, `eslint@10.7.0`,
  `eslint-config-prettier@10.1.8`, `eslint-plugin-vue@10.9.2`,
  `knip@6.26.0`, `npm-run-all2@9.0.2`, `postcss-html@1.8.1`,
  `prettier@3.9.5`, `stylelint@17.14.0`,
  `stylelint-config-standard@40.0.0`, `typescript@6.0.3`,
  `typescript-eslint@8.63.0`, `vite@8.1.4`,
  `vue-eslint-parser@10.4.1`, and `vue-tsc@3.3.7`.
- Scripts: `dev`, `build`, `preview`, `typecheck`, `typecheck:vue`, `lint`,
  `lint:style`, `format`, `format:write`, `check:deps`, `check:architecture`,
  `check:tokens`, `check:mocks`, `check:secrets`, `check:governance`,
  `check:unused`, `audit:prod`, and `check:static`.
- Automated tests: no test dependency, test script, test file, snapshot,
  fixture suite, coverage tool, Playwright suite, or Cypress suite exists.
- GitHub Actions: no `.github/workflows` files exist.

## Architecture owner map

| Capability                                    | Current owner and symbol                                                                  |                         Owners | Duplicate candidates                                                   | Status / remaining need                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- | -----------------------------: | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Vue creation and mount                        | `src/main.ts:12` `createApp`; `src/main.ts:27` `mount`                                    |                              1 | none                                                                   | `IMPLEMENTED_VALIDATED`; preserve                                                  |
| Router and route table                        | `src/router/index.ts:5` `router`; routes at lines 7-57                                    |                              1 | none                                                                   | `IMPLEMENTED_VALIDATED`; preserve                                                  |
| Navigation guard                              | `src/router/index.ts:60` `beforeEach`                                                     |                              1 | none                                                                   | `PARTIAL`; query token absorption is a security conflict                           |
| Pinia creation                                | `src/stores/index.ts:3` `pinia`                                                           |                              1 | none                                                                   | `IMPLEMENTED_VALIDATED`; preserve                                                  |
| QueryClient                                   | `src/api/queryClient.ts:32` `queryClient`                                                 |                              1 | none                                                                   | `PARTIAL`; defaults are narrow and there is no global QueryCache error owner       |
| Query keys                                    | `src/api/queryClient.ts:5` `productQueryKeys`                                             |                              1 | no ad hoc product keys found                                           | `IMPLEMENTED_VALIDATED` for current product queries                                |
| Axios creation                                | `src/api/client.ts:267` `httpClient`                                                      |                              1 | no direct Axios imports outside this file                              | `PARTIAL`; browser bearer creation remains a conflict                              |
| Native fetch / direct XHR                     | none                                                                                      |                              0 | none                                                                   | `IMPLEMENTED_VALIDATED`; both remain absent; Axios explicitly uses its XHR adapter |
| JSON request boundary                         | `src/api/client.ts:314` `requestJson`                                                     |                              1 | consumers only in `src/api/auth.ts` and `src/api/productApi.ts`        | `IMPLEMENTED_VALIDATED`                                                            |
| Product API/repository boundary               | `src/api/productApi.ts`                                                                   |          1 functional boundary | no dedicated repository layer                                          | `PARTIAL`                                                                          |
| DTO validation                                | `src/api/auth.ts`, `src/api/client.ts`, `src/api/productMappers.ts`                       |                    distributed | permissive record/unknown schemas                                      | `PARTIAL`                                                                          |
| DTO-to-domain mapping                         | `src/api/productMappers.ts`                                                               |                              1 | none                                                                   | `IMPLEMENTED_VALIDATED` for current confirmed endpoints                            |
| Token registry                                | `src/styles/tokens.css`                                                                   |                              1 | none                                                                   | `IMPLEMENTED_VALIDATED`; preserve                                                  |
| Theme engine                                  | `src/theme/runtime.ts`, `src/stores/theme.ts`                                             |               1 composed owner | synchronous duplicate contract in `index.html`                         | `IMPLEMENTED_VALIDATED`; consolidate only with explicit no-flash proof             |
| Synchronous theme bootstrap                   | `index.html:7-76`                                                                         |                              1 | `src/bootstrap/preferences/themePreference.ts` shares the key contract | `IMPLEMENTED_VALIDATED`; preserve behavior                                         |
| Naive UI provider root                        | `src/app/providers/AppProviders.vue:16`                                                   |                              1 | none                                                                   | `PARTIAL`; only config/global style exist                                          |
| Message/dialog/notification/loading providers | none                                                                                      |                              0 | none                                                                   | `MISSING`                                                                          |
| Overlay host and generic UI adapters          | none; `src/ui/index.ts` only re-exports board APIs                                        |                              0 | board components are not generic adapters                              | `MISSING`; board must remain feature-owned                                         |
| Icon system                                   | inline SVG in `BoardView.vue` and `BoardRadialMenu.vue`                                   |           0 project icon owner | no icon-library dependency/import                                      | `MISSING`; avoid a duplicate icon library                                          |
| Chessboard                                    | `src/features/board/CanonicalChessBoard.vue` and `useBoardView.ts`                        |                              1 | none                                                                   | `IMPLEMENTED_VALIDATED`; preserve                                                  |
| PGN parse/navigation                          | `src/features/pgn/domain/parsePgn.ts`; `src/stores/pgn.ts`                                |               1 composed owner | reusable `PgnChessBoard` consumes the same parser                      | `IMPLEMENTED_VALIDATED`; preserve                                                  |
| Annotations                                   | `src/features/annotations/**`; node state in `src/stores/pgn.ts`                          |               1 composed owner | none                                                                   | `IMPLEMENTED_VALIDATED`; persistence is missing                                    |
| AI analysis and Workers                       | `src/features/analysis/**`; `src/stores/analysis.ts`                                      |                              1 | main-thread execution is a local compute fallback, not product data    | `IMPLEMENTED_VALIDATED`; preserve                                                  |
| GSAP                                          | feature-scoped owners under board, analysis, and workspace                                |       distributed by component | no second motion library                                               | `IMPLEMENTED_VALIDATED`; preserve cleanup contracts                                |
| Dexie / IndexedDB                             | `WorkspaceLayoutDatabase` in `src/persistence/workspace/workspaceLayoutPersistence.ts:33` |                              1 | none                                                                   | `PARTIAL`; only schema version 1 layout exists                                     |
| `localStorage`                                | theme bootstrap/adapter and auth persistence                                              |                      2 domains | direct sensitive auth owner conflicts with target architecture         | `PARTIAL`                                                                          |
| `sessionStorage`                              | `src/persistence/workspace/workspaceHandoff.ts:38` key owner                              |                              1 | memory fallback                                                        | `PARTIAL`; no expiry enforcement                                                   |
| Preferences                                   | `src/stores/theme.ts`, theme adapter, workspace store/layout adapter                      | distributed by preference type | no unified preference schema                                           | `PARTIAL`                                                                          |
| Error normalization                           | `ApiClientError` in `src/api/client.ts:11-35`                                             |              1 transport owner | business-envelope errors bypass full sanitizer                         | `PARTIAL`                                                                          |
| Vue global errors / unhandled rejection       | none                                                                                      |                              0 | none                                                                   | `MISSING`                                                                          |
| Query Cache global errors                     | none; no `new QueryCache`                                                                 |                              0 | none                                                                   | `MISSING`                                                                          |
| Global user feedback                          | page/module state components only                                                         |                 0 global owner | none                                                                   | `MISSING`                                                                          |

The board, PGN, annotation, analysis, theme, and workspace owners are accepted
runtime capabilities and are not candidates for replacement during hardening.

## Authentication and browser-secret conflict map

Authentication works as a product capability, but its security foundation is
not complete.

1. `LoginView.vue:36-42` sends account and password to the auth store and clears
   the password ref on failure.
2. `src/api/auth.ts:73-86` constructs the upstream login payload after
   `md5Hex` digest creation; a digest is not a password-storage security boundary.
3. `src/api/auth.ts:99-123` calls `/liveproxy/PostLoginByPhone`, accepts a
   permissive object envelope, and extracts `token`, `jwttoken`, `jwtToken`, or
   `loginToken`.
4. `src/persistence/auth/sessionPersistence.ts:81-89` writes authentication
   values to browser-readable `localStorage`, including a duplicate
   `jwttoken` value. No server-controlled expiry is retained.
5. `src/stores/auth.ts:67-138` owns the in-memory session and cleanup lifecycle.
6. `src/api/auth.ts:136-167` accepts `jwttoken`, `loginToken`, and `token` URL
   query values. `src/router/index.ts:60-71` replaces the URL after absorption,
   but cannot erase prior browser history, referrer, extension, or intermediary
   exposure.
7. `src/api/client.ts:145-168` reads the browser session and
   `src/api/client.ts:284-300` creates `Authorization: Bearer ...` in browser
   JavaScript.
8. `src/features/teaching-workspace/useRemoteReplayLoader.ts:80-90` tags replay
   Query data as private; logout/login failure removes private Query entries,
   replay handoff, AI tasks, and private PGN state.
9. There is no global 401/auth-loss handler, token expiry policy, refresh
   contract, or cross-tab auth synchronization.
10. Axios transport messages are bounded and secret-pattern filtered, but auth
    and product business-envelope messages can still surface raw upstream
    `msg`/`errmsg` values.

Confirmed active security conflicts:

- browser-readable upstream authentication tokens;
- URL authentication-token absorption;
- browser-created upstream `Authorization` headers;
- indefinite client retention without a server expiry contract;
- unproved production cookie, CORS, CSRF, and authentication-loss behavior.

No current authentication token was found in sessionStorage, IndexedDB, Query
cache, workspace handoff state, or authored runtime logs. The Query cache does
hold private replay domain data with explicit private metadata and cleanup, while
the handoff parser rejects token-like fields. Those controls do not neutralize
the active localStorage, Pinia-memory, URL-query, and browser-header conflicts.

These findings contradict the `browserSecrets: ABSENT` claim in the P1H report
and the opaque-HttpOnly-cookie-only target stated by the active architecture and
persistence ADRs. H1 is blocked on an owner-approved backend/session and hosting
contract; H0 does not change authentication.

## Browser storage inventory

| Owner                                                                    | Mechanism / key or table                                                                                                                                                                                                                                    | Data and flow                                                                           | Retention / cleanup                                                                                       | Classification                                    | Current status / future owner                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| `index.html:9-68`                                                        | `localStorage.themeMode` read                                                                                                                                                                                                                               | synchronous pre-Vue theme bootstrap                                                     | indefinite; invalid/unavailable values fall back                                                          | public preference                                 | allowed bootstrap exception; theme owner                                  |
| `src/bootstrap/preferences/themePreference.ts` and `src/stores/theme.ts` | `localStorage.themeMode` read/write/remove and `storage` event                                                                                                                                                                                              | runtime theme preference and cross-tab synchronization                                  | indefinite until reset; listener cleanup exists                                                           | public preference                                 | `IMPLEMENTED_VALIDATED`; preserve no-flash contract                       |
| `src/persistence/auth/sessionPersistence.ts`                             | `localStorage`: `logintoken`, `ksllogintoken`, `jwttoken`, `uid`, `jgid`, `loginphone`; cleanup also removes `passtoken`, `userinfo`, `ksl_uinfo`, `UserInfo:Kaisaile`, `UserInfo:Kaisaile:expire`, `UserInfo:ChessService`, `UserInfo:ChessService:expire` | login or URL handoff produces values; auth store and Axios consume them                 | indefinite; cleared on logout or login failure; no expiry/cross-tab contract                              | tokens sensitive; identity metadata private       | `BLOCKED` security conflict; future server-session/auth owner             |
| `src/persistence/workspace/workspaceHandoff.ts`                          | `sessionStorage` key `pgnViewer.workspaceHandoff.v1`                                                                                                                                                                                                        | sanitized mode/source/route/tournament/round/board/game metadata; memory fallback       | tab lifetime; invalid JSON clears; `createdAt` is not enforced as expiry; replay contexts clear on logout | public to private operational metadata by context | `PARTIAL`; workspace handoff owner                                        |
| `src/persistence/workspace/workspaceLayoutPersistence.ts`                | Dexie database `chess-pgnviewer-vue`, table `workspaceSession`, key `current`, schema version 1                                                                                                                                                             | panel visibility, toolbar collapse, alignment/orientation, active tab, PGN panel height | 30-day expiry; invalid/expired rows delete; unavailable storage silently uses defaults                    | public preference/layout                          | `PARTIAL`; persistence owner needs migration/reset/quota/cross-tab policy |

No other direct `localStorage`, `sessionStorage`, `indexedDB`, or Dexie owners
were found. PGN text, annotations, analysis metadata, drafts, recovery context,
and broad preferences are not durably persisted. Live state and AI tasks remain
memory-only.

## Transport and API boundary map

- One Axios XHR client exists in `src/api/client.ts`; direct Axios, native
  `fetch`, and direct `XMLHttpRequest` calls elsewhere are absent.
- Paths are relative and validated; dynamic request bases are rejected; the
  environment timeout is bounded to 3-30 seconds and explicit per-request values
  to 1-30 seconds; `AbortSignal` reaches product reads and replay.
- Current Query consumers are the competition list/detail/display views and
  remote replay loader. Views call `productApi.ts`, not `requestJson` directly.
- `productMappers.ts` converts confirmed upstream responses to domain results,
  but external DTO validation remains permissive rather than endpoint-specific
  Zod schemas.
- Runtime public variables are `VITE_KSL_CHESS_API_BASE`,
  `VITE_KSL_MAIN_API_BASE`, and `VITE_KSL_REQUEST_TIMEOUT_MS`; the public app ID
  is a non-secret constant. URL/timeout validation exists.
- The Vite `/api/ksl` proxy is development-only. No production host, reverse
  proxy, BFF, serverless function, or deployment configuration exists in this
  repository.
- Production `/api/ksl`, hosting, CORS, cookie, CSRF, CSP, and security-header
  behavior are externally blocked. No hosting platform may be invented.
- No explicit production source-map/debug policy exists. Vite defaults are not
  a documented deployment security contract.

## Internationalization state

Status: `MISSING`.

- No i18n dependency, Vue I18n, i18next runtime, locale files, `useI18n`, `$t`,
  locale store, locale persistence, formatting helper, missing-key scanner, or
  key-parity gate exists.
- `index.html:2` is `lang="en"`, while the active product is predominantly
  hard-coded Simplified Chinese.
- Repository scan found 318 source lines containing Han characters across 32
  active source files, plus hard-coded English transport/contract messages.
- `docs/ui/I18N_SPEC.md` specifies an i18next runtime, `zh-CN` primary locale,
  English fallback, namespaces, typed keys, and CI validation that do not exist.
- Naive UI receives neither `locale` nor `date-locale`.
- Product identity is inconsistent across `Application bootstrap`, package/DB
  `chess-pgnviewer-vue`, `Kaisaile Production API`, and Chinese product copy.
  The authorized repository spelling remains `chess-pgnviewet-vue`.

H0 does not choose an i18n package or create translations.

## UI adapter, provider, overlay, and icon state

- `src/ui/index.ts` contains only board re-exports. It is not a generic adapter
  catalog.
- Direct Naive UI imports are restricted to the approved provider boundary:
  `AppProviders.vue`, `naiveTheme.ts`, and `naiveThemeOverrides.ts`.
- The provider root includes only `NConfigProvider` and `NGlobalStyle`. Message,
  dialog, notification, loading-bar, locale, date-locale, discrete API, and
  overlay-host providers are absent.
- Active Vue pages use 60 native `<button>` elements in 14 files, 12 native
  `<input>` elements in 6 files, and 4 native `<select>` elements in 2 files.
  Native checkbox inputs exist inside the input inventory. No native dialog,
  drawer, tooltip, or popover element/component names were found.
- `PromotionChooser.vue` has a feature-specific modal, focus trap, Escape close,
  initial focus, restoration, background dismissal, reduced-motion handling,
  and GSAP cleanup. This is not a generic overlay framework.
- Inline SVG is used by `BoardView.vue` and `BoardRadialMenu.vue`. No icon
  library dependency or project icon adapter exists.
- Project-specific board components must remain outside generic UI adapters.

## Global error and feedback state

`ApiClientError` owns these categories: `auth-required`, `cancelled`,
`configuration`, `contract-mismatch`, `http`, `invalid-json`, `network`,
`permission-denied`, `rate-limited`, `service-unavailable`, `timeout`, and
`upstream`.

Module feedback exists through `ResourceState.vue`, replay status, PGN status,
analysis alerts, inline login errors, local retry buttons, and local loading
states. There is no Vue global error handler, `unhandledrejection` handler,
QueryCache global error handler, global feedback owner, message/notification
owner, dialog owner, or loading-bar owner. Raw upstream business messages and
technical English terminology can reach user-facing surfaces. Error/feedback
and translated-error ownership are therefore `PARTIAL`.

## Persistence state

- One Dexie subclass and one database exist:
  `WorkspaceLayoutDatabase`, database `chess-pgnviewer-vue`.
- One table exists: `workspaceSession: 'id, updatedAt'`, version 1. There is no
  later schema version or migration function.
- Layout validation, 30-day expiry, invalid-row deletion, and unavailable-store
  fallback exist. Quota/corruption diagnostics are not surfaced to the user.
- Theme uses the approved synchronous `localStorage` exception. Workspace
  handoff uses `sessionStorage` with a memory fallback.
- Sensitive auth values in `localStorage` violate the target persistence ADR.
- Logout clears authentication, private Query cache, replay handoff contexts,
  private PGN replay, and AI tasks while preserving public layout/theme state.
- There is no global reset, Dexie deletion/reset contract, persistence status
  UI, handoff expiry enforcement, or cross-tab persistence coordination beyond
  theme.

## QueryClient and repository state

- One QueryClient exists with `refetchOnWindowFocus: false`, `retry: 1`, and
  `staleTime: 30_000`.
- `gcTime`, network mode, reconnect policy, mutation defaults, and QueryCache
  global errors are implicit or absent.
- `productQueryKeys` owns all current product query keys; no ad hoc current
  product keys were found.
- Current calls: `useQuery` in three product views and `fetchQuery` in the replay
  loader. No `useMutation` or `ensureQueryData` call exists.
- Current query functions propagate `AbortSignal`; Axios owns a validated
  timeout; replay unmount cancels the active exact query.
- Private replay uses `meta.privacy = 'private'` and is removed on logout/login
  failure. Public product queries stay in memory.
- `productApi.ts` is the functional repository boundary, but there is no
  explicit repository module taxonomy. Endpoint-specific DTO Zod schemas are
  incomplete; mappers are present and Query caches retain mapped domain data,
  not raw payloads.
- Credentialed live API behavior remains owner-credential dependent. MQTT live,
  cloud PGN, and legacy compatibility PGN are truthfully unavailable rather
  than fabricated.

## Accessibility, motion, layout, and responsive state

- Global `:focus-visible` ownership exists in `src/styles/base.css:29`.
- Global reduced-motion CSS exists; board, workspace, analysis, and promotion
  GSAP owners also observe `prefers-reduced-motion`.
- Board keyboard operation uses a focusable grid and Arrow/Enter/Space/Escape
  handling. Offscreen grid rows/cells have labels. An announcement callback is
  defined but no active consumer was found, so the screen-reader contract is
  partial.
- Promotion chooser implements focus trap/restoration and Escape. Other
  feature overlays lack a shared focus/scroll/stack owner.
- Coarse-pointer and compact profiles enforce 44px controls; P1H browser
  evidence covers desktop, tablet, portrait mobile, and landscape mobile.
- `100dvh` is centralized through `--workspace-viewport-h`; no source `100vh`
  use exists. `html`/`body` overflow is hidden and modules own scrolling.
- Responsive modes exist around 1200px, 900px, and 560px plus a short landscape
  profile. These differ from parts of the aspirational UI specification.
- No `env(safe-area-inset-*)` use exists.
- Splitter geometry is constrained and persisted, with pointer cleanup, but no
  keyboard splitter behavior was found.
- Overlay z-index tokens exist, but there is no global overlay stack/host.
- Board `ResizeObserver` is created in `useBoardView.ts:1140` and disconnected
  during teardown; orientation/resize paths cancel motion.

## CI and governance state

Local deterministic governance is substantial: dependency policy, architecture
boundaries, tokens, mock indicators, secret patterns, formatting, ESLint,
Stylelint, Knip, type checking, builds, and pnpm audits have package scripts.

GitHub enforcement is `MISSING`: there are no Actions, triggers, frozen pnpm
install gates, protected branch, required status checks, or rulesets. No workflow
requests secrets or calls production APIs because no workflow exists.

The no-mock scanner detects mock/fake/sample/demo/fixture/fallback terminology,
invented endpoints/DTOs, and named fake records. Its hard-coded record scan
requires those lexical markers, so it does not comprehensively detect every
hard-coded successful product record or unlabeled fallback data shape. This gate
is `PARTIAL`, despite passing against the current repository.

## Stale documentation findings

| Authority and location                                                                                             | Stale or contradictory state                                                                        | Current evidence                                                                                          | Corrected status                        | Correction owner                                     |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| `FOUNDATION_READINESS_MATRIX.json` capability 8 / lines 805-852                                                    | QueryClient deferred                                                                                | `src/api/queryClient.ts:32`; P1H validation                                                               | `PARTIAL` policy, owner implemented     | H0 records truth; H10 replaces current matrix claims |
| Same, capability 14 / line 1160                                                                                    | no Dexie schema                                                                                     | `workspaceLayoutPersistence.ts:33-38`                                                                     | `PARTIAL`                               | H0/H10                                               |
| Same, capability 16 / lines 1262-1263                                                                              | no `src/api`                                                                                        | current `src/api/**`                                                                                      | `PARTIAL` repository foundation         | H0/H10                                               |
| Same, capability 25 / lines 1764, 1792 and remote snapshots                                                        | remote empty / no local Git                                                                         | live remote and synchronized Git at `d4a099...`                                                           | `IMPLEMENTED_VALIDATED`                 | H0/H10                                               |
| Same, warning line 2401                                                                                            | product UI remains unimplemented                                                                    | accepted P1A-P1H source and product evidence                                                              | `IMPLEMENTED_VALIDATED` product runtime | H0/H10                                               |
| P1H report `transportAndSecurity.browserSecrets`                                                                   | `ABSENT`                                                                                            | browser-readable tokens and browser Authorization creation                                                | `BLOCKED` security conflict             | H0/H1; historical report remains evidence-only       |
| `P1H_PRODUCT_COMPLETE_USABLE_INTEGRATION_BASELINE.md:53-63`                                                        | states that the browser runtime has no browser secret                                               | auth values are read by browser code and used for Bearer auth                                             | `BLOCKED` security conflict             | H0/H1; H10 historical-scope correction               |
| `API_BOUNDARY_ADR.md:4,24-32,47`                                                                                   | runtime `NOT_IN_P0`; server-only `/api/auth/*` and no browser bearer                                | browser hashes login input, calls the upstream login path, persists tokens, and creates Bearer headers    | `BLOCKED` security conflict             | H0/H1/H10                                            |
| `PRODUCTION_DEPLOYMENT_BOUNDARY.md:35,39,70`                                                                       | says browser never receives upstream secrets and cites `src/config/productionApi.ts`                | browser-readable upstream auth values exist; actual config owner is `src/runtime/config/productionApi.ts` | `BLOCKED` / `PARTIAL`                   | H0/H1/H10                                            |
| `PERSISTENCE_ADR.md:4,25-31`                                                                                       | runtime `NOT_IN_P0`, no database, and no client auth tokens                                         | Dexie layout plus local/session storage and auth tokens exist                                             | `PARTIAL` with security conflict        | H0/H1/H6/H10                                         |
| `FRONTEND_ARCHITECTURE_RFC.md:23,39,46`                                                                            | future API, opaque cookie only, P0 implements no API/auth/persistence                               | current API/auth/Query/Dexie runtime                                                                      | `PARTIAL` / `BLOCKED`                   | H0/H1/H5/H6/H10                                      |
| `TECH_STACK_DECISION.md:17-22`                                                                                     | P0 dependency-only or empty runtime statuses                                                        | Query, GSAP, chess, Dexie, Zod, and UI runtime implemented                                                | mixed current statuses                  | H0/H10                                               |
| `TOKEN_AND_THEME_ARCHITECTURE_BASELINE.md:48`                                                                      | no Query/API/product UI and related blanket gaps                                                    | current product runtime implements several listed items                                                   | mixed current statuses                  | H0/H10                                               |
| `F2_TOOLCHAIN_AND_STATIC_GOVERNANCE_CLOSURE.md:192` and old migration matrices                                     | no product UI / P0-only state                                                                       | P1H product runtime                                                                                       | historical-only, not current authority  | H10 labels historical scope                          |
| `PRODUCT_UI_MIGRATION_GATE_BASELINE.md:6,40,59-71` and `P1G1_AXIOS_HTTP_CLIENT_AND_VITE_PROXY_BASELINE.md:153-156` | P1A/P1H are still next and product/API runtime has not started                                      | accepted P1A-P1H runtime and `PRODUCT_COMPLETE_USABLE` status                                             | `IMPLEMENTED_VALIDATED` product runtime | H10 historical-scope labeling                        |
| `PRODUCT_FIRST_DELIVERY_REBASE.md:66-70,104-106,488-492`                                                           | obsolete intermediate “next required phase” statements remain inside an active cumulative authority | later sections and accepted reports close P1A-P1H and name post-product hardening                         | `PARTIAL` documentation consistency     | H0 output; H10 final canonicalization                |
| `SOURCE_ADAPTER_ADR.md:4,32`                                                                                       | runtime remains `NOT_IN_P0` and adapter acceptance requires tests                                   | several adapters now run; automated test files are forbidden by current owner policy                      | `PARTIAL`                               | H5/H10                                               |
| `docs/ui/I18N_SPEC.md:23-100`                                                                                      | describes configured i18next behavior and CI governance                                             | no dependency/runtime/locales/gates                                                                       | `MISSING`                               | H2 then H10                                          |

`docs/architecture/FOUNDATION_READINESS_MATRIX.json` is an input only and is
not modified in H0. Phase-scoped P0-P1 reports are not rewritten; H10 must make
their historical scope explicit wherever active documents cite them as current
state.

## Foundation domain classification

| Phase | Domains                                                                                                              | Current classification                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| H1    | auth/session security; production `/api/ksl`; hosting; CORS/cookies/CSRF; CSP/headers; public env; source maps/debug | `BLOCKED` with partial client boundaries                                 |
| H2    | i18n runtime; locale/fallback; HTML/Naive locale; hard-coded strings; translated errors                              | `MISSING` / `PARTIAL`                                                    |
| H3    | UI adapters; provider composition; overlays/focus; icons                                                             | `MISSING` / `PARTIAL`                                                    |
| H4    | global errors/feedback; loading ownership                                                                            | `MISSING` / `PARTIAL`                                                    |
| H5    | Query policy; keys; repositories; DTO validation/mapping; cancellation; private cache                                | `PARTIAL`, with keys/mapping/private cleanup validated                   |
| H6    | Dexie; migrations; classification; storage failure; logout/reset                                                     | `PARTIAL`                                                                |
| H7    | accessibility; touch targets; board keyboard/screen-reader contract                                                  | `PARTIAL`, with touch targets validated                                  |
| H8    | reduced motion; GSAP lifecycle                                                                                       | `IMPLEMENTED_VALIDATED` for current runtime; consolidate without rebuild |
| H9    | breakpoints; viewport/scroll; safe areas; splitters; z-index; ResizeObserver                                         | mixed `IMPLEMENTED_VALIDATED`, `PARTIAL`, and `MISSING`                  |
| H10   | GitHub gates; documentation; final readiness matrix                                                                  | `MISSING` / `PARTIAL`                                                    |

Formally rejected as unnecessary or unsafe: inventing a hosting platform/BFF,
migrating the feature-owned chessboard into generic UI adapters, adding automated
test infrastructure against owner policy, and replacing real APIs with mock or
fallback product data.

## Externally blocked decisions

1. Backend/session owner: approve the authentication contract, server-controlled
   expiry, cookie/bearer ownership, token handoff removal, auth-loss behavior,
   CSRF posture, and credentialed validation account.
2. Hosting/operator owner: identify the real production host and implement the
   restricted same-origin `/api/ksl` boundary or approve a browser-readable HTTPS
   base with proven CORS/cookie behavior.
3. Security/hosting owner: define CSP and response headers compatible with the
   inline no-flash bootstrap, Workers, assets, upstream connection policy, and
   production source-map/debug policy.
4. Product/API owner: approve live MQTT/electronic-board and compatibility/cloud
   PGN contracts. Until then those capabilities remain blocked and truthfully
   unavailable.
5. Product owner: confirm primary/fallback locale and product identity before H2
   selects a runtime or translation ownership model.

## H1 through H10 dependency order

1. `H1_AUTHENTICATION_AND_PRODUCTION_BOUNDARY_HARDENING`: resolve the backend
   session and production hosting contract first; do not change auth until the
   owner decision exists.
2. `H2_I18N_AND_USER_FACING_LANGUAGE_FOUNDATION`: establish locale ownership and
   error translation after security-facing messages and deployment behavior are
   stable.
3. `H3_UI_ADAPTER_PROVIDER_OVERLAY_ICON_FOUNDATION`: add only the generic UI
   boundaries required by the preserved product; do not migrate the board.
4. `H4_GLOBAL_ERROR_FEEDBACK_LOADING_FOUNDATION`: compose global error and
   feedback ownership through the H3 provider boundary.
5. `H5_QUERY_REPOSITORY_DTO_TRANSPORT_HARDENING`: consolidate server-state and
   DTO policy after auth/error contracts are fixed.
6. `H6_PERSISTENCE_RECOVERY_AND_RESET_HARDENING`: finalize storage classification,
   migrations, recovery, reset, and private cleanup against the H1/H5 contracts.
7. `H7_ACCESSIBILITY_FOUNDATION_HARDENING`: close generic focus, screen-reader,
   keyboard, and semantic gaps on stable UI/provider behavior.
8. `H8_MOTION_LIFECYCLE_CANONICALIZATION`: canonicalize the already-valid GSAP
   and reduced-motion owners without rebuilding them.
9. `H9_RESPONSIVE_LAYOUT_SAFE_AREA_HARDENING`: close safe-area, splitter,
   stacking, and remaining layout contracts after accessibility/motion behavior
   is stable.
10. `H10_CI_GOVERNANCE_AND_FINAL_CANONICALIZATION`: add approved static merge
    gates and replace stale current-state documentation only after H1-H9 close.

The smallest coherent next slice is H1 contract resolution plus evidence-backed
classification of the real server session, production `/api/ksl` host boundary,
CORS/cookie/CSRF behavior, CSP/security headers, and production debug/source-map
policy. It must not invent a host, BFF, proxy, authentication contract, or deploy
capability, and it must not proceed without the relevant owner decisions.
