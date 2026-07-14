type PrivateAuthLossHandler = (message: string) => void
type PrivateAuthTokenProvider = () => string | null

let privateAuthLossHandler: PrivateAuthLossHandler | null = null
let privateAuthTokenProvider: PrivateAuthTokenProvider | null = null
let transientPrivateAuthToken: string | null = null

export function registerPrivateAuthLossHandler(handler: PrivateAuthLossHandler): void {
  privateAuthLossHandler = handler
}

export function registerPrivateAuthTokenProvider(provider: PrivateAuthTokenProvider): void {
  privateAuthTokenProvider = provider
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
