import type { PgnItem } from '@/features/pgn/domain/types'
import type { WorkspaceEditIdentity } from '@/stores/pgn'
import type { ProductOverlayReturnFocus } from '@/ui/productOverlayFocus'

export type PgnImportIntent = 'open-as-new-source' | 'insert-into-current-source'

type PgnImportPhase =
  | 'idle'
  | 'reading'
  | 'parsing'
  | 'cancelling'
  | 'awaiting-partial-confirmation'
  | 'applying'
  | 'completed'
  | 'cancelled'
  | 'failed'

export type PgnImportFailureReason =
  'unreadable' | 'empty' | 'invalid-pgn' | 'unsupported-content' | 'cancelled-read' | 'stale-target'

type PgnImportFileStatus = 'pending' | 'reading' | 'parsing' | 'success' | 'failure' | 'cancelled'

export interface PgnImportFileResult {
  id: string
  selectionIndex: number
  filename: string
  status: PgnImportFileStatus
  failureReason: PgnImportFailureReason | null
  gameCount: number
}

export interface PgnImportSessionState {
  id: string
  intent: PgnImportIntent
  phase: PgnImportPhase
  currentFilename: string | null
  currentIndex: number
  total: number
  completed: number
  successCount: number
  failureCount: number
  stagedGameCount: number
  appliedGameCount: number
  currentBytesLoaded: number
  currentBytesTotal: number
  results: PgnImportFileResult[]
  statusMessage: string
  focusRequest: number
}

export interface PgnImportTarget {
  intent: PgnImportIntent
  expectedIdentity: WorkspaceEditIdentity
  returnFocus: ProductOverlayReturnFocus
}

export type PgnImportApplicationResult = 'applied' | 'cancelled' | 'stale' | 'failed'

export interface PgnImportApplicationRequest {
  target: PgnImportTarget
  items: PgnItem[]
  successfulFilenames: string[]
  isCurrent: () => boolean
}
