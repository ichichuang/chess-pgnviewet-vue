export type AnalysisScope = 'current' | 'full'

export type AnalysisExecutionPhase =
  'idle' | 'initializing' | 'ready' | 'analyzing' | 'available' | 'unavailable' | 'error'

export interface AnalysisProductOutcome {
  sequence: number
  kind: 'cancelled' | 'stale'
  origin: 'task' | 'candidate'
  scope: AnalysisScope
}

type AnalysisPresentationKind =
  'off' | 'preparing' | 'running' | 'completed' | 'failed' | 'cancelled' | 'stale'

export interface AnalysisPresentation {
  kind: AnalysisPresentationKind
  scope: AnalysisScope | null
  statusText: string
  title: string
  description: string
  actionLabel: string | null
  role: 'status' | 'alert'
}

export type CandidateInsertionProductKind =
  'inserted' | 'existing' | 'illegal' | 'readonly' | 'busy'

export interface CandidateInsertionProductOutcome {
  sequence: number
  kind: CandidateInsertionProductKind
}

export interface CandidateInsertionPresentation {
  message: string
  role: 'status' | 'alert'
  tone: 'info' | 'success' | 'warning' | 'error'
}

interface AnalysisPresentationInput {
  phase: AnalysisExecutionPhase
  activeScope: AnalysisScope | null
  completedScope: AnalysisScope | null
  lastRequestedScope: AnalysisScope | null
  hasResult: boolean
  outcome: AnalysisProductOutcome | null
}

function scopeName(scope: AnalysisScope | null): string {
  return scope === 'full' ? '整局' : '当前局面'
}

function reanalysisLabel(scope: AnalysisScope | null): string {
  return scope === 'full' ? '重新分析整局' : '重新分析当前局面'
}

export function createAnalysisPresentation(input: AnalysisPresentationInput): AnalysisPresentation {
  if (input.outcome?.kind === 'cancelled') {
    return {
      kind: 'cancelled',
      scope: input.outcome.scope,
      statusText: '分析已取消',
      title: '分析已取消',
      description: `${scopeName(input.outcome.scope)}的未完成结果不会保存，当前棋局和批注保持不变。`,
      actionLabel: reanalysisLabel(input.outcome.scope),
      role: 'status',
    }
  }

  if (input.outcome?.kind === 'stale') {
    return {
      kind: 'stale',
      scope: input.outcome.scope,
      statusText: '已忽略过期分析结果',
      title: '已忽略过期分析结果',
      description: `这份${scopeName(input.outcome.scope)}结果不属于当前棋局、节点或任务身份，未写入当前内容。`,
      actionLabel: reanalysisLabel(input.outcome.scope),
      role: 'status',
    }
  }

  const scope = input.activeScope ?? input.completedScope ?? input.lastRequestedScope

  if (input.phase === 'initializing' || input.phase === 'ready') {
    return {
      kind: 'preparing',
      scope,
      statusText: scope === 'full' ? '正在准备整局分析' : '正在准备当前局面分析',
      title: '正在准备分析',
      description: '正在准备本地分析资源。',
      actionLabel: null,
      role: 'status',
    }
  }

  if (input.phase === 'analyzing') {
    return {
      kind: 'running',
      scope,
      statusText: scope === 'full' ? '正在分析整局' : '正在分析当前局面',
      title: '正在分析',
      description: '分析结果只会在当前任务完成并通过身份校验后显示。',
      actionLabel: null,
      role: 'status',
    }
  }

  if (input.phase === 'error' || input.phase === 'unavailable') {
    return {
      kind: 'failed',
      scope,
      statusText: input.phase === 'unavailable' ? '本地分析暂不可用' : 'AI 分析失败',
      title: input.phase === 'unavailable' ? '本地分析暂不可用' : 'AI 分析失败',
      description:
        input.phase === 'unavailable'
          ? '当前设备暂时无法完成本地分析，请稍后重试。'
          : '分析过程中发生问题，当前棋局和批注保持不变。',
      actionLabel: '重试分析',
      role: 'alert',
    }
  }

  if (input.phase === 'available' && input.hasResult) {
    return {
      kind: 'completed',
      scope: input.completedScope,
      statusText: input.completedScope === 'full' ? '整局分析完成' : '当前局面分析完成',
      title: '分析完成',
      description: '结果保持只读，只有明确选择候选变化后才会写入本地棋谱。',
      actionLabel: reanalysisLabel(input.completedScope),
      role: 'status',
    }
  }

  return {
    kind: 'off',
    scope: null,
    statusText: 'AI 分析未开启',
    title: 'AI 分析未开启',
    description: '分析默认关闭，不会占用额外计算资源。',
    actionLabel: null,
    role: 'status',
  }
}

const CANDIDATE_INSERTION_PRESENTATIONS: Record<
  CandidateInsertionProductKind,
  CandidateInsertionPresentation
> = {
  inserted: {
    message: '候选变化已插入本地棋谱。',
    role: 'status',
    tone: 'success',
  },
  existing: {
    message: '相同候选变化已存在，未重复插入。',
    role: 'status',
    tone: 'info',
  },
  illegal: {
    message: '候选变化未通过完整合法性校验，未写入棋谱。',
    role: 'alert',
    tone: 'error',
  },
  readonly: {
    message: '当前来源不可编辑，候选变化未写入棋谱。',
    role: 'alert',
    tone: 'warning',
  },
  busy: {
    message: '请先完成或取消当前分析任务，或完成当前走法或教学编辑，再插入候选变化。',
    role: 'status',
    tone: 'info',
  },
}

export function candidateInsertionPresentation(
  outcome: CandidateInsertionProductOutcome | null
): CandidateInsertionPresentation | null {
  return outcome ? CANDIDATE_INSERTION_PRESENTATIONS[outcome.kind] : null
}
