import { requestJson } from './client'
import {
  mapCompetitionDetail,
  mapCompetitionGroup,
  mapCompetitionList,
  mapCompetitionPairing,
  mapCompetitionRound,
  mapGameInfoResponse,
  readArrayPayload,
  readRoundListCurrentRoundId,
  readTotal,
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

export type {
  Competition,
  CompetitionDetail,
  CompetitionGroup,
  CompetitionPairing,
  CompetitionRound,
  FinishedGameReplay,
  PageResult,
} from './productTypes'

export async function fetchCompetitionList(
  input: CompetitionListInput = {},
  signal?: AbortSignal
): Promise<PageResult<Competition>> {
  const raw = await requestJson({
    path: '/liveproxy/GetActList',
    signal,
    body: {
      start: input.start ?? 0,
      max: input.max ?? 20,
      search: input.search ?? '',
      type: input.type ? Number(input.type) : 0,
      uid: '',
      month: input.month || null,
      year: input.year || null,
      actflag: input.actflag ? Number(input.actflag) : 0,
    },
  })

  return mapCompetitionList(raw)
}

export async function fetchCompetitionDetail(
  hdid: string,
  signal?: AbortSignal
): Promise<CompetitionDetail> {
  const query = new URLSearchParams({ token: '', type: '10' })
  const raw = await requestJson({
    path: `/award/c-GetActDetail?${query.toString()}`,
    signal,
    body: {
      id: hdid,
      sid: null,
    },
  })

  return mapCompetitionDetail(raw, hdid)
}

export async function fetchCompetitionGroups(
  hdid: string,
  signal?: AbortSignal
): Promise<CompetitionGroup[]> {
  const raw = await requestJson({
    path: '/liveproxy/GetActGroups',
    signal,
    body: { hdid },
  })

  return readArrayPayload(raw)
    .map((item) => mapCompetitionGroup(item, hdid))
    .filter((item): item is CompetitionGroup => item !== null)
}

export async function fetchCompetitionRounds(
  hdid: string,
  ticketid: string,
  signal?: AbortSignal
): Promise<CompetitionRound[]> {
  const raw = await requestJson({
    path: '/award/c-GetMatchRoundlist',
    signal,
    body: { hdid, ticketid },
  })
  const sourceCurrentRoundId = readRoundListCurrentRoundId(raw)

  return readArrayPayload(raw)
    .map((item) => mapCompetitionRound(item, hdid, ticketid, ticketid, sourceCurrentRoundId))
    .filter((item): item is CompetitionRound => item !== null)
}

export async function fetchCompetitionPairings(
  input: PairingListInput,
  signal?: AbortSignal
): Promise<PageResult<CompetitionPairing>> {
  const raw = await requestJson({
    path: '/award/c-GetMatchPairlist',
    signal,
    body: {
      hdid: input.hdid,
      ticketid: input.ticketid,
      round_id: input.roundId,
      st: input.start ?? 0,
      plen: input.pageSize ?? 50,
      name: input.name ?? '',
      uid: '',
      jgid: '',
      type: 2,
    },
  })
  const items = readArrayPayload(raw)
    .map((item) => mapCompetitionPairing(item, input.hdid, input.ticketid, input.roundId))
    .filter((item): item is CompetitionPairing => item !== null)

  return { items, total: readTotal(raw, items.length), raw }
}

export async function fetchFinishedGameReplay(
  gameId: string,
  signal?: AbortSignal
): Promise<FinishedGameReplay> {
  const raw = await requestJson({
    path: '/gameapi/gamemgr/getgameinfo',
    signal,
    auth: 'session-required',
    body: { gameid: gameId },
  })

  return mapGameInfoResponse(raw, gameId)
}
