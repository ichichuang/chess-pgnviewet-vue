#!/usr/bin/env node

import { obsoleteArchitecturePolicy } from './policy.mjs'
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

const scannerName = 'obsolete-architecture-residue'
const args = parseArgs()
const context = createContext(args)

const staleAuthorityRules = [
  {
    ruleId: 'RESIDUE_REJECTED_API_PHASE',
    pattern: /\bP1G\b/gu,
    reason:
      'The rejected production-API phase marker must not remain in active or historical text.',
  },
  {
    ruleId: 'RESIDUE_DELETED_AUTHORITY_ARTIFACT',
    pattern:
      /\b(?:FOUNDATION_HARDENING(?:_CURRENT_STATE|_REMAINING_MATRIX)?|API_MASTER_SUMMARY|REAL_REPLAY_DATA_SOURCE_SMOKE|SERVER_ONLY_HMAC_SMOKE|API_AUTHORITY_MAP|WEB_API_MIGRATION_BASELINE|P1G1_AXIOS_HTTP_CLIENT_AND_VITE_PROXY_BASELINE)\b/gu,
    reason: 'A deleted or superseded API authority artifact is still referenced.',
  },
  {
    ruleId: 'RESIDUE_REJECTED_HARDENING_PHASE',
    pattern: /\bH(?:[1-9]|10)[_-](?:BFF|AUTH|API|SESSION|COOKIE|HMAC|PROXY|TOKEN)\w*/giu,
    reason: 'A rejected hardening-phase authority marker is still present.',
  },
  {
    ruleId: 'RESIDUE_DELETED_SESSION_ADAPTER',
    pattern: /\bsessionPersistence(?:\.ts)?\b/gu,
    reason: 'The deleted browser-session persistence adapter is still referenced.',
  },
]

const rejectedArchitectureRules = [
  {
    ruleId: 'RESIDUE_INTERNAL_PROXY',
    pattern: /\b\/api\/ksl\b|\bproxyRequest\b|\bBFF\b/giu,
    reason:
      'Internal proxy or BFF architecture may appear only in explicit prohibition authorities.',
  },
  {
    ruleId: 'RESIDUE_GENERIC_CALL',
    pattern: /\b\/CALL\b/gu,
    reason: 'Generic /CALL architecture may appear only in explicit prohibition authorities.',
  },
  {
    ruleId: 'RESIDUE_SECRET_AUTH_ARCHITECTURE',
    pattern:
      /\b(?:browser[- ]?HMAC|server[- ]?HMAC|HttpOnly|session vault|cookie session|CSRF server|browser-token-conflict|URL[- ]token|query[- ]token|fingerprint guest)\b/giu,
    reason:
      'Rejected secret, cookie, URL-token, or device-identity architecture may appear only in explicit prohibitions.',
  },
  {
    ruleId: 'RESIDUE_MINI_PROGRAM_AUTHORITY',
    pattern: /\bMini Program(?: API)? authority\b/giu,
    reason: 'Mini Program authority may appear only in explicit prohibition authorities.',
  },
]

const files = listFiles(context, {
  scopes: ['.'],
  extensions: [
    '.cjs',
    '.css',
    '.html',
    '.js',
    '.json',
    '.md',
    '.mjs',
    '.ts',
    '.vue',
    '.yaml',
    '.yml',
  ],
  excludePaths: ['scripts/governance/check-obsolete-architecture-residue.mjs'],
})

for (const file of files) {
  const text = readTextFile(context, file)

  if (text === null) {
    continue
  }

  scanRules(file, text, staleAuthorityRules)

  if (!obsoleteArchitecturePolicy.explicitProhibitionAllowlist.includes(file)) {
    scanRules(file, text, rejectedArchitectureRules)
  }
}

report(context, scannerName, args)

function scanRules(file, text, rules) {
  for (const rule of rules) {
    for (const match of text.matchAll(rule.pattern)) {
      const location = lineAndExcerpt(text, match.index ?? 0)

      addFinding(context, {
        ruleId: rule.ruleId,
        file,
        line: location.line,
        excerpt: normalizeExcerpt(location.excerpt),
        reason: rule.reason,
        remediationOwner: 'architecture-governance',
      })
    }
  }
}
