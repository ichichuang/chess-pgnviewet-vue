import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { gsap } from 'gsap'

import type { AnnotationShapeKind } from '@/features/annotations/domain/annotationTypes'

import {
  BOARD_RADIAL_GEOMETRY,
  BOARD_RADIAL_WIDTHS,
  type BoardRadialColor,
  type BoardRadialCommand,
} from '../domain/boardCapabilities'

interface BoardRadialMenuProps {
  open?: boolean
  x?: number
  y?: number
  pointerX?: number
  pointerY?: number
  colors?: unknown[]
  activeShape?: string | null
  colorIndex?: number
  width?: number
}

interface RadialOption {
  id: string
  title: string
  label: string
  fill?: string
  command: BoardRadialCommand
  active: boolean
}

type RadialMenuEmit = (event: string, command: BoardRadialCommand | null) => void

const geometry = BOARD_RADIAL_GEOMETRY

const shapeOptions: { title: string; label: string; shape: AnnotationShapeKind | null }[] = [
  { title: '选择', label: '选择', shape: null },
  { title: '方框', label: 'SQ', shape: 'square' },
  { title: '高亮', label: 'HI', shape: 'highlight' },
  { title: '箭头', label: 'AR', shape: 'arrow' },
]

const widthOptions = [
  { title: '细线', label: 'S', width: BOARD_RADIAL_WIDTHS[0] },
  { title: '中线', label: 'M', width: BOARD_RADIAL_WIDTHS[1] },
  { title: '粗线', label: 'L', width: BOARD_RADIAL_WIDTHS[2] },
]

function isRadialColor(value: unknown): value is BoardRadialColor {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'token' in value &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.token === 'string'
  )
}

function tokenValue(name: string): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function duration(name: string): number {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 0
  }

  const value = tokenValue(name)

  if (value.endsWith('ms')) {
    return Number.parseFloat(value) / 1000
  }

  return Number.parseFloat(value) || 0
}

function ease(name: string): string {
  return tokenValue(name) || 'none'
}

function isShape(value: string | null | undefined): value is AnnotationShapeKind {
  return value === 'arrow' || value === 'square' || value === 'highlight'
}

export function useBoardRadialMenuView(props: BoardRadialMenuProps, emit: RadialMenuEmit) {
  const rootEl = ref<HTMLDivElement | null>(null)
  const colors = computed(() => (props.colors ?? []).filter(isRadialColor))
  const activeShape = computed<AnnotationShapeKind | null>(() =>
    isShape(props.activeShape) ? props.activeShape : null
  )

  const options = computed<RadialOption[]>(() => [
    ...shapeOptions.map((option) => ({
      id: `shape-${option.shape ?? 'select'}`,
      title: option.title,
      label: option.label,
      command: { kind: 'shape', shape: option.shape } satisfies BoardRadialCommand,
      active: activeShape.value === option.shape,
    })),
    ...widthOptions.map((option) => ({
      id: `width-${option.width}`,
      title: option.title,
      label: option.label,
      command: { kind: 'width', width: option.width } satisfies BoardRadialCommand,
      active: props.width === option.width,
    })),
    ...colors.value.map((color, index) => ({
      id: `color-${color.id}`,
      title: color.name,
      label: '',
      fill: `var(${color.token})`,
      command: { kind: 'color', index } satisfies BoardRadialCommand,
      active: props.colorIndex === index,
    })),
  ])

  const selectedIndex = computed(() => {
    if (!props.open) {
      return -1
    }

    const count = options.value.length

    if (count === 0) {
      return -1
    }

    const dx = (props.pointerX ?? 0) - (props.x ?? 0)
    const dy = (props.pointerY ?? 0) - (props.y ?? 0)
    const distance = Math.hypot(dx, dy)

    if (distance < geometry.hitInnerRadius || distance > geometry.hitOuterRadius) {
      return -1
    }

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    return Math.floor(((angle + 90 + 360) % 360) / (360 / count))
  })

  const selectedOption = computed(() => {
    const index = selectedIndex.value

    return index >= 0 ? (options.value[index] ?? null) : null
  })

  const menuStyle = computed(() => ({
    left: `${props.x ?? 0}px`,
    top: `${props.y ?? 0}px`,
  }))

  function sliceTargets(): Element[] {
    return rootEl.value ? Array.from(rootEl.value.querySelectorAll('.radial-menu-slice')) : []
  }

  function activeIndicatorTargets(): Element[] {
    return rootEl.value
      ? Array.from(rootEl.value.querySelectorAll('.radial-menu-active-indicator'))
      : []
  }

  function optionClass(option: RadialOption): string {
    return `kind-${option.command.kind}`
  }

  function indicatorOpacity(_index: number, target: Element): number {
    return (target as SVGElement).dataset.active === 'true' ? 1 : 0
  }

  async function syncActiveIndicators(immediate = false): Promise<void> {
    await nextTick()
    const targets = activeIndicatorTargets()

    if (targets.length === 0) {
      return
    }

    gsap.killTweensOf(targets)
    gsap.to(targets, {
      autoAlpha: indicatorOpacity,
      duration: immediate ? 0 : duration('--board-radial-indicator-duration'),
      ease: ease('--board-radial-indicator-ease'),
      overwrite: true,
    })
  }

  function animateOpen(): void {
    const root = rootEl.value

    if (!root) {
      return
    }

    const slices = sliceTargets()
    gsap.killTweensOf([root, ...slices])
    gsap.fromTo(
      root,
      {
        autoAlpha: 0,
        scale: 0.4,
        transformOrigin: `${geometry.menuCenter}px ${geometry.menuCenter}px`,
      },
      {
        autoAlpha: 1,
        scale: 1,
        transformOrigin: `${geometry.menuCenter}px ${geometry.menuCenter}px`,
        duration: duration('--board-radial-open-duration'),
        ease: ease('--board-radial-open-ease'),
        overwrite: true,
      }
    )
    gsap.fromTo(
      slices,
      {
        autoAlpha: 0,
        scale: 0.72,
        transformOrigin: `${geometry.menuCenter}px ${geometry.menuCenter}px`,
        svgOrigin: `${geometry.menuCenter} ${geometry.menuCenter}`,
      },
      {
        autoAlpha: 1,
        scale: 1,
        transformOrigin: `${geometry.menuCenter}px ${geometry.menuCenter}px`,
        svgOrigin: `${geometry.menuCenter} ${geometry.menuCenter}`,
        duration: duration('--board-radial-open-duration'),
        ease: ease('--board-radial-open-ease'),
        stagger: duration('--board-radial-stagger-duration'),
        overwrite: true,
      }
    )
  }

  function animateClose(): void {
    const root = rootEl.value

    if (!root) {
      return
    }

    const slices = sliceTargets()
    gsap.killTweensOf([root, ...slices])
    gsap.to(root, {
      autoAlpha: 0,
      scale: 0.82,
      transformOrigin: `${geometry.menuCenter}px ${geometry.menuCenter}px`,
      duration: duration('--board-radial-close-duration'),
      ease: ease('--board-radial-close-ease'),
      overwrite: true,
    })
    gsap.to(slices, {
      autoAlpha: 0,
      scale: 0.86,
      transformOrigin: `${geometry.menuCenter}px ${geometry.menuCenter}px`,
      svgOrigin: `${geometry.menuCenter} ${geometry.menuCenter}`,
      duration: duration('--board-radial-slice-close-duration'),
      ease: ease('--board-radial-close-ease'),
      stagger: duration('--board-radial-close-stagger-duration'),
      overwrite: true,
    })
  }

  function polarPoint(radius: number, angle: number): { x: number; y: number } {
    const radians = ((angle - 90) * Math.PI) / 180

    return {
      x: geometry.menuCenter + radius * Math.cos(radians),
      y: geometry.menuCenter + radius * Math.sin(radians),
    }
  }

  function sectorPath(index: number): string {
    const count = options.value.length
    const step = 360 / count
    const gap = 1.4
    const start = index * step + gap
    const end = (index + 1) * step - gap
    const outerStart = polarPoint(geometry.outerRadius, start)
    const outerEnd = polarPoint(geometry.outerRadius, end)
    const innerEnd = polarPoint(geometry.innerRadius, end)
    const innerStart = polarPoint(geometry.innerRadius, start)
    const largeArc = end - start > 180 ? 1 : 0

    return [
      `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)}`,
      `A ${geometry.outerRadius} ${geometry.outerRadius} 0 ${largeArc} 1 ${outerEnd.x.toFixed(
        3
      )} ${outerEnd.y.toFixed(3)}`,
      `L ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)}`,
      `A ${geometry.innerRadius} ${geometry.innerRadius} 0 ${largeArc} 0 ${innerStart.x.toFixed(
        3
      )} ${innerStart.y.toFixed(3)}`,
      'Z',
    ].join(' ')
  }

  function labelPoint(index: number): { x: number; y: number } {
    const count = options.value.length

    return polarPoint(geometry.labelRadius, (index + 0.5) * (360 / count))
  }

  function widthStroke(option: RadialOption): number {
    if (option.id === 'width-0.08') {
      return 4
    }

    if (option.id === 'width-0.28') {
      return 10
    }

    return 7
  }

  function widthFocusRect(index: number): {
    x: number
    y: number
    width: number
    height: number
    rx: number
  } {
    const point = labelPoint(index)

    return {
      x: point.x - geometry.widthFocusWidth / 2,
      y: point.y - geometry.widthFocusHeight / 2,
      width: geometry.widthFocusWidth,
      height: geometry.widthFocusHeight,
      rx: geometry.widthFocusHeight / 2,
    }
  }

  watch(
    () => props.open,
    async (open) => {
      await nextTick()

      if (open) {
        animateOpen()
      } else {
        animateClose()
      }
    },
    { immediate: true }
  )

  watch(
    selectedOption,
    (option) => {
      emit('select', option?.command ?? null)
    },
    { immediate: true }
  )

  watch(
    () => options.value.map((option) => `${option.id}:${option.active ? '1' : '0'}`).join('|'),
    () => {
      void syncActiveIndicators()
    },
    { flush: 'post', immediate: true }
  )

  watch(
    options,
    async () => {
      await nextTick()
      void syncActiveIndicators(true)
    },
    { flush: 'post', immediate: true }
  )

  onBeforeUnmount(() => {
    const root = rootEl.value

    if (root) {
      gsap.killTweensOf([root, ...sliceTargets(), ...activeIndicatorTargets()])
    }
  })

  return {
    geometry,
    labelPoint,
    menuStyle,
    optionClass,
    options,
    rootEl,
    sectorPath,
    selectedIndex,
    widthFocusRect,
    widthStroke,
  }
}
