import { Chess } from 'chess.js'
import { defineStore } from 'pinia'

import { serializeAnnotation } from '@/features/annotations/domain/ycdw'
import { computeEvalResult, normalizeEngineScore } from '@/features/analysis/domain/classifyMove'
import type { EngineEval } from '@/features/analysis/domain/engine'
import {
  AnalysisStoppedError,
  createSearchEngine,
  type SearchEngine,
} from '@/features/analysis/domain/searchEngine'
import { effectiveDepth } from '@/features/analysis/domain/search'
import type { MoveNode } from '@/features/pgn/domain/types'

import { usePgnStore } from './pgn'

type AnalysisPhase =
  'idle' | 'initializing' | 'ready' | 'analyzing' | 'available' | 'unavailable' | 'error'
type WorkerMode = 'worker' | 'main-thread-fallback' | 'unavailable'

interface AnalysisContext {
  requestId: number
  nodeId: number
  nodeKey: string
  positionId: string
  fen: string
  parentFen: string | null
  moveFromTo: string | null
}

interface AnalysisScore {
  kind: 'cp' | 'mate'
  value: number
  whiteValue: number
}

export interface AnalysisLine {
  move: string
  pv: string
  score: AnalysisScore
}

interface CurrentAnalysis {
  requestId: number
  nodeId: number
  nodeKey: string
  positionId: string
  fen: string
  raw: EngineEval
  score: AnalysisScore
  pv: string
  pvLegal: boolean
  bestMove: string
  lines: AnalysisLine[]
  analyzedAt: string
}

interface AnalysisState {
  phase: AnalysisPhase
  workerMode: WorkerMode
  workerCount: number
  activeRequest: AnalysisContext | null
  lastContext: Omit<AnalysisContext, 'requestId'> | null
  current: CurrentAnalysis | null
  error: string | null
  unavailableReason: string | null
  staleRejected: number
  completedRequests: number
  cancelledRequests: number
  retryCount: number
}

const MATE_SCORE = 9000
const MATE_SCORE_FLOOR = MATE_SCORE - 100
const DEFAULT_DEPTH = effectiveDepth(16, '1.8')
const DEFAULT_THINK_MS = 900

let engine: SearchEngine | null = null
let requestSeq = 0

function nextRequestId(): number {
  requestSeq += 1
  return requestSeq
}

function createEngine(): SearchEngine {
  const cores =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4

  return createSearchEngine(Math.max(1, Math.min(Math.floor(cores / 2), 4)))
}

function getEngine(): SearchEngine {
  if (!engine) {
    engine = createEngine()
  }

  return engine
}

function disposeEngine(): void {
  engine?.dispose()
  engine = null
}

function hashString(input: string): string {
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function nodeKeyFor(selectedIndex: number, nodeId: number): string {
  return `${selectedIndex}:${nodeId}`
}

function moveFromNode(node: MoveNode): string | null {
  if (!node.from || !node.to) {
    return null
  }

  return `${node.from}${node.to}${node.promotion ?? ''}`
}

function scoreFromEval(fen: string, evalResult: EngineEval): AnalysisScore {
  const normalized = normalizeEngineScore(evalResult.score)
  const turn = fen.split(' ')[1] === 'b' ? 'b' : 'w'
  const whiteValue = turn === 'w' ? normalized : -normalized

  if (Math.abs(normalized) >= MATE_SCORE_FLOOR) {
    const distance = Math.max(0, MATE_SCORE - Math.abs(normalized))

    return {
      kind: 'mate',
      value: Math.sign(normalized) * distance,
      whiteValue: Math.sign(whiteValue) * distance,
    }
  }

  return {
    kind: 'cp',
    value: normalized,
    whiteValue,
  }
}

function validatePv(fen: string, pv: string): boolean {
  const moves = pv.trim().split(/\s+/u).filter(Boolean)

  if (moves.length === 0) {
    return true
  }

  try {
    const chess = new Chess(fen)

    for (const san of moves) {
      const applied = chess.move(san)

      if (!applied) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

function sortedLines(fen: string, evalResult: EngineEval): AnalysisLine[] {
  return Object.entries(evalResult.candidates ?? {})
    .map(([move, candidate]) => ({
      move,
      pv: candidate.pv,
      score: scoreFromEval(fen, {
        fen,
        score: candidate.score,
        pv: candidate.pv,
        bestMove: move,
      }),
    }))
    .sort((left, right) => right.score.value - left.score.value)
    .slice(0, 5)
}

function stopped(error: unknown): boolean {
  return error instanceof AnalysisStoppedError
}

function contextFromCurrentNode(): Omit<AnalysisContext, 'requestId'> | null {
  const pgn = usePgnStore()
  const node = pgn.currentNode

  if (!pgn.hasGame || !node) {
    return null
  }

  return {
    nodeId: node.id,
    nodeKey: nodeKeyFor(pgn.selectedIndex, node.id),
    positionId: hashString(pgn.currentFen),
    fen: pgn.currentFen,
    parentFen: node.parent?.fen ?? null,
    moveFromTo: moveFromNode(node),
  }
}

export const useAnalysisStore = defineStore('analysis', {
  state: (): AnalysisState => ({
    phase: 'idle',
    workerMode: 'unavailable',
    workerCount: 0,
    activeRequest: null,
    lastContext: null,
    current: null,
    error: null,
    unavailableReason: null,
    staleRejected: 0,
    completedRequests: 0,
    cancelledRequests: 0,
    retryCount: 0,
  }),

  getters: {
    running(state): boolean {
      return state.phase === 'initializing' || state.phase === 'analyzing'
    },
    canRetry(state): boolean {
      return Boolean(
        state.lastContext && (state.phase === 'error' || state.phase === 'unavailable')
      )
    },
    hasResult(state): boolean {
      return state.current != null
    },
  },

  actions: {
    async analyzeCurrent(force = false): Promise<boolean> {
      const context = contextFromCurrentNode()

      if (!context) {
        this.stop()
        this.phase = 'idle'
        this.current = null
        this.error = null
        this.unavailableReason = null
        return false
      }

      if (
        !force &&
        this.current?.nodeKey === context.nodeKey &&
        this.current.positionId === context.positionId
      ) {
        return true
      }

      if (
        !force &&
        this.activeRequest?.nodeKey === context.nodeKey &&
        this.activeRequest.positionId === context.positionId
      ) {
        return true
      }

      this.stop()
      const request: AnalysisContext = { ...context, requestId: nextRequestId() }
      this.activeRequest = request
      this.lastContext = context
      this.phase = 'initializing'
      this.error = null
      this.unavailableReason = null

      try {
        const activeEngine = getEngine()
        activeEngine.init()

        if (!this.accepts(request)) {
          this.staleRejected += 1
          return false
        }

        this.workerMode = activeEngine.workerBacked ? 'worker' : 'main-thread-fallback'
        this.workerCount = activeEngine.workerCount
        this.phase = 'ready'
        this.phase = 'analyzing'

        const currentPromise = activeEngine.evalFen(request.fen, {
          depth: DEFAULT_DEPTH,
          maxthinktimes: DEFAULT_THINK_MS,
        })
        const parentPromise = request.parentFen
          ? activeEngine.evalFen(request.parentFen, {
              depth: DEFAULT_DEPTH,
              maxthinktimes: DEFAULT_THINK_MS,
            })
          : Promise.resolve<EngineEval | null>(null)
        const [currentEval, parentEval] = await Promise.all([currentPromise, parentPromise])

        if (!this.accepts(request)) {
          this.staleRejected += 1
          return false
        }

        const pvLegal = validatePv(request.fen, currentEval.pv)
        this.current = {
          requestId: request.requestId,
          nodeId: request.nodeId,
          nodeKey: request.nodeKey,
          positionId: request.positionId,
          fen: request.fen,
          raw: currentEval,
          score: scoreFromEval(request.fen, currentEval),
          pv: pvLegal ? currentEval.pv : '',
          pvLegal,
          bestMove: currentEval.bestMove,
          lines: sortedLines(request.fen, currentEval),
          analyzedAt: new Date().toISOString(),
        }

        this.writeMoveAssessment(request, currentEval, parentEval)
        this.phase = 'available'
        this.completedRequests += 1
        this.activeRequest = null
        return true
      } catch (error) {
        if (stopped(error) || !this.accepts(request)) {
          return false
        }

        this.phase = typeof Worker === 'undefined' ? 'unavailable' : 'error'
        this.workerMode = this.phase === 'unavailable' ? 'unavailable' : this.workerMode
        this.unavailableReason = this.phase === 'unavailable' ? '当前浏览器不支持分析 Worker' : null
        this.error = error instanceof Error ? error.message : '分析失败'
        this.activeRequest = null
        return false
      }
    },

    retry(): Promise<boolean> {
      this.retryCount += 1
      return this.analyzeCurrent(true)
    },

    stop(): void {
      if (this.activeRequest) {
        this.cancelledRequests += 1
      }

      this.activeRequest = null
      engine?.stop()

      if (this.phase === 'initializing' || this.phase === 'analyzing' || this.phase === 'ready') {
        this.phase = this.current ? 'available' : 'idle'
      }
    },

    dispose(): void {
      this.stop()
      disposeEngine()
      this.workerCount = 0
      this.workerMode = 'unavailable'
    },

    accepts(request: AnalysisContext): boolean {
      const pgn = usePgnStore()

      return (
        this.activeRequest?.requestId === request.requestId &&
        pgn.currentNode?.id === request.nodeId &&
        hashString(pgn.currentFen) === request.positionId
      )
    },

    writeMoveAssessment(
      request: AnalysisContext,
      currentEval: EngineEval,
      parentEval: EngineEval | null
    ): void {
      if (!request.parentFen || !request.moveFromTo || !parentEval) {
        return
      }

      const pgn = usePgnStore()
      const node = pgn.currentNode

      if (!node || node.id !== request.nodeId) {
        return
      }

      const result = computeEvalResult({
        r1: currentEval,
        r2: parentEval,
        moveFromTo: request.moveFromTo,
        moveFen: request.fen,
      })

      if (!result) {
        return
      }

      node.annotation = {
        ...node.annotation,
        analysis: {
          ...result,
          analysisScope: 'single',
        },
      }
      node.rawComments = serializeAnnotation(node.annotation)
    },
  },
})
