import type { BoardAnnotation } from '@/features/annotations/domain/annotationTypes'

interface EmptyDataSource {
  type: 'null'
  id: ''
  ownership: 'none'
  editable: false
  localCopyPolicy: 'forbidden'
  origin: 'none'
}

interface LocalDataSource {
  type: 'FS' | 'manual'
  id: string
  ownership: 'local'
  editable: true
  localCopyPolicy: 'not-applicable'
  origin: 'local-file' | 'manual-position' | 'readonly-copy'
  filename?: string | undefined
}

interface ReadonlyDataSource {
  type: 'remote_replay' | 'competition_snapshot'
  id: string
  ownership: 'remote'
  editable: false
  localCopyPolicy: 'completed-snapshot' | 'forbidden'
  origin: 'completed-replay' | 'completed-commentary'
  filename?: string | undefined
}

export type DataSource = EmptyDataSource | LocalDataSource | ReadonlyDataSource

export interface MoveNode {
  id: number
  san: string
  from?: string | undefined
  to?: string | undefined
  promotion?: string | undefined
  fen: string
  prevFen?: string | undefined
  ply: number
  moveNumber: number
  color: 'w' | 'b' | null
  rawComments: string[]
  annotation: BoardAnnotation
  nags: string[]
  parent: MoveNode | null
  children: MoveNode[]
}

export interface GameTree {
  startFen: string
  fromFen: boolean
  root: MoveNode
}

export interface PgnItem {
  headers: string[]
  tags: Record<string, string>
  FEN?: string | undefined
  PGN: string
  Event?: string | undefined
  White?: string | undefined
  Black?: string | undefined
  Result?: string | undefined
  pgnTitle?: string | undefined
  description?: string | undefined
  last_fen?: string | undefined
  dataSource?: DataSource | undefined
  tree?: GameTree | undefined
  parseError?: boolean | undefined
}
