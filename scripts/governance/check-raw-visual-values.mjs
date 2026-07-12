#!/usr/bin/env node

import { visualValuePolicy } from './policy.mjs'
import {
  addFinding,
  createContext,
  lineAndExcerpt,
  listFiles,
  parseArgs,
  readTextFile,
  report,
} from './utils.mjs'

const scannerName = 'raw-visual-values'
const args = parseArgs()
const context = createContext(args)

const files = listFiles(context, {
  scopes: visualValuePolicy.scopes,
  extensions: visualValuePolicy.extensions,
})

for (const file of files) {
  if (visualValuePolicy.tokenAuthorities.includes(file)) {
    continue
  }

  const text = readTextFile(context, file)

  if (text === null) {
    continue
  }

  scanColorValues(file, text)
  scanNonColorValues(file, text)
}

report(context, scannerName, args)

function scanColorValues(file, text) {
  const colorRules = [
    {
      ruleId: 'VISUAL_RAW_HEX_COLOR',
      pattern: /(^|[^A-Za-z0-9_-])(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b)/gu,
      reason: 'Raw hexadecimal colors are allowed only in the token authority.',
    },
    {
      ruleId: 'VISUAL_RAW_RGB_COLOR',
      pattern: /\brgba?\s*\(/giu,
      reason: 'Raw rgb/rgba colors are allowed only in the token authority.',
    },
    {
      ruleId: 'VISUAL_RAW_HSL_COLOR',
      pattern: /\bhsla?\s*\(/giu,
      reason: 'Raw hsl/hsla colors are allowed only in the token authority.',
    },
    {
      ruleId: 'VISUAL_RAW_MODERN_COLOR',
      pattern: /\b(?:hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/giu,
      reason: 'Raw modern color functions are allowed only in the token authority.',
    },
  ]

  for (const rule of colorRules) {
    for (const match of stripBlockComments(text).matchAll(rule.pattern)) {
      addVisualFinding(rule.ruleId, file, text, match.index ?? 0, rule.reason)
    }
  }

  const namedColorPattern = new RegExp(`\\b(${visualValuePolicy.namedColors.join('|')})\\b`, 'giu')

  for (const match of stripBlockComments(text).matchAll(namedColorPattern)) {
    const location = lineAndExcerpt(text, match.index ?? 0)
    const lowered = match[1].toLowerCase()

    if (visualValuePolicy.allowedKeywordValues.includes(lowered)) {
      continue
    }

    if (!looksLikeVisualValue(location.excerpt, match[1])) {
      continue
    }

    addFinding(context, {
      ruleId: 'VISUAL_RAW_NAMED_COLOR',
      file,
      line: location.line,
      excerpt: location.excerpt,
      reason: 'Named colors are allowed only in the token authority unless listed as CSS keywords.',
      remediationOwner: 'token-governance',
    })
  }
}

function scanNonColorValues(file, text) {
  const declarationPattern =
    /(?<property>\b(?:box-shadow|text-shadow|border-radius|border(?:-[a-z]+)?-radius|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|gap|row-gap|column-gap|z-index|animation-duration|transition-duration)\b)\s*:\s*(?<value>[^;}\n]+)[;}]/giu

  for (const match of text.matchAll(declarationPattern)) {
    const property = match.groups.property.toLowerCase()
    const value = match.groups.value.trim()

    if (value.includes('var(')) {
      continue
    }

    if (isAllowedExactDeclaration(file, property, value)) {
      continue
    }

    if (value === '0' && /^(?:margin|padding)/u.test(property)) {
      continue
    }

    const ruleId = ruleIdForProperty(property)
    addVisualFinding(
      ruleId,
      file,
      text,
      match.index ?? 0,
      `${property} must resolve through project tokens outside the token authority.`
    )
  }
}

function stripBlockComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//gu, (match) => '\n'.repeat(match.split('\n').length - 1))
}

function looksLikeVisualValue(excerpt, value) {
  const before = excerpt.slice(0, Math.max(0, excerpt.indexOf(value)))
  return (
    /[:=(,]\s*['"]?$/u.test(before) ||
    /\b(?:color|background|border|shadow|fill|stroke)\b/iu.test(excerpt)
  )
}

function isAllowedExactDeclaration(file, property, value) {
  return visualValuePolicy.allowedExactDeclarations.some(
    (entry) => entry.path === file && entry.property === property && entry.value === value
  )
}

function ruleIdForProperty(property) {
  if (property.includes('shadow')) {
    return 'VISUAL_RAW_SHADOW'
  }

  if (property.includes('radius')) {
    return 'VISUAL_RAW_RADIUS'
  }

  if (property === 'z-index') {
    return 'VISUAL_RAW_Z_INDEX'
  }

  if (property.includes('duration')) {
    return 'VISUAL_RAW_MOTION_DURATION'
  }

  return 'VISUAL_RAW_SPACING'
}

function addVisualFinding(ruleId, file, text, index, reason) {
  const location = lineAndExcerpt(text, index)
  addFinding(context, {
    ruleId,
    file,
    line: location.line,
    excerpt: location.excerpt,
    reason,
    remediationOwner: 'token-governance',
  })
}
