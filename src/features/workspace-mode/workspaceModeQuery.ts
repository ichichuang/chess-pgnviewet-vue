import type { WorkspaceMode, WorkspaceModeContext, WorkspaceSource } from './workspaceModeTypes'

type WorkspaceModeQueryValue =
  string | number | Array<string | number | null | undefined> | null | undefined

type WorkspaceModeQuery = Record<string, WorkspaceModeQueryValue>

export interface WorkspaceModeRouteInput {
  name?: unknown
  query?: WorkspaceModeQuery
}

const MODE_ALIASES: Record<string, WorkspaceMode> = {
  analysis: 'analysis',
  commentary: 'competition_commentary',
  competition_commentary: 'competition_commentary',
  live: 'live_spectator',
  live_spectator: 'live_spectator',
  replay: 'replay',
  spectator: 'live_spectator',
  unknown: 'unknown',
}

const SOURCE_ALIASES: Record<string, WorkspaceSource> = {
  backend_handoff: 'backend_handoff_pgn',
  backend_handoff_pgn: 'backend_handoff_pgn',
  cloud: 'cloud_pgn',
  cloud_pgn: 'cloud_pgn',
  competition_pairing: 'competition_pairing',
  electronic_board_live: 'electronic_board_live',
  hardware_live: 'electronic_board_live',
  manual: 'manual_pgn',
  manual_pgn: 'manual_pgn',
  online_game_live: 'online_game_live',
  pairing: 'competition_pairing',
  replay: 'replay_only',
  replay_only: 'replay_only',
  unknown: 'unknown',
}

const SAFE_ANALYSIS_SOURCES = new Set<WorkspaceSource>([
  'manual_pgn',
  'cloud_pgn',
  'backend_handoff_pgn',
])

function emptyContext(
  mode: WorkspaceMode,
  source: WorkspaceSource,
  warnings: string[] = []
): WorkspaceModeContext {
  return {
    mode,
    source,
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
    warnings,
  }
}

function queryValues(query: WorkspaceModeQuery, key: string): string[] {
  const value = query[key]
  const values = Array.isArray(value) ? value : [value]
  return values
    .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
    .map((item) => String(item).trim())
    .filter(Boolean)
}

function queryText(query: WorkspaceModeQuery, key: string): string {
  const values = queryValues(query, key)
  return values.length ? (values.at(-1) ?? '') : ''
}

function normalizeToken(text: string): string {
  return text.trim().toLowerCase()
}

function isUnsafeExternalOrMalformed(text: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/iu.test(text) || text.startsWith('//') || containsUnsafeTextCharacter(text)
  )
}

function containsUnsafeTextCharacter(text: string): boolean {
  for (const character of text) {
    const code = character.charCodeAt(0)

    if (code <= 31 || character === '<' || character === '>' || character === '`') {
      return true
    }

    if (character === '"' || character === "'") {
      return true
    }
  }

  return false
}

function safeField(
  query: WorkspaceModeQuery,
  key: string,
  field: string,
  warnings: string[]
): string {
  const text = queryText(query, key)
  if (!text) {
    return ''
  }

  if (isUnsafeExternalOrMalformed(text)) {
    warnings.push(`${field} ignored: unsafe or malformed value`)
    return ''
  }

  return text
}

function safeAliasField(
  query: WorkspaceModeQuery,
  keys: string[],
  field: string,
  warnings: string[]
): string {
  const uniqueValues = [
    ...new Set(keys.map((key) => safeField(query, key, field, warnings)).filter(Boolean)),
  ]

  if (uniqueValues.length > 1) {
    warnings.push(`${field} ignored: ambiguous aliases`)
    return ''
  }

  return uniqueValues[0] ?? ''
}

function normalizeMode(raw: string): WorkspaceMode {
  if (!raw) {
    return 'analysis'
  }

  return MODE_ALIASES[normalizeToken(raw)] ?? 'unknown'
}

function normalizeSource(raw: string, mode: WorkspaceMode): WorkspaceSource {
  if (!raw) {
    if (mode === 'analysis') {
      return 'manual_pgn'
    }

    if (mode === 'competition_commentary') {
      return 'competition_pairing'
    }

    return 'unknown'
  }

  return SOURCE_ALIASES[normalizeToken(raw)] ?? 'unknown'
}

function normalizeReadonly(raw: string): boolean {
  const flag = normalizeToken(raw)
  return flag === '1' || flag === 'readonly' || flag === 'true' || flag === 'yes'
}

function publicPgnQuerySource(query: WorkspaceModeQuery): WorkspaceSource | null {
  const type = normalizeToken(queryText(query, 'type'))

  if (type === 'cloud' || type === 'match' || type === 'share') {
    return 'unknown'
  }

  return null
}

function validateModeSource(
  mode: WorkspaceMode,
  source: WorkspaceSource,
  warnings: string[]
): { mode: WorkspaceMode; source: WorkspaceSource } {
  if (mode === 'unknown' || source === 'unknown') {
    warnings.push('workspace mode/source ignored: unknown value')
    return { mode: 'unknown', source: 'unknown' }
  }

  if (mode === 'analysis' && SAFE_ANALYSIS_SOURCES.has(source)) {
    return { mode, source }
  }

  if (
    mode === 'competition_commentary' &&
    (source === 'competition_pairing' || source === 'electronic_board_live')
  ) {
    return { mode, source }
  }

  if (
    mode === 'live_spectator' &&
    (source === 'electronic_board_live' || source === 'online_game_live')
  ) {
    return { mode, source }
  }

  if (mode === 'replay' && source === 'replay_only') {
    return { mode, source }
  }

  warnings.push('workspace mode/source ignored: incompatible combination')
  return { mode: 'unknown', source: 'unknown' }
}

function parseWorkspaceModeQuery(query: WorkspaceModeQuery = {}): WorkspaceModeContext {
  const warnings: string[] = []
  const mode = normalizeMode(queryText(query, 'mode'))
  const source = normalizeSource(queryText(query, 'source'), mode)
  const validated = validateModeSource(mode, source, warnings)
  const context = emptyContext(validated.mode, validated.source, warnings)

  context.readonly = normalizeReadonly(queryText(query, 'readonly'))
  context.competitionId = safeField(query, 'hdid', 'competitionId', warnings)
  context.groupId = safeField(query, 'group', 'groupId', warnings)
  context.roundId = safeField(query, 'round', 'roundId', warnings)
  context.boardId = safeAliasField(query, ['board', 'boardId'], 'boardId', warnings)
  context.gameId = safeAliasField(query, ['gameId', 'gameid'], 'gameId', warnings)
  context.matchId = safeAliasField(query, ['matchId', 'matchid'], 'matchId', warnings)
  context.view = safeField(query, 'view', 'view', warnings)

  return context
}

export function resolveWorkspaceModeRouteContext(
  route: WorkspaceModeRouteInput
): WorkspaceModeContext {
  const query = route.query ?? {}
  const publicSource = publicPgnQuerySource(query)

  if (publicSource) {
    return emptyContext('analysis', publicSource)
  }

  return parseWorkspaceModeQuery(query)
}
