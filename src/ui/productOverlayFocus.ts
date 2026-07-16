export type ProductOverlayInitialFocus = 'safe-action' | 'first-action' | 'title' | 'none'

export type ProductOverlayReturnFocus = () => HTMLElement | null | void

interface ProductOverlayFocusEntry {
  readonly key: symbol
  readonly trigger: HTMLElement | null
  readonly fallback: ProductOverlayReturnFocus | null
  readonly focusActive: (() => boolean) | null
}

const overlayFocusStack: ProductOverlayFocusEntry[] = []

const focusableSelector = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function activeTriggerElement(): HTMLElement | null {
  const active = document.activeElement
  if (
    !(active instanceof HTMLElement) ||
    !active.isConnected ||
    active === document.body ||
    active === document.documentElement
  ) {
    return null
  }
  return active
}

function isDisabled(element: HTMLElement): boolean {
  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.disabled
  }
  return element.getAttribute('aria-disabled') === 'true'
}

function isFocusableCandidate(element: HTMLElement): boolean {
  if (!element.isConnected || isDisabled(element)) return false
  if (element.getAttribute('aria-hidden') === 'true') return false
  return element.matches(focusableSelector) || element.tabIndex >= 0
}

function focusElementSafely(element: HTMLElement | null | undefined): boolean {
  if (!element || !isFocusableCandidate(element)) return false
  element.focus({ preventScroll: true })
  const active = document.activeElement
  return active === element || Boolean(active && element.contains(active))
}

function firstFocusable(
  root: HTMLElement,
  options: { safeOnly?: boolean; includeDanger?: boolean } = {}
): HTMLElement | null {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(focusableSelector))
  return (
    candidates.find((candidate) => {
      if (!isFocusableCandidate(candidate)) return false
      if (options.safeOnly && !candidate.hasAttribute('data-product-overlay-safe')) return false
      if (!options.includeDanger && candidate.hasAttribute('data-product-overlay-danger')) {
        return false
      }
      return true
    }) ?? null
  )
}

function explicitInitialTarget(root: HTMLElement): HTMLElement | null {
  return (
    Array.from(root.querySelectorAll<HTMLElement>('[data-product-overlay-initial]')).find(
      isFocusableCandidate
    ) ?? null
  )
}

export function focusProductOverlayTarget(
  root: HTMLElement | null,
  title: HTMLElement | null,
  mode: ProductOverlayInitialFocus
): boolean {
  if (mode === 'none') return false
  if (mode === 'title') return focusElementSafely(title)
  if (!root) return focusElementSafely(title)

  const explicit = explicitInitialTarget(root)
  if (focusElementSafely(explicit)) return true

  if (mode === 'safe-action') {
    const safe = firstFocusable(root, { safeOnly: true })
    if (focusElementSafely(safe)) return true
  }

  const firstNonDangerous = firstFocusable(root)
  if (focusElementSafely(firstNonDangerous)) return true

  const firstAny = firstFocusable(root, { includeDanger: true })
  if (focusElementSafely(firstAny)) return true

  return focusElementSafely(title)
}

export function captureProductOverlayFocus(options: {
  fallback?: ProductOverlayReturnFocus
  focusActive?: () => boolean
}): ProductOverlayFocusEntry {
  const entry: ProductOverlayFocusEntry = {
    key: Symbol('product-overlay-focus'),
    trigger: activeTriggerElement(),
    fallback: options.fallback ?? null,
    focusActive: options.focusActive ?? null,
  }
  overlayFocusStack.push(entry)
  return entry
}

export function restoreProductOverlayFocus(entry: ProductOverlayFocusEntry): boolean {
  const index = overlayFocusStack.findIndex((candidate) => candidate.key === entry.key)
  if (index === -1) return false

  const wasActiveOverlay = index === overlayFocusStack.length - 1
  overlayFocusStack.splice(index, 1)
  if (!wasActiveOverlay) return false

  const parentOverlay = overlayFocusStack.at(-1)
  if (parentOverlay?.focusActive?.()) return true

  if (focusElementSafely(entry.trigger)) return true

  if (entry.fallback) {
    const fallbackTarget = entry.fallback()
    if (fallbackTarget === undefined) return true
    return focusElementSafely(fallbackTarget)
  }

  return false
}
