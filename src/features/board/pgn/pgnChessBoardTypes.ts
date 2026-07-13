import type { BoardAnnotation } from '@/features/annotations/domain/annotationTypes'
import type { MoveNode, PgnItem } from '@/features/pgn/domain/types'

import type {
  ChessboardCapabilities,
  ChessboardEvents,
  ChessboardExposed,
} from '../domain/boardCapabilities'

export type PgnChessBoardSource = string | PgnItem | readonly PgnItem[] | null

export type PgnNavigationReason =
  'load' | 'game' | 'node' | 'start' | 'end' | 'previous' | 'next' | 'variation' | 'move'

export type PgnChessBoardErrorCode =
  'empty-pgn' | 'invalid-pgn' | 'missing-tree' | 'invalid-game-index' | 'invalid-node'

export interface PgnChessBoardError {
  code: PgnChessBoardErrorCode
  message: string
  recoverable: boolean
}

export interface PgnNodeSnapshot {
  id: number
  san: string
  from: string | null
  to: string | null
  promotion: string | null
  fen: string
  ply: number
  moveNumber: number
  color: MoveNode['color']
  parentId: number | null
  childIds: readonly number[]
  annotation: BoardAnnotation
}

export interface PgnGameSummary {
  index: number
  title: string
  white: string | null
  black: string | null
  result: string | null
  rootNodeId: number
}

export interface PgnNavigationEvent {
  reason: PgnNavigationReason
  gameIndex: number
  previousNodeId: number | null
  currentNode: PgnNodeSnapshot
  pathNodeIds: readonly number[]
}

export interface PgnSourceChangeEvent {
  games: readonly PgnGameSummary[]
  selectedGameIndex: number
  currentNode: PgnNodeSnapshot
}

export interface PgnChessBoardProps {
  pgn?: PgnChessBoardSource | undefined
  initialPgn?: Exclude<PgnChessBoardSource, null> | undefined
  position?: string | undefined
  lastMove?: readonly [string, string] | undefined
  annotations?: BoardAnnotation | undefined
  capabilities?: ChessboardCapabilities | undefined
  gameIndex?: number | undefined
  nodeId?: number | null | undefined
  preserveOnInvalid?: boolean | undefined
}

export interface PgnChessBoardEvents extends ChessboardEvents {
  'pgn-change': [event: PgnSourceChangeEvent]
  'pgn-remove': []
  'pgn-error': [error: PgnChessBoardError]
  'game-change': [game: PgnGameSummary]
  'current-node-change': [node: PgnNodeSnapshot]
  navigation: [event: PgnNavigationEvent]
  'update:gameIndex': [index: number]
  'update:nodeId': [nodeId: number | null]
}

export interface PgnChessBoardExposed extends Pick<
  ChessboardExposed,
  | 'cancelPromotion'
  | 'clearAnnotations'
  | 'flipOrientation'
  | 'getPosition'
  | 'redoAnnotations'
  | 'resolvePromotion'
  | 'setOrientation'
  | 'undoAnnotations'
> {
  getCurrentNode: () => PgnNodeSnapshot | null
  getGames: () => readonly PgnGameSummary[]
  goToEnd: () => boolean
  goToStart: () => boolean
  next: () => boolean
  previous: () => boolean
  removePgn: () => void
  replacePgn: (source: Exclude<PgnChessBoardSource, null>) => boolean
  selectGame: (index: number) => boolean
  selectNode: (nodeId: number) => boolean
  selectVariation: (index: number) => boolean
}
