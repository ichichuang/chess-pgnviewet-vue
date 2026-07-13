/**
 * A real, dependency-free chess search engine.
 *
 * It uses negamax + alpha-beta search with iterative deepening, quiescence on
 * captures, MVV-LVA ordering, and piece-square evaluation. That is enough for
 * local current-position evaluation, candidate lines, and move classification.
 *
 * It is a pure function over a FEN (`searchPosition`), so it runs identically on
 * the main thread path and inside a Web Worker. P1F keeps the `AnalysisEngine`
 * interface open for a future approved engine.
 */
import { Chess, type Move } from 'chess.js'
import type { EngineEval } from './engine'

const PIECE_VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }
const MATE_SCORE = 9000

// Piece-square tables (midgame), White's POV, indexed a8..h1 (row-major, the
// same order `chess.board()` returns). Black mirrors vertically.
// prettier-ignore
const PST: Record<string, number[]> = {
  p: [
      0,  0,  0,  0,  0,  0,  0,  0,
     50, 50, 50, 50, 50, 50, 50, 50,
     10, 10, 20, 30, 30, 20, 10, 10,
      5,  5, 10, 25, 25, 10,  5,  5,
      0,  0,  0, 20, 20,  0,  0,  0,
      5, -5,-10,  0,  0,-10, -5,  5,
      5, 10, 10,-20,-20, 10, 10,  5,
      0,  0,  0,  0,  0,  0,  0,  0,
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0,
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20,
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20,
  ],
}

interface RootMove {
  from: string
  to: string
  promotion?: string
  san: string
  score: number
  pv: string[]
}

function moveInput(move: Move): { from: string; to: string; promotion?: string } {
  return move.promotion
    ? { from: move.from, to: move.to, promotion: move.promotion }
    : { from: move.from, to: move.to }
}

function searchedRootMove(move: Move, score: number, pv: string[]): RootMove {
  return move.promotion
    ? { from: move.from, to: move.to, promotion: move.promotion, san: move.san, score, pv }
    : { from: move.from, to: move.to, san: move.san, score, pv }
}

/** Static evaluation of the position, in centipawns from the side-to-move POV. */
function evaluate(chess: Chess): number {
  let white = 0
  let whiteBishops = 0
  let blackBishops = 0
  const board = chess.board()
  for (let r = 0; r < 8; r++) {
    const row = board[r]

    if (!row) {
      continue
    }

    for (let c = 0; c < 8; c++) {
      const sq = row[c]
      if (!sq) continue
      const base = PIECE_VALUE[sq.type] ?? 0
      const table = PST[sq.type]
      if (sq.color === 'w') {
        white += base + (table?.[r * 8 + c] ?? 0)
        if (sq.type === 'b') whiteBishops++
      } else {
        white -= base + (table?.[(7 - r) * 8 + c] ?? 0)
        if (sq.type === 'b') blackBishops++
      }
    }
  }
  if (whiteBishops >= 2) white += 30
  if (blackBishops >= 2) white -= 30
  const stm = chess.turn() === 'w' ? white : -white
  return stm + 10 // small tempo bonus for the side to move
}

function isTactical(m: Move): boolean {
  return m.captured !== undefined || m.flags.includes('e') || m.promotion !== undefined
}

/** MVV-LVA-ish ordering score: prioritise high-value captures and promotions. */
function orderScore(m: Move): number {
  let s = 0
  if (m.captured) s += 100 * (PIECE_VALUE[m.captured] ?? 0) - (PIECE_VALUE[m.piece] ?? 0)
  if (m.promotion) s += 800 + (PIECE_VALUE[m.promotion] ?? 0)
  if (m.flags.includes('e')) s += 100
  return s
}

interface SearchCtx {
  chess: Chess
  nodes: number
  nodeCap: number
  deadline: number
  stopped: boolean
}

function timeUp(ctx: SearchCtx): boolean {
  if (ctx.stopped) return true
  if ((ctx.nodes & 2047) === 0 && (ctx.nodes >= ctx.nodeCap || Date.now() >= ctx.deadline)) {
    ctx.stopped = true
  }
  return ctx.stopped
}

/**
 * Quiescence search: resolve tactics to a stable position before evaluating.
 * Normally only captures/promotions are explored (stand-pat lower bound). But when
 * the side to move is in CHECK, standing pat is illegal and the only legal replies
 * may be quiet king moves or interpositions — so check nodes search ALL legal
 * evasions (no stand-pat, no tactical-only filter), and a check with no legal reply
 * is checkmate. `ply` is threaded only to give that mate a distance-aware score.
 */
function quiesce(ctx: SearchCtx, alpha: number, beta: number, qdepth: number, ply: number): number {
  ctx.nodes++
  const inCheck = ctx.chess.inCheck()

  if (!inCheck) {
    const standPat = evaluate(ctx.chess)
    if (standPat >= beta) return beta
    if (standPat > alpha) alpha = standPat
    if (qdepth <= 0 || timeUp(ctx)) return alpha
  } else if (timeUp(ctx)) {
    return alpha
  }

  const legal = ctx.chess.moves({ verbose: true })
  if (inCheck && legal.length === 0) return -MATE_SCORE + ply // checkmate
  // In check: search every evasion. Otherwise: captures/promotions only.
  const moves = (inCheck ? legal : legal.filter(isTactical)).sort(
    (a, b) => orderScore(b) - orderScore(a)
  )
  for (const m of moves) {
    ctx.chess.move(moveInput(m))
    const score = -quiesce(ctx, -beta, -alpha, qdepth - 1, ply + 1)
    ctx.chess.undo()
    if (ctx.stopped) return alpha
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

interface NegamaxResult {
  score: number
  pv: string[]
}

function negamax(
  ctx: SearchCtx,
  depth: number,
  ply: number,
  alpha: number,
  beta: number
): NegamaxResult {
  if (timeUp(ctx)) return { score: alpha, pv: [] }
  ctx.nodes++

  if (ctx.chess.isCheckmate()) return { score: -MATE_SCORE + ply, pv: [] }
  if (ctx.chess.isDraw() || ctx.chess.isStalemate() || ctx.chess.isThreefoldRepetition()) {
    return { score: 0, pv: [] }
  }
  if (depth <= 0) return { score: quiesce(ctx, alpha, beta, 8, ply), pv: [] }

  const moves = ctx.chess.moves({ verbose: true }).sort((a, b) => orderScore(b) - orderScore(a))
  let bestPv: string[] = []
  let best = -Infinity
  for (const m of moves) {
    ctx.chess.move(moveInput(m))
    const child = negamax(ctx, depth - 1, ply + 1, -beta, -alpha)
    ctx.chess.undo()
    if (ctx.stopped) break
    const score = -child.score
    if (score > best) {
      best = score
      bestPv = [m.san, ...child.pv]
    }
    if (score > alpha) alpha = score
    if (alpha >= beta) break // beta cut-off
  }
  if (best === -Infinity) return { score: alpha, pv: [] } // no legal moves explored (time-up)
  return { score: best, pv: bestPv }
}

export interface SearchOptions {
  /** Target search depth in plies (capped internally for responsiveness). */
  depth: number
  /** Per-position time budget in ms. */
  maxthinktimes: number
  /** Hard node ceiling (safety guard). */
  nodeCap?: number
}

/** Map the persisted engine "version" to a search-depth ceiling (real effect). */
function depthCapForVersion(version: '1.8' | '2.1' | 'stockfish'): number {
  if (version === 'stockfish') return 6
  if (version === '2.1') return 5
  return 4
}

/** Clamp UI settings into a fast, safe effective search depth. */
export function effectiveDepth(uiDepth: number, version: '1.8' | '2.1' | 'stockfish'): number {
  const cap = depthCapForVersion(version)
  if (!Number.isFinite(uiDepth) || uiDepth <= 0) return cap
  return Math.max(2, Math.min(uiDepth, cap))
}

/**
 * Search a single position and return an `EngineEval` (score from the
 * side-to-move POV, best move, principal variation, and per-move candidate
 * scores for the top root moves).
 */
export function searchPosition(fen: string, options: SearchOptions): EngineEval {
  let chess: Chess
  try {
    chess = new Chess(fen)
  } catch {
    return { fen, score: 0, pv: '', bestMove: '' }
  }

  const moves = chess.moves({ verbose: true }).sort((a, b) => orderScore(b) - orderScore(a))
  if (moves.length === 0) {
    const score = chess.isCheckmate() ? -MATE_SCORE : 0
    return { fen, score, pv: '', bestMove: '' }
  }

  const ctx: SearchCtx = {
    chess,
    nodes: 0,
    nodeCap: options.nodeCap ?? 600_000,
    deadline: Date.now() + Math.max(80, Math.min(options.maxthinktimes || 1500, 8000)),
    stopped: false,
  }
  const targetDepth = Math.max(2, options.depth || 4)

  const firstMove = moves[0]

  if (!firstMove) {
    return { fen, score: 0, pv: '', bestMove: '' }
  }

  // Iterative deepening: keep the best fully-completed iteration's result.
  let best: RootMove = {
    from: firstMove.from,
    to: firstMove.to,
    ...(firstMove.promotion ? { promotion: firstMove.promotion } : {}),
    san: firstMove.san,
    score: 0,
    pv: [firstMove.san],
  }
  const candidates: Record<string, { pv: string; score: number }> = {}

  for (let depth = 1; depth <= targetDepth; depth++) {
    const iter: RootMove[] = []
    // Search the previous best move first for better pruning.
    const ordered = [...moves].sort((a, b) =>
      a.from === best.from && a.to === best.to
        ? -1
        : b.from === best.from && b.to === best.to
          ? 1
          : 0
    )
    let completed = true
    for (const m of ordered) {
      ctx.chess.move(moveInput(m))
      // Full window per root move so candidate scores are exact (true MultiPV).
      const child = negamax(ctx, depth - 1, 1, -Infinity, Infinity)
      ctx.chess.undo()
      if (ctx.stopped) {
        completed = false
        break
      }
      const score = -child.score
      iter.push(searchedRootMove(m, score, [m.san, ...child.pv]))
    }
    if (iter.length === 0) break // time-up before any root move at this depth
    iter.sort((a, b) => b.score - a.score)
    // Keeping a deeper-but-partial iteration's best is safe (and an improvement):
    // the previous best is searched first with a full, exact window, so iter[0] is
    // never worse than the prior depth's choice.
    best = iter[0]!
    // The candidate MAP must stay at a single search depth so its scores remain
    // mutually comparable (the UI/branch logic sorts them). Only refresh it from a
    // fully-completed iteration; a partial final iteration keeps the previous
    // complete depth's candidates (seeded once if the very first depth was cut off).
    if (completed || Object.keys(candidates).length === 0) {
      // Key candidates by full UCI (incl. promotion piece) so the four promotion
      // targets on one from/to square don't collapse onto a single entry.
      for (const c of iter)
        candidates[`${c.from}${c.to}${c.promotion ?? ''}`] = { pv: c.pv.join(' '), score: c.score }
    }
    if (ctx.stopped) break
    if (Math.abs(best.score) >= MATE_SCORE - 100) break // mate found, stop early
  }

  return {
    fen,
    score: best.score,
    pv: best.pv.join(' '),
    bestMove: `${best.from}${best.to}${best.promotion ?? ''}`,
    candidates,
  }
}
