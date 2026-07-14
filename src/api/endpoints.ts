export const WEB_API_ENDPOINTS = Object.freeze({
  competitionList: '/liveproxy/GetActList',
  competitionDetail: '/award/c-GetActDetail?token=&type=10',
  competitionGroups: '/liveproxy/GetActGroups',
  competitionRounds: '/award/c-GetMatchRoundlist',
  competitionPairings: '/award/c-GetMatchPairlist',
} as const)

export type WebApiEndpoint = (typeof WEB_API_ENDPOINTS)[keyof typeof WEB_API_ENDPOINTS]
