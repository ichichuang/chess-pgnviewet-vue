import {
  canCopyReadonlySnapshot,
  isLocalEditableDataSource,
  localSourceIdentityLabel,
} from '@/features/pgn/domain/sourceOwnership'
import type { DataSource } from '@/features/pgn/domain/types'

import type { WorkspaceModeContext } from './workspaceModeTypes'

export interface WorkspaceSourceProjection {
  source: DataSource
  hasCanonicalPgnSnapshot: boolean
}

export interface WorkspacePermissions {
  hasSource: boolean
  sourceReadonly: boolean
  isLocalEditable: boolean
  sourceUnavailable: boolean
  canEditBoard: boolean
  canEditAnnotations: boolean
  canEditComments: boolean
  canCreateVariations: boolean
  canEnterBoardEditor: boolean
  canOpenLocalPgnAsNewSource: boolean
  canInsertLocalPgnIntoCurrentSource: boolean
  canMutateCurrentSource: boolean
  canCreateEditableLocalCopy: boolean
  canRunAnalysis: boolean
  canShowEvalBar: boolean
  canShowAnalysisPanel: boolean
  canShowNotation: boolean
  canShowComments: boolean
  canShowAnnotations: boolean
  modeLabel: string
  sourceLabel: string
  sourceIdentityLabel: string
  unavailableReason: string | null
}

const UNAVAILABLE_SOURCES = new Set([
  'cloud_pgn',
  'backend_handoff_pgn',
  'competition_pairing',
  'electronic_board_live',
  'online_game_live',
  'replay_only',
])

export function useWorkspacePermissionAdapter(
  context: WorkspaceModeContext,
  active: WorkspaceSourceProjection
): WorkspacePermissions {
  const hasSource = active.hasCanonicalPgnSnapshot && active.source.type !== 'null'
  const sourceUnavailable =
    !hasSource &&
    (context.mode === 'unknown' ||
      context.source === 'unknown' ||
      UNAVAILABLE_SOURCES.has(context.source))
  const isLocalEditable = hasSource && isLocalEditableDataSource(active.source)
  const sourceReadonly = hasSource ? !isLocalEditable : context.readonly || sourceUnavailable
  const canMutateCurrentSource = isLocalEditable
  const localEntryContext =
    context.mode === 'analysis' && context.source === 'manual_pgn' && !context.readonly

  const canEditBase = canMutateCurrentSource
  const canRunAnalysis = canMutateCurrentSource
  const canShowEvalBar = canRunAnalysis
  const canShowAnalysisPanel = isLocalEditable
  const canShowComments = isLocalEditable
  const canShowAnnotations = isLocalEditable

  return {
    hasSource,
    sourceReadonly,
    isLocalEditable,
    sourceUnavailable,
    canEditBoard: canEditBase,
    canEditAnnotations: canShowAnnotations,
    canEditComments: canShowComments,
    canCreateVariations: canEditBase,
    canEnterBoardEditor: canEditBase || (!hasSource && localEntryContext),
    canOpenLocalPgnAsNewSource: true,
    canInsertLocalPgnIntoCurrentSource: canMutateCurrentSource,
    canMutateCurrentSource,
    canCreateEditableLocalCopy:
      hasSource &&
      context.mode !== 'live_spectator' &&
      (context.mode === 'competition_commentary' || context.mode === 'replay') &&
      canCopyReadonlySnapshot(active.source),
    canRunAnalysis,
    canShowEvalBar,
    canShowAnalysisPanel,
    canShowNotation: true,
    canShowComments,
    canShowAnnotations,
    modeLabel: isLocalEditable ? '本地分析' : modeLabel(context.mode),
    sourceLabel: hasSource
      ? activeSourceLabel(active.source)
      : localEntryContext
        ? '无来源'
        : sourceLabel(context.source),
    sourceIdentityLabel: localSourceIdentityLabel(active.source),
    unavailableReason: sourceUnavailable ? '当前版本暂不支持这项能力。' : null,
  }
}

function activeSourceLabel(source: DataSource): string {
  if (source.ownership === 'local') {
    return source.origin === 'readonly-copy' ? '本地可编辑副本' : '本地可编辑 PGN'
  }

  if (source.origin === 'completed-replay') return '完成棋局只读快照'
  if (source.origin === 'completed-commentary') return '完成赛事讲解只读快照'
  return '无来源'
}

function modeLabel(mode: string): string {
  switch (mode) {
    case 'analysis':
      return '本地分析'
    case 'competition_commentary':
      return '赛事讲解'
    case 'live_spectator':
      return '实时观战'
    case 'replay':
      return '棋局回放'
    default:
      return '未选择来源'
  }
}

function sourceLabel(source: string): string {
  switch (source) {
    case 'manual_pgn':
      return '本地 PGN'
    case 'cloud_pgn':
      return '云端棋谱'
    case 'backend_handoff_pgn':
      return '分享/对接棋谱'
    case 'competition_pairing':
      return '赛事对阵'
    case 'electronic_board_live':
      return '电子棋盘直播'
    case 'online_game_live':
      return '在线对局直播'
    case 'replay_only':
      return '完成棋局回放'
    default:
      return '无来源'
  }
}
