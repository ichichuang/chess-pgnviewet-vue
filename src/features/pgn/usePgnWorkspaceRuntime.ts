import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import type { BoardMoveRequest } from '@/features/board/domain/boardTypes'
import { localFileDataSource } from '@/features/pgn/domain/sourceOwnership'
import type { DataSource, PgnItem } from '@/features/pgn/domain/types'
import { usePgnStore } from '@/stores'
import type { WorkspaceEditIdentity } from '@/stores/pgn'
import type { ProductOverlayReturnFocus } from '@/ui/productOverlayFocus'

import type {
  PgnImportApplicationRequest,
  PgnImportApplicationResult,
  PgnImportIntent,
  PgnImportTarget,
} from './pgnImportTypes'
import type { PgnWorkspaceAction } from './pgnWorkspaceTypes'
import { usePgnImportSession } from './usePgnImportSession'

interface PgnImportCapabilities {
  canOpenLocalPgnAsNewSource: boolean
  canInsertLocalPgnIntoCurrentSource: boolean
}

interface PgnSourceReplacementRequest {
  expectedIdentity: WorkspaceEditIdentity
  source: DataSource
  items: PgnItem[]
  returnFocus: ProductOverlayReturnFocus
  isCurrent: () => boolean
}

interface PgnWorkspaceRuntimeOptions {
  replaceSource: (request: PgnSourceReplacementRequest) => Promise<boolean>
  workspaceFocusTarget: ProductOverlayReturnFocus
  onSourceReplaced?: () => void
}

export function usePgnWorkspaceRuntime(
  capabilities: () => PgnImportCapabilities,
  options: PgnWorkspaceRuntimeOptions
) {
  const pgn = usePgnStore()
  const fileInput = ref<HTMLInputElement | null>(null)
  const dragDepth = ref(0)
  const boardPosition = computed(() => pgn.currentFen)
  const boardInteractive = computed(() => pgn.hasGame)
  const dragActive = computed(() => dragDepth.value > 0)
  let pendingFileImport: PgnImportTarget | null = null
  let runtimeActive = false

  const importSession = usePgnImportSession({
    canContinue: canImport,
    apply: applyImport,
    onApplied: (target) => {
      pgn.lastError = null
      if (target.intent === 'open-as-new-source') options.onSourceReplaced?.()
    },
  })

  function handlePgnAction(
    name: PgnWorkspaceAction,
    returnFocus: ProductOverlayReturnFocus = () =>
      connectedActiveElement() ?? options.workspaceFocusTarget()
  ): void {
    if (importSession.hasSession.value) {
      importSession.focusExisting()
      return
    }

    if (pendingFileImport) {
      pgn.lastError = '已有本地 PGN 导入正在等待选择文件。'
      return
    }

    const intent = actionIntent(name)
    const allowed =
      intent === 'open-as-new-source'
        ? capabilities().canOpenLocalPgnAsNewSource
        : capabilities().canInsertLocalPgnIntoCurrentSource

    if (!allowed) {
      pgn.lastError =
        intent === 'open-as-new-source'
          ? '当前无法打开新的本地 PGN 来源。'
          : '当前来源不可插入 PGN，请改为打开新的本地来源。'
      return
    }

    pendingFileImport = {
      intent,
      expectedIdentity: pgn.captureWorkspaceEditIdentity(),
      returnFocus,
    }
    if (fileInput.value) fileInput.value.value = ''
    fileInput.value?.click()
  }

  function canImport(target: PgnImportTarget): boolean {
    if (!runtimeActive || !pgn.matchesWorkspaceEditIdentity(target.expectedIdentity)) return false
    if (target.intent === 'open-as-new-source') {
      return capabilities().canOpenLocalPgnAsNewSource
    }

    return (
      target.expectedIdentity.sourceId !== '' &&
      pgn.canMutateCurrentSource &&
      capabilities().canInsertLocalPgnIntoCurrentSource
    )
  }

  async function applyImport(
    request: PgnImportApplicationRequest
  ): Promise<PgnImportApplicationResult> {
    if (!request.isCurrent() || !canImport(request.target)) return 'stale'

    if (request.target.intent === 'insert-into-current-source') {
      if (!request.isCurrent() || !canImport(request.target)) return 'stale'
      const applied = pgn.insertParsedCollection(request.items, request.target.expectedIdentity)
      if (applied) return 'applied'
      return canImport(request.target) ? 'failed' : 'stale'
    }

    const filename =
      request.successfulFilenames.length === 1
        ? request.successfulFilenames[0]
        : `${request.successfulFilenames.length} 个本地文件`
    const applied = await options.replaceSource({
      expectedIdentity: request.target.expectedIdentity,
      source: localFileDataSource(filename),
      items: request.items,
      returnFocus: request.target.returnFocus,
      isCurrent: request.isCurrent,
    })
    if (applied) return 'applied'
    return canImport(request.target) ? 'cancelled' : 'stale'
  }

  function onFiles(event: Event): void {
    const input = event.target
    if (!(input instanceof HTMLInputElement)) return

    const files = Array.from(input.files ?? [])
    const target = pendingFileImport
    pendingFileImport = null
    input.value = ''

    if (files.length === 0 || !target) return
    if (!canImport(target)) {
      pgn.lastError = '操作目标已变化，请重新选择当前来源。'
      return
    }

    importSession.start(files, target)
  }

  function onFilePickerCancel(event: Event): void {
    const input = event.target
    if (input instanceof HTMLInputElement) input.value = ''
    pendingFileImport = null
  }

  async function retryImport(): Promise<void> {
    const target = importSession.prepareRetry()
    if (!target) return
    await nextTick()

    if (!canImport(target)) {
      pgn.lastError = '操作目标已变化，请重新选择当前来源。'
      return
    }

    pendingFileImport = target
    if (fileInput.value) fileInput.value.value = ''
    fileInput.value?.click()
  }

  function cancelImportForNavigation(): void {
    pendingFileImport = null
    if (fileInput.value) fileInput.value.value = ''
    importSession.cancelForNavigation()
  }

  function isFileDrag(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files')
  }

  function onDragEnter(event: DragEvent): void {
    if (!isFileDrag(event)) return
    event.preventDefault()
    dragDepth.value += 1
  }

  function onDragOver(event: DragEvent): void {
    if (!isFileDrag(event)) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  function onDragLeave(event: DragEvent): void {
    if (!isFileDrag(event)) return
    dragDepth.value = Math.max(0, dragDepth.value - 1)
  }

  function onDrop(event: DragEvent): void {
    if (!isFileDrag(event)) return
    event.preventDefault()
    dragDepth.value = 0

    if (importSession.hasSession.value) {
      importSession.focusExisting()
      return
    }
    if (pendingFileImport) {
      pgn.lastError = '已有本地 PGN 导入正在等待选择文件。'
      return
    }

    const files = Array.from(event.dataTransfer?.files ?? [])
    if (files.length === 0) return

    const target: PgnImportTarget = {
      intent: 'open-as-new-source',
      expectedIdentity: pgn.captureWorkspaceEditIdentity(),
      returnFocus: options.workspaceFocusTarget,
    }
    if (!canImport(target)) {
      pgn.lastError = '当前无法打开新的本地 PGN 来源。'
      return
    }
    importSession.start(files, target)
  }

  function onBoardMoveRequest(payload: BoardMoveRequest): void {
    pgn.tryMove(payload)
  }

  onMounted(() => {
    runtimeActive = true
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
  })

  onBeforeUnmount(() => {
    runtimeActive = false
    cancelImportForNavigation()
    window.removeEventListener('dragenter', onDragEnter)
    window.removeEventListener('dragover', onDragOver)
    window.removeEventListener('dragleave', onDragLeave)
    window.removeEventListener('drop', onDrop)
  })

  return {
    boardInteractive,
    boardPosition,
    cancelImportForNavigation,
    dragActive,
    fileInput,
    handlePgnAction,
    importSession,
    onBoardMoveRequest,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onFilePickerCancel,
    onFiles,
    pgn,
    retryImport,
  }
}

function actionIntent(action: PgnWorkspaceAction): PgnImportIntent {
  return action === 'openLocal' ? 'open-as-new-source' : 'insert-into-current-source'
}

function connectedActiveElement(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement && document.activeElement.isConnected
    ? document.activeElement
    : null
}
