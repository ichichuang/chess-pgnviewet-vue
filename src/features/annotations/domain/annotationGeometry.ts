import type { BoardOrientation } from '@/features/board/domain/boardTypes'
import { squareCenter } from '@/features/board/domain/boardGeometry'

export interface AnnotationArrowGeometry {
  shaft: { x1: number; y1: number; x2: number; y2: number }
  head: [number, number][]
}

const ANNOTATION_ARROW_HEAD_SIZE = 0.34

export function arrowGeometry(
  from: string,
  to: string,
  orientation: BoardOrientation
): AnnotationArrowGeometry | null {
  const start = squareCenter(from, orientation)
  const end = squareCenter(to, orientation)

  if (!start || !end) {
    return null
  }

  return arrowGeometryFromPoints(start, end)
}

export function arrowGeometryFromPoints(
  start: [number, number],
  end: [number, number]
): AnnotationArrowGeometry | null {
  const [x1, y1] = start
  const [x2, y2] = end
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy)

  if (length < 0.05) {
    return null
  }

  const unitX = dx / length
  const unitY = dy / length
  const perpX = -unitY
  const perpY = unitX
  const baseX = x2 - unitX * ANNOTATION_ARROW_HEAD_SIZE
  const baseY = y2 - unitY * ANNOTATION_ARROW_HEAD_SIZE

  return {
    shaft: {
      x1,
      y1,
      x2: x2 - unitX * ANNOTATION_ARROW_HEAD_SIZE * 0.9,
      y2: y2 - unitY * ANNOTATION_ARROW_HEAD_SIZE * 0.9,
    },
    head: [
      [x2, y2],
      [
        baseX + perpX * ANNOTATION_ARROW_HEAD_SIZE * 0.6,
        baseY + perpY * ANNOTATION_ARROW_HEAD_SIZE * 0.6,
      ],
      [
        baseX - perpX * ANNOTATION_ARROW_HEAD_SIZE * 0.6,
        baseY - perpY * ANNOTATION_ARROW_HEAD_SIZE * 0.6,
      ],
    ],
  }
}
