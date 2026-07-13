export { default as CanonicalChessBoard } from './CanonicalChessBoard.vue'
export { default as PgnChessBoard } from './pgn/PgnChessBoard.vue'

export { meridaPieceResolver } from './domain/pieceAssets'
export { BOARD_PROMOTION_CHOICES, BOARD_RADIAL_WIDTHS } from './domain/boardCapabilities'
export {
  BOARD_COLOR_BLACK,
  BOARD_COLOR_WHITE,
  BOARD_ORIENTATION_BLACK,
  BOARD_ORIENTATION_WHITE,
} from './domain/boardTypes'

export type {
  BoardAccessibilityCapabilityOptions,
  BoardAccessibilityLabels,
  BoardAdvancedCapabilities,
  BoardAnimationCapabilityOptions,
  BoardAnnotationCapabilityOptions,
  BoardAnnotationChangeEvent,
  BoardAppearance,
  BoardCoordinateCapabilityOptions,
  BoardEditorAcceptDecision,
  BoardEditorCapabilityOptions,
  BoardEditorCastlingRights,
  BoardEditorDraftSnapshot,
  BoardEditorPiece,
  BoardEditorValidationResult,
  BoardInteractionKind,
  BoardInteractionCapabilityOptions,
  BoardMoveRequestDecision,
  BoardPieceDescriptor,
  BoardPieceResolver,
  BoardPositionCapabilityOptions,
  BoardPromotionCapabilityOptions,
  BoardRadialColor,
  BoardRadialCommand,
  BoardRadialCustomItem,
  BoardRadialMenuOptions,
  BoardRadialSelectionContext,
  BoardReducedMotionMode,
  BoardResponsiveCapabilityOptions,
  BoardResponsiveFit,
  BoardWheelEventConsumption,
  BoardWheelNavigationDirection,
  BoardWheelNavigationOptions,
  ChessboardCapabilities,
  ChessboardEvents,
  ChessboardExposed,
  ChessboardProps,
} from './domain/boardCapabilities'
export type {
  BoardColor,
  BoardMoveRequest,
  BoardOrientation,
  ExecutedBoardMove,
  PendingPromotion,
  PromotionPiece,
} from './domain/boardTypes'
export type {
  PgnChessBoardError,
  PgnChessBoardErrorCode,
  PgnChessBoardEvents,
  PgnChessBoardExposed,
  PgnChessBoardProps,
  PgnChessBoardSource,
  PgnGameSummary,
  PgnNavigationEvent,
  PgnNavigationReason,
  PgnNodeSnapshot,
  PgnSourceChangeEvent,
} from './pgn/pgnChessBoardTypes'
