export type RawApiRecord = Record<string, unknown>

export interface PageResult<T> {
  readonly items: T[]
  readonly total: number
  readonly raw: unknown
}

export interface Competition {
  readonly id: string
  readonly title: string
  readonly status: string
  readonly startTime: string
  readonly endTime: string
  readonly type: string
  readonly category: string
  readonly organizer: string
  readonly countSummary: string
  readonly raw: RawApiRecord
}

export interface CompetitionDetail extends Competition {
  readonly description: string
  readonly address: string
}

export interface CompetitionGroup {
  readonly id: string
  readonly competitionId: string
  readonly name: string
  readonly ticketId: string
  readonly countSummary: string
  readonly raw: RawApiRecord
}

export interface CompetitionRound {
  readonly id: string
  readonly competitionId: string
  readonly groupId: string
  readonly ticketId: string
  readonly name: string
  readonly roundNumber: number | null
  readonly status: string
  readonly startTime: string
  readonly endTime: string
  readonly sourceCurrentRoundId: string
  readonly raw: RawApiRecord
}

export interface CompetitionPairing {
  readonly id: string
  readonly competitionId: string
  readonly groupId: string
  readonly roundId: string
  readonly boardNo: string
  readonly whiteName: string
  readonly blackName: string
  readonly whiteRating: string
  readonly blackRating: string
  readonly whitePoints: string
  readonly blackPoints: string
  readonly result: string
  readonly status: string
  readonly startTime: string
  readonly raw: RawApiRecord
}

export interface FinishedGameReplay {
  readonly gameId: string
  readonly pgnText: string
  readonly result: string
  readonly initialFen: string
  readonly title: string
  readonly warnings: string[]
  readonly raw: unknown
}

export interface CompetitionListInput {
  readonly start?: number
  readonly max?: number
  readonly search?: string
  readonly type?: string
  readonly actflag?: string
  readonly month?: string
  readonly year?: string
}

export interface PairingListInput {
  readonly hdid: string
  readonly ticketid: string
  readonly roundId: string
  readonly start?: number
  readonly pageSize?: number
  readonly name?: string
}
