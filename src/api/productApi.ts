import { z } from 'zod'

import { ApiClientError, requestJson } from './client'
import {
  mapCompetitionDetail,
  mapCompetitionGroups,
  mapCompetitionList,
  mapCompetitionPairings,
  mapCompetitionRounds,
} from './productMappers'
import type {
  Competition,
  CompetitionDetail,
  CompetitionGroup,
  CompetitionListInput,
  CompetitionPairing,
  CompetitionRound,
  FinishedGameReplay,
  PageResult,
  PairingListInput,
} from './productTypes'

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code <= 31 || code === 127) return true
  }

  return false
}

const IdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/u)
const SearchSchema = z
  .string()
  .trim()
  .max(80)
  .refine((value) => !hasControlCharacter(value))
const NumericFilterSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d+$/u.test(value))
  .refine((value) => value === '' || Number.isSafeInteger(Number(value)))
const MonthSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{1,2}$/u.test(value))
  .refine((value) => value === '' || (Number(value) >= 1 && Number(value) <= 12))
const YearSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{4}$/u.test(value))

const CompetitionListInputSchema = z.object({
  start: z.number().int().min(0).max(1_000_000).default(0),
  max: z.number().int().min(1).max(100).default(20),
  search: SearchSchema.default(''),
  type: NumericFilterSchema.default(''),
  actflag: NumericFilterSchema.default(''),
  month: MonthSchema.default(''),
  year: YearSchema.default(''),
})

const PairingListInputSchema = z.object({
  hdid: IdentifierSchema,
  ticketid: IdentifierSchema,
  roundId: IdentifierSchema,
  start: z.number().int().min(0).max(1_000_000).default(0),
  pageSize: z.number().int().min(1).max(100).default(50),
  name: SearchSchema.default(''),
})

function invalidInput(label: string): ApiClientError {
  return new ApiClientError({
    kind: 'invalid-input',
    message: `${label}请求参数无效。`,
  })
}

function parseInput<T>(schema: z.ZodType<T>, raw: unknown, label: string): T {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) throw invalidInput(label)
  return parsed.data
}

async function fetchCompetitionList(
  input: CompetitionListInput = {},
  signal?: AbortSignal
): Promise<PageResult<Competition>> {
  const normalized = parseInput(CompetitionListInputSchema, input, '赛事列表')
  const raw = await requestJson({
    path: '/liveproxy/GetActList',
    signal,
    body: {
      start: normalized.start,
      max: normalized.max,
      search: normalized.search,
      type: normalized.type ? Number(normalized.type) : 0,
      month: normalized.month ? [Number(normalized.month)] : [],
      year: normalized.year,
      actflag: normalized.actflag ? Number(normalized.actflag) : 0,
    },
  })

  return mapCompetitionList(raw)
}

async function fetchCompetitionDetail(
  hdid: string,
  signal?: AbortSignal
): Promise<CompetitionDetail> {
  const id = parseInput(IdentifierSchema, hdid, '赛事详情')
  const raw = await requestJson({
    path: '/award/c-GetActDetail?token=&type=10',
    signal,
    body: { id, sid: null },
  })

  return mapCompetitionDetail(raw, id)
}

async function fetchCompetitionGroups(
  hdid: string,
  signal?: AbortSignal
): Promise<CompetitionGroup[]> {
  const id = parseInput(IdentifierSchema, hdid, '赛事组别')
  const raw = await requestJson({
    path: '/liveproxy/GetActGroups',
    signal,
    body: { hdid: id },
  })

  return mapCompetitionGroups(raw, id)
}

async function fetchCompetitionRounds(
  hdid: string,
  ticketid: string,
  signal?: AbortSignal
): Promise<CompetitionRound[]> {
  const competitionId = parseInput(IdentifierSchema, hdid, '赛事轮次')
  const groupId = parseInput(IdentifierSchema, ticketid, '赛事轮次')
  const raw = await requestJson({
    path: '/award/c-GetMatchRoundlist',
    signal,
    body: { hdid: competitionId, ticketid: groupId },
  })

  return mapCompetitionRounds(raw, competitionId, groupId)
}

async function fetchCompetitionPairings(
  input: PairingListInput,
  signal?: AbortSignal
): Promise<PageResult<CompetitionPairing>> {
  const normalized = parseInput(PairingListInputSchema, input, '赛事对阵')
  const body: Record<string, string | number> = {
    hdid: normalized.hdid,
    ticketid: normalized.ticketid,
    round_id: normalized.roundId,
    st: normalized.start,
    plen: normalized.pageSize,
    type: 2,
  }
  if (normalized.name) body.name = normalized.name

  const raw = await requestJson({
    path: '/award/c-GetMatchPairlist',
    signal,
    body,
  })

  return mapCompetitionPairings(raw, normalized)
}

function fetchFinishedGameReplay(
  _gameId: string,
  _signal?: AbortSignal
): Promise<FinishedGameReplay> {
  return Promise.reject(
    new ApiClientError({
      kind: 'service-unavailable',
      message: '回放认证合同尚未确认，当前不会发送受保护请求。',
    })
  )
}

export const tournamentRepository = Object.freeze({
  list: fetchCompetitionList,
  detail: fetchCompetitionDetail,
  groups: fetchCompetitionGroups,
  rounds: fetchCompetitionRounds,
  pairings: fetchCompetitionPairings,
})

export const replayRepository = Object.freeze({
  finishedGame: fetchFinishedGameReplay,
})
