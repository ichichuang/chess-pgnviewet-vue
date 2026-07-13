/**
 * `AnalysisEngine` backed by the real negamax search (`search.ts`).
 *
 * In the browser it runs the search inside a small pool of Web Workers (sized by
 * local hardware concurrency) so current-position analysis does not block the
 * UI. Where Workers are unavailable, it runs the same pure search in-process.
 */
import type { AnalysisEngine, EngineEval, EngineEvalOptions } from './engine'
import { searchPosition } from './search'

interface Pending {
  /** The worker this request was dispatched to (for error-driven rescue). */
  worker: Worker
  resolve: (ev: EngineEval) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
  /** In-process rescue used if the owning worker dies or times out. */
  rescueSearch: () => EngineEval
}

export class AnalysisStoppedError extends Error {
  constructor() {
    super('analysis stopped')
    this.name = 'AnalysisStoppedError'
  }
}

/** True when the Web Worker + module-worker machinery is usable. */
function workersSupported(): boolean {
  try {
    return (
      typeof Worker !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof import.meta.url === 'string'
    )
  } catch {
    return false
  }
}

export class SearchEngine implements AnalysisEngine {
  private workers: Worker[] = []
  private pending = new Map<number, Pending>()
  private seq = 0
  private rr = 0
  private readonly poolSize: number
  private readonly useWorkers: boolean

  constructor(poolSize = 2) {
    this.poolSize = Math.max(1, Math.min(poolSize || 1, 8))
    this.useWorkers = workersSupported()
  }

  get workerSupported(): boolean {
    return this.useWorkers
  }

  get workerCount(): number {
    return this.workers.length
  }

  get workerBacked(): boolean {
    return this.workers.length > 0
  }

  init(): void {
    if (!this.useWorkers || this.workers.length > 0) return
    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new Worker(new URL('./search.worker.ts', import.meta.url), {
          type: 'module',
        })
        worker.onmessage = (
          e: MessageEvent<{ id: number; result?: EngineEval; error?: string }>
        ) => {
          const p = this.pending.get(e.data.id)
          if (p) {
            this.pending.delete(e.data.id)
            clearTimeout(p.timer)
            if (e.data.result) {
              p.resolve(e.data.result)
            } else {
              p.reject(new Error(e.data.error ?? 'search failed'))
            }
          }
        }
        worker.onerror = () => this.dropWorker(worker)
        this.workers.push(worker)
      } catch {
        /* keep the remaining slots on the in-process path */
      }
    }
  }

  /**
   * Remove a crashed/errored worker from the pool and immediately rescue any of
   * its in-flight requests via the in-process search, instead of leaving them to
   * each stall until the long per-request timeout (and continuing to round-robin
   * fresh work onto the dead worker).
   */
  private dropWorker(worker: Worker): void {
    const idx = this.workers.indexOf(worker)
    if (idx !== -1) this.workers.splice(idx, 1)
    try {
      worker.terminate()
    } catch {
      /* ignore */
    }
    for (const [id, p] of this.pending) {
      if (p.worker === worker) {
        this.pending.delete(id)
        clearTimeout(p.timer)
        p.resolve(p.rescueSearch())
      }
    }
  }

  async evalFen(fen: string, options: EngineEvalOptions): Promise<EngineEval> {
    if (!this.useWorkers || this.workers.length === 0) {
      return searchPosition(fen, options)
    }
    const worker = this.workers[this.rr++ % this.workers.length]
    if (!worker) return searchPosition(fen, options)
    const id = ++this.seq
    const rescueSearch = () => searchPosition(fen, options)
    return new Promise<EngineEval>((resolve, reject) => {
      // Safety net: if a worker stalls or errors, rescue the request with the
      // same in-process search so analysis cannot hang indefinitely.
      const timer = setTimeout(
        () => {
          if (this.pending.delete(id)) resolve(rescueSearch())
        },
        (options.maxthinktimes || 1500) + 4000
      )
      this.pending.set(id, {
        worker,
        rescueSearch,
        reject,
        timer,
        resolve: (ev) => {
          clearTimeout(timer)
          resolve(ev)
        },
      })
      worker.postMessage({ id, fen, options })
    })
  }

  dispose(): void {
    this.stop()
  }

  stop(): void {
    const stopped = new AnalysisStoppedError()
    for (const p of this.pending.values()) {
      clearTimeout(p.timer)
      p.reject(stopped)
    }
    this.pending.clear()
    for (const w of this.workers) w.terminate()
    this.workers = []
  }
}

/** Factory used by app bootstrap. */
export function createSearchEngine(poolSize?: number): SearchEngine {
  return new SearchEngine(poolSize)
}
