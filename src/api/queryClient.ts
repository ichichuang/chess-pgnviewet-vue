import { QueryClient } from '@tanstack/vue-query'

import { ApiClientError } from './client'

const PRODUCT_QUERY_KEY = 'web-api-v2'

export interface CompetitionListQueryFilters {
  readonly search: string
  readonly actflag: string
  readonly type: string
  readonly month: string
  readonly year: string
}

export const publicQueryMeta = Object.freeze({ privacy: 'public' as const })
export const privateQueryMeta = Object.freeze({ privacy: 'private' as const })

function normalizedListFilters(filters: CompetitionListQueryFilters) {
  return {
    search: filters.search.trim(),
    actflag: filters.actflag.trim(),
    type: filters.type.trim(),
    month: filters.month.trim(),
    year: filters.year.trim(),
  } as const
}

export const productQueryKeys = {
  competitions: (filters: CompetitionListQueryFilters, page: number) =>
    [PRODUCT_QUERY_KEY, 'competitions', normalizedListFilters(filters), page] as const,
  competitionDetail: (competitionId: string) =>
    [PRODUCT_QUERY_KEY, 'competition-detail', competitionId] as const,
  competitionGroups: (competitionId: string) =>
    [PRODUCT_QUERY_KEY, 'competition-groups', competitionId] as const,
  competitionRounds: (competitionId: string, groupId: string) =>
    [PRODUCT_QUERY_KEY, 'competition-rounds', competitionId, groupId] as const,
  competitionPairings: (competitionId: string, groupId: string, roundId: string, search: string) =>
    [
      PRODUCT_QUERY_KEY,
      'competition-pairings',
      competitionId,
      groupId,
      roundId,
      search.trim(),
    ] as const,
  displayDetail: (competitionId: string) =>
    [PRODUCT_QUERY_KEY, 'competition-display-detail', competitionId] as const,
  displayGroups: (competitionId: string) =>
    [PRODUCT_QUERY_KEY, 'competition-display-groups', competitionId] as const,
  displayRounds: (competitionId: string, groupId: string) =>
    [PRODUCT_QUERY_KEY, 'competition-display-rounds', competitionId, groupId] as const,
  displayPairings: (competitionId: string, groupId: string, roundId: string) =>
    [PRODUCT_QUERY_KEY, 'competition-display-pairings', competitionId, groupId, roundId] as const,
  finishedReplay: (gameId: string) => [PRODUCT_QUERY_KEY, 'finished-replay', gameId] as const,
}

function retryableQueryFailure(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  if (!(error instanceof ApiClientError)) return false
  return error.retryable
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: retryableQueryFailure,
      staleTime: 30_000,
    },
  },
})

export function clearPrivateProductQueries(): void {
  queryClient.removeQueries({
    predicate: (query) => query.meta?.privacy === 'private',
  })
}
