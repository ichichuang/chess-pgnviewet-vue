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

export function selectDisplayRound(
  rounds: readonly CompetitionRound[],
  explicitRoundId = ''
): CompetitionRound | undefined {
  return (
    explicitRound(rounds, explicitRoundId) ??
    firstRoundWithLifecycle(rounds, 'ongoing') ??
    firstRoundWithLifecycle(rounds, 'upcoming') ??
    latestCompletedRound(rounds) ??
    rounds[0]
  )
}
