import { inject, provide, type InjectionKey } from 'vue'

import type { ProductOverlayReturnFocus } from '@/ui/productOverlayFocus'

export type ProductRecoverableMessageKind =
  'settings-saved' | 'settings-save-failed' | 'action-completed' | 'content-temporarily-unavailable'

export interface ProductRecoverableMessageEvent {
  kind: ProductRecoverableMessageKind
}

export interface ProductLoginRequiredEvent {
  returnPath?: string
}

export interface ProductSessionExpiredEvent {
  returnPath?: string
}

export interface ProductConfirmationRequest {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  dangerous?: boolean
  returnFocus?: ProductOverlayReturnFocus
}

export interface ProductFeedbackApi {
  showRecoverableMessage: (event: ProductRecoverableMessageEvent) => void
  showLoginRequired: (event?: ProductLoginRequiredEvent) => void
  showSessionExpired: (event?: ProductSessionExpiredEvent) => void
  requestConfirmation: (request: ProductConfirmationRequest) => Promise<boolean>
}

const productFeedbackKey: InjectionKey<ProductFeedbackApi> = Symbol('product-feedback')

export function provideProductFeedback(api: ProductFeedbackApi): void {
  provide(productFeedbackKey, api)
}

export function useProductFeedback(): ProductFeedbackApi {
  const api = inject(productFeedbackKey, null)
  if (!api) {
    throw new Error('Product feedback provider is not installed.')
  }
  return api
}
