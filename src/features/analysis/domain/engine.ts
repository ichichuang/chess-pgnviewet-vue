export interface EngineEvalOptions {
  depth: number
  /** Per-position think budget in ms. */
  maxthinktimes: number
}

/**
 * One position evaluation. Scores are centipawns from the side-to-move point of
 * view. Forced mates are distance encoded near +/-9000 by the canonical search.
 */
export interface EngineEval {
  fen: string
  score: number
  pv: string
  bestMove: string
  candidates?: Record<string, { pv: string; score: number }>
}

export interface AnalysisEngine {
  init?(): void | Promise<void>
  evalFen(fen: string, options: EngineEvalOptions): Promise<EngineEval>
  dispose?(): void
}
