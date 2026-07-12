#!/usr/bin/env node
import { secretPolicy } from './policy.mjs'
import {
  addFinding,
  createContext,
  lineAndExcerpt,
  listFiles,
  normalizeExcerpt,
  parseArgs,
  readTextFile,
  redact,
  report,
} from './utils.mjs'

const scannerName = 'secret-patterns'
const args = parseArgs()
const context = createContext(args)

const files = listFiles(context, {
  scopes: ['.'],
  useGit: true,
  excludeDirectories: secretPolicy.excludedDirectories,
  excludePaths: secretPolicy.excludedPaths,
})

for (const file of files) {
  if (isBinaryLike(file)) {
    continue
  }

  const text = readTextFile(context, file)

  if (text === null) {
    continue
  }

  scanSecrets(file, text)
}

report(context, scannerName, args)

function scanSecrets(file, text) {
  const rules = [
    {
      ruleId: 'SECRET_PRIVATE_KEY',
      category: 'private-key',
      pattern:
        /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/gu,
      secretGroup: 0,
      reason: 'Private keys must never be tracked.',
    },
    {
      ruleId: 'SECRET_AUTHORIZATION_HEADER',
      category: 'authorization-header',
      pattern: /\bAuthorization\b\s*[:=]\s*['"]?(?:Bearer|Basic)\s+([A-Za-z0-9._~+/=-]{16,})/giu,
      secretGroup: 1,
      reason: 'Authorization headers containing usable credentials are forbidden.',
    },
    {
      ruleId: 'SECRET_PASSWORD_ASSIGNMENT',
      category: 'password',
      pattern:
        /\b(?:password|passwd|pwd|mqttPassword|registryPassword)\b\s*[:=]\s*['"]([^'"\s]{12,})['"]/giu,
      secretGroup: 1,
      reason: 'Hardcoded passwords are forbidden.',
    },
    {
      ruleId: 'SECRET_SIGNING_OR_HMAC_SECRET',
      category: 'signing-secret',
      pattern:
        /\b(?:hmacSecret|signingSecret|jwtSecret|clientSecret|webhookSecret)\b\s*[:=]\s*['"]([^'"\s]{16,})['"]/giu,
      secretGroup: 1,
      reason: 'Signing, HMAC, client, and webhook secrets must not be tracked.',
    },
    {
      ruleId: 'SECRET_ACCESS_TOKEN',
      category: 'token',
      pattern:
        /\b(?:accessToken|refreshToken|apiToken|authToken|mqttToken|registryToken|cloudToken)\b\s*[:=]\s*['"]([^'"\s]{16,})['"]/giu,
      secretGroup: 1,
      reason: 'Access tokens must not be tracked.',
    },
    {
      ruleId: 'SECRET_COOKIE',
      category: 'cookie',
      pattern: /\b(?:Cookie|Set-Cookie)\b\s*[:=]\s*['"]?([^'"\n;=]{8,}=.[^'"\n]{8,})/giu,
      secretGroup: 1,
      reason: 'Cookies containing credential-like values must not be tracked.',
    },
    {
      ruleId: 'SECRET_CLOUD_CREDENTIAL',
      category: 'cloud-credential',
      pattern:
        /\b(?:AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|GOOGLE_APPLICATION_CREDENTIALS|AZURE_CLIENT_SECRET|CLOUDFLARE_API_TOKEN)\b\s*[:=]\s*['"]?([^'"\s]{12,})/gu,
      secretGroup: 1,
      reason: 'Cloud credentials must not be tracked.',
    },
    {
      ruleId: 'SECRET_REGISTRY_CREDENTIAL',
      category: 'registry-credential',
      pattern: /\/\/[^/\s]+\/?:?_authToken=([A-Za-z0-9._~+/=-]{16,})/gu,
      secretGroup: 1,
      reason: 'Registry credentials must not be tracked.',
    },
    {
      ruleId: 'SECRET_BEARING_URL',
      category: 'secret-url',
      pattern: /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:([^@\s/]{12,})@[^/\s]+/giu,
      secretGroup: 1,
      reason: 'Secret-bearing URLs are forbidden.',
    },
    {
      ruleId: 'SECRET_UNSAFE_VITE_EXPOSURE',
      category: 'vite-public-secret',
      pattern:
        /\bVITE_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|HMAC|KEY|CREDENTIAL)[A-Z0-9_]*\b\s*[:=]\s*['"]?([^'"\s]{12,})/gu,
      secretGroup: 1,
      reason: 'VITE-prefixed public configuration must not expose secret-like values.',
    },
    {
      ruleId: 'SECRET_API_KEY',
      category: 'api-key',
      pattern: /\b(?:apiKey|api_key|API_KEY)\b\s*[:=]\s*['"]([A-Za-z0-9._~+/=-]{24,})['"]/gu,
      secretGroup: 1,
      reason: 'API keys must not be tracked.',
    },
  ]

  for (const rule of rules) {
    for (const match of text.matchAll(rule.pattern)) {
      const secretValue = match[rule.secretGroup]

      if (
        !secretValue ||
        isAllowedPlaceholder(file, secretValue) ||
        isDocumentationPlaceholder(secretValue)
      ) {
        continue
      }

      const location = lineAndExcerpt(text, match.index ?? 0)
      addFinding(context, {
        ruleId: rule.ruleId,
        file,
        line: location.line,
        category: rule.category,
        fingerprint: redact(secretValue),
        excerpt: normalizeExcerpt(location.excerpt, [secretValue, match[0]]),
        reason: rule.reason,
        remediationOwner: 'security-governance',
      })
    }
  }
}

function isBinaryLike(file) {
  return /\.(?:png|jpe?g|gif|webp|avif|ico|svg|pdf|woff2?|ttf|otf)$/iu.test(file)
}

function isAllowedPlaceholder(file, value) {
  return secretPolicy.placeholderAllowlist.some(
    (entry) => entry.path === file && value.toLowerCase().includes(entry.pattern)
  )
}

function isDocumentationPlaceholder(value) {
  const lowered = value.toLowerCase()

  return (
    lowered.includes('example') ||
    lowered.includes('placeholder') ||
    lowered.includes('changeme') ||
    lowered.includes('not-a-secret') ||
    lowered.includes('redacted') ||
    /^x+$/u.test(lowered)
  )
}
