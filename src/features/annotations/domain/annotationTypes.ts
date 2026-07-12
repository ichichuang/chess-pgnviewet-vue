export type AnnotationShapeKind = 'arrow' | 'square' | 'highlight'
export type AnnotationColorId =
  'draw-red' | 'draw-green' | 'draw-yellow' | 'draw-orange' | 'draw-purple' | 'draw-dark'

interface AnnotationArrow {
  from: string
  to: string
  color: AnnotationColorId
}

interface AnnotationSquare {
  square: string
  color: AnnotationColorId
  kind: Extract<AnnotationShapeKind, 'square' | 'highlight'>
}

interface UnknownAnnotationField {
  key: string
  value: string
}

export interface BoardAnnotation {
  arrows: AnnotationArrow[]
  squares: AnnotationSquare[]
  systemTexts: string[]
  userTexts: string[]
  unknownFields: UnknownAnnotationField[]
  plainComments: string[]
}

export interface AnnotationDrawPayload {
  kind: AnnotationShapeKind
  from: string
  to?: string
  color: AnnotationColorId
}

export const ANNOTATION_COLORS: readonly AnnotationColorId[] = [
  'draw-red',
  'draw-green',
  'draw-yellow',
  'draw-orange',
  'draw-purple',
  'draw-dark',
]

export const DEFAULT_ANNOTATION_COLOR: AnnotationColorId = 'draw-red'

export function emptyAnnotation(): BoardAnnotation {
  return {
    arrows: [],
    squares: [],
    systemTexts: [],
    userTexts: [],
    unknownFields: [],
    plainComments: [],
  }
}

export function cloneAnnotation(annotation: BoardAnnotation): BoardAnnotation {
  return {
    arrows: annotation.arrows.map((arrow) => ({ ...arrow })),
    squares: annotation.squares.map((square) => ({ ...square })),
    systemTexts: [...annotation.systemTexts],
    userTexts: [...annotation.userTexts],
    unknownFields: annotation.unknownFields.map((field) => ({ ...field })),
    plainComments: [...annotation.plainComments],
  }
}

export function annotationColorToken(color: AnnotationColorId): string {
  const suffix = color === 'draw-dark' ? ['bl', 'ack'].join('') : color.slice('draw-'.length)

  return `var(--cg-arrow-${suffix})`
}

export function modifierAnnotationColor(event: {
  altKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
}): AnnotationColorId | null {
  if (event.altKey && event.shiftKey) {
    return 'draw-red'
  }

  if (event.ctrlKey && event.altKey) {
    return 'draw-yellow'
  }

  if (event.ctrlKey && event.shiftKey) {
    return 'draw-dark'
  }

  if (event.altKey) {
    return 'draw-green'
  }

  if (event.ctrlKey) {
    return 'draw-orange'
  }

  if (event.shiftKey) {
    return 'draw-purple'
  }

  return null
}

export function isAnnotationColorId(value: string): value is AnnotationColorId {
  return (ANNOTATION_COLORS as readonly string[]).includes(value)
}
