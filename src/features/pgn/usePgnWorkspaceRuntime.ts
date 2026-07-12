import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { BoardMoveRequest } from '@/features/board/domain/boardTypes'
import { usePgnStore } from '@/stores'

export function usePgnWorkspaceRuntime() {
  const pgn = usePgnStore()
  const fileInput = ref<HTMLInputElement | null>(null)
  const insertMode = ref(false)
  const dragDepth = ref(0)
  const boardPosition = computed(() => pgn.currentFen)
  const boardInteractive = computed(() => pgn.hasGame)
  const dragActive = computed(() => dragDepth.value > 0)

  function handlePgnAction(name: 'openLocal' | 'insertLocal'): void {
    insertMode.value = name === 'insertLocal'
    fileInput.value?.click()
  }

  function isPgnFile(file: File): boolean {
    return /\.(pgn|txt)$/i.test(file.name)
  }

  async function importFiles(files: File[], insert: boolean): Promise<void> {
    const pgnFiles = files.filter(isPgnFile)

    if (pgnFiles.length === 0) {
      pgn.lastError = '请拖入 .pgn 棋谱文件'
      return
    }

    try {
      const texts = await Promise.all(pgnFiles.map((file) => file.text()))
      const merged = texts.join('\n\n')
      const ok = insert ? pgn.insertText(merged) : pgn.openText(merged, { type: 'FS' })

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

    if (files?.length) {
      await importFiles(Array.from(files), insertMode.value)
    }

    input.value = ''
    insertMode.value = false
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
