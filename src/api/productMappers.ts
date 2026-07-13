import { Chess } from 'chess.js'
import { z } from 'zod'

import { ApiClientError } from './client'
import type {
  Competition,
  CompetitionDetail,
  CompetitionGroup,
  CompetitionPairing,
  CompetitionRound,
  FinishedGameReplay,
  PageResult,
  RawApiRecord,
} from './productTypes'

const ApiRecordSchema = z.record(z.string(), z.unknown())

const LIST_ARRAY_KEYS = [
  'Details',
  'content',
  'data',
  'matches',
  'list',
  'rows',
  'records',
  'items',
  'result',
  'actlist',
  'group_list',
  'roundinfo',
  'roundlist',
  'pairlist',
] as const

function isRecord(value: unknown): value is RawApiRecord {
  return ApiRecordSchema.safeParse(value).success
}

function parseJsonString(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed || !/^[{[]/u.test(trimmed)) return value

  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return value
  }
}

function textValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }
  return ''
}

function recordFrom(value: unknown, seen = new Set<unknown>()): RawApiRecord | null {
  const parsed = parseJsonString(value)
  if (!isRecord(parsed) || seen.has(parsed)) return null
  seen.add(parsed)

  for (const key of ['content', 'data', 'result']) {
    const nested = parsed[key]
    if (!isRecord(nested)) continue
    const unwrapped = recordFrom(nested, seen)
    if (unwrapped) return unwrapped
  }

  return parsed
}

function firstString(record: RawApiRecord, keys: readonly string[]): string {
  for (const key of keys) {
    const text = textValue(record[key])
    if (text) return text
  }
  return ''
}

function firstNumber(record: RawApiRecord, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = record[key]
    if (value == null || value === '') continue
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

function findArray(value: unknown, seen = new Set<unknown>()): unknown[] | null {
  const parsed = parseJsonString(value)
  if (Array.isArray(parsed)) return Array.from(parsed as readonly unknown[])
  if (!isRecord(parsed) || seen.has(parsed)) return null
  seen.add(parsed)

  for (const key of LIST_ARRAY_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(parsed, key)) continue
    const found = findArray(parsed[key], seen)
    if (found) return found
  }

  return null
}

function findTotal(value: unknown, seen = new Set<unknown>()): number | null {
  const parsed = parseJsonString(value)
  if (!isRecord(parsed) || seen.has(parsed)) return null
  seen.add(parsed)

  const own = firstNumber(parsed, ['Total', 'total', 'count', 'recordsTotal', 'allcount'])
  if (own != null) return own

  for (const key of ['content', 'data', 'result']) {
    const nested = findTotal(parsed[key], seen)
    if (nested != null) return nested
  }

  return null
}

function assertServiceOk(raw: unknown): void {
  const outer = recordFrom(raw)
  if (!outer) return
  const resp = isRecord(outer.resp) ? outer.resp : null
  const err = resp?.err

  if (err !== undefined && Number(err) !== 0) {
    throw new ApiClientError({
      kind: 'upstream',
      message: (resp ? firstString(resp, ['msg', 'errmsg']) : '') || '赛事数据返回业务错误',
    })
  }

  const code = outer.code
  if (code !== undefined && ![0, 203].includes(Number(code))) {
    throw new ApiClientError({
      kind: Number(code) === 401 ? 'auth-required' : 'upstream',
      message: firstString(outer, ['msg', 'errmsg']) || '赛事数据返回业务错误',
    })
  }
}

function countSummary(record: RawApiRecord): string {
  const groups = firstString(record, ['ticketcount', 'groupcount', 'group_count', 'groups'])
  const players = firstString(record, ['signcount', 'playercount', 'player_count', 'count'])
  if (groups && players) return `${groups} 个组别 / ${players} 人`
  if (groups) return `${groups} 个组别`
  if (players) return `${players} 人`
  return ''
}

function competitionStatus(record: RawApiRecord): string {
  const raw = firstString(record, ['status', 'state', 'act_status', 'isfinish', 'finish'])
  if (raw === '0') return '待开赛'
  if (raw === '1') return '比赛中'
  if (raw === '2') return '已结束'
  if (raw === 'pending') return '待开赛'
  if (raw === 'living') return '比赛中'
  if (raw === 'ending') return '已结束'
  return raw
}

function statusCode(value: unknown): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function resultTextFromStatus(value: unknown): string {
  const code = statusCode(value)
  if (code == null) return ''

  switch (code & 0x0f) {
    case 0:
    case 1:
      return '未定'
    case 2:
      return '1 - 0'
    case 3:
      return '0 - 1'
    case 4:
      return '1/2-1/2'
    case 5:
      return '0 - 0'
    default:
      return ''
  }
}

function statusTextFromStatus(value: unknown, isBye = false): string {
  if (isBye) return '轮空'
  const code = statusCode(value)

  if (code == null) {
    const raw = textValue(value).toLowerCase()
    if (
      ['pending', 'upcoming', 'waiting', 'wait', 'ready', '待开赛', '待进入', '未开始'].includes(
        raw
      )
    )
      return '待开赛'
    if (['running', 'living', 'current', 'active', '比赛中', '进行中'].includes(raw))
      return '进行中'
    if (['finished', 'finish', 'done', 'ended', 'end', '已结束'].includes(raw)) return '已结束'
    return raw ? '状态未明' : ''
  }

  switch (code & 0x0f) {
    case 0:
      return '待开赛'
    case 1:
      return '进行中'
    case 2:
    case 3:
    case 4:
    case 5:
      return '已结束'
    default:
      return '状态未明'
  }
}

function normalizedExplicitResult(value: unknown): string {
  const text = textValue(value)
  if (!text || /^\d+(\.\d+)?$/u.test(text)) return ''
  const compact = text.replace(/\s+/gu, '')

  if (compact === '1-0') return '1 - 0'
  if (compact === '0-1') return '0 - 1'
  if (compact === '1/2-1/2' || compact === '1/2:1/2' || compact === '½-½') return '1/2-1/2'
  if (compact === '0-0') return '0 - 0'
  return text
}

export function readArrayPayload(payload: unknown): unknown[] {
  return findArray(payload) ?? []
}

export function readTotal(payload: unknown, fallback: number): number {
  return findTotal(payload) ?? fallback
}

export function readRoundListCurrentRoundId(payload: unknown): string {
  const record = recordFrom(payload)
  return record
    ? firstString(record, ['cur_round', 'current_round', 'currentRound', 'round_id', 'roundid'])
    : ''
}

function mapCompetition(input: unknown): Competition | null {
  const record = recordFrom(input)
  if (!record) return null
  const id = firstString(record, ['id', 'hdid', 'hd_id', 'cid', 'actid', 'competition_id'])
  if (!id) return null
  const title = firstString(record, ['title', 'name', 'actname', 'competition_name', 'hdname'])

  return {
    id,
    title: title || `赛事 ${id}`,
    status: competitionStatus(record),
    startTime: firstString(record, [
      'act_starttime',
      'starttime',
      'start_time',
      'stime',
      'begintime',
      'startdate',
    ]),
    endTime: firstString(record, ['act_endtime', 'endtime', 'end_time', 'etime', 'enddate']),
    type: firstString(record, ['type', 'acttype', 'competition_type']),
    category: firstString(record, ['category', 'catgory', 'ext_catgory', 'ext_category']),
    organizer: firstString(record, ['shoptitle', 'organizer', 'orgname', 'jgname', 'sponsor']),
    countSummary: countSummary(record),
  }
}

export function mapCompetitionDetail(input: unknown, fallbackId: string): CompetitionDetail {
  const record = recordFrom(input)
  const base = (record ? mapCompetition({ id: fallbackId, ...record }) : null) ?? {
    id: fallbackId,
    title: fallbackId ? `赛事 ${fallbackId}` : '赛事详情',
    status: '',
    startTime: '',
    endTime: '',
    type: '',
    category: '',
    organizer: '',
    countSummary: '',
  }

  return {
    ...base,
    description: record
      ? firstString(record, ['remark', 'desc', 'description', 'content', 'intro'])
      : '',
    address: record ? firstString(record, ['act_addr', 'address', 'addr', 'place']) : '',
  }
}

export function mapCompetitionGroup(
  input: unknown,
  competitionId: string
): CompetitionGroup | null {
  const record = recordFrom(input)
  if (!record) return null
  const id = firstString(record, ['id', 'groupid', 'group_id', 'gid', 'ticketid'])
  const ticketId = firstString(record, ['ticketid', 'ticket_id', 'id', 'groupid', 'group_id'])
  if (!id && !ticketId) return null

  return {
    id: id || ticketId,
    competitionId,
    name:
      firstString(record, ['name', 'groupname', 'group_name', 'title', 'ticketname']) || '默认组别',
    ticketId: ticketId || id,
    countSummary: countSummary(record),
  }
}

export function mapCompetitionRound(
  input: unknown,
  competitionId: string,
  groupId: string,
  ticketId: string,
  sourceCurrentRoundId = ''
): CompetitionRound | null {
  const record = recordFrom(input)
  if (!record) return null
  const id = firstString(record, ['id', 'round_id', 'roundid', 'rid'])
  const roundNumber = firstNumber(record, ['round', 'roundnum', 'round_no', 'sort'])
  if (!id && roundNumber == null) return null
  const name = firstString(record, ['name', 'title', 'roundname', 'round_name'])

  return {
    id: id || String(roundNumber),
    competitionId,
    groupId,
    ticketId,
    name: name || (roundNumber == null ? '轮次' : `第 ${roundNumber} 轮`),
    roundNumber,
    status: firstString(record, ['status', 'state', 'finish', 'isfinish']),
    startTime: firstString(record, ['starttime', 'start_time', 'matchtime', 'time', 'start_date']),
    endTime: firstString(record, ['endtime', 'end_time', 'enddate']),
    sourceCurrentRoundId,
  }
}

export function mapCompetitionPairing(
  input: unknown,
  competitionId: string,
  groupId: string,
  roundId: string
): CompetitionPairing | null {
  const record = recordFrom(input)
  if (!record) return null
  const id = firstString(record, ['id', 'matchid', 'match_id', 'gameid', 'game_id', 'boardid'])
  const boardNo = firstString(record, [
    'sort_id',
    'boardno',
    'board_no',
    'deskid',
    'desk_id',
    'table_no',
    'tai',
  ])
  if (!id && !boardNo) return null
  const whiteId = firstString(record, ['white', 'whiteid', 'white_id', 'wuid'])
  const blackId = firstString(record, ['black', 'blackid', 'black_id', 'buid'])
  const hasWhiteField = ['white', 'whiteid', 'white_id', 'wuid'].some((key) =>
    Object.prototype.hasOwnProperty.call(record, key)
  )
  const hasBlackField = ['black', 'blackid', 'black_id', 'buid'].some((key) =>
    Object.prototype.hasOwnProperty.call(record, key)
  )
  const isBye = (hasWhiteField && !whiteId) || (hasBlackField && !blackId)
  const byeText = firstString(record, ['isgroupmatch']) === '1' ? '--' : '轮空'
  const statusRaw = record.status ?? record.state ?? record.isfinish ?? record.finish
  const explicitResult = normalizedExplicitResult(
    firstString(record, ['result', 'score', 'matchresult'])
  )

  return {
    id: id || boardNo,
    competitionId,
    groupId,
    roundId,
    boardNo,
    whiteName:
      firstString(record, ['whitename', 'white_name', 'wname', 'whiteplayer']) ||
      (whiteId ? whiteId : byeText),
    blackName:
      firstString(record, ['blackname', 'black_name', 'bname', 'blackplayer']) ||
      (blackId ? blackId : byeText),
    whiteRating: firstString(record, [
      'whiteelo',
      'white_elo',
      'welo',
      'white_rating',
      'welo_after',
    ]),
    blackRating: firstString(record, [
      'blackelo',
      'black_elo',
      'belo',
      'black_rating',
      'belo_after',
    ]),
    whitePoints: firstString(record, ['wpoints', 'white_points', 'wscore']),
    blackPoints: firstString(record, ['bpoints', 'black_points', 'bscore']),
    result: explicitResult || resultTextFromStatus(statusRaw),
    status: statusTextFromStatus(statusRaw, isBye),
    startTime: firstString(record, ['starttime', 'start_time', 'start_date']),
  }
}

function unwrapGameInfo(raw: unknown): unknown {
  if (!isRecord(raw)) return raw
  if ('gameid' in raw || 'gameId' in raw || 'pgn' in raw || 'moves' in raw || 'datas' in raw)
    return raw
  if ('content' in raw) return raw.content
  if ('data' in raw) return raw.data
  return raw
}

function normalizedString(values: readonly unknown[]): string {
  for (const value of values) {
    const text = textValue(value)
    if (text) return text
  }

  return ''
}

function extractMoveTokens(payload: RawApiRecord): string[] {
  const datas = isRecord(payload.datas) ? payload.datas : {}
  const moveHistory =
    payload.moves ??
    payload.moveList ??
    payload.moveHistory ??
    payload.history ??
    datas.moves ??
    datas.moveList ??
    datas.moveHistory ??
    datas.history

  if (typeof moveHistory === 'string') {
    return moveHistory
      .replace(/\d+\.(?:\.\.)?/gu, ' ')
      .split(/\s+/u)
      .map((item) => item.trim())
      .filter((item) => item && !['1-0', '0-1', '1/2-1/2', '*'].includes(item))
  }

  if (!Array.isArray(moveHistory)) {
    return []
  }

  return moveHistory
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (!isRecord(item)) return ''
      const coordinate =
        normalizedString([item.from]) && normalizedString([item.to])
          ? `${normalizedString([item.from])}${normalizedString([item.to])}${normalizedString([item.promotion]).toLowerCase()}`
          : ''
      return normalizedString([
        item.san,
        item.sanMove,
        item.notation,
        item.algebraic,
        item.pgn,
        item.move,
        item.lan,
        item.uci,
        item.m,
        item.value,
        coordinate,
      ])
    })
    .filter(Boolean)
}

function moveTokenToSan(chess: Chess, token: string): string {
  const normalized = token.replace(/-/gu, '').trim()

  try {
    const move = chess.move(normalized)
    if (move) return move.san
  } catch {
    // Fall through to coordinate notation.
  }

  const coordinate = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/iu.exec(normalized)
  if (!coordinate) {
    throw new ApiClientError({
      kind: 'contract-mismatch',
      message: 'Replay move history contained an unsupported move token.',
    })
  }

  const moveRequest: { from: string; to: string; promotion?: string } = {
    from: coordinate[1] ?? '',
    to: coordinate[2] ?? '',
  }

  if (coordinate[3]) {
    moveRequest.promotion = coordinate[3].toLowerCase()
  }

  const move = chess.move(moveRequest)

  if (!move) {
    throw new ApiClientError({
      kind: 'contract-mismatch',
      message: 'Replay move history could not be applied to the board.',
    })
  }

  return move.san
}

function escapeTag(text: string): string {
  return text.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"')
}

function buildPgnFromMoves(input: {
  readonly gameId: string
  readonly title: string
  readonly initialFen: string
  readonly moves: string[]
  readonly result: string
}): string {
  const chess = input.initialFen ? new Chess(input.initialFen) : new Chess()
  const sanMoves = input.moves.map((token) => moveTokenToSan(chess, token))
  const moveParts: string[] = []

  for (let index = 0; index < sanMoves.length; index += 2) {
    const whiteMove = sanMoves[index]
    const blackMove = sanMoves[index + 1]
    moveParts.push(`${Math.floor(index / 2) + 1}. ${whiteMove}${blackMove ? ` ${blackMove}` : ''}`)
  }

  const tags = [
    `[Event "${escapeTag(input.title || `Game ${input.gameId}`)}"]`,
    `[Site "Kaisaile Production API"]`,
    `[Result "${escapeTag(input.result || '*')}"]`,
  ]

  if (input.initialFen) {
    tags.push('[SetUp "1"]', `[FEN "${escapeTag(input.initialFen)}"]`)
  }

  return `${tags.join('\n')}\n\n${moveParts.join(' ')} ${input.result || '*'}`.trim()
}

export function mapGameInfoResponse(raw: unknown, gameId: string): FinishedGameReplay {
  assertServiceOk(raw)
  const unwrapped = unwrapGameInfo(raw)
  const payload = typeof unwrapped === 'string' ? { pgn: unwrapped } : unwrapped

  if (!isRecord(payload)) {
    throw new ApiClientError({
      kind: 'contract-mismatch',
      message: 'Replay response did not include a game payload.',
    })
  }

  const datas = isRecord(payload.datas) ? payload.datas : {}
  const resolvedGameId = normalizedString([payload.gameId, payload.gameid, payload.id, gameId])
  const result = normalizedString([payload.result, datas.result]) || '*'
  const initialFen = normalizedString([payload.initialFen, payload.fen, datas.fen])
  const title =
    normalizedString([payload.title, payload.name, datas.title]) || `对局 ${resolvedGameId}`
  const pgnText = normalizedString([
    payload.pgn,
    payload.pgn_str,
    payload.pgnstr,
    datas.pgn,
    datas.pgn_str,
    datas.pgnstr,
  ])

  if (pgnText) {
    return {
      gameId: resolvedGameId,
      pgnText,
      result,
      initialFen,
      title,
      warnings: [],
    }
  }

  const moves = extractMoveTokens(payload)
  if (moves.length === 0) {
    throw new ApiClientError({
      kind: 'contract-mismatch',
      message: 'Replay response did not include PGN or move history.',
    })
  }

  return {
    gameId: resolvedGameId,
    pgnText: buildPgnFromMoves({ gameId: resolvedGameId, title, initialFen, moves, result }),
    result,
    initialFen,
    title,
    warnings: ['using_production_move_history_without_pgn_text'],
  }
}

export function mapCompetitionList(raw: unknown): PageResult<Competition> {
  assertServiceOk(raw)
  const items = readArrayPayload(raw)
    .map(mapCompetition)
    .filter((item): item is Competition => item !== null)
  return { items, total: readTotal(raw, items.length) }
}
