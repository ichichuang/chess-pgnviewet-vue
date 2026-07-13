# P1F Canonical AI Analysis Worker Runtime Baseline

Status: `P1F_CANONICAL_AI_ANALYSIS_WORKER_RUNTIME_PASS_READY_FOR_GOVERNANCE_CLOSURE`
Phase: `P1F_CANONICAL_AI_ANALYSIS_AND_WORKER_MIGRATION`
Target route: `/pgnViewer/`
Next phase: `P1G_CANONICAL_PRODUCT_RUNTIME_INTEGRATION`

## Scope

P1F migrates the canonical local AI analysis runtime over the accepted P1A
workspace shell, P1B board, P1C PGN owner, P1D annotation runtime, and P1E
workspace control layer.

P1F covers local position evaluation, module Web Worker execution, request
identity, stale-result rejection, explicit cancellation, score normalization,
principal-variation display, candidate-line display, move assessment writing to
the current PGN node annotation boundary, and truthful unavailable/error states.

P1F does not implement authentication, production APIs, cloud persistence,
settings, live/replay import, tournament records, upstream engine assets, or
product account workflows.

## Canonical Source Files

- `pgnViewer-new/src/domains/analysis/analysisResult.ts`
- `pgnViewer-new/src/domains/analysis/engine.ts`
- `pgnViewer-new/src/domains/analysis/search.ts`
- `pgnViewer-new/src/domains/analysis/search.worker.ts`
- `pgnViewer-new/src/domains/analysis/searchEngine.ts`
- `pgnViewer-new/src/domains/analysis/classifyMove.ts`
- `pgnViewer-new/src/domains/annotations/ycdw.ts`
- `pgnViewer-new/src/stores/pgnStore.ts`
- `pgnViewer-new/src/features/teaching-workspace/TeachingWorkspace.vue`
- `pgnViewer-new/src/features/teaching-workspace/components/AnalysisPanel.vue`

Secondary product evidence:

- `chess-pgnviewer/src/hooks/useAnalysisController.ts`
- `chess-pgnviewer/src/hooks/useStockfishEngine.ts`

## Target Files

- `src/features/analysis/domain/analysisResult.ts`
- `src/features/analysis/domain/engine.ts`
- `src/features/analysis/domain/search.ts`
- `src/features/analysis/domain/search.worker.ts`
- `src/features/analysis/domain/searchEngine.ts`
- `src/features/analysis/domain/classifyMove.ts`
- `src/features/analysis/domain/formatAnalysis.ts`
- `src/features/analysis/components/EvalBar.vue`
- `src/features/analysis/components/AnalysisPanel.vue`
- `src/features/annotations/domain/annotationTypes.ts`
- `src/features/annotations/domain/ycdw.ts`
- `src/features/teaching-workspace/TeachingWorkspace.vue`
- `src/features/teaching-workspace/WorkspaceRightPanel.vue`
- `src/stores/analysis.ts`
- `src/stores/index.ts`
- `src/styles/tokens.css`

## Source To Target Mapping

| Canonical owner                          | Target owner                                       | P1F classification            |
| ---------------------------------------- | -------------------------------------------------- | ----------------------------- |
| analysis result DTOs                     | `analysisResult.ts`                                | `REQUIRED_IN_P1F`             |
| local search implementation              | `search.ts`                                        | `REQUIRED_IN_P1F`             |
| module Worker entry                      | `search.worker.ts`                                 | `REQUIRED_IN_P1F`             |
| Worker pool and request protocol         | `searchEngine.ts`                                  | `REQUIRED_IN_P1F`             |
| move assessment classifier               | `classifyMove.ts`                                  | `REQUIRED_IN_P1F`             |
| analysis store and current-node watcher  | `stores/analysis.ts`, `TeachingWorkspace.vue`      | `REQUIRED_IN_P1F`             |
| analysis panel                           | `AnalysisPanel.vue`, `WorkspaceRightPanel.vue`     | `REQUIRED_IN_P1F`             |
| evaluation rail                          | `EvalBar.vue`, `TeachingWorkspace.vue`             | `REQUIRED_IN_P1F`             |
| YCDW analysis comment field              | `annotationTypes.ts`, `ycdw.ts`                    | `REQUIRED_IN_P1F`             |
| canonical auth, cloud, settings, reports | not copied                                         | `DEFERRED_TO_LATER_PHASE`     |
| upstream engine binary or WASM assets    | not present in accepted canonical source or target | `NO_ASSET_MIGRATION_REQUIRED` |

## Engine Identity

The accepted P1F engine is the canonical dependency-free TypeScript search
runtime from `pgnViewer-new`. It uses `chess.js` for legal move generation and
SAN replay, a material plus piece-square evaluation, negamax with alpha-beta
pruning, candidate root-line collection, and a module Web Worker entry created
through Vite worker-compatible URL handling.

No Stockfish, WASM, NNUE, binary engine asset, network service, browser
credential, upstream token, or secret-bearing URL is introduced by P1F.

## Worker Runtime

`createSearchEngine()` owns a small Worker pool. Each request sends `{ id, fen,
options }` to `search.worker.ts` and accepts only the matching `{ id, result }`
response. Worker errors reject the pending request. `stop()` rejects active
requests, terminates live workers, clears timers, and prevents stopped promises
from publishing UI state.

When Worker construction is unavailable, the same search function can execute on
the main thread with the same typed request and result contract. The UI exposes
the runtime mode as `worker`, `main-thread-fallback`, or `unavailable`.

## Analysis Store Lifecycle

`stores/analysis.ts` is the single P1F owner for local analysis state. It tracks:

- phase: idle, initializing, ready, analyzing, available, unavailable, or error;
- worker mode and worker count;
- active request identity;
- latest accepted result;
- stale rejection, completion, cancellation, and retry counters.

`TeachingWorkspace.vue` watches the current PGN selection, node id, and FEN. A
node or position change starts a new request and stops the previous active
request. Unmount disposes the analysis engine.

## Request Identity And Stale Rejection

Each analysis request records:

- `requestId`;
- `nodeId`;
- `nodeKey`, derived from selected game index and node id;
- `positionId`, derived from the current FEN;
- exact current FEN;
- optional parent FEN;
- optional current move coordinate.

A result is accepted only when the active request id still matches, the current
PGN node still matches, and the current FEN still hashes to the same
`positionId`. Otherwise the result is counted as stale and discarded.

## Score And Mate Semantics

The search score is side-to-move centipawns or mate-distance score. P1F
normalizes display into:

- side-to-move perspective, used for current-player and candidate-line display;
- White perspective, used for the primary board evaluation rail and summary.

Mate scores use the canonical `9000` band. Values inside the mate band are
reported as mate-distance display values while preserving the winning side after
White-perspective normalization.

## Principal Variations And Candidates

The accepted result exposes one best move, one principal variation, and up to
five root candidate lines. Principal variations are replayed against the current
FEN before display. Illegal PV text is hidden and marked as failed validation
instead of being shown as a trusted line.

Candidate lines are sorted by side-to-move score and displayed with the same
score normalization as the current result. Candidate lines do not create extra
PGN nodes.

## Annotation Boundary

When a current node has a parent FEN and a coordinate move, P1F compares the
parent-position evaluation with the current-position evaluation and writes the
classified move assessment into `node.annotation.analysis`. The node comment is
then serialized through the existing YCDW boundary.

`ycdw.ts` now preserves an `A=<base64-json>` analysis field. Unknown fields,
plain comments, shapes, and text annotations remain preserved by the same
annotation model.

## UI Runtime

The workspace evaluation rail is now `EvalBar.vue`, driven by the accepted
analysis store. The lower analysis region is now `AnalysisPanel.vue`. The right
panel analysis tab shows the same store state in compact form; it does not own a
second analysis lifecycle.

The analysis UI reports only real local runtime states: no PGN, initializing,
ready, analyzing, available result, unavailable, or error. It exposes explicit
analyze, cancel, and retry controls.

## Tokens

P1F consumes accepted surface, text, border, control, focus, warning, spacing,
radius, motion, and evaluation tokens. P1F adds three semantic evaluation-rail
tokens:

- `--analysis-rail-dark-fill: var(--eval-black)`
- `--analysis-rail-light-fill: var(--eval-white)`
- `--analysis-rail-boundary-offset: -1px`

No accepted token value is changed.

## Assets And Dependencies

P1F migrates no assets and adds no package dependency. The runtime stays inside
the existing Vue, Vite, Pinia, TypeScript, and `chess.js` dependency graph.

## Deferred Capabilities

Deferred to later phases: production analysis providers, cloud records, account
boundaries, settings, persistence stores, live/replay import, tournament
integration, report export, and final product workflows.

## Validation

Completed validation on 2026-07-13:

- `mise exec -- pnpm run lint`: pass.
- `mise exec -- pnpm run typecheck`: pass.
- `mise exec -- pnpm run format:check`: pass.
- `mise exec -- pnpm run lint:style`: pass.
- `mise exec -- pnpm run check:governance`: pass.
- `mise exec -- pnpm run check:unused`: pass with existing configuration hints
  for `chess.js`, `naive-ui`, and `zod`.
- `mise exec -- pnpm run audit:prod`: pass, no known vulnerabilities.
- `mise exec -- pnpm exec vite build --outDir /tmp/p1f-build-final4.6FFj1r
--emptyOutDir`: pass after authoritative Vue SFC typecheck.

Temporary production build evidence:

- route served from `http://127.0.0.1:4178/pgnViewer/`;
- build output kept outside the repository at `/tmp/p1f-build-final4.6FFj1r`;
- Worker asset emitted as
  `/tmp/p1f-build-final4.6FFj1r/assets/search.worker--m-y5vME.js`;
- route returned 200 through Vite preview.

Real-browser validation evidence:

- Browser route check: `/pgnViewer/` loaded with title `Application bootstrap`,
  nonblank workspace DOM, no Vite overlay, and no Vue/runtime console error.
- PGN input: uploaded `/tmp/p1f-validation-game.pgn` through the visible
  `打开 PGN` file chooser.
- Navigation interaction: clicked `下步`, changing the current node to the first
  move and updating board focus plus evaluation rail state.
- Analysis runtime: analysis tab showed `状态 available`, `Worker worker`,
  lower panel showed `Worker x 4`, `请求 2`, `位置 24e6c180`, best move `b8c6`,
  principal variation `Nc6 Nc3 Nf6`, and five candidate lines.
- Analysis interaction: clicked `分析当前`; request identity advanced from
  `请求 2` to `请求 3` while preserving the same Worker-backed result.
- Worker network evidence: `search.worker--m-y5vME.js` loaded with HTTP 200.
- Responsive check: `844x390` viewport remained nonblank and kept the board,
  evaluation rail, right analysis status, and lower analysis result available.
- Screenshot evidence: `/tmp/p1f-browser-final4-desktop.png` and
  `/tmp/p1f-browser-final4-landscape.png`.

Observed non-breaking browser noise:

- Vite preview requested `/favicon.ico` and returned 404. No framework overlay,
  Vue error, unhandled exception, Worker load failure, or app-breaking console
  error was observed.

## Completion Gate

P1F is complete only when local analysis starts from the current real PGN node,
Worker execution is observed in the browser, stale request rejection and
cancellation are protected by request identity, principal variations are
legality-checked, current-node analysis comments serialize through YCDW, static
checks and build pass, real-browser validation passes, implementation and
governance commits are pushed normally, local `HEAD` equals remote `main`, and
no read-only evidence source is modified.
