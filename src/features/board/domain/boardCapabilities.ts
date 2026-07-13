import type {
  AnnotationColorId,
  AnnotationShapeKind,
} from '@/features/annotations/domain/annotationTypes'

import type { BoardMoveRequest } from './boardTypes'

export type BoardWheelNavigationDirection = 'previous' | 'next'
export type BoardMoveRequestDecision =
  boolean | 'applied' | 'branch' | 'promotion' | 'illegal' | void

export interface BoardRadialColor {
  id: AnnotationColorId
  name: string
  token: string
}

export type BoardRadialCommand =
  | { kind: 'shape'; shape: AnnotationShapeKind | null }
  | { kind: 'width'; width: 0.08 | 0.16 | 0.28 }
  | { kind: 'color'; index: number }

interface BoardMoveAnimationOptions {
  enabled?: boolean
  requestMove?: (payload: BoardMoveRequest) => BoardMoveRequestDecision
}

interface BoardSnapbackAnimationOptions {
  enabled?: boolean
}

interface BoardAnimationCapabilityOptions {
  move?: BoardMoveAnimationOptions
  snapback?: BoardSnapbackAnimationOptions
}

interface BoardRadialMenuOptions {
  enabled?: boolean
  activeShape?: AnnotationShapeKind | null
  colorIndex?: number
  width?: 0.08 | 0.16 | 0.28
  colors?: readonly BoardRadialColor[]
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

interface BoardEditorCapabilityOptions {
  available?: boolean
  active?: boolean
  initialFen?: string
}

interface BoardWheelNavigationOptions {
  enabled?: boolean
  blocked?: boolean
}

export interface BoardAdvancedCapabilities {
  animation?: BoardAnimationCapabilityOptions
  radialMenu?: BoardRadialMenuOptions
  editor?: BoardEditorCapabilityOptions
  wheelNavigation?: BoardWheelNavigationOptions
}

export interface NormalizedBoardAdvancedCapabilities {
  animation: {
    move: Required<Pick<BoardMoveAnimationOptions, 'enabled'>> & {
      requestMove?: BoardMoveAnimationOptions['requestMove']
    }
    snapback: Required<BoardSnapbackAnimationOptions>
  }
  radialMenu: Required<Pick<BoardRadialMenuOptions, 'enabled' | 'colorIndex' | 'width'>> & {
    activeShape: AnnotationShapeKind | null
    colors: readonly BoardRadialColor[]
  }
  editor: Required<Pick<BoardEditorCapabilityOptions, 'available' | 'active'>> & {
    initialFen?: string
  }
  wheelNavigation: Required<BoardWheelNavigationOptions>
}

export const BOARD_RADIAL_WIDTHS = [0.08, 0.16, 0.28] as const

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
