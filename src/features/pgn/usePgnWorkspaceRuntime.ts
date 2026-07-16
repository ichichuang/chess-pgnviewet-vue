import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { BoardMoveRequest } from '@/features/board/domain/boardTypes'
import { localFileDataSource } from '@/features/pgn/domain/sourceOwnership'
import type { DataSource } from '@/features/pgn/domain/types'
import { usePgnStore } from '@/stores'
import type { WorkspaceEditIdentity } from '@/stores/pgn'
import type { ProductOverlayReturnFocus } from '@/ui/productOverlayFocus'

import type { PgnWorkspaceAction } from './pgnWorkspaceTypes'

interface PgnImportCapabilities {
  canOpenLocalPgnAsNewSource: boolean
  canInsertLocalPgnIntoCurrentSource: boolean
}

interface PgnSourceReplacementRequest {
  expectedIdentity: WorkspaceEditIdentity
  source: DataSource
  text: string
  returnFocus: ProductOverlayReturnFocus
}

interface PgnWorkspaceRuntimeOptions {
  replaceSource: (request: PgnSourceReplacementRequest) => Promise<boolean>
  workspaceFocusTarget: ProductOverlayReturnFocus
  onSourceReplaced?: () => void
}

interface PendingFileImport {
  insert: boolean
  expectedIdentity: WorkspaceEditIdentity
  returnFocus: ProductOverlayReturnFocus
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
  let pendingFileImport: PendingFileImport | null = null
  let runtimeActive = false

  function handlePgnAction(
    name: PgnWorkspaceAction,
    returnFocus: ProductOverlayReturnFocus = () =>
      connectedActiveElement() ?? options.workspaceFocusTarget()
  ): void {
    const allowed =
      name === 'openLocal'
        ? capabilities().canOpenLocalPgnAsNewSource
        : capabilities().canInsertLocalPgnIntoCurrentSource

    if (!allowed) {
      pgn.lastError =
        name === 'openLocal'
          ? '当前无法打开新的本地 PGN 来源。'
          : '当前来源不可插入 PGN，请改为打开新的本地来源。'
      return
    }

    pendingFileImport = {
      insert: name === 'insertLocal',
      expectedIdentity: pgn.captureWorkspaceEditIdentity(),
      returnFocus,
    }
    fileInput.value?.click()
  }

  function isPgnFile(file: File): boolean {
    return /\.(pgn|txt)$/i.test(file.name)
  }

  function canImport(insert: boolean, expectedIdentity: WorkspaceEditIdentity): boolean {
    if (!pgn.matchesWorkspaceEditIdentity(expectedIdentity)) return false
    if (!insert) return capabilities().canOpenLocalPgnAsNewSource

    return (
      expectedIdentity.sourceId !== '' &&
      pgn.canMutateCurrentSource &&
      capabilities().canInsertLocalPgnIntoCurrentSource
    )
  }

  async function importFiles(files: File[], pending: PendingFileImport): Promise<void> {
    const allowed = canImport(pending.insert, pending.expectedIdentity)

    if (!allowed) {
      pgn.lastError = pending.insert
        ? '当前来源不可插入 PGN，请改为打开新的本地来源。'
        : '当前无法打开新的本地 PGN 来源。'
      return
    }

    const pgnFiles = files.filter(isPgnFile)

    if (pgnFiles.length === 0) {
      pgn.lastError = '请拖入 .pgn 棋谱文件'
      return
    }

    try {
      const texts = await Promise.all(pgnFiles.map((file) => file.text()))

      if (!runtimeActive || !canImport(pending.insert, pending.expectedIdentity)) {
        pgn.lastError = '操作目标已变化，请重新选择当前来源。'
        return
      }

      const merged = texts.join('\n\n')
      if (!pgn.validateText(merged)) return

      const filename = pgnFiles.length === 1 ? pgnFiles[0]?.name : `${pgnFiles.length} 个本地文件`
      const ok = pending.insert
        ? pgn.insertText(merged)
        : await options.replaceSource({
            expectedIdentity: pending.expectedIdentity,
            source: localFileDataSource(filename),
            text: merged,
            returnFocus: pending.returnFocus,
          })

      if (ok) {
        if (!pending.insert) options.onSourceReplaced?.()
        pgn.lastError = null
      } else if (!pgn.matchesWorkspaceEditIdentity(pending.expectedIdentity)) {
        pgn.lastError = '操作目标已变化，请重新选择当前来源。'
      }
    } catch (error) {
      pgn.lastError = error instanceof Error ? error.message : '读取本地文件失败'
    }
  }

  async function onFiles(event: Event): Promise<void> {
    const input = event.target

    if (!(input instanceof HTMLInputElement)) {
      return
    }

    const files = input.files
    const pending = pendingFileImport

    if (files?.length && pending) {
      await importFiles(Array.from(files), pending)
    }

    input.value = ''
    pendingFileImport = null
  }

  function isFileDrag(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types ?? []).includes('Files')
  }

  function onDragEnter(event: DragEvent): void {
    if (!isFileDrag(event)) {
      return
    }

    event.preventDefault()
    dragDepth.value += 1
  }

  function onDragOver(event: DragEvent): void {
    if (!isFileDrag(event)) {
      return
    }

    event.preventDefault()

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  function onDragLeave(event: DragEvent): void {
    if (!isFileDrag(event)) {
      return
    }

    dragDepth.value = Math.max(0, dragDepth.value - 1)
  }

  function onDrop(event: DragEvent): void {
    if (!isFileDrag(event)) {
      return
    }

    event.preventDefault()
    dragDepth.value = 0

    const files = event.dataTransfer?.files

    if (files?.length) {
      void importFiles(Array.from(files), {
        insert: false,
        expectedIdentity: pgn.captureWorkspaceEditIdentity(),
        returnFocus: options.workspaceFocusTarget,
      })
    }
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
    pendingFileImport = null
    window.removeEventListener('dragenter', onDragEnter)
    window.removeEventListener('dragover', onDragOver)
    window.removeEventListener('dragleave', onDragLeave)
    window.removeEventListener('drop', onDrop)
  })

  return {
    boardInteractive,
    boardPosition,
    dragActive,
    fileInput,
    handlePgnAction,
    onBoardMoveRequest,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onFiles,
    pgn,
  }
}

function connectedActiveElement(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement && document.activeElement.isConnected
    ? document.activeElement
    : null
}
