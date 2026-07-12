import {
  DEFAULT_ANNOTATION_COLOR,
  emptyAnnotation,
  isAnnotationColorId,
  type AnnotationColorId,
  type BoardAnnotation,
} from './annotationTypes'

const YCDW_MAGIC = 'YCDW:'

const SQUARE_RE = /^[a-h][1-8]$/u
const FIELD_RE = /^([^=]+)=(.*)$/su
const HASH = String.fromCharCode(35)

const COLOR_TO_CODE: Record<AnnotationColorId, string> = {
  'draw-green': '00',
  'draw-red': '01',
  'draw-orange': '02',
  'draw-yellow': '03',
  'draw-purple': '04',
  'draw-dark': '05',
}

const CODE_TO_COLOR: Record<string, AnnotationColorId> = {
  '00': 'draw-green',
  '01': 'draw-red',
  '02': 'draw-orange',
  '03': 'draw-yellow',
  '04': 'draw-purple',
  '05': 'draw-dark',
}

function hexColorToId(value: string): AnnotationColorId | null {
  const upper = value.toUpperCase()

  if (upper === `${HASH}FF2828`) return 'draw-red'
  if (upper === `${HASH}61ED00`) return 'draw-green'
  if (upper === `${HASH}FFC81F`) return 'draw-yellow'
  if (upper === `${HASH}FA810B`) return 'draw-orange'
  if (upper === `${HASH}6F2EE2`) return 'draw-purple'
  if (upper === `${HASH}333333`) return 'draw-dark'

  return null
}

function colorIdFromRaw(value: string): AnnotationColorId {
  if (isAnnotationColorId(value)) {
    return value
  }

  return CODE_TO_COLOR[value] ?? hexColorToId(value) ?? DEFAULT_ANNOTATION_COLOR
}

function parseFieldToken(token: string): { key: string; value: string } | null {
  const match = FIELD_RE.exec(token)

  if (!match?.[1]) {
    return null
  }

  return { key: match[1], value: match[2] ?? '' }
}

function appendArrow(value: string, annotation: BoardAnnotation): void {
  const from = value.slice(0, 2)
  const to = value.slice(2, 4)

  if (!SQUARE_RE.test(from) || !SQUARE_RE.test(to)) {
    return
  }

  annotation.arrows.push({
    from,
    to,
    color: colorIdFromRaw(value.slice(4)),
  })
}

function appendSquare(value: string, annotation: BoardAnnotation): void {
  const square = value.slice(0, 2)

  if (!SQUARE_RE.test(square)) {
    return
  }

  const rawTail = value.slice(2)
  const [rawColor, ...parts] = rawTail.split('|')
  const kind = parts.includes('k=highlight') ? 'highlight' : 'square'

  annotation.squares.push({
    square,
    kind,
    color: colorIdFromRaw(rawColor ?? ''),
  })
}

function parseYcdwPayload(payload: string, annotation: BoardAnnotation): void {
  let lastText: { arr: string[]; index: number } | null = null

  for (const token of payload.split(',')) {
    const field = parseFieldToken(token)

    if (!field) {
      if (lastText) {
        lastText.arr[lastText.index] += `,${token}`
      } else if (token.trim() !== '') {
        annotation.plainComments.push(token.trim())
      }
      continue
    }

    if (field.key === 'L') {
      appendArrow(field.value, annotation)
      lastText = null
    } else if (field.key === 'S') {
      appendSquare(field.value, annotation)
      lastText = null
    } else if (field.key === 'G') {
      annotation.systemTexts.push(field.value)
      lastText = { arr: annotation.systemTexts, index: annotation.systemTexts.length - 1 }
    } else if (field.key === 'U') {
      annotation.userTexts.push(field.value)
      lastText = { arr: annotation.userTexts, index: annotation.userTexts.length - 1 }
    } else {
      annotation.unknownFields.push(field)
      lastText = null
    }
  }
}

export function parseAnnotationComments(comments: readonly string[]): BoardAnnotation {
  const annotation = emptyAnnotation()

  for (const comment of comments) {
    const index = comment.indexOf(YCDW_MAGIC)

    if (index === -1) {
      annotation.plainComments.push(comment)
      continue
    }

    const plain = comment.slice(0, index).trim()

    if (plain) {
      annotation.plainComments.push(plain)
    }

    parseYcdwPayload(comment.slice(index + YCDW_MAGIC.length), annotation)
  }

  return annotation
}

export function serializeAnnotation(annotation: BoardAnnotation): string[] {
  const comments = [...annotation.plainComments]
  const fields: string[] = []

  for (const arrow of annotation.arrows) {
    fields.push(`L=${arrow.from}${arrow.to}${COLOR_TO_CODE[arrow.color]}`)
  }

  for (const square of annotation.squares) {
    const kindSuffix = square.kind === 'highlight' ? '|k=highlight' : ''
    fields.push(`S=${square.square}${COLOR_TO_CODE[square.color]}${kindSuffix}`)
  }

  for (const value of annotation.systemTexts) {
    fields.push(`G=${value}`)
  }

  for (const value of annotation.userTexts) {
    fields.push(`U=${value}`)
  }

  for (const field of annotation.unknownFields) {
    fields.push(`${field.key}=${field.value}`)
  }

  if (fields.length > 0) {
    comments.push(`${YCDW_MAGIC}${fields.join(',')}`)
  }

  return comments
}
