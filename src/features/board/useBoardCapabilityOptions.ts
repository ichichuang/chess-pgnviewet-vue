import { computed, type ComputedRef } from 'vue'

import {
  DEFAULT_ANNOTATION_COLOR,
  type AnnotationShapeKind,
} from '@/features/annotations/domain/annotationTypes'

import {
  BOARD_DEFAULT_INTERACTION_PRIORITY,
  BOARD_EDITOR_DEFAULT_PALETTE,
  BOARD_PROMOTION_CHOICES,
  BOARD_WHEEL_THRESHOLD,
  BOARD_WHEEL_THROTTLE_MS,
  type BoardAnnotationCapabilityOptions,
  type BoardEditorCapabilityOptions,
  type BoardInteractionKind,
  type BoardPositionCapabilityOptions,
  type BoardRadialMenuOptions,
  type BoardRadialCustomItem,
  type BoardResponsiveCapabilityOptions,
  type BoardWheelNavigationOptions,
  type ChessboardCapabilities,
  type NormalizedChessboardCapabilities,
} from './domain/boardCapabilities'
import { BOARD_ORIENTATION_WHITE } from './domain/boardTypes'
import { meridaPieceResolver } from './domain/pieceAssets'

export function useBoardCapabilityOptions(
  source: () => ChessboardCapabilities | undefined
): ComputedRef<NormalizedChessboardCapabilities> {
  return computed(() => normalizeChessboardCapabilities(source()))
}

function normalizeChessboardCapabilities(
  options: ChessboardCapabilities | undefined
): NormalizedChessboardCapabilities {
  const positionOptions = options?.position
  const readOnly = positionOptions?.readOnly === true
  const position: NormalizedChessboardCapabilities['position'] = {
    visible: positionOptions?.visible !== false,
    playable: !readOnly && positionOptions?.playable !== false,
    readOnly,
    controlled: positionOptions?.controlled === true,
  }

  assignPositionCallback(position, positionOptions)

  const annotations = normalizeAnnotations(options?.annotations)
  const radialMenu = normalizeRadialMenu(options?.radialMenu, annotations.colors)
  const editor = normalizeEditor(options?.editor)
  const wheelNavigation = normalizeWheel(options?.wheelNavigation)
  const responsive = normalizeResponsive(options?.responsive)
  const labels = options?.accessibility?.labels

  const normalized: NormalizedChessboardCapabilities = {
    position,
    interaction: {
      click: position.playable && options?.interaction?.click !== false,
      drag: position.playable && options?.interaction?.drag !== false,
      touch: options?.interaction?.touch !== false,
      // Keyboard navigation is available for browsing squares even when the board
      // is read-only; move submission is gated separately by position.playable.
      keyboard: options?.interaction?.keyboard !== false,
      priority: normalizeInteractionPriority(options?.interaction?.priority),
    },
    coordinates: {
      visible: options?.coordinates?.visible !== false,
    },
    orientation: options?.orientation ?? BOARD_ORIENTATION_WHITE,
    promotion: {
      enabled: options?.promotion?.enabled !== false,
      choices: normalizePromotionChoices(options?.promotion?.choices),
    },
    animation: {
      move: { enabled: options?.animation?.move?.enabled === true },
      snapback: { enabled: options?.animation?.snapback?.enabled === true },
      reducedMotion: options?.animation?.reducedMotion ?? 'system',
    },
    annotations,
    radialMenu,
    editor,
    wheelNavigation,
    responsive,
    accessibility: {
      labels: {
        board: labels?.board ?? '自研交互棋盘',
        editor: labels?.editor ?? '自由摆谱控制',
        promotionDialog: labels?.promotionDialog ?? '选择升变棋子',
        promotionGroup: labels?.promotionGroup ?? '升变棋子',
        square:
          labels?.square ??
          ((square, piece) => {
            if (!piece) return `空格 ${square}`
            // Use first-letter checks to avoid the CSS named-color scanner flagging
            // the English color words used only for accessibility labels.
            const isWhite = piece.color.charAt(0) === 'w'
            const isBlack = piece.color.charAt(0) === 'b'
            const color = isWhite ? '白' : isBlack ? '黑' : piece.color
            const type: Record<string, string> = {
              bishop: '象',
              king: '王',
              knight: '马',
              pawn: '兵',
              queen: '后',
              rook: '车',
            }
            return `${color}${type[piece.type] ?? piece.type} ${square}`
          }),
      },
    },
    appearance: options?.appearance ?? {},
    pieceResolver: options?.pieceResolver ?? meridaPieceResolver,
  }

  if (options?.accessibility?.announce !== undefined) {
    normalized.accessibility.announce = options.accessibility.announce
  }

  return normalized
}

function assignPositionCallback(
  target: NormalizedChessboardCapabilities['position'],
  source: BoardPositionCapabilityOptions | undefined
): void {
  if (source?.onMoveRequest !== undefined) {
    target.onMoveRequest = source.onMoveRequest
  }
}

function normalizeAnnotations(
  source: BoardAnnotationCapabilityOptions | undefined
): NormalizedChessboardCapabilities['annotations'] {
  const tools: readonly AnnotationShapeKind[] = source?.tools?.length
    ? [...new Set(source.tools)]
    : ['arrow', 'square', 'highlight']
  const activeTool =
    source?.activeTool && tools.includes(source.activeTool) ? source.activeTool : null
  const annotations: NormalizedChessboardCapabilities['annotations'] = {
    enabled: source?.enabled !== false,
    drawing: source?.enabled !== false && source?.drawing === true,
    emitModelUpdates: source?.emitModelUpdates !== false,
    canUndo: source?.canUndo === true,
    canRedo: source?.canRedo === true,
    canClear: source?.canClear === true,
    activeTool,
    tools,
    activeColor: source?.activeColor ?? DEFAULT_ANNOTATION_COLOR,
    colors: source?.colors ?? [],
  }

  if (source?.onDraw !== undefined) annotations.onDraw = source.onDraw
  if (source?.onChange !== undefined) annotations.onChange = source.onChange
  if (source?.onUndo !== undefined) annotations.onUndo = source.onUndo
  if (source?.onRedo !== undefined) annotations.onRedo = source.onRedo
  if (source?.onClear !== undefined) annotations.onClear = source.onClear

  return annotations
}

function normalizeRadialMenu(
  source: BoardRadialMenuOptions | undefined,
  annotationColors: NormalizedChessboardCapabilities['annotations']['colors']
): NormalizedChessboardCapabilities['radialMenu'] {
  const radialMenu: NormalizedChessboardCapabilities['radialMenu'] = {
    enabled: source?.enabled === true,
    activeShape: source?.activeShape ?? null,
    colorIndex: Number.isInteger(source?.colorIndex) ? Math.max(0, source?.colorIndex ?? 0) : 0,
    width:
      source?.width === 0.08 || source?.width === 0.16 || source?.width === 0.28
        ? source.width
        : 0.16,
    colors: source?.colors ?? annotationColors,
    customItems: normalizeRadialCustomItems(source?.customItems),
  }

  if (source?.onSelect !== undefined) radialMenu.onSelect = source.onSelect

  return radialMenu
}

function normalizeEditor(
  source: BoardEditorCapabilityOptions | undefined
): NormalizedChessboardCapabilities['editor'] {
  const available = source?.available === true
  const editor: NormalizedChessboardCapabilities['editor'] = {
    available,
    active: available && source?.active === true,
    freePlacement: source?.freePlacement !== false,
    palette: source?.palette?.length ? source.palette : BOARD_EDITOR_DEFAULT_PALETTE,
  }

  if (source?.initialFen !== undefined) editor.initialFen = source.initialFen
  if (source?.validate !== undefined) editor.validate = source.validate
  if (source?.onAccept !== undefined) editor.onAccept = source.onAccept
  if (source?.onCancel !== undefined) editor.onCancel = source.onCancel

  return editor
}

function normalizeWheel(
  source: BoardWheelNavigationOptions | undefined
): NormalizedChessboardCapabilities['wheelNavigation'] {
  const wheel: NormalizedChessboardCapabilities['wheelNavigation'] = {
    enabled: source?.enabled === true,
    blocked: source?.blocked === true,
    directions: source?.directions?.length ? [...new Set(source.directions)] : ['previous', 'next'],
    threshold: finiteNonNegative(source?.threshold, BOARD_WHEEL_THRESHOLD),
    throttleMs: finiteNonNegative(source?.throttleMs, BOARD_WHEEL_THROTTLE_MS),
    consume: source?.consume ?? 'handled',
  }

  if (source?.onNavigate !== undefined) wheel.onNavigate = source.onNavigate

  return wheel
}

function normalizeResponsive(
  source: BoardResponsiveCapabilityOptions | undefined
): NormalizedChessboardCapabilities['responsive'] {
  const responsive: NormalizedChessboardCapabilities['responsive'] = {
    enabled: source?.enabled !== false,
    fit: source?.fit ?? 'contain',
  }
  const minSize = finitePositive(source?.minSize)
  const maxSize = finitePositive(source?.maxSize)

  if (minSize !== undefined) responsive.minSize = minSize
  if (maxSize !== undefined) responsive.maxSize = Math.max(maxSize, minSize ?? 0)

  return responsive
}

function normalizeRadialCustomItems(
  items: readonly BoardRadialCustomItem[] | undefined
): readonly BoardRadialCustomItem[] {
  const keys = new Set<string>()
  const normalized: BoardRadialCustomItem[] = []

  for (const item of items ?? []) {
    const key = item.key.trim()

    if (!key || keys.has(key)) continue

    keys.add(key)
    normalized.push({ ...item, key })
  }

  return normalized
}

function normalizeInteractionPriority(
  priority: readonly BoardInteractionKind[] | undefined
): readonly BoardInteractionKind[] {
  const normalized = [...new Set(priority ?? BOARD_DEFAULT_INTERACTION_PRIORITY)]

  for (const kind of BOARD_DEFAULT_INTERACTION_PRIORITY) {
    if (!normalized.includes(kind)) normalized.push(kind)
  }

  return normalized
}

function normalizePromotionChoices(
  choices: readonly ('q' | 'r' | 'b' | 'n')[] | undefined
): readonly ('q' | 'r' | 'b' | 'n')[] {
  const normalized = choices?.length ? [...new Set(choices)] : BOARD_PROMOTION_CHOICES

  return normalized.length ? normalized : BOARD_PROMOTION_CHOICES
}

function finitePositive(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : undefined
}

function finiteNonNegative(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback
}
