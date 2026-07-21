export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function onReducedMotionChange(listener: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined
  }

  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', listener)

  return () => query.removeEventListener('change', listener)
}

export function motionDuration(owner: Element | null, token: string): number {
  if (prefersReducedMotion() || typeof window === 'undefined') return 0

  const value = window
    .getComputedStyle(owner ?? document.documentElement)
    .getPropertyValue(token)
    .trim()

  return value.endsWith('ms') ? Number.parseFloat(value) / 1000 : Number.parseFloat(value) || 0
}

export function motionEase(owner: Element | null, token: string): string {
  if (typeof window === 'undefined') return 'none'

  return (
    window
      .getComputedStyle(owner ?? document.documentElement)
      .getPropertyValue(token)
      .trim() || 'none'
  )
}

export function motionScalar(owner: Element | null, token: string): number {
  if (typeof window === 'undefined') return 0

  return (
    Number.parseFloat(
      window
        .getComputedStyle(owner ?? document.documentElement)
        .getPropertyValue(token)
        .trim()
    ) || 0
  )
}
