import type { WorkspaceModeContext } from './workspaceModeTypes'

export interface WorkspaceModeRouteInput {
  name?: unknown
  query?: Record<string, unknown>
}

function createDefaultLocalContext(): WorkspaceModeContext {
  return {
    mode: 'analysis',
    source: 'manual_pgn',
    readonly: false,
    competitionId: '',
    groupId: '',
    roundId: '',
    boardId: '',
    qrcode: '',
    serialNumber: '',
    gameId: '',
    matchId: '',
    view: '',
    warnings: [],
  }
}

export function resolveWorkspaceModeRouteContext(
  _route: WorkspaceModeRouteInput
): WorkspaceModeContext {
  // 根路由只接受 handoff ID；没有 handoff 时进入默认本地分析上下文。
  // 禁止通过 ?mode、?source、?readonly、?qrcode、?sn 等直接注入远程来源上下文。
  return createDefaultLocalContext()
}
