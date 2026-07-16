import { computed, readonly, ref, type Ref } from 'vue'

import { parseStrictPgnCollection, StrictPgnParseError } from '@/features/pgn/domain/parsePgn'
import type { PgnItem } from '@/features/pgn/domain/types'

import type {
  PgnImportApplicationRequest,
  PgnImportApplicationResult,
  PgnImportFailureReason,
  PgnImportFileResult,
  PgnImportSessionState,
  PgnImportTarget,
} from './pgnImportTypes'

interface PgnImportSessionOptions {
  canContinue: (target: PgnImportTarget) => boolean
  apply: (request: PgnImportApplicationRequest) => Promise<PgnImportApplicationResult>
  onApplied?: (target: PgnImportTarget) => void
}

class FileReadError extends Error {
  readonly reason: 'unreadable' | 'cancelled-read'

  constructor(reason: 'unreadable' | 'cancelled-read') {
    super(reason)
    this.name = 'FileReadError'
    this.reason = reason
  }
}

export function usePgnImportSession(options: PgnImportSessionOptions) {
  const session = ref<PgnImportSessionState | null>(null)
  const hasSession = computed(() => session.value !== null)
  const returnFocus = computed(() => activeTarget?.returnFocus)
  let activeTarget: PgnImportTarget | null = null
  let activeReader: FileReader | null = null
  let stagedItems: PgnItem[] = []
  let cancellationRequested = false
  let activeRun = 0

  function start(files: File[], target: PgnImportTarget): boolean {
    if (session.value) {
      focusExisting()
      return false
    }

    activeRun += 1
    const run = activeRun
    const id = globalThis.crypto?.randomUUID?.() ?? `pgn-import-${Date.now().toString(36)}`
    activeTarget = target
    cancellationRequested = false
    stagedItems = []
    session.value = {
      id,
      intent: target.intent,
      phase: 'idle',
      currentFilename: null,
      currentIndex: 0,
      total: files.length,
      completed: 0,
      successCount: 0,
      failureCount: 0,
      stagedGameCount: 0,
      appliedGameCount: 0,
      currentBytesLoaded: 0,
      currentBytesTotal: 0,
      results: files.map((file, selectionIndex) => ({
        id: `${id}:${selectionIndex}`,
        selectionIndex,
        filename: file.name || `未命名文件 ${selectionIndex + 1}`,
        status: 'pending',
        failureReason: null,
        gameCount: 0,
      })),
      statusMessage: '正在准备读取所选文件。',
      focusRequest: 0,
    }

    void processFiles(files, target, run)
    return true
  }

  async function processFiles(files: File[], target: PgnImportTarget, run: number): Promise<void> {
    const currentSession = session.value
    if (!currentSession || files.length === 0) {
      if (currentSession) finishFailure(currentSession, '没有选择可导入的文件。')
      return
    }

    for (let index = 0; index < files.length; index += 1) {
      if (run !== activeRun || session.value !== currentSession) return
      if (cancellationRequested) {
        finishCancellation(currentSession, index)
        return
      }

      const file = files[index]
      const result = currentSession.results[index]
      if (!file || !result) continue

      currentSession.currentFilename = result.filename
      currentSession.currentIndex = index + 1
      currentSession.currentBytesLoaded = 0
      currentSession.currentBytesTotal = file.size

      if (!isSupportedFile(file)) {
        setFileFailure(result, 'unsupported-content')
        markFileCompleted(currentSession)
        continue
      }

      let text: string
      try {
        currentSession.phase = 'reading'
        currentSession.statusMessage = `正在读取第 ${index + 1} 个文件。`
        result.status = 'reading'
        text = await readFile(file, currentSession)
      } catch (error) {
        if (run !== activeRun || session.value !== currentSession) return
        const reason = isFileReadFailure(error) ? error.reason : 'unreadable'
        setFileFailure(result, reason)
        markFileCompleted(currentSession)

        if (reason === 'cancelled-read' || cancellationRequested) {
          finishCancellation(currentSession, index + 1)
          return
        }
        if (!options.canContinue(target)) {
          setFileFailure(result, 'stale-target')
          finishStaleTarget(currentSession, index + 1)
          return
        }
        continue
      }

      if (run !== activeRun || session.value !== currentSession) return
      currentSession.currentBytesLoaded = file.size

      if (!options.canContinue(target)) {
        setFileFailure(result, 'stale-target')
        markFileCompleted(currentSession)
        finishStaleTarget(currentSession, index + 1)
        return
      }

      if (cancellationRequested) {
        result.status = 'cancelled'
        result.failureReason = 'cancelled-read'
        markFileCompleted(currentSession)
        finishCancellation(currentSession, index + 1)
        return
      }

      currentSession.phase = 'parsing'
      currentSession.statusMessage = `正在解析第 ${index + 1} 个文件。`
      result.status = 'parsing'

      try {
        const items = parseStrictPgnCollection(text)
        stagedItems.push(...items)
        result.status = 'success'
        result.gameCount = items.length
        currentSession.successCount += 1
        currentSession.stagedGameCount += items.length
      } catch (error) {
        setFileFailure(result, parseFailureReason(error))
      }

      markFileCompleted(currentSession)
      await yieldForCancellation()

      if (run !== activeRun || session.value !== currentSession) return
      if (cancellationRequested) {
        finishCancellation(currentSession, index + 1)
        return
      }
    }

    currentSession.currentFilename = null
    currentSession.currentIndex = currentSession.total
    currentSession.currentBytesLoaded = 0
    currentSession.currentBytesTotal = 0

    if (currentSession.successCount === 0) {
      finishFailure(currentSession, '所选文件均未通过检查，工作区未发生变化。')
      return
    }

    if (currentSession.failureCount > 0) {
      currentSession.phase = 'awaiting-partial-confirmation'
      currentSession.statusMessage = `有 ${currentSession.successCount} 个文件可导入，${currentSession.failureCount} 个文件未通过检查。`
      return
    }

    await applyStaged(target, currentSession, run)
  }

  async function confirmPartial(): Promise<void> {
    const currentSession = session.value
    const target = activeTarget
    if (!currentSession || !target || currentSession.phase !== 'awaiting-partial-confirmation')
      return

    if (!options.canContinue(target)) {
      finishStaleTarget(currentSession, currentSession.total)
      return
    }

    await applyStaged(target, currentSession, activeRun)
  }

  async function applyStaged(
    target: PgnImportTarget,
    currentSession: PgnImportSessionState,
    run: number
  ): Promise<void> {
    if (!options.canContinue(target)) {
      finishStaleTarget(currentSession, currentSession.total)
      return
    }

    currentSession.phase = 'applying'
    currentSession.statusMessage = '正在应用已通过检查的棋谱。'
    await Promise.resolve()

    if (
      run !== activeRun ||
      session.value !== currentSession ||
      cancellationRequested ||
      !options.canContinue(target)
    ) {
      finishStaleTarget(currentSession, currentSession.total)
      return
    }

    const successfulFilenames = currentSession.results
      .filter((result) => result.status === 'success')
      .map((result) => result.filename)
    let applicationResult: PgnImportApplicationResult
    try {
      applicationResult = await options.apply({
        target,
        items: stagedItems,
        successfulFilenames,
        isCurrent: () =>
          run === activeRun &&
          session.value === currentSession &&
          !cancellationRequested &&
          options.canContinue(target),
      })
    } catch {
      if (run !== activeRun || session.value !== currentSession) return
      finishFailure(currentSession, '应用棋谱失败，原工作区保持不变。')
      return
    }

    if (run !== activeRun || session.value !== currentSession) return

    if (applicationResult === 'applied') {
      currentSession.phase = 'completed'
      currentSession.appliedGameCount = currentSession.stagedGameCount
      currentSession.statusMessage = `已导入 ${currentSession.successCount} 个文件，共 ${currentSession.appliedGameCount} 盘棋。`
      stagedItems = []
      options.onApplied?.(target)
      return
    }

    stagedItems = []
    if (applicationResult === 'cancelled') {
      currentSession.phase = 'cancelled'
      currentSession.statusMessage = '已取消应用，原工作区保持不变。'
    } else if (applicationResult === 'stale') {
      finishStaleTarget(currentSession, currentSession.total)
    } else {
      finishFailure(currentSession, '应用棋谱失败，原工作区保持不变。')
    }
  }

  function requestCancel(): void {
    const currentSession = session.value
    if (!currentSession || !canCancelPhase(currentSession.phase)) return

    cancellationRequested = true
    currentSession.phase = 'cancelling'
    currentSession.statusMessage =
      activeReader !== null ? '正在停止文件读取。' : '当前解析完成后将停止导入。'
    activeReader?.abort()

    if (!activeReader && currentSession.completed === currentSession.total) {
      finishCancellation(currentSession, currentSession.total)
    }
  }

  function cancelForNavigation(): void {
    cancellationRequested = true
    activeReader?.abort()
    activeReader = null
    activeRun += 1
    stagedItems = []
    activeTarget = null
    session.value = null
  }

  function dismiss(): void {
    const currentSession = session.value
    if (!currentSession) return

    if (canCancelPhase(currentSession.phase)) {
      requestCancel()
      return
    }
    if (currentSession.phase === 'applying' || currentSession.phase === 'cancelling') return

    activeRun += 1
    stagedItems = []
    activeTarget = null
    session.value = null
  }

  function prepareRetry(): PgnImportTarget | null {
    const currentSession = session.value
    const target = activeTarget
    if (!currentSession || !target || currentSession.phase !== 'failed') return null

    activeRun += 1
    stagedItems = []
    activeTarget = null
    session.value = null
    return target
  }

  function focusExisting(): void {
    if (session.value) session.value.focusRequest += 1
  }

  function finishFailure(currentSession: PgnImportSessionState, message: string): void {
    stagedItems = []
    currentSession.phase = 'failed'
    currentSession.currentFilename = null
    currentSession.statusMessage = message
  }

  function finishCancellation(currentSession: PgnImportSessionState, startIndex: number): void {
    stagedItems = []
    for (let index = startIndex; index < currentSession.results.length; index += 1) {
      const result = currentSession.results[index]
      if (!result || result.status === 'success' || result.status === 'failure') continue
      result.status = 'cancelled'
      result.failureReason = 'cancelled-read'
    }
    refreshFailureCount(currentSession)
    currentSession.phase = 'cancelled'
    currentSession.currentFilename = null
    currentSession.statusMessage = '已取消导入，暂存内容已丢弃，原工作区保持不变。'
    activeReader = null
  }

  function finishStaleTarget(currentSession: PgnImportSessionState, startIndex: number): void {
    stagedItems = []
    for (let index = startIndex; index < currentSession.results.length; index += 1) {
      const result = currentSession.results[index]
      if (!result || result.status === 'success' || result.status === 'failure') continue
      result.status = 'failure'
      result.failureReason = 'stale-target'
    }
    refreshFailureCount(currentSession)
    currentSession.phase = 'failed'
    currentSession.currentFilename = null
    currentSession.statusMessage = '导入目标已变化，原工作区保持不变。请重新选择文件。'
  }

  function markFileCompleted(currentSession: PgnImportSessionState): void {
    currentSession.completed += 1
    currentSession.currentBytesLoaded = 0
    currentSession.currentBytesTotal = 0
    refreshFailureCount(currentSession)
  }

  function refreshFailureCount(currentSession: PgnImportSessionState): void {
    currentSession.failureCount = currentSession.results.filter(
      (result) => result.status === 'failure' || result.status === 'cancelled'
    ).length
  }

  function setFileFailure(result: PgnImportFileResult, reason: PgnImportFailureReason): void {
    result.status = reason === 'cancelled-read' ? 'cancelled' : 'failure'
    result.failureReason = reason
    result.gameCount = 0
  }

  function readFile(file: File, currentSession: PgnImportSessionState): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      activeReader = reader

      reader.onprogress = (event) => {
        if (session.value !== currentSession) return
        currentSession.currentBytesLoaded = event.loaded
        if (event.lengthComputable) currentSession.currentBytesTotal = event.total
      }
      reader.onload = () => {
        activeReader = null
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject(new FileReadError('unreadable'))
      }
      reader.onerror = () => {
        activeReader = null
        reject(new FileReadError('unreadable'))
      }
      reader.onabort = () => {
        activeReader = null
        reject(new FileReadError('cancelled-read'))
      }
      reader.readAsText(file)
    })
  }

  return {
    confirmPartial,
    cancelForNavigation,
    dismiss,
    focusExisting,
    hasSession,
    prepareRetry,
    requestCancel,
    returnFocus,
    session: readonly(session) as Readonly<Ref<PgnImportSessionState | null>>,
    start,
  }
}

function isSupportedFile(file: File): boolean {
  return /\.(pgn|txt)$/iu.test(file.name)
}

function isFileReadFailure(error: unknown): error is FileReadError {
  return error instanceof FileReadError
}

function parseFailureReason(error: unknown): PgnImportFailureReason {
  return error instanceof StrictPgnParseError ? error.reason : 'invalid-pgn'
}

function canCancelPhase(phase: PgnImportSessionState['phase']): boolean {
  return (
    phase === 'idle' ||
    phase === 'reading' ||
    phase === 'parsing' ||
    phase === 'awaiting-partial-confirmation'
  )
}

function yieldForCancellation(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => {
      channel.port1.close()
      channel.port2.close()
      resolve()
    }
    channel.port2.postMessage(undefined)
  })
}
