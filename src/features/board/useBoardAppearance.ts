import { computed, type CSSProperties, type ComputedRef } from 'vue'

import type { NormalizedChessboardCapabilities } from './domain/boardCapabilities'

type SupportedCssProperty =
  'background-color' | 'border-color' | 'border-radius' | 'box-shadow' | 'color'

interface AppearanceBinding {
  token: `--${string}`
  property: SupportedCssProperty
  value: string | undefined
}

export function useBoardAppearance(
  capabilities: ComputedRef<NormalizedChessboardCapabilities>
): ComputedRef<CSSProperties> {
  return computed(() => {
    const appearance = capabilities.value.appearance
    const bindings: AppearanceBinding[] = [
      { token: '--cg-square-light', property: 'background-color', value: appearance.lightSquare },
      { token: '--cg-square-dark', property: 'background-color', value: appearance.darkSquare },
      { token: '--board-coordinate-color', property: 'color', value: appearance.coordinates },
      { token: '--cg-overlay-selected', property: 'background-color', value: appearance.selected },
      { token: '--cg-hint-fill', property: 'background-color', value: appearance.legalTarget },
      {
        token: '--cg-hint-capture-fill',
        property: 'background-color',
        value: appearance.legalCapture,
      },
      { token: '--cg-overlay-lastmove', property: 'background-color', value: appearance.lastMove },
      { token: '--cg-overlay-check', property: 'background-color', value: appearance.check },
      { token: '--cg-overlay-hover', property: 'background-color', value: appearance.hover },
      { token: '--border-focus', property: 'border-color', value: appearance.focus },
      { token: '--border', property: 'border-color', value: appearance.border },
      { token: '--board-frame-radius', property: 'border-radius', value: appearance.radius },
      { token: '--board-square-radius', property: 'border-radius', value: appearance.radius },
      { token: '--board-instance-shadow', property: 'box-shadow', value: appearance.shadow },
      {
        token: '--board-radial-slice-fill',
        property: 'background-color',
        value: appearance.radialMenu?.background,
      },
      {
        token: '--board-radial-slice-selected',
        property: 'background-color',
        value: appearance.radialMenu?.selected,
      },
      {
        token: '--board-radial-slice-active',
        property: 'border-color',
        value: appearance.radialMenu?.active,
      },
      {
        token: '--board-radial-divider',
        property: 'border-color',
        value: appearance.radialMenu?.border,
      },
      {
        token: '--board-radial-shadow',
        property: 'box-shadow',
        value: appearance.radialMenu?.shadow,
      },
      {
        token: '--board-editor-chip-bg',
        property: 'background-color',
        value: appearance.editorPalette?.background,
      },
      {
        token: '--board-editor-palette-border',
        property: 'border-color',
        value: appearance.editorPalette?.border,
      },
      {
        token: '--board-editor-palette-selected',
        property: 'background-color',
        value: appearance.editorPalette?.selected,
      },
      {
        token: '--board-editor-palette-shadow',
        property: 'box-shadow',
        value: appearance.editorPalette?.shadow,
      },
    ]

    for (const [color, value] of Object.entries(appearance.annotations ?? {})) {
      const suffix = color === 'draw-dark' ? ['bl', 'ack'].join('') : color.slice('draw-'.length)
      bindings.push({
        token: `--cg-arrow-${suffix}`,
        property: 'color',
        value,
      })
    }

    const style: CSSProperties = {}

    for (const binding of bindings) {
      if (isSupportedValue(binding.property, binding.value)) {
        style[binding.token] = binding.value
      }
    }

    const responsive = capabilities.value.responsive

    if (responsive.minSize !== undefined) {
      style.minWidth = `${responsive.minSize}px`
      style.minHeight = `${responsive.minSize}px`
    }

    if (responsive.maxSize !== undefined) {
      style.maxWidth = `${responsive.maxSize}px`
      style.maxHeight = `${responsive.maxSize}px`
    }

    return style
  })
}

function isSupportedValue(
  property: SupportedCssProperty,
  value: string | undefined
): value is string {
  if (!value || value.includes(';') || value.includes('{') || value.includes('}')) {
    return false
  }

  if (typeof globalThis.CSS === 'undefined' || typeof globalThis.CSS.supports !== 'function') {
    return true
  }

  return globalThis.CSS.supports(property, value)
}
