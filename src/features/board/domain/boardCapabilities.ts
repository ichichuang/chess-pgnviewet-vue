import type {
  AnnotationColorId,
  AnnotationDrawPayload,
  AnnotationShapeKind,
  BoardAnnotation,
} from '@/features/annotations/domain/annotationTypes'

import type {
  BoardMoveRequest,
  BoardColor,
  BoardOrientation,
  ExecutedBoardMove,
  PendingPromotion,
  PromotionPiece,
} from './boardTypes'

export type BoardWheelNavigationDirection = 'previous' | 'next'
export type BoardMoveRequestDecision =
  boolean | 'applied' | 'branch' | 'promotion' | 'illegal' | void
export type BoardReducedMotionMode = 'system' | 'reduce'
export type BoardWheelEventConsumption = 'always' | 'handled' | 'never'
export type BoardResponsiveFit = 'contain' | 'width' | 'height'
export type BoardInteractionKind =
  | 'splitter'
  | 'editor'
  | 'radial-menu'
  | 'annotation'
  | 'drag'
  | 'click'
  | 'touch'
  | 'wheel'
  | 'keyboard'

export interface BoardRadialColor {
  id: AnnotationColorId
  name: string
  token: string
}

export interface BoardRadialCustomItem {
  key: string
  label: string
  title: string
  fill?: string
  active?: boolean
  disabled?: boolean
  onSelect: (context: BoardRadialSelectionContext) => void
}

export type BoardRadialCommand =
  | { kind: 'shape'; shape: AnnotationShapeKind | null }
  | { kind: 'width'; width: 0.08 | 0.16 | 0.28 }
  | { kind: 'color'; index: number }
  | { kind: 'custom'; item: BoardRadialCustomItem }

export interface BoardRadialSelectionContext {
  command: BoardRadialCommand
  position: string
  orientation: BoardOrientation
}

export interface BoardEditorPiece {
  color: 'w' | 'b'
  type: 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'
}

export interface BoardEditorCastlingRights {
  wK: boolean
  wQ: boolean
  bK: boolean
  bQ: boolean
}

export interface BoardEditorDraftSnapshot {
  fen: string
  sideToMove: 'w' | 'b'
  castlingRights: BoardEditorCastlingRights
}

export type BoardEditorValidationResult = { valid: true } | { valid: false; message: string }

export type BoardEditorAcceptDecision = boolean | BoardEditorValidationResult | void

export interface BoardPieceDescriptor {
  letter: string
  color: BoardColor
  type: 'bishop' | 'king' | 'knight' | 'pawn' | 'queen' | 'rook'
  square?: string
}

export type BoardPieceResolver = (piece: BoardPieceDescriptor) => string

export interface BoardAppearance {
  lightSquare?: string
  darkSquare?: string
  coordinates?: string
  selected?: string
  legalTarget?: string
  legalCapture?: string
  lastMove?: string
  check?: string
  hover?: string
  focus?: string
  annotations?: Partial<Record<AnnotationColorId, string>>
  border?: string
  radius?: string
  shadow?: string
  radialMenu?: {
    background?: string
    selected?: string
    active?: string
    border?: string
    shadow?: string
  }
  editorPalette?: {
    background?: string
    border?: string
    selected?: string
    shadow?: string
  }
}

export interface BoardPositionCapabilityOptions {
  visible?: boolean
  playable?: boolean
  readOnly?: boolean
  controlled?: boolean
  onMoveRequest?: (payload: BoardMoveRequest) => BoardMoveRequestDecision
}

export interface BoardInteractionCapabilityOptions {
  click?: boolean
  drag?: boolean
  touch?: boolean
  keyboard?: boolean
  priority?: readonly BoardInteractionKind[]
}

export interface BoardCoordinateCapabilityOptions {
  visible?: boolean
}

export interface BoardPromotionCapabilityOptions {
  enabled?: boolean
  choices?: readonly PromotionPiece[]
}

interface BoardMoveAnimationOptions {
  enabled?: boolean
}

interface BoardSnapbackAnimationOptions {
  enabled?: boolean
}

export interface BoardAnimationCapabilityOptions {
  move?: BoardMoveAnimationOptions
  snapback?: BoardSnapbackAnimationOptions
  reducedMotion?: BoardReducedMotionMode
}

export interface BoardAnnotationChangeEvent {
  previous: BoardAnnotation
  next: BoardAnnotation
  draw: AnnotationDrawPayload
}

export interface BoardAnnotationCapabilityOptions {
  enabled?: boolean
  drawing?: boolean
  activeTool?: AnnotationShapeKind | null
  tools?: readonly AnnotationShapeKind[]
  activeColor?: AnnotationColorId
  colors?: readonly BoardRadialColor[]
  emitModelUpdates?: boolean
  canUndo?: boolean
  canRedo?: boolean
  canClear?: boolean
  onDraw?: (payload: AnnotationDrawPayload) => void
  onChange?: (event: BoardAnnotationChangeEvent) => void
  onUndo?: () => boolean | void
  onRedo?: () => boolean | void
  onClear?: () => boolean | void
}

export interface BoardRadialMenuOptions {
  enabled?: boolean
  activeShape?: AnnotationShapeKind | null
  colorIndex?: number
  width?: 0.08 | 0.16 | 0.28
  colors?: readonly BoardRadialColor[]
  customItems?: readonly BoardRadialCustomItem[]
  onSelect?: (context: BoardRadialSelectionContext) => void
}

export interface BoardEditorCapabilityOptions {
  available?: boolean
  active?: boolean
  initialFen?: string
  freePlacement?: boolean
  palette?: readonly BoardEditorPiece[]
  validate?: (snapshot: BoardEditorDraftSnapshot) => BoardEditorValidationResult
  onAccept?: (snapshot: BoardEditorDraftSnapshot) => BoardEditorAcceptDecision
  onCancel?: () => void
}

export interface BoardWheelNavigationOptions {
  enabled?: boolean
  blocked?: boolean
  directions?: readonly BoardWheelNavigationDirection[]
  threshold?: number
  throttleMs?: number
  consume?: BoardWheelEventConsumption
  onNavigate?: (direction: BoardWheelNavigationDirection) => void
}

export interface BoardResponsiveCapabilityOptions {
  enabled?: boolean
  fit?: BoardResponsiveFit
  minSize?: number
  maxSize?: number
}

export interface BoardAccessibilityLabels {
  board?: string
  editor?: string
  promotionDialog?: string
  promotionGroup?: string
  square?: (square: string, piece: BoardPieceDescriptor | null) => string
}

export interface BoardAccessibilityCapabilityOptions {
  labels?: BoardAccessibilityLabels
  announce?: (message: string) => void
}

export interface ChessboardCapabilities {
  position?: BoardPositionCapabilityOptions
  interaction?: BoardInteractionCapabilityOptions
  coordinates?: BoardCoordinateCapabilityOptions
  orientation?: BoardOrientation
  promotion?: BoardPromotionCapabilityOptions
  animation?: BoardAnimationCapabilityOptions
  annotations?: BoardAnnotationCapabilityOptions
  radialMenu?: BoardRadialMenuOptions
  editor?: BoardEditorCapabilityOptions
  wheelNavigation?: BoardWheelNavigationOptions
  responsive?: BoardResponsiveCapabilityOptions
  accessibility?: BoardAccessibilityCapabilityOptions
  appearance?: BoardAppearance
  pieceResolver?: BoardPieceResolver
}

export type BoardAdvancedCapabilities = ChessboardCapabilities

export interface NormalizedChessboardCapabilities {
  position: Required<
    Pick<BoardPositionCapabilityOptions, 'visible' | 'playable' | 'readOnly' | 'controlled'>
  > & {
    onMoveRequest?: BoardPositionCapabilityOptions['onMoveRequest']
  }
  interaction: Required<
    Pick<BoardInteractionCapabilityOptions, 'click' | 'drag' | 'touch' | 'keyboard'>
  > & {
    priority: readonly BoardInteractionKind[]
  }
  coordinates: Required<BoardCoordinateCapabilityOptions>
  orientation: BoardOrientation
  promotion: {
    enabled: boolean
    choices: readonly PromotionPiece[]
  }
  animation: {
    move: Required<BoardMoveAnimationOptions>
    snapback: Required<BoardSnapbackAnimationOptions>
    reducedMotion: BoardReducedMotionMode
  }
  annotations: Required<
    Pick<
      BoardAnnotationCapabilityOptions,
      'enabled' | 'drawing' | 'emitModelUpdates' | 'canUndo' | 'canRedo' | 'canClear'
    >
  > & {
    activeTool: AnnotationShapeKind | null
    tools: readonly AnnotationShapeKind[]
    activeColor: AnnotationColorId
    colors: readonly BoardRadialColor[]
    onDraw?: BoardAnnotationCapabilityOptions['onDraw']
    onChange?: BoardAnnotationCapabilityOptions['onChange']
    onUndo?: BoardAnnotationCapabilityOptions['onUndo']
    onRedo?: BoardAnnotationCapabilityOptions['onRedo']
    onClear?: BoardAnnotationCapabilityOptions['onClear']
  }
  radialMenu: Required<Pick<BoardRadialMenuOptions, 'enabled' | 'colorIndex' | 'width'>> & {
    activeShape: AnnotationShapeKind | null
    colors: readonly BoardRadialColor[]
    customItems: readonly BoardRadialCustomItem[]
    onSelect?: BoardRadialMenuOptions['onSelect']
  }
  editor: Required<Pick<BoardEditorCapabilityOptions, 'available' | 'active' | 'freePlacement'>> & {
    initialFen?: string
    palette: readonly BoardEditorPiece[]
    validate?: BoardEditorCapabilityOptions['validate']
    onAccept?: BoardEditorCapabilityOptions['onAccept']
    onCancel?: BoardEditorCapabilityOptions['onCancel']
  }
  wheelNavigation: Required<
    Pick<
      BoardWheelNavigationOptions,
      'enabled' | 'blocked' | 'threshold' | 'throttleMs' | 'consume'
    >
  > & {
    directions: readonly BoardWheelNavigationDirection[]
    onNavigate?: BoardWheelNavigationOptions['onNavigate']
  }
  responsive: Required<Pick<BoardResponsiveCapabilityOptions, 'enabled' | 'fit'>> & {
    minSize?: number
    maxSize?: number
  }
  accessibility: {
    labels: Required<Omit<BoardAccessibilityLabels, 'square'>> & {
      square: NonNullable<BoardAccessibilityLabels['square']>
    }
    announce?: BoardAccessibilityCapabilityOptions['announce']
  }
  appearance: BoardAppearance
  pieceResolver: BoardPieceResolver
}

export interface ChessboardProps {
  position?: string | undefined
  lastMove?: readonly [string, string] | undefined
  annotations?: BoardAnnotation | undefined
  capabilities?: ChessboardCapabilities | undefined
}

export interface ChessboardEvents {
  'move-request': [payload: BoardMoveRequest]
  'move-executed': [payload: ExecutedBoardMove]
  'promotion-request': [payload: PendingPromotion]
  'position-change': [fen: string]
  'annotation-draw': [payload: AnnotationDrawPayload]
  'update:annotations': [annotations: BoardAnnotation]
  'radial-command': [command: BoardRadialCommand]
  'editor-update': [snapshot: BoardEditorDraftSnapshot]
  'editor-commit': [snapshot: BoardEditorDraftSnapshot]
  'editor-error': [message: string]
  'editor-cancel': []
  'editor-clear-request': []
  'editor-reset-request': []
  'wheel-navigation': [direction: BoardWheelNavigationDirection]
  'interaction-active': [active: boolean]
}

export interface ChessboardExposed {
  cancelPromotion: () => void
  clearEditorDraft: () => BoardEditorDraftSnapshot
  clearAnnotations: () => boolean
  flipOrientation: () => void
  getPosition: () => string
  getEditorDraftSnapshot: () => BoardEditorDraftSnapshot
  readonly interactionActive: boolean
  redoAnnotations: () => boolean
  resolvePromotion: (piece: PromotionPiece) => void
  resetEditorDraft: () => BoardEditorDraftSnapshot
  setOrientation: (orientation: BoardOrientation) => void
  setPosition: (fen: string) => void
  undoAnnotations: () => boolean
}

export const BOARD_RADIAL_WIDTHS = [0.08, 0.16, 0.28] as const
export const BOARD_PROMOTION_CHOICES: readonly PromotionPiece[] = ['q', 'r', 'b', 'n']
export const BOARD_EDITOR_DEFAULT_PALETTE: readonly BoardEditorPiece[] = [
  { color: 'w', type: 'K' },
  { color: 'w', type: 'Q' },
  { color: 'w', type: 'R' },
  { color: 'w', type: 'B' },
  { color: 'w', type: 'N' },
  { color: 'w', type: 'P' },
  { color: 'b', type: 'K' },
  { color: 'b', type: 'Q' },
  { color: 'b', type: 'R' },
  { color: 'b', type: 'B' },
  { color: 'b', type: 'N' },
  { color: 'b', type: 'P' },
]
export const BOARD_DEFAULT_INTERACTION_PRIORITY: readonly BoardInteractionKind[] = [
  'splitter',
  'editor',
  'radial-menu',
  'annotation',
  'drag',
  'click',
  'touch',
  'wheel',
  'keyboard',
]

export const BOARD_RADIAL_GEOMETRY = {
  menuSize: 300,
  menuCenter: 150,
  outerRadius: 141,
  innerRadius: 48,
  labelRadius: 96,
  coreRadius: 36,
  colorSwatchRadius: 12,
  colorFocusRadius: 23,
  widthMarkHalf: 18,
  widthFocusWidth: 64,
  widthFocusHeight: 38,
  hitInnerRadius: 45,
  hitOuterRadius: 168,
} as const

export const BOARD_WHEEL_THROTTLE_MS = 60
export const BOARD_WHEEL_THRESHOLD = 1
export const BOARD_DRAG_THRESHOLD_PX = 5

export function isAcceptedMoveDecision(decision: BoardMoveRequestDecision): boolean {
  return (
    decision === undefined ||
    decision === true ||
    decision === 'applied' ||
    decision === 'branch' ||
    decision === 'promotion'
  )
}
