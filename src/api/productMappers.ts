import { z } from 'zod'

import { ApiClientError } from './client'
import type {
  Competition,
  CompetitionDetail,
  CompetitionGroup,
  CompetitionPairing,
  CompetitionRound,
  PageResult,
  PairingListInput,
} from './productTypes'

const IdentifierDtoSchema = z.union([z.string(), z.number()])
const NullableTextDtoSchema = z.union([z.string(), z.number(), z.null()])

const ServiceResponseSchema = z.object({
  err: z.number(),
  msg: z.string().optional(),
})

const CompetitionListItemSchema = z.object({
  hdid: IdentifierDtoSchema,
  title: z.string(),
  act_starttime: z.string(),
  act_endtime: z.string(),
  sign_endtime: z.string(),
  poster: z.string(),
  act_sign: z.number(),
  ext_catgory: z.number(),
  sponsor: z.string(),
  delaymatchtime: z.number(),
  actflag: z.number(),
  sponsorLogo: z.string(),
})

const CompetitionListEnvelopeSchema = z.object({
  resp: ServiceResponseSchema,
  content: z.object({
    Total: z.number().int().nonnegative(),
    Details: z.array(CompetitionListItemSchema).nullable(),
  }),
})

const CompetitionDetailSchema = z.object({
  id: IdentifierDtoSchema,
  title: z.string(),
  state: NullableTextDtoSchema,
  isfinish: NullableTextDtoSchema,
  act_starttime: z.string(),
  act_endtime: z.string(),
  type: NullableTextDtoSchema,
  ext_catgory: NullableTextDtoSchema,
  shoptitle: NullableTextDtoSchema,
  sponsor: NullableTextDtoSchema,
  description: NullableTextDtoSchema,
  act_addr: NullableTextDtoSchema,
})

const CompetitionDetailEnvelopeSchema = z.object({
  resp: ServiceResponseSchema,
  content: CompetitionDetailSchema,
})

const CompetitionGroupSchema = z.object({
  hdid: IdentifierDtoSchema,
  ticketid: IdentifierDtoSchema,
  ticketname: z.string(),
  signcount: z.number().int().nonnegative(),
  cur_state: z.number(),
})

const CompetitionGroupsEnvelopeSchema = z.object({
  resp: ServiceResponseSchema,
  content: z.array(CompetitionGroupSchema),
})

const CompetitionRoundSchema = z.object({
  round_id: IdentifierDtoSchema,
  starttime: z.string(),
})

const CompetitionRoundsEnvelopeSchema = z.object({
  resp: ServiceResponseSchema,
  content: z.object({
    cur_round: IdentifierDtoSchema,
    roundfinish: z.unknown(),
    roundinfo: z.array(CompetitionRoundSchema),
  }),
})

const CompetitionPairingSchema = z.object({
  id: IdentifierDtoSchema,
  white: NullableTextDtoSchema,
  black: NullableTextDtoSchema,
  status: NullableTextDtoSchema,
  sort_id: NullableTextDtoSchema,
  welo: NullableTextDtoSchema,
  belo: NullableTextDtoSchema,
  wjgname: NullableTextDtoSchema,
  bjgname: NullableTextDtoSchema,
  wfieldid: NullableTextDtoSchema,
  bfieldid: NullableTextDtoSchema,
  wfaceimg: NullableTextDtoSchema,
  bfaceimg: NullableTextDtoSchema,
  whitename: NullableTextDtoSchema,
  blackname: NullableTextDtoSchema,
})

const CompetitionPairingsEnvelopeSchema = z.object({
  resp: ServiceResponseSchema,
  content: z.array(CompetitionPairingSchema),
})

function contractMismatch(message: string): ApiClientError {
  return new ApiClientError({ kind: 'contract-mismatch', message })
}

function parseEnvelope<T extends { readonly resp: z.infer<typeof ServiceResponseSchema> }>(
  schema: z.ZodType<T>,
  raw: unknown,
  label: string
): T {
  const parsed = schema.safeParse(raw)

  if (!parsed.success) {
    throw contractMismatch(`${label}返回的数据无法识别。`)
  }

  if (parsed.data.resp.err !== 0) {
    throw new ApiClientError({ kind: 'upstream', message: `${label}返回业务错误。` })
  }

  return parsed.data
}

function text(value: string | number | null): string {
  return value == null ? '' : String(value).trim()
}

function resultFromStatus(value: string): string {
  const status = Number(value)
  if (!Number.isInteger(status)) return ''

  switch (status & 0x0f) {
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

function lifecycleFromStatus(value: string, isBye: boolean): string {
  if (isBye) return '轮空'

  const status = Number(value)
  if (!Number.isInteger(status)) return ''

  switch (status & 0x0f) {
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
      return ''
  }
}

export function mapCompetitionList(raw: unknown): PageResult<Competition> {
  const envelope = parseEnvelope(CompetitionListEnvelopeSchema, raw, '赛事列表')
  const items = (envelope.content.Details ?? []).map((item) => ({
    id: text(item.hdid),
    title: item.title.trim(),
    status: '',
    startTime: item.act_starttime.trim(),
    endTime: item.act_endtime.trim(),
    type: '',
    category: text(item.ext_catgory),
    organizer: item.sponsor.trim(),
    countSummary: '',
  }))

  return { items, total: envelope.content.Total }
}

export function mapCompetitionDetail(raw: unknown, expectedId: string): CompetitionDetail {
  const envelope = parseEnvelope(CompetitionDetailEnvelopeSchema, raw, '赛事详情')
  const item = envelope.content
  const id = text(item.id)

  if (id !== expectedId) throw contractMismatch('赛事详情标识与当前路由不一致。')

  return {
    id,
    title: item.title.trim(),
    status: text(item.state) || text(item.isfinish),
    startTime: item.act_starttime.trim(),
    endTime: item.act_endtime.trim(),
    type: text(item.type),
    category: text(item.ext_catgory),
    organizer: text(item.shoptitle) || text(item.sponsor),
    countSummary: '',
    description: text(item.description),
    address: text(item.act_addr),
  }
}

export function mapCompetitionGroups(raw: unknown, competitionId: string): CompetitionGroup[] {
  const envelope = parseEnvelope(CompetitionGroupsEnvelopeSchema, raw, '赛事组别')

  return envelope.content.map((item) => {
    const sourceCompetitionId = text(item.hdid)
    if (sourceCompetitionId !== competitionId) {
      throw contractMismatch('赛事组别标识与当前赛事不一致。')
    }

    const ticketId = text(item.ticketid)
    return {
      id: ticketId,
      competitionId,
      name: item.ticketname.trim(),
      ticketId,
      countSummary: `${item.signcount} 人`,
    }
  })
}

export function mapCompetitionRounds(
  raw: unknown,
  competitionId: string,
  ticketId: string
): CompetitionRound[] {
  const envelope = parseEnvelope(CompetitionRoundsEnvelopeSchema, raw, '赛事轮次')
  const currentRoundId = text(envelope.content.cur_round)

  return envelope.content.roundinfo.map((item, index) => ({
    id: text(item.round_id),
    competitionId,
    groupId: ticketId,
    ticketId,
    name: `第 ${index + 1} 轮`,
    roundNumber: index + 1,
    status: '',
    startTime: item.starttime.trim(),
    endTime: '',
    sourceCurrentRoundId: currentRoundId,
  }))
}

export function mapCompetitionPairings(
  raw: unknown,
  input: PairingListInput
): PageResult<CompetitionPairing> {
  const envelope = parseEnvelope(CompetitionPairingsEnvelopeSchema, raw, '赛事对阵')
  const items = envelope.content.map((item) => {
    const whiteId = text(item.white)
    const blackId = text(item.black)
    const whiteName = text(item.whitename)
    const blackName = text(item.blackname)
    const isBye = !whiteId || !blackId || !whiteName || !blackName
    const status = text(item.status)

    return {
      id: text(item.id),
      competitionId: input.hdid,
      groupId: input.ticketid,
      roundId: input.roundId,
      boardNo: text(item.sort_id),
      whiteName: whiteName || '轮空',
      blackName: blackName || '轮空',
      whiteRating: text(item.welo),
      blackRating: text(item.belo),
      result: resultFromStatus(status),
      status: lifecycleFromStatus(status, isBye),
    }
  })

  return { items, total: items.length }
}
