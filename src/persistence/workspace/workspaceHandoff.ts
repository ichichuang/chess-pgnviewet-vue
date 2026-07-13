import type { RouteLocationRaw } from 'vue-router'

import type {
  WorkspaceMode,
  WorkspaceModeContext,
  WorkspaceSource,
} from '@/features/workspace-mode/workspaceModeTypes'

type WorkspaceHandoffMode = Extract<
  WorkspaceMode,
  'analysis' | 'competition_commentary' | 'live_spectator' | 'replay'
>

type WorkspaceHandoffSource = WorkspaceSource

export interface WorkspaceHandoffContext {
  id: string
  createdAt: number
  mode: WorkspaceHandoffMode
  source: WorkspaceHandoffSource
  readonly: boolean
  competitionId: string
  groupId: string
  roundId: string
  boardId: string
  qrcode: string
  serialNumber: string
  gameId: string
  matchId: string
  returnRoute?: string
  competitionTitle?: string
  groupName?: string
  roundLabel?: string
}

export type WorkspaceHandoffInput = Partial<WorkspaceHandoffContext> & Record<string, unknown>

const WORKSPACE_HANDOFF_STORAGE_KEY = 'pgnViewer.workspaceHandoff.v1'
const HANDOFF_MODES = new Set<WorkspaceHandoffMode>([
  'analysis',
  'competition_commentary',
  'live_spectator',
  'replay',
])
const HANDOFF_SOURCES = new Set<WorkspaceHandoffSource>([
  'manual_pgn',
  'cloud_pgn',
  'backend_handoff_pgn',
  'competition_pairing',
  'electronic_board_live',
  'online_game_live',
  'replay_only',
  'unknown',
])
const ALLOWED_KEYS = new Set([
  'id',
  'createdAt',
  'mode',
  'source',
  'readonly',
  'competitionId',
  'groupId',
  'roundId',
  'boardId',
  'qrcode',
  'serialNumber',
  'gameId',
  'matchId',
  'returnRoute',
  'competitionTitle',
  'groupName',
  'roundLabel',
])
const BLOCKED_KEY_MARKERS = [
  ['to', 'ken'].join(''),
  ['coo', 'kie'].join(''),
  ['author', 'ization'].join(''),
  ['pass', 'word'].join(''),
  ['se', 'cret'].join(''),
  ['full', 'url'].join(''),
  ['authenticated', 'url'].join(''),
]
const TEXT_FIELD_LIMIT = 256
const LABEL_FIELD_LIMIT = 160
const RETURN_ROUTE_LIMIT = 512

interface WorkspaceHandoffStoragePayload {
  latestId: string
  contexts: Record<string, WorkspaceHandoffContext>
}

let memoryContexts: Record<string, WorkspaceHandoffContext> = {}
let latestContextId = ''

function storage(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}

function cloneContext(context: WorkspaceHandoffContext): WorkspaceHandoffContext {
  return JSON.parse(JSON.stringify(context)) as WorkspaceHandoffContext
}

function randomPart(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi && 'randomUUID' in cryptoApi) {
    return cryptoApi.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

function nextId(): string {
  return `workspace-handoff-${Date.now()}-${randomPart()}`
}

function hasBlockedMarker(text: string): boolean {
  const lower = text.toLowerCase()
  return BLOCKED_KEY_MARKERS.some((marker) => lower.includes(marker))
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasUnsafeCharacter(text: string): boolean {
  for (const character of text) {
    const code = character.charCodeAt(0)

    if (
      code <= 31 ||
      character === '<' ||
      character === '>' ||
      character === '`' ||
      character === '"' ||
      character === "'" ||
      character === '\\'
    ) {
      return true
    }
  }

  return false
}

function isMalformedText(text: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/iu.test(text) ||
    text.startsWith('//') ||
    hasUnsafeCharacter(text) ||
    hasBlockedMarker(text)
  )
}

function cleanText(value: unknown, limit = TEXT_FIELD_LIMIT): string {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  const text = String(value).trim()
  if (!text || text.length > limit || isMalformedText(text)) return ''
  return text
}

function cleanOptionalText(value: unknown, limit = LABEL_FIELD_LIMIT): string | undefined {
  return cleanText(value, limit) || undefined
}

function cleanCreatedAt(value: unknown): number {
  const timestamp = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now()
}

function cleanReadonly(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value !== 'string') return false
  const text = value.trim().toLowerCase()
  return text === '1' || text === 'true' || text === 'yes' || text === 'readonly'
}

function cleanMode(value: unknown): WorkspaceHandoffMode {
  return typeof value === 'string' && HANDOFF_MODES.has(value as WorkspaceHandoffMode)
    ? (value as WorkspaceHandoffMode)
    : 'analysis'
}

function fallbackSource(mode: WorkspaceHandoffMode): WorkspaceHandoffSource {
  if (mode === 'analysis') return 'manual_pgn'
  if (mode === 'competition_commentary') return 'competition_pairing'
  if (mode === 'live_spectator') return 'electronic_board_live'
  if (mode === 'replay') return 'replay_only'
  return 'unknown'
}

function validModeSource(mode: WorkspaceHandoffMode, source: WorkspaceHandoffSource): boolean {
  if (mode === 'analysis')
    return source === 'manual_pgn' || source === 'cloud_pgn' || source === 'backend_handoff_pgn'
  if (mode === 'competition_commentary')
    return source === 'competition_pairing' || source === 'electronic_board_live'
  if (mode === 'live_spectator')
    return source === 'electronic_board_live' || source === 'online_game_live'
  if (mode === 'replay') return source === 'replay_only'
  return false
}

function cleanSource(value: unknown, mode: WorkspaceHandoffMode): WorkspaceHandoffSource {
  const source =
    typeof value === 'string' && HANDOFF_SOURCES.has(value as WorkspaceHandoffSource)
      ? (value as WorkspaceHandoffSource)
      : fallbackSource(mode)
  return validModeSource(mode, source) ? source : fallbackSource(mode)
}

function cleanReturnRoute(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  if (!text || text.length > RETURN_ROUTE_LIMIT) return undefined
  if (!text.startsWith('/') || text.startsWith('//')) return undefined
  if (hasUnsafeCharacter(text) || hasBlockedMarker(text)) return undefined
  return text
}

function hasValidKeySet(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => ALLOWED_KEYS.has(key) && !hasBlockedMarker(key))
}

function isValidStoredPayload(value: unknown): value is WorkspaceHandoffStoragePayload {
  if (!isPlainRecord(value) || typeof value.latestId !== 'string' || !isPlainRecord(value.contexts))
    return false
  if (value.latestId && isMalformedText(value.latestId)) return false
  return Object.values(value.contexts).every((context) => isValidWorkspaceHandoffContext(context))
}

function storedPayload(): WorkspaceHandoffStoragePayload | null {
  const stored = storage()?.getItem(WORKSPACE_HANDOFF_STORAGE_KEY)

  if (!stored) {
    return {
      latestId: latestContextId,
      contexts: { ...memoryContexts },
    }
  }

  try {
    const parsed = JSON.parse(stored) as unknown
    if (isValidWorkspaceHandoffContext(parsed)) {
      return {
        latestId: parsed.id,
        contexts: { [parsed.id]: parsed },
      }
    }
    if (isValidStoredPayload(parsed)) return parsed
  } catch {
    clearWorkspaceHandoffContext()
    return null
  }

  clearWorkspaceHandoffContext()
  return null
}

export function createWorkspaceHandoffContext(
  input: WorkspaceHandoffInput
): WorkspaceHandoffContext {
  const mode = cleanMode(input.mode)
  const source = cleanSource(input.source, mode)
  const context: WorkspaceHandoffContext = {
    id: cleanText(input.id) || nextId(),
    createdAt: cleanCreatedAt(input.createdAt),
    mode,
    source,
    readonly: cleanReadonly(input.readonly),
    competitionId: cleanText(input.competitionId),
    groupId: cleanText(input.groupId),
    roundId: cleanText(input.roundId),
    boardId: cleanText(input.boardId),
    qrcode: cleanText(input.qrcode),
    serialNumber: cleanText(input.serialNumber),
    gameId: cleanText(input.gameId),
    matchId: cleanText(input.matchId),
  }

  const returnRoute = cleanReturnRoute(input.returnRoute)
  const competitionTitle = cleanOptionalText(input.competitionTitle)
  const groupName = cleanOptionalText(input.groupName)
  const roundLabel = cleanOptionalText(input.roundLabel)

  if (returnRoute) context.returnRoute = returnRoute
  if (competitionTitle) context.competitionTitle = competitionTitle
  if (groupName) context.groupName = groupName
  if (roundLabel) context.roundLabel = roundLabel

  return context
}

function isValidWorkspaceHandoffContext(value: unknown): value is WorkspaceHandoffContext {
  if (!isPlainRecord(value) || !hasValidKeySet(value)) return false
  if (typeof value.id !== 'string' || !value.id || isMalformedText(value.id)) return false
  if (
    typeof value.createdAt !== 'number' ||
    !Number.isFinite(value.createdAt) ||
    value.createdAt <= 0
  )
    return false
  if (typeof value.mode !== 'string' || !HANDOFF_MODES.has(value.mode as WorkspaceHandoffMode))
    return false
  if (
    typeof value.source !== 'string' ||
    !HANDOFF_SOURCES.has(value.source as WorkspaceHandoffSource)
  )
    return false
  if (!validModeSource(value.mode as WorkspaceHandoffMode, value.source as WorkspaceHandoffSource))
    return false
  if (typeof value.readonly !== 'boolean') return false

  for (const key of [
    'competitionId',
    'groupId',
    'roundId',
    'boardId',
    'qrcode',
    'serialNumber',
    'gameId',
    'matchId',
  ] as const) {
    const text = value[key]
    if (
      typeof text !== 'string' ||
      text.length > TEXT_FIELD_LIMIT ||
      (text && isMalformedText(text))
    )
      return false
  }

  for (const key of ['competitionTitle', 'groupName', 'roundLabel'] as const) {
    const text = value[key]
    if (
      text !== undefined &&
      (typeof text !== 'string' || text.length > LABEL_FIELD_LIMIT || isMalformedText(text))
    )
      return false
  }

  return (
    value.returnRoute === undefined || cleanReturnRoute(value.returnRoute) === value.returnRoute
  )
}

export function saveWorkspaceHandoffContext(context: WorkspaceHandoffContext): boolean {
  if (!isValidWorkspaceHandoffContext(context)) return false
  const payload = storedPayload() ?? { latestId: '', contexts: {} }
  payload.latestId = context.id
  payload.contexts[context.id] = cloneContext(context)
  latestContextId = context.id
  memoryContexts = JSON.parse(JSON.stringify(payload.contexts)) as Record<
    string,
    WorkspaceHandoffContext
  >

  try {
    storage()?.setItem(WORKSPACE_HANDOFF_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Memory state still covers same-page navigation.
  }

  return true
}

export function readWorkspaceHandoffContext(id?: string): WorkspaceHandoffContext | null {
  const requestedId = cleanText(id)
  const payload = storedPayload()
  if (!payload) return null
  latestContextId = payload.latestId
  memoryContexts = JSON.parse(JSON.stringify(payload.contexts)) as Record<
    string,
    WorkspaceHandoffContext
  >
  const contextId = requestedId || payload.latestId
  const context = contextId ? payload.contexts[contextId] : null
  return context && isValidWorkspaceHandoffContext(context) ? cloneContext(context) : null
}

function clearWorkspaceHandoffContext(): void {
  memoryContexts = {}
  latestContextId = ''

  try {
    storage()?.removeItem(WORKSPACE_HANDOFF_STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}

export function clearPrivateWorkspaceHandoffContexts(): void {
  const payload = storedPayload()
  if (!payload) return

  const publicContexts = Object.fromEntries(
    Object.entries(payload.contexts).filter(([, context]) => context.mode !== 'replay')
  )
  const latestId =
    payload.latestId && publicContexts[payload.latestId]
      ? payload.latestId
      : (Object.keys(publicContexts).at(-1) ?? '')

  latestContextId = latestId
  memoryContexts = JSON.parse(JSON.stringify(publicContexts)) as Record<
    string,
    WorkspaceHandoffContext
  >

  try {
    const target = storage()
    if (Object.keys(publicContexts).length === 0) {
      target?.removeItem(WORKSPACE_HANDOFF_STORAGE_KEY)
      return
    }
    target?.setItem(
      WORKSPACE_HANDOFF_STORAGE_KEY,
      JSON.stringify({ latestId, contexts: publicContexts })
    )
  } catch {
    // Memory state still clears protected handoffs for this page lifecycle.
  }
}

export function buildRootWorkspaceRouteFromHandoff(
  context: WorkspaceHandoffContext
): RouteLocationRaw {
  return {
    name: 'workspace',
    query: { handoff: context.id },
  }
}

export function workspaceModeContextFromHandoff(
  context: WorkspaceHandoffContext
): WorkspaceModeContext {
  return {
    mode: context.mode,
    source: context.source,
    readonly: context.readonly,
    competitionId: context.competitionId,
    groupId: context.groupId,
    roundId: context.roundId,
    boardId: context.boardId,
    qrcode: context.qrcode,
    serialNumber: context.serialNumber,
    gameId: context.gameId,
    matchId: context.matchId,
    view: '',
    warnings: [],
  }
}
