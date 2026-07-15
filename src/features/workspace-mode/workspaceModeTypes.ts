export type WorkspaceMode =
  'analysis' | 'competition_commentary' | 'live_spectator' | 'replay' | 'unknown'

export type WorkspaceSource =
  | 'manual_pgn'
  | 'cloud_pgn'
  | 'backend_handoff_pgn'
  | 'competition_pairing'
  | 'electronic_board_live'
  | 'online_game_live'
  | 'replay_only'
  | 'unknown'

export interface WorkspaceModeContext {
  mode: WorkspaceMode
  source: WorkspaceSource
  readonly: boolean
  competitionId: string
  groupId: string
  roundId: string
  boardId: string
  gameId: string
  matchId: string
  view: string
  warnings: string[]
}
