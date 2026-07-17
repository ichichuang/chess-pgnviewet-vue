import type { CompetitionRound } from '@/api/productTypes'

function explicitRound(
  rounds: readonly CompetitionRound[],
  explicitRoundId: string
): CompetitionRound | undefined {
  if (!explicitRoundId) return undefined
  return rounds.find((round) => round.id === explicitRoundId)
}

function firstRoundWithLifecycle(
  rounds: readonly CompetitionRound[],
  lifecycle: CompetitionRound['lifecycle']
): CompetitionRound | undefined {
  return rounds.find((round) => round.lifecycle === lifecycle)
}

function latestCompletedRound(rounds: readonly CompetitionRound[]): CompetitionRound | undefined {
  for (let index = rounds.length - 1; index >= 0; index -= 1) {
    const round = rounds[index]
    if (round?.lifecycle === 'completed') return round
  }
  return undefined
}

export type DisplayRoundSelectionSource =
  | 'explicit'
  | 'automatic-last-ongoing'
  | 'automatic-last-completed'
  | 'automatic-previous-completed'
  | 'automatic-latest-confirmed-completed'

type DisplayRoundUnavailableReason = 'no-rounds' | 'no-completed-round' | 'lifecycle-unknown'

export type DisplayRoundResolution =
  | {
      readonly kind: 'selected'
      readonly round: CompetitionRound
      readonly source: DisplayRoundSelectionSource
    }
  | {
      readonly kind: 'unavailable'
      readonly reason: DisplayRoundUnavailableReason
    }

export function selectCommentaryRound(
  rounds: readonly CompetitionRound[],
  explicitRoundId = ''
): CompetitionRound | undefined {
  return (
    explicitRound(rounds, explicitRoundId) ??
    latestCompletedRound(rounds) ??
    firstRoundWithLifecycle(rounds, 'ongoing') ??
    firstRoundWithLifecycle(rounds, 'upcoming') ??
    rounds[0]
  )
}

export function resolveDisplayRound(
  rounds: readonly CompetitionRound[],
  explicitRoundId = ''
): DisplayRoundResolution {
  const selectedExplicitRound = explicitRound(rounds, explicitRoundId)
  if (selectedExplicitRound) {
    return { kind: 'selected', round: selectedExplicitRound, source: 'explicit' }
  }

  const lastRound = rounds.at(-1)
  if (!lastRound) return { kind: 'unavailable', reason: 'no-rounds' }

  if (lastRound.lifecycle === 'ongoing') {
    return { kind: 'selected', round: lastRound, source: 'automatic-last-ongoing' }
  }

  if (lastRound.lifecycle === 'completed') {
    return { kind: 'selected', round: lastRound, source: 'automatic-last-completed' }
  }

  const confirmedCompletedRound = latestCompletedRound(rounds.slice(0, -1))

  if (lastRound.lifecycle === 'upcoming') {
    return confirmedCompletedRound
      ? {
          kind: 'selected',
          round: confirmedCompletedRound,
          source: 'automatic-previous-completed',
        }
      : { kind: 'unavailable', reason: 'no-completed-round' }
  }

  return confirmedCompletedRound
    ? {
        kind: 'selected',
        round: confirmedCompletedRound,
        source: 'automatic-latest-confirmed-completed',
      }
    : { kind: 'unavailable', reason: 'lifecycle-unknown' }
}
