#!/usr/bin/env node
import { mockDataPolicy } from './policy.mjs'
import {
  addFinding,
  createContext,
  lineAndExcerpt,
  listFiles,
  parseArgs,
  readTextFile,
  report,
} from './utils.mjs'

const scannerName = 'forbidden-mock-data'
const args = parseArgs()
const context = createContext(args)

const files = listFiles(context, {
  scopes: mockDataPolicy.scopes,
  extensions: ['.ts', '.vue', '.js', '.mjs'],
  excludePaths: mockDataPolicy.excludedPaths,
})

for (const file of files) {
  const text = readTextFile(context, file)

  if (text === null) {
    continue
  }

  scanMockData(file, text)
}

report(context, scannerName, args)

function scanMockData(file, text) {
  const rules = [
    {
      ruleId: 'MOCK_API_MODE',
      pattern: /\b(?:mockApi|mockMode|useMock|enableMock|MOCK_API|VITE_USE_MOCKS)\b/gu,
      reason: 'Mock API modes are forbidden in product runtime code.',
    },
    {
      ruleId: 'MOCK_FAKE_DATA_GENERATOR',
      pattern:
        /\b(?:faker|fake[A-Z][A-Za-z0-9]*|generateFake[A-Za-z0-9]*|createFake[A-Za-z0-9]*)\b/gu,
      reason: 'Fake data generators are forbidden in product runtime code.',
    },
    {
      ruleId: 'MOCK_RUNTIME_FIXTURE_FALLBACK',
      pattern: /\b(?:fixture|fixtures|fallbackFixture|runtimeFixture|loadFixture)\b/giu,
      reason: 'Fixtures must not be used as product runtime fallback data.',
    },
    {
      ruleId: 'MOCK_SAMPLE_PRODUCT_RECORD',
      pattern:
        /\b(?:sampleTournament|sampleGame|samplePgn|demoTournament|demoGame|exampleTournament|examplePgn)\b/giu,
      reason: 'Sample tournaments, games, and PGNs are not production data.',
    },
    {
      ruleId: 'MOCK_FAKE_TRANSPORT_OR_ANALYSIS',
      pattern:
        /\b(?:fakeReplay|fakeLive|mockReplay|mockLive|fakeAnalysis|mockAnalysis|fakeEngine|mockEngine)\b/giu,
      reason: 'Fake replay, live transport, and AI analysis outputs are forbidden.',
    },
    {
      ruleId: 'MOCK_PLACEHOLDER_SUCCESS',
      pattern:
        /\b(?:placeholderSuccess|fakeSuccess|mockSuccess|alwaysSuccess|silentSuccess|returnSuccessFallback)\b/giu,
      reason: 'Placeholder success states and silent fake fallback responses are forbidden.',
    },
    {
      ruleId: 'MOCK_INVENTED_ENDPOINT',
      pattern: /['"`]\/(?:api\/)?(?:mock|fake|sample|demo|fixture)s?\/[^'"`]*['"`]/giu,
      reason: 'Invented mock, fake, sample, demo, or fixture endpoints are forbidden.',
    },
    {
      ruleId: 'MOCK_INVENTED_DTO_FIELD',
      pattern:
        /\b(?:invented[A-Z][A-Za-z0-9]*|placeholder[A-Z][A-Za-z0-9]*Dto|dummy[A-Z][A-Za-z0-9]*)\b/gu,
      reason: 'Invented DTO fields and dummy product records are forbidden.',
    },
  ]

  const stripped = stripComments(text)

  for (const rule of rules) {
    for (const match of stripped.matchAll(rule.pattern)) {
      const location = lineAndExcerpt(text, match.index ?? 0)

      if (isNeutralFoundationText(location.excerpt)) {
        continue
      }

      addFinding(context, {
        ruleId: rule.ruleId,
        file,
        line: location.line,
        excerpt: location.excerpt,
        reason: rule.reason,
        remediationOwner: 'product-data-governance',
      })
    }
  }

  scanHardcodedProductRecords(file, text)
}

function scanHardcodedProductRecords(file, text) {
  const productRecordPattern =
    /\{[\s\S]{0,240}\b(?:hdid|tournamentId|gameId|pgn|fen|moves|round|whitePlayer|blackPlayer)\b[\s\S]{0,240}\}/giu

  for (const match of stripComments(text).matchAll(productRecordPattern)) {
    const excerptText = match[0]

    if (!/\b(?:mock|fake|sample|demo|placeholder|fallback|fixture)\b/iu.test(excerptText)) {
      continue
    }

    const location = lineAndExcerpt(text, match.index ?? 0)

    addFinding(context, {
      ruleId: 'MOCK_HARDCODED_PRODUCT_RECORD',
      file,
      line: location.line,
      excerpt: location.excerpt,
      reason: 'Hardcoded product records that pretend to be runtime data are forbidden.',
      remediationOwner: 'product-data-governance',
    })
  }
}

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//gu, (match) => '\n'.repeat(match.split('\n').length - 1))
    .replace(/\/\/.*$/gmu, '')
    .replace(/<!--[\s\S]*?-->/gu, (match) => '\n'.repeat(match.split('\n').length - 1))
}

function isNeutralFoundationText(excerpt) {
  const lowered = excerpt.toLowerCase()
  return mockDataPolicy.neutralAllowedPhrases.some((phrase) => lowered.includes(phrase))
}
