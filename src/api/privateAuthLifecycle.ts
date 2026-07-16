type PrivateAuthLossHandler = (message: string) => void
type PrivateAuthTokenProvider = () => string | null
export type PrivateAuthUiLossReason = 'expired' | 'invalidated'

export interface PrivateAuthUiLossEvent {
  reason: PrivateAuthUiLossReason
  occurredAt: number
}

type PrivateAuthUiLossHandler = (event: PrivateAuthUiLossEvent) => void

let privateAuthLossHandler: PrivateAuthLossHandler | null = null
let privateAuthTokenProvider: PrivateAuthTokenProvider | null = null
let transientPrivateAuthToken: string | null = null
const privateAuthUiLossHandlers = new Set<PrivateAuthUiLossHandler>()

export function registerPrivateAuthLossHandler(handler: PrivateAuthLossHandler): void {
  privateAuthLossHandler = handler
}

export function registerPrivateAuthTokenProvider(provider: PrivateAuthTokenProvider): void {
  privateAuthTokenProvider = provider
}

export function subscribePrivateAuthUiLoss(handler: PrivateAuthUiLossHandler): () => void {
  privateAuthUiLossHandlers.add(handler)
  return () => {
    privateAuthUiLossHandlers.delete(handler)
  }
}

export function privateAuthToken(): string | null {
  return transientPrivateAuthToken ?? privateAuthTokenProvider?.() ?? null
}

export async function withTransientPrivateAuthToken<T>(
  token: string,
  task: () => Promise<T>
): Promise<T> {
  transientPrivateAuthToken = token

  try {
    return await task()
  } finally {
    transientPrivateAuthToken = null
  }
}

export function notifyPrivateAuthLoss(message: string): void {
  privateAuthLossHandler?.(message)
}

export function notifyPrivateAuthUiLoss(event: PrivateAuthUiLossEvent): void {
  for (const handler of privateAuthUiLossHandlers) {
    handler(event)
  }
}
