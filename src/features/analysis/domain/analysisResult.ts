/**
 * AI analysis result shape, compatible with the old engine output that gets
 * serialized into the `YCDW:A=<base64-json>` PGN annotation field.
 *
 * Old code stored a JSON blob; new code keeps the same field names so existing
 * saved/shared PGNs decode without loss. Unknown extra keys are preserved via
 * the index signature.
 */
import { z } from 'zod'

export interface AnalysisResult {
  fen?: string
  pv?: string
  userSan?: string
  userScore?: number
  userBestScore?: number
  delta_score?: number
  advantageScore?: number
  advantageSide?: '+-' | '-+' | '=='
  /** Move-quality classification bucket from the old engine. */
  eval_move?: number
  eval_move_pv?: string
  candidates?: Record<string, { pv: string; score: number }>
  // Preserve any forward-compatible fields we do not model yet.
  [key: string]: unknown
}

const AnalysisCandidateSchema = z
  .object({
    pv: z.string(),
    score: z.number().refine(Number.isFinite),
  })
  .passthrough()

const AnalysisResultSchema = z
  .object({
    fen: z.string().optional(),
    pv: z.string().optional(),
    userSan: z.string().optional(),
    userScore: z.number().refine(Number.isFinite).optional(),
    userBestScore: z.number().refine(Number.isFinite).optional(),
    delta_score: z.number().refine(Number.isFinite).optional(),
    advantageScore: z.number().refine(Number.isFinite).optional(),
    advantageSide: z.enum(['+-', '-+', '==']).optional(),
    eval_move: z.number().int().optional(),
    eval_move_pv: z.string().optional(),
    candidates: z.record(z.string(), AnalysisCandidateSchema).optional(),
  })
  .catchall(z.unknown())

export function parseAnalysisResult(value: unknown): AnalysisResult | null {
  const parsed = AnalysisResultSchema.safeParse(value)

  return parsed.success ? (parsed.data as AnalysisResult) : null
}
