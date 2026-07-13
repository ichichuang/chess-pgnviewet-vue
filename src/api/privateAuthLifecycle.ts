type PrivateAuthLossHandler = (message: string) => void

let privateAuthLossHandler: PrivateAuthLossHandler | null = null

export function registerPrivateAuthLossHandler(handler: PrivateAuthLossHandler): void {
  privateAuthLossHandler = handler
}

export function notifyPrivateAuthLoss(message: string): void {
  privateAuthLossHandler?.(message)
}
