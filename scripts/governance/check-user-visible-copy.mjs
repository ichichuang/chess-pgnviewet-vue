#!/usr/bin/env node

import { userVisibleCopyPolicy } from './policy.mjs'
import {
  addFinding,
  createContext,
  lineAndExcerpt,
  listFiles,
  normalizeExcerpt,
  parseArgs,
  readTextFile,
  report,
} from './utils.mjs'

const scannerName = 'user-visible-copy'
const args = parseArgs()
const context = createContext(args)

const files = listFiles(context, {
  scopes: userVisibleCopyPolicy.scopes,
  extensions: ['.vue'],
})

for (const file of files) {
  const text = readTextFile(context, file)
  if (text === null) continue

  for (const template of text.matchAll(/<template\b[^>]*>([\s\S]*?)<\/template>/giu)) {
    const templateText = (template[1] ?? '').replace(/<!--[\s\S]*?-->/gu, '')
    const templateOffset = (template.index ?? 0) + template[0].indexOf(template[1] ?? '')

    for (const rule of userVisibleCopyPolicy.forbiddenTerms) {
      for (const match of templateText.matchAll(rule.pattern)) {
        const absoluteIndex = templateOffset + (match.index ?? 0)
        const location = lineAndExcerpt(text, absoluteIndex)
        if (isApproved(file, rule.id, location.excerpt)) continue

        addFinding(context, {
          ruleId: 'COPY_INTERNAL_PRODUCT_WORDING',
          file,
          line: location.line,
          excerpt: normalizeExcerpt(location.excerpt),
          reason: `${rule.id} wording is not approved for rendered product copy.`,
          remediationOwner: 'product-copy-governance',
        })
      }
    }
  }
}

report(context, scannerName, args)

function isApproved(file, termId, excerpt) {
  return userVisibleCopyPolicy.approvedNormalProductCopy.some(
    (entry) => entry.path === file && entry.termId === termId && excerpt.includes(entry.phrase)
  )
}
