import { Chess } from 'chess.js'

import { emptyAnnotation } from '@/features/annotations/domain/annotationTypes'
import { parseAnnotationComments } from '@/features/annotations/domain/ycdw'

import type { GameTree, MoveNode, PgnItem } from './types'

export type StrictPgnParseFailure = 'empty' | 'invalid-pgn' | 'unsupported-content'

const STRICT_PGN_PARSE_MESSAGES: Record<StrictPgnParseFailure, string> = {
  empty: 'PGN 中未找到棋谱',
  'invalid-pgn': 'PGN 包含无效格式或走法，未加载',
  'unsupported-content': '文件内容不是受支持的 PGN',
}

export class StrictPgnParseError extends Error {
  readonly reason: StrictPgnParseFailure

  constructor(reason: StrictPgnParseFailure) {
    super(STRICT_PGN_PARSE_MESSAGES[reason])
    this.name = 'StrictPgnParseError'
    this.reason = reason
  }
}

export const STANDARD_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const RESULT_RE = /^(1-0|0-1|1\/2-1\/2|\*)$/
const TAG_LINE_RE = /^\s*\[\s*([A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"\s*\]\s*$/
const QUALITY_NAGS: Record<string, string> = {
  '!': '$1',
  '?': '$2',
  '!!': '$3',
  '??': '$4',
  '!?': '$5',
  '?!': '$6',
}

interface Token {
  type: 'move' | 'comment' | 'open' | 'close' | 'nag' | 'result' | 'movenum'
  value: string
}

let nodeIdCounter = 0

function resetNodeIds(): void {
  nodeIdCounter = 0
}

function allocNodeId(): number {
  return nodeIdCounter++
}

function makeNode(partial: Partial<MoveNode>): MoveNode {
  return {
    id: allocNodeId(),
    san: '',
    fen: STANDARD_START_FEN,
    prevFen: undefined,
    ply: 0,
    moveNumber: 1,
    color: null,
    rawComments: [],
    annotation: emptyAnnotation(),
    nags: [],
    parent: null,
    children: [],
    ...partial,
  }
}

function cleanCommentText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function extractQualityGlyph(san: string): { base: string; nag: string | null } {
  const match = /(!!|\?\?|!\?|\?!|!|\?)$/.exec(san)
  if (!match) {
    return { base: san, nag: null }
  }

  const glyph = match[1]

  if (!glyph) {
    return { base: san, nag: null }
  }

  return {
    base: san.slice(0, -glyph.length),
    nag: QUALITY_NAGS[glyph] ?? null,
  }
}

function splitGames(text: string): { headerLines: string[]; movetext: string }[] {
  const lines = text.split(/\r?\n/)
  const games: { headerLines: string[]; moveLines: string[] }[] = []
  let current: { headerLines: string[]; moveLines: string[] } = {
    headerLines: [],
    moveLines: [],
  }
  let seenMoves = false

  const pushCurrent = () => {
    const hasHeaders = current.headerLines.length > 0
    const hasMoves = current.moveLines.some((line) => line.trim() !== '')

    if (hasHeaders || hasMoves) {
      games.push(current)
    }
  }

  for (const line of lines) {
    if (TAG_LINE_RE.test(line)) {
      if (seenMoves) {
        pushCurrent()
        current = { headerLines: [], moveLines: [] }
        seenMoves = false
      }
      current.headerLines.push(line)
    } else {
      if (line.trim() !== '') {
        seenMoves = true
      }
      current.moveLines.push(line)
    }
  }

  pushCurrent()

  return games
    .filter((game) => game.headerLines.length > 0 || game.moveLines.some((line) => line.trim()))
    .map((game) => ({
      headerLines: game.headerLines,
      movetext: game.moveLines.join('\n').trim(),
    }))
}

function parseHeaderLines(headerLines: string[]): {
  tags: Record<string, string>
  headers: string[]
} {
  const tags: Record<string, string> = {}
  const headers: string[] = []

  for (const line of headerLines) {
    const match = TAG_LINE_RE.exec(line)

    if (match) {
      const name = match[1]
      const value = match[2]

      if (!name || value == null) {
        continue
      }

      tags[name] = value.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      headers.push(line.trim())
    }
  }

  return { tags, headers }
}

function tokenizeMovetext(movetext: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < movetext.length) {
    const char = movetext[index] ?? ''

    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if (char === '{') {
      const end = movetext.indexOf('}', index)
      tokens.push({
        type: 'comment',
        value: end === -1 ? movetext.slice(index + 1) : movetext.slice(index + 1, end),
      })
      index = end === -1 ? movetext.length : end + 1
      continue
    }

    if (char === ';') {
      const end = movetext.indexOf('\n', index)
      tokens.push({
        type: 'comment',
        value: end === -1 ? movetext.slice(index + 1) : movetext.slice(index + 1, end),
      })
      index = end === -1 ? movetext.length : end + 1
      continue
    }

    if (char === '(' || char === ')') {
      tokens.push({ type: char === '(' ? 'open' : 'close', value: char })
      index += 1
      continue
    }

    if (char === '}') {
      index += 1
      continue
    }

    if (char === '$') {
      let end = index + 1
      while (end < movetext.length) {
        const digit = movetext[end]

        if (!digit || !/\d/.test(digit)) {
          break
        }

        end += 1
      }
      tokens.push({ type: 'nag', value: movetext.slice(index, end) })
      index = end
      continue
    }

    let end = index
    while (end < movetext.length) {
      const next = movetext[end]

      if (!next || ' \t\r\n{}();'.includes(next)) {
        break
      }

      end += 1
    }

    if (end === index) {
      index += 1
      continue
    }

    let word = movetext.slice(index, end)
    index = end

    if (RESULT_RE.test(word)) {
      tokens.push({ type: 'result', value: word })
      continue
    }

    const moveNumber = /^(\d+)\.(\.\.)?/.exec(word)
    if (moveNumber) {
      word = word.slice(moveNumber[0].length)
      if (word === '') {
        tokens.push({ type: 'movenum', value: moveNumber[0] })
        continue
      }
    }

    tokens.push({ type: 'move', value: word })
  }

  return tokens
}

function buildGameTree(
  movetext: string,
  startFen: string
): {
  tree: GameTree
  parseError: boolean
} {
  new Chess(startFen)

  const root = makeNode({ fen: startFen, ply: 0 })
  const tokens = tokenizeMovetext(movetext)
  let parseError = false
  let parentNode = root
  let skipDepth = 0
  let lastIllegal = false
  const stack: { parent: MoveNode; skip: number; lastIllegal: boolean }[] = []

  for (const token of tokens) {
    if (token.type === 'movenum' || token.type === 'result') {
      continue
    }

    if (token.type === 'open') {
      stack.push({ parent: parentNode, skip: skipDepth, lastIllegal })
      parentNode = lastIllegal ? parentNode : (parentNode.parent ?? root)
      skipDepth = 0
      lastIllegal = false
      continue
    }

    if (token.type === 'close') {
      const restored = stack.pop()

      if (restored) {
        parentNode = restored.parent
        skipDepth = restored.skip
        lastIllegal = restored.lastIllegal
      }
      continue
    }

    if (skipDepth > 0) {
      continue
    }

    if (token.type === 'comment') {
      const comment = cleanCommentText(token.value)

      if (comment) {
        parentNode.rawComments.push(comment)
      }
      continue
    }

    if (token.type === 'nag') {
      if (!parentNode.nags.includes(token.value)) {
        parentNode.nags.push(token.value)
      }
      continue
    }

    if (token.type === 'move') {
      const chess = new Chess(parentNode.fen)
      const moveNumber = chess.moveNumber()
      const color = chess.turn()
      const { base, nag } = extractQualityGlyph(token.value)
      let result

      try {
        result = chess.move(base, { strict: false })
      } catch {
        result = null
      }

      if (!result) {
        parseError = true
        skipDepth = 1
        lastIllegal = true
        continue
      }

      const node = makeNode({
        san: result.san,
        from: result.from,
        to: result.to,
        promotion: result.promotion,
        fen: result.after,
        prevFen: result.before,
        ply: parentNode.ply + 1,
        moveNumber,
        color,
        parent: parentNode,
      })

      if (nag && !node.nags.includes(nag)) {
        node.nags.push(nag)
      }

      parentNode.children.push(node)
      parentNode = node
      lastIllegal = false
    }
  }

  return {
    tree: { startFen, fromFen: startFen !== STANDARD_START_FEN, root },
    parseError,
  }
}

function lastMainlineNode(tree: GameTree): MoveNode {
  let node = tree.root

  while (node.children.length > 0) {
    const next = node.children[0]

    if (!next) {
      break
    }

    node = next
  }

  return node
}

function finalizeAnnotations(node: MoveNode): void {
  node.annotation = parseAnnotationComments(node.rawComments)

  for (const child of node.children) {
    finalizeAnnotations(child)
  }
}

export function mainlineMoves(tree: GameTree): MoveNode[] {
  const out: MoveNode[] = []
  let node = tree.root

  while (node.children.length > 0) {
    const next = node.children[0]

    if (!next) {
      break
    }

    node = next
    out.push(node)
  }

  return out
}

function parseGame(headerLines: string[], movetext: string): PgnItem {
  const { tags, headers } = parseHeaderLines(headerLines)
  const startFen = tags.FEN && tags.FEN.trim() !== '' ? tags.FEN.trim() : STANDARD_START_FEN
  const { tree, parseError } = buildGameTree(movetext, startFen)
  finalizeAnnotations(tree.root)
  const last = lastMainlineNode(tree)

  return {
    headers,
    tags,
    FEN: tags.FEN,
    PGN: movetext,
    Event: tags.Event,
    White: tags.White,
    Black: tags.Black,
    Result: tags.Result,
    pgnTitle: tags.Event,
    description: tags.Annotator,
    last_fen: last.fen,
    tree,
    parseError,
  }
}

export function parsePgnCollection(text: string): PgnItem[] {
  resetNodeIds()

  return splitGames(text).map((game) => parseGame(game.headerLines, game.movetext))
}

export function parseStrictPgnCollection(text: string): PgnItem[] {
  const normalized = text.trim()

  if (normalized === '') {
    throw new StrictPgnParseError('empty')
  }

  const hasPgnStructure =
    /\[\s*[A-Za-z0-9_]+\s+"/u.test(normalized) ||
    /(?:^|\s)\d+\.(?:\.\.)?\s*\S/u.test(normalized) ||
    /(?:^|\s)(?:1-0|0-1|1\/2-1\/2|\*)(?:\s|$)/u.test(normalized)

  try {
    const items = parsePgnCollection(normalized)

    if (items.length === 0) {
      throw new StrictPgnParseError('empty')
    }

    if (items.some((item) => item.parseError)) {
      throw new StrictPgnParseError(hasPgnStructure ? 'invalid-pgn' : 'unsupported-content')
    }

    return items
  } catch (error) {
    if (error instanceof StrictPgnParseError) throw error
    throw new StrictPgnParseError(hasPgnStructure ? 'invalid-pgn' : 'unsupported-content')
  }
}
