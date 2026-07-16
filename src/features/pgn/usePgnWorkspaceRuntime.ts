import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { BoardMoveRequest } from '@/features/board/domain/boardTypes'
import { localFileDataSource } from '@/features/pgn/domain/sourceOwnership'
import { usePgnStore } from '@/stores'

import type { PgnWorkspaceAction } from './pgnWorkspaceTypes'

interface PgnImportCapabilities {
  canOpenLocalPgnAsNewSource: boolean
  canInsertLocalPgnIntoCurrentSource: boolean
}

export function usePgnWorkspaceRuntime(capabilities: () => PgnImportCapabilities) {
  const pgn = usePgnStore()
  const fileInput = ref<HTMLInputElement | null>(null)
  const insertMode = ref(false)
  const insertTargetSourceId = ref('')
  const dragDepth = ref(0)
  const boardPosition = computed(() => pgn.currentFen)
  const boardInteractive = computed(() => pgn.hasGame)
  const dragActive = computed(() => dragDepth.value > 0)

  function handlePgnAction(name: PgnWorkspaceAction): void {
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

    insertMode.value = name === 'insertLocal'
    insertTargetSourceId.value = insertMode.value ? pgn.source.id : ''
    fileInput.value?.click()
  }

  function isPgnFile(file: File): boolean {
    return /\.(pgn|txt)$/i.test(file.name)
  }

  function canImport(insert: boolean, expectedSourceId: string): boolean {
    if (!insert) return capabilities().canOpenLocalPgnAsNewSource

    return (
      expectedSourceId !== '' &&
      pgn.source.id === expectedSourceId &&
      pgn.canMutateCurrentSource &&
      capabilities().canInsertLocalPgnIntoCurrentSource
    )
  }

  async function importFiles(files: File[], insert: boolean, expectedSourceId = ''): Promise<void> {
    const allowed = canImport(insert, expectedSourceId)

    if (!allowed) {
      pgn.lastError = insert
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

      if (!canImport(insert, expectedSourceId)) {
        pgn.lastError = insert
          ? '插入目标已变化，请重新选择当前本地来源。'
          : '当前无法打开新的本地 PGN 来源。'
        return
      }

      const merged = texts.join('\n\n')
      const filename = pgnFiles.length === 1 ? pgnFiles[0]?.name : `${pgnFiles.length} 个本地文件`
      const ok = insert
        ? pgn.insertText(merged)
        : pgn.openText(merged, localFileDataSource(filename))

      if (ok) {
        pgn.lastError = null
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
    const insert = insertMode.value
    const expectedSourceId = insertTargetSourceId.value

    if (files?.length) {
      await importFiles(Array.from(files), insert, expectedSourceId)
    }

    input.value = ''
    insertMode.value = false
    insertTargetSourceId.value = ''
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
      void importFiles(Array.from(files), false)
    }
  }

  function onBoardMoveRequest(payload: BoardMoveRequest): void {
    pgn.tryMove(payload)
  }

  onMounted(() => {
    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
  })

  onBeforeUnmount(() => {
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
