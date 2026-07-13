import type { BoardAnnotation } from '@/features/annotations/domain/annotationTypes'

type DataSourceType = 'FS' | 'manual' | 'null' | 'production_api'

export interface DataSource {
  type: DataSourceType
  filename?: string | undefined
}

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
