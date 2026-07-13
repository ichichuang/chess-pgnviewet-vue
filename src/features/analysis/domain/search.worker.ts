/**
 * Web Worker entry for the search engine. Keeps the (potentially heavy) negamax
 * search off the main thread so the UI stays responsive during analysis.
 *
 * Protocol: the main thread posts `{ id, fen, options }`; the worker replies with
 * `{ id, result }` where `result` is an `EngineEval`.
 */
import { searchPosition, type SearchOptions } from './search'

interface Req {
  id: number
  fen: string
  options: SearchOptions
}

self.onmessage = (e: MessageEvent<Req>) => {
  const { id, fen, options } = e.data
  try {
    const result = searchPosition(fen, options)
    ;(self as unknown as Worker).postMessage({ id, result })
  } catch (err) {
    ;(self as unknown as Worker).postMessage({
      id,
      error: err instanceof Error ? err.message : 'search failed',
    })
  }
}
