export type TeachingDraftScope = 'node-comment' | 'game-note'

type TeachingDraftFeedbackStatus = 'idle' | 'success' | 'error'

export interface TeachingDraftContextIdentity {
  sourceSession: number
  sourceId: string
  gameId: number
  nodeId: number | null
  canonicalRevision: number
}

export interface TeachingDraft {
  id: number
  scope: TeachingDraftScope
  context: TeachingDraftContextIdentity
  staleContextIdentity: string
  baselineText: string
  currentText: string
  revision: number
  feedbackStatus: TeachingDraftFeedbackStatus
  feedbackMessage: string | null
  canRetry: boolean
}

export interface TeachingDraftEditIdentity extends TeachingDraftContextIdentity {
  draftId: number
  draftRevision: number
  currentText: string
  staleContextIdentity: string
}

export type TeachingDraftSaveResult = 'saved' | 'unchanged' | 'stale' | 'readonly' | 'missing'

export function teachingDraftContextIdentity(context: TeachingDraftContextIdentity): string {
  return [
    context.sourceSession,
    context.sourceId,
    context.gameId,
    context.nodeId ?? 'game',
    context.canonicalRevision,
  ].join(':')
}

export function teachingDraftIsDirty(draft: TeachingDraft | null): boolean {
  return draft !== null && draft.currentText !== draft.baselineText
}

export function nodeCommentText(comments: readonly string[]): string {
  return comments.join('\n\n')
}

export function nodeCommentsFromText(text: string): string[] {
  return text
    .split(/\n\s*\n/gu)
    .map((comment) => comment.replace(/\s+/gu, ' ').trim())
    .filter(Boolean)
}

export function gameTeachingNoteKey(sourceSession: number, gameId: number): string {
  return `${sourceSession}:${gameId}`
}
