import { gsap } from 'gsap'

import { motionDuration, motionEase, motionScalar } from './gsapTokens'

type OverlayPlacement = 'right' | 'left' | 'top' | 'bottom'

function overlayDuration(owner: Element | null, token: string): number {
  return motionDuration(owner, token)
}

/**
 * Dialog entry: short fade plus a restrained scale-up, matching the workspace
 * promotion and drop overlays. Runs on the project-owned dialog card element.
 */
export function animateDialogEnter(card: HTMLElement, owner: Element | null): void {
  gsap.fromTo(
    card,
    { autoAlpha: 0, scale: motionScalar(owner, '--workspace-motion-overlay-scale') },
    {
      autoAlpha: 1,
      scale: 1,
      duration: overlayDuration(owner, '--workspace-motion-duration-panel'),
      ease: motionEase(owner, '--workspace-motion-ease-enter'),
      overwrite: true,
      clearProps: 'opacity,transform,visibility',
    }
  )
}

/**
 * Drawer or sheet entry: short fade plus a small placement-axis offset, the
 * same distance used by workspace panel motion. Runs on the drawer surface
 * element resolved from project-owned content.
 */
export function animateDrawerEnter(
  surface: HTMLElement,
  owner: Element | null,
  placement: OverlayPlacement
): void {
  const distance = motionScalar(owner, '--workspace-motion-distance-panel')
  const axis =
    placement === 'left'
      ? { x: -distance, y: 0 }
      : placement === 'right'
        ? { x: distance, y: 0 }
        : placement === 'top'
          ? { x: 0, y: -distance }
          : { x: 0, y: distance }

  gsap.fromTo(
    surface,
    { autoAlpha: 0, ...axis },
    {
      autoAlpha: 1,
      x: 0,
      y: 0,
      duration: overlayDuration(owner, '--workspace-motion-duration-panel'),
      ease: motionEase(owner, '--workspace-motion-ease-enter'),
      overwrite: true,
      clearProps: 'opacity,transform,visibility',
    }
  )
}

/**
 * Shared overlay exit: fast fade (with the same small offset for drawer
 * surfaces) that runs after focus has already been restored by the owning
 * adapter, so the close animation never delays focus return. `onComplete`
 * releases the overlay so Naive UI can unmount it immediately afterwards.
 */
export function animateOverlayLeave(
  surface: HTMLElement,
  owner: Element | null,
  placement: OverlayPlacement | 'dialog',
  onReleased: () => void
): void {
  const distance =
    placement === 'dialog' ? 0 : motionScalar(owner, '--workspace-motion-distance-panel')
  const axis =
    placement === 'left'
      ? { x: -distance }
      : placement === 'right'
        ? { x: distance }
        : placement === 'top'
          ? { y: -distance }
          : placement === 'bottom'
            ? { y: distance }
            : {}

  gsap.to(surface, {
    autoAlpha: 0,
    ...axis,
    duration: overlayDuration(owner, '--workspace-motion-duration-fast'),
    ease: motionEase(owner, '--workspace-motion-ease-state'),
    overwrite: true,
    onComplete: onReleased,
    onInterrupt: onReleased,
  })
}
