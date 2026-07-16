export type PgnWorkspaceAction = 'openLocal' | 'insertLocal'

export type PgnNavigationIntent =
  | { kind: 'game'; gameIndex: number }
  | { kind: 'node'; nodeId: number }
  | { kind: 'start' | 'previous' | 'next' | 'end' }
