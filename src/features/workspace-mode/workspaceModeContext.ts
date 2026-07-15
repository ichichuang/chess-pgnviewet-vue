import { computed, inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue'

import type { WorkspaceModeContext } from './workspaceModeTypes'

const workspaceModeContextKey: InjectionKey<ComputedRef<WorkspaceModeContext>> =
  Symbol('workspaceModeContext')

function createDefaultWorkspaceModeContext(): WorkspaceModeContext {
  return {
    mode: 'analysis',
    source: 'manual_pgn',
    readonly: false,
    competitionId: '',
    groupId: '',
    roundId: '',
    boardId: '',
    gameId: '',
    matchId: '',
    view: '',
    warnings: [],
  }
}

type WorkspaceModeContextInput =
  WorkspaceModeContext | Ref<WorkspaceModeContext> | ComputedRef<WorkspaceModeContext>

function isContextRef(
  value: WorkspaceModeContextInput
): value is Ref<WorkspaceModeContext> | ComputedRef<WorkspaceModeContext> {
  return typeof value === 'object' && value !== null && 'value' in value
}

export function provideWorkspaceModeContext(
  context: WorkspaceModeContextInput
): ComputedRef<WorkspaceModeContext> {
  const contextRef = isContextRef(context) ? computed(() => context.value) : computed(() => context)
  provide(workspaceModeContextKey, contextRef)
  return contextRef
}

export function useWorkspaceModeContext(): ComputedRef<WorkspaceModeContext> {
  return inject(workspaceModeContextKey, computed(createDefaultWorkspaceModeContext))
}
