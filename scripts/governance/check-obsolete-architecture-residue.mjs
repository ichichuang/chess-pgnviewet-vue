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

const staleCurrentAuthStatusRules = [
  {
    ruleId: 'RESIDUE_AUTH_OWNER_VALIDATION_REQUIRED_MARKER',
    pattern:
      /\b(?:LOGIN_TOKEN_AUTH_FLOW_IMPLEMENTED_OWNER_REAL_ACCOUNT_VALIDATION_REQUIRED|LOGIN_TOKEN_AUTH_FLOW_IMPLEMENTED_READY_FOR_OWNER_REAL_ACCOUNT_VALIDATION|IMPLEMENTED_READY_FOR_OWNER_REAL_ACCOUNT_VALIDATION|READY_FOR_OWNER_REAL_ACCOUNT_VALIDATION)\b/gu,
    reason: 'Owner-validation-required authentication status must not remain in current authority.',
  },
  {
    ruleId: 'RESIDUE_AUTH_LOGIN_SUCCESS_UNCLAIMED',
    pattern:
      /\b(?:successful account (?:access|login)|account login)[^\n]{0,100}\b(?:unclaimed|required|waiting)\b|\bowner validation[^\n]{0,100}\brequired\b/giu,
    reason:
      'Owner validation has passed; current authority must not retain an unvalidated login claim.',
  },
]

const activeAuthorityConsistencyRules = [
  {
    ruleId: 'RESIDUE_AUTOMATED_TEST_REQUIREMENT',
    pattern:
      /(?:verification methods?|"verification_methods")\s*:[^\n]{0,180}\b(?:unit|component|integration|e2e|axe)\b|^\|[^\n]*\|\s*[^|\n]*\b(?:unit|component|integration|e2e|axe)\b[^|\n]*\|\s*$|\bTest requirements?\b|^\|\s*Tests\s*\||\b(?:unit|component|integration|visual[- ]regression|e2e|end[- ]to[- ]end|automated accessibility|axe-core)\s+(?:tests?|suites?)\b|\b(?:Vitest|Jest|Vue Test Utils|Testing Library|Playwright|Cypress|jsdom|snapshots?|coverage)\b[^\n]{0,100}\b(?:required|mandatory|must|passes?|completion|acceptance|merge gate)\b/gimu,
    reason: 'Active authority must use the accepted non-automated validation methods.',
    allowExplicitProhibition: true,
  },
  {
    ruleId: 'RESIDUE_TEST_COMMAND_REQUIREMENT',
    pattern: /\b(?:pnpm|npm)\s+(?:run\s+)?test\b/giu,
    reason: 'Active authority must not require a test package command.',
    allowExplicitProhibition: true,
  },
  {
    ruleId: 'RESIDUE_MANDATORY_I18NEXT',
    pattern: /\bi18next\b/giu,
    reason:
      'The runtime package is unselected; active authority must name the project-owned Vue i18n boundary.',
  },
  {
    ruleId: 'RESIDUE_STALE_PRODUCT_UI_GATE',
    pattern:
      /\bPRODUCT_UI_MIGRATION_READY\b|\bP1[^\n]{0,80}\b(?:remains?\s+)?blocked\b|\bproduct UI[^\n]{0,80}\b(?:not started|remains?\s+blocked)\b/giu,
    reason: 'Current authority must use PRODUCT_UI_DEVELOPMENT_BASELINE_PASS.',
  },
  {
    ruleId: 'RESIDUE_IMPLEMENTED_OWNER_MARKED_FUTURE',
    pattern:
      /(?:domains\/|features\/|api\/)[^\n]{0,60}\bfuture\b|\bfuture\b[^\n]{0,60}(?:domains\/|features\/|api\/)/giu,
    reason: 'Implemented runtime ownership must not be classified as future.',
  },
  {
    ruleId: 'RESIDUE_STALE_PHASE_SUCCESSOR',
    pattern: /\bNext\s+(?:required\s+)?phase:\s*/giu,
    reason:
      'Active architecture must record the current development gate, not an obsolete successor.',
  },
  {
    ruleId: 'RESIDUE_STALE_IMPLEMENTED_STATUS',
    pattern:
      /\bStatus:\s*`[^`\n]*(?:PENDING|PASS_READY_FOR|READY_FOR_GOVERNANCE|READY_FOR_WORKSPACE)[^`\n]*`/giu,
    reason: 'Implemented runtime baselines must not retain pending or successor-ready status.',
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

  if (!obsoleteArchitecturePolicy.historicalAuthStatusAllowlist.includes(file)) {
    scanRules(file, text, staleCurrentAuthStatusRules)
  }

  if (
    isActiveAuthority(file) &&
    !obsoleteArchitecturePolicy.authorityPatternDefinitionAllowlist.includes(file)
  ) {
    scanActiveAuthorityConsistencyRules(file, text)
  }

  if (!obsoleteArchitecturePolicy.explicitProhibitionAllowlist.includes(file)) {
    scanRules(file, text, rejectedArchitectureRules)
  }
}

function scanActiveAuthorityConsistencyRules(file, text) {
  for (const rule of activeAuthorityConsistencyRules) {
    for (const match of text.matchAll(rule.pattern)) {
      const location = lineAndExcerpt(text, match.index ?? 0)

      if (
        rule.allowExplicitProhibition &&
        isExplicitProhibition(lineTextAt(text, match.index ?? 0))
      ) {
        continue
      }

      addFinding(context, {
        ruleId: rule.ruleId,
        file,
        line: location.line,
        excerpt: normalizeExcerpt(location.excerpt),
        reason: rule.reason,
        remediationOwner: 'active-authority-governance',
      })
    }
  }
}

function isActiveAuthority(file) {
  return (
    obsoleteArchitecturePolicy.activeAuthorityExactPaths.includes(file) ||
    obsoleteArchitecturePolicy.activeAuthorityPrefixes.some((prefix) => file.startsWith(prefix))
  )
}

function isExplicitProhibition(excerpt) {
  return /\b(?:forbidden|prohibited|must not|may not|never|do not|does not|without|not part|not adopt|not copy|no automated|no test script|is not permitted|are not permitted)\b/iu.test(
    excerpt
  )
}

function lineTextAt(text, index) {
  const start = text.lastIndexOf('\n', index - 1) + 1
  const end = text.indexOf('\n', index)
  return text.slice(start, end === -1 ? text.length : end)
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
