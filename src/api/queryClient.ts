import { QueryClient } from '@tanstack/vue-query'

const PRODUCT_QUERY_KEY = 'product-api-v1'

export const productQueryKeys = {
  competitions: (filters: unknown, page: number) =>
    [PRODUCT_QUERY_KEY, 'competitions', filters, page] as const,
  competitionDetail: (competitionId: unknown) =>
    [PRODUCT_QUERY_KEY, 'competition-detail', competitionId] as const,
  competitionGroups: (competitionId: unknown) =>
    [PRODUCT_QUERY_KEY, 'competition-groups', competitionId] as const,
  competitionRounds: (competitionId: unknown, groupId: unknown) =>
    [PRODUCT_QUERY_KEY, 'competition-rounds', competitionId, groupId] as const,
  competitionPairings: (
    competitionId: unknown,
    groupId: unknown,
    roundId: unknown,
    search: unknown
  ) =>
    [PRODUCT_QUERY_KEY, 'competition-pairings', competitionId, groupId, roundId, search] as const,
  displayDetail: (competitionId: unknown) =>
    [PRODUCT_QUERY_KEY, 'competition-display-detail', competitionId] as const,
  displayGroups: (competitionId: unknown) =>
    [PRODUCT_QUERY_KEY, 'competition-display-groups', competitionId] as const,
  displayRounds: (competitionId: unknown, groupId: unknown) =>
    [PRODUCT_QUERY_KEY, 'competition-display-rounds', competitionId, groupId] as const,
  displayPairings: (competitionId: unknown, groupId: unknown, roundId: unknown) =>
    [PRODUCT_QUERY_KEY, 'competition-display-pairings', competitionId, groupId, roundId] as const,
  finishedReplay: (gameId: string) => [PRODUCT_QUERY_KEY, 'finished-replay', gameId] as const,
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export function clearPrivateProductQueries(): void {
  queryClient.removeQueries({
    predicate: (query) => query.meta?.privacy === 'private',
  })
}
