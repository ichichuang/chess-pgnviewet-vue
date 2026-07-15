import type { WorkspaceModeContext } from './workspaceModeTypes'

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
  canImportLocalPgn: boolean
  canImportAsLocalCopy: boolean
  canRunAnalysis: boolean
  canShowEvalBar: boolean
  canShowAnalysisPanel: boolean
  canShowNotation: boolean
  canShowComments: boolean
  canShowAnnotations: boolean
  modeLabel: string
  sourceLabel: string
  unavailableReason: string | null
}

const UNAVAILABLE_SOURCES = new Set([
  'cloud_pgn',
  'backend_handoff_pgn',
  'electronic_board_live',
  'online_game_live',
  'replay_only',
])

const LOCAL_EDITABLE_SOURCES = new Set(['manual_pgn'])

export function useWorkspacePermissionAdapter(context: WorkspaceModeContext): WorkspacePermissions {
  const hasSource = context.source !== 'unknown' && context.mode !== 'unknown'
  const sourceUnavailable =
    context.mode === 'unknown' ||
    context.source === 'unknown' ||
    UNAVAILABLE_SOURCES.has(context.source)
  const sourceReadonly = context.readonly || sourceUnavailable
  const isLocalEditable = LOCAL_EDITABLE_SOURCES.has(context.source) && !sourceReadonly

  const canEditBase = isLocalEditable
  const canRunAnalysis = isLocalEditable
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
    canEnterBoardEditor: canEditBase,
    canImportLocalPgn: true,
    canImportAsLocalCopy: context.mode === 'competition_commentary' || context.mode === 'replay',
    canRunAnalysis,
    canShowEvalBar,
    canShowAnalysisPanel,
    canShowNotation: true,
    canShowComments,
    canShowAnnotations,
    modeLabel: modeLabel(context.mode),
    sourceLabel: sourceLabel(context.source),
    unavailableReason: sourceUnavailable ? '当前版本暂不支持这项能力。' : null,
  }
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
