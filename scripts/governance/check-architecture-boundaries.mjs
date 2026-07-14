#!/usr/bin/env node
import path from 'node:path'

import { architecturePolicy, evidenceSourceRoots } from './policy.mjs'
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

const scannerName = 'architecture-boundaries'
const args = parseArgs()
const context = createContext(args)

const files = listFiles(context, {
  scopes: architecturePolicy.implementationScopes,
  extensions: ['.ts', '.vue', '.js', '.mjs', '.cjs', '.json'],
  excludeDirectories: ['scripts'],
  includeFiles: [
    'vite.config.ts',
    'eslint.config.mjs',
    'prettier.config.mjs',
    'stylelint.config.mjs',
  ],
})

const occurrences = {
  createApp: [],
  createRouter: [],
  createPinia: [],
  appUseRouter: [],
  appUsePinia: [],
}

for (const file of files) {
  const text = readTextFile(context, file)

  if (text === null) {
    continue
  }

  scanImports(file, text)
  scanTopology(file, text)
  scanBoundaries(file, text)
}

validateUniqueOwner('ARCH_DUPLICATE_VUE_ROOT', 'createApp', architecturePolicy.approvedVueBootstrap)
validateUniqueOwner(
  'ARCH_DUPLICATE_ROUTER_OWNER',
  'createRouter',
  architecturePolicy.approvedRouterOwner
)
validateUniqueOwner(
  'ARCH_DUPLICATE_PINIA_OWNER',
  'createPinia',
  architecturePolicy.approvedPiniaOwner
)
validateUniqueOwner(
  'ARCH_DUPLICATE_ROUTER_INSTALLATION',
  'appUseRouter',
  architecturePolicy.approvedVueBootstrap
)
validateUniqueOwner(
  'ARCH_DUPLICATE_PINIA_INSTALLATION',
  'appUsePinia',
  architecturePolicy.approvedVueBootstrap
)

report(context, scannerName, args)

function scanImports(file, text) {
  const importPattern = /(?:import|export)\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/gu

  for (const match of text.matchAll(importPattern)) {
    const specifier = match[1]
    const location = lineAndExcerpt(text, match.index ?? 0)

    if (['react', 'react-dom', 'react/jsx-runtime'].includes(specifier)) {
      addArchitectureFinding(
        'ARCH_REACT_RUNTIME_IMPORT',
        file,
        location,
        'React runtime imports are forbidden.'
      )
    }

    if (specifier === 'naive-ui' && !isAllowed(file, architecturePolicy.naiveUiAllowlist)) {
      addArchitectureFinding(
        'ARCH_DIRECT_NAIVE_UI_IMPORT',
        file,
        location,
        'Naive UI imports must stay behind approved project-owned provider or UI adapter paths.'
      )
    }

    if (isIconLibrary(specifier) && !isAllowed(file, architecturePolicy.iconAllowlist)) {
      addArchitectureFinding(
        'ARCH_DIRECT_ICON_IMPORT',
        file,
        location,
        'Icon-library imports must stay behind the approved future icon adapter.'
      )
    }

    if (specifier === 'axios' && !isAllowed(file, architecturePolicy.axiosImportAllowlist)) {
      addArchitectureFinding(
        'ARCH_RAW_HTTP_CLIENT',
        file,
        location,
        'Axios imports are allowed only in the project-owned HTTP client.'
      )
    }

    if (importsEvidenceSource(specifier)) {
      addArchitectureFinding(
        'ARCH_EVIDENCE_SOURCE_IMPORT',
        file,
        location,
        'Runtime/config code must not import read-only evidence-source projects.'
      )
    }
  }
}

function scanTopology(file, text) {
  collectOccurrences(text, /\bcreateApp\s*\(/gu, occurrences.createApp, file)
  collectOccurrences(text, /\bcreateRouter\s*\(/gu, occurrences.createRouter, file)
  collectOccurrences(text, /\bcreatePinia\s*\(/gu, occurrences.createPinia, file)
  collectOccurrences(text, /\.use\s*\(\s*router\s*\)/gu, occurrences.appUseRouter, file)
  collectOccurrences(text, /\.use\s*\(\s*pinia\s*\)/gu, occurrences.appUsePinia, file)
}

function scanBoundaries(file, text) {
  const boundaryRules = [
    {
      ruleId: 'ARCH_RAW_FETCH_OUTSIDE_API',
      pattern: /\bfetch\s*\(/gu,
      allowlist: architecturePolicy.nativeHttpAllowlist,
      reason: 'Native fetch is forbidden in authored browser product code.',
    },
    {
      ruleId: 'ARCH_RAW_XMLHTTPREQUEST_OUTSIDE_API',
      pattern: /\bXMLHttpRequest\b/gu,
      allowlist: architecturePolicy.nativeHttpAllowlist,
      reason: 'Raw XMLHttpRequest is forbidden in authored browser product code.',
    },
    {
      ruleId: 'ARCH_RAW_BROWSER_STORAGE',
      pattern: /\b(?:localStorage|sessionStorage|indexedDB)\b/gu,
      allowlist: architecturePolicy.persistenceAllowlist,
      reason:
        'Raw browser storage is allowed only inside approved persistence or bootstrap-preference adapters.',
    },
    {
      ruleId: 'ARCH_IMPORT_META_ENV_OUTSIDE_CONFIG',
      pattern: /\bimport\.meta\.env\b/gu,
      allowlist: architecturePolicy.runtimeConfigAllowlist,
      reason: 'Direct import.meta.env access is allowed only in runtime config ownership paths.',
    },
    {
      ruleId: 'ARCH_GENERIC_CALL_ENDPOINT',
      pattern: /['"`]\/CALL(?:['"`/?#]|$)|\b\/CALL\b/gu,
      allowlist: [],
      reason: 'Generic /CALL usage is forbidden.',
    },
    {
      ruleId: 'ARCH_PROXY_REQUEST_USAGE',
      pattern: /\bproxyRequest\b/gu,
      allowlist: [],
      reason: 'proxyRequest usage is forbidden without explicit API authority.',
    },
    {
      ruleId: 'ARCH_INTERNAL_API_PROXY',
      pattern: /['"`]\/api\/ksl(?:['"`/?#]|$)|\b\/api\/ksl\b/giu,
      allowlist: [],
      reason: 'A same-project /api/ksl proxy boundary is forbidden.',
    },
    {
      ruleId: 'ARCH_NODE_SERVER_RUNTIME',
      pattern:
        /(?:from\s+|require\s*\(\s*)['"](?:node:)?(?:http|https|http2|net|tls)['"]|(?:from\s+|require\s*\(\s*)['"](?:express|fastify|koa|http-proxy|http-proxy-middleware)['"]/giu,
      allowlist: [],
      reason: 'Node server or proxy runtime ownership is forbidden in this frontend repository.',
    },
    {
      ruleId: 'ARCH_COOKIE_SESSION_AUTH',
      pattern:
        /\bdocument\.cookie\b|\bwithCredentials\s*:\s*true\b|\bcredentials\s*:\s*['"]include['"]|\b(?:HttpOnly|sessionVault|csrfToken)\b/giu,
      allowlist: [],
      reason: 'Cookie, session-vault, and CSRF authentication architecture is forbidden.',
    },
    {
      ruleId: 'ARCH_URL_TOKEN_AUTH',
      pattern:
        /\b(?:route|router|location)\.(?:query|search)[^.\n]{0,80}\btoken\b|\bsearchParams\.get\s*\(\s*['"]token['"]\s*\)/giu,
      allowlist: [],
      reason: 'URL or query-token authentication is forbidden.',
    },
    {
      ruleId: 'ARCH_DEVICE_GUEST_IDENTITY',
      pattern: /\b(?:openid|visitorId|deviceFingerprint|fingerprintId)\b/giu,
      allowlist: [],
      reason: 'Invented device, fingerprint, or Mini Program guest identity is forbidden.',
    },
    {
      ruleId: 'ARCH_MINI_PROGRAM_TRANSPORT',
      pattern: /\b(?:wx|uni)\.request\s*\(/gu,
      allowlist: [],
      reason: 'Mini Program transport is not Web API authority.',
    },
    {
      ruleId: 'ARCH_SECRET_HEADER',
      pattern: /['"](?:authorization|x-api-key|x-signature|x-hmac-signature)['"]\s*:/giu,
      allowlist: architecturePolicy.browserAuthHeaderAllowlist,
      reason: 'Browser-authored credential or signature headers are forbidden.',
    },
    {
      ruleId: 'ARCH_MQTT_PUBLISH',
      pattern: /\bmqtt\b[\s\S]{0,160}\bpublish\s*\(|\b\.publish\s*\(/giu,
      allowlist: [],
      reason: 'MQTT publish behavior is forbidden in the browser runtime.',
    },
    {
      ruleId: 'ARCH_BROWSER_SECRET_OWNERSHIP',
      pattern:
        /\b(?:Authorization|Bearer|HMAC|signingSecret|clientSecret|mqttPassword|mqttUsername|upstreamCredential|secretUrl)\b/gu,
      allowlist: architecturePolicy.browserAuthHeaderAllowlist,
      reason:
        'Browser runtime must not own upstream credentials, auth headers, signing secrets, or secret-bearing URLs.',
    },
    {
      ruleId: 'ARCH_WRITE_ADMIN_ENDPOINT',
      pattern:
        /\b(?:DELETE|PATCH|POST|PUT)\b|['"`][^'"`]*(?:\/admin\/|\/delete|\/destroy|\/mutate|\/write)[^'"`]*['"`]/gu,
      allowlist: architecturePolicy.writeEndpointAllowlist,
      reason: 'Write, administration, mutation, or destructive endpoints need explicit authority.',
    },
  ]

  for (const rule of boundaryRules) {
    if (isAllowed(file, rule.allowlist)) {
      continue
    }

    for (const match of text.matchAll(rule.pattern)) {
      const location = lineAndExcerpt(text, match.index ?? 0)
      addArchitectureFinding(rule.ruleId, file, location, rule.reason)
    }
  }
}

function collectOccurrences(text, pattern, bucket, file) {
  for (const match of text.matchAll(pattern)) {
    bucket.push({ file, ...lineAndExcerpt(text, match.index ?? 0) })
  }
}

function validateUniqueOwner(ruleId, key, approvedOwner) {
  const entries = occurrences[key]
  const unauthorized = entries.filter((entry) => entry.file !== approvedOwner)

  for (const entry of unauthorized) {
    addArchitectureFinding(ruleId, entry.file, entry, `${key} is owned by ${approvedOwner}.`)
  }

  if (entries.length > 1) {
    for (const entry of entries) {
      addArchitectureFinding(
        ruleId,
        entry.file,
        entry,
        `${key} must have exactly one repository owner.`
      )
    }
  }
}

function isAllowed(file, allowlist) {
  return allowlist.some((allowedPath) => file === allowedPath || file.startsWith(allowedPath))
}

function isIconLibrary(specifier) {
  return (
    specifier === 'lucide-vue-next' ||
    specifier === '@vicons/ionicons5' ||
    specifier === '@vicons/material' ||
    specifier.startsWith('@vicons/')
  )
}

function importsEvidenceSource(specifier) {
  if (specifier.includes('pgnViewer-new') || specifier.includes('chess-pgnviewer')) {
    return true
  }

  if (path.isAbsolute(specifier)) {
    return evidenceSourceRoots.some((sourceRoot) => specifier.startsWith(sourceRoot))
  }

  return false
}

function addArchitectureFinding(ruleId, file, location, reason) {
  addFinding(context, {
    ruleId,
    file,
    line: location.line,
    excerpt: normalizeExcerpt(location.excerpt),
    reason,
    remediationOwner: 'architecture-governance',
  })
}
