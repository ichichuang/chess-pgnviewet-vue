/**
 * Move-quality classification and per-move result computation.
 *
 * Ported from old analyzePgns.js `evalResult` while keeping the serialized
 * `YCDW:A` field names stable. New engine scores are normalized into the same
 * mover-POV delta contract before assigning legacy-compatible `eval_move`
 * buckets.
 */
import type { AnalysisResult } from './analysisResult'
import type { EngineEval } from './engine'

const MATE_SCORE = 9000
const MATE_SCORE_FLOOR = MATE_SCORE - 100

interface MoveLabel {
  /** 1 (best) .. 8 (worst). */
  eval_move: number
  label: string
  /** True for moves worth flagging in the PGN panel. */
  bad: boolean
}

/**
 * Normalize raw engine scores before delta math. Search engines may encode mates
 * as large sentinel values (our search uses ±(9000 - ply), some UCI engines use
 * much larger numbers); keep distance-encoded local mates, clamp external
 * sentinels, and remove non-finite values before they reach YCDW:A.
 */
export function normalizeEngineScore(score: number): number {
  if (!Number.isFinite(score)) return 0
  const abs = Math.abs(score)
  if (abs >= MATE_SCORE_FLOOR) return Math.sign(score) * Math.min(abs, MATE_SCORE)
  return score
}

function normalizeCandidateScores(candidates: EngineEval['candidates']): EngineEval['candidates'] {
  if (!candidates) return undefined
  return Object.fromEntries(
    Object.entries(candidates).map(([move, c]) => [
      move,
      { ...c, score: normalizeEngineScore(c.score) },
    ])
  )
}

/**
 * Map a centipawn delta (player − engine-best, signed, ≤ 0 for a real move) to a
 * quality bucket. A delta of exactly 0 means the played move was as good as the
 * engine's best, so it belongs in bucket 1 ("最佳一手"); only a strictly negative
 * delta represents a loss.
 *
 * The writer intentionally emits a sparse legacy-compatible subset:
 *   1 best/excellent, 2 good, 4 inaccuracy, 5 mistake, 8 blunder.
 * Historical YCDW:A blobs that contain buckets 3/6/7 are still interpreted by
 * `evalMoveToQuality`.
 */
function classifyDelta(delta: number): MoveLabel {
  if (!Number.isFinite(delta)) return { eval_move: 8, label: '漏着（异常评估）', bad: true }
  if (delta >= -10) return { eval_move: 1, label: '最佳一手', bad: false }
  if (delta >= -30) return { eval_move: 2, label: '好棋', bad: false }
  if (delta >= -50) return { eval_move: 4, label: '不精确', bad: true }
  if (delta >= -100) return { eval_move: 5, label: '错误', bad: true }
  return { eval_move: 8, label: '漏着', bad: true }
}

export interface EvalInputs {
  /** Engine eval of the position AFTER the played move (node.fen). */
  r1: EngineEval
  /** Engine eval of the position BEFORE the played move (parent.fen). */
  r2: EngineEval
  /** The played move as `<from><to>`. */
  moveFromTo: string
  /** FEN after the played move. */
  moveFen: string
}

/**
 * Compute the structured per-move analysis result (advantage, delta, quality).
 * Returns null when there is no usable engine line (e.g. game over).
 */
export function computeEvalResult(input: EvalInputs): AnalysisResult | null {
  const { r1, r2, moveFromTo, moveFen } = input
  const pv = r2.pv
  if (!pv || pv.length === 0) return null

  // Both scores are brought to the MOVER's point of view (positive = good for the
  // side that just moved). `userBestScore` is the engine's best achievable score
  // from the parent position; `userScore` is what the played move actually yields.
  const beforeScore = normalizeEngineScore(r2.score)
  const afterScore = normalizeEngineScore(r1.score)
  const userBestScore = beforeScore
  const userScore = -afterScore

  // Signed loss = how much worse the played move is than the engine's best.
  // 0 means "as good as best"; negative means worse. The sign of EACH score must
  // be preserved — the old code took Math.abs of both operands, which collapsed a
  // +300 → -300 swing to delta 0 (a blunder graded "best") and scored worsening an
  // already-losing position as positive (graded "brilliant"). Never use abs here.
  //
  // Forced mates need no special case: the search encodes mate distance into the
  // score (mate-in-N ≈ ±(MATE_SCORE − N)), so a slower mate yields a small negative
  // delta and throwing the mate away yields a large one. The old `=== 9000`
  // pv-length correction was dead code (the real engine never returns exactly
  // ±9000, only ±(9000 − ply)) and is removed.
  let delta_score = userScore - userBestScore
  // If the player's move equals the engine's best move, there is no loss.
  if (moveFromTo && moveFromTo === r2.bestMove) delta_score = 0

  // Advantage side/score (positive advantageScore = White is better).
  const turn = moveFen.split(' ')[1]
  let advantageScore: number
  let advantageSide: '+-' | '-+' | '=='
  if (turn === 'w') {
    advantageScore = afterScore
    advantageSide = afterScore > 0 ? '+-' : afterScore === 0 ? '==' : '-+'
  } else {
    advantageScore = -afterScore
    advantageSide = afterScore > 0 ? '-+' : afterScore === 0 ? '==' : '+-'
  }

  const { eval_move } = classifyDelta(delta_score)

  const result: AnalysisResult = {
    fen: input.r2.fen,
    pv,
    userScore,
    userBestScore,
    delta_score,
    advantageSide,
    advantageScore,
    eval_move,
    eval_move_pv: pv,
  }
  const candidates = normalizeCandidateScores(r2.candidates)

  if (candidates) {
    result.candidates = candidates
  }

  return result
}
