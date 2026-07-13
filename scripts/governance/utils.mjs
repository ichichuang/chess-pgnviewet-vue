import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'

import {
  evidenceSourceRoots,
  generatedOrLocalPatterns,
  permanentExcludedDirectories,
  projectRoot,
} from './policy.mjs'

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {
    json: false,
    root: projectRoot,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]

    if (value === '--json') {
      args.json = true
      continue
    }

    if (value === '--root') {
      const next = argv[index + 1]

      if (!next) {
        throw new Error('--root requires a path')
      }

      args.root = path.resolve(next)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${value}`)
  }

  return args
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/')
}

function relativePath(root, filePath) {
  return toPosixPath(path.relative(root, filePath))
}

function isInsidePath(parent, candidate) {
  const relative = path.relative(parent, candidate)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

export function createContext(args) {
  const root = path.resolve(args.root)
  const rootStats = fs.lstatSync(root)

  if (!rootStats.isDirectory()) {
    throw new Error(`Scanner root is not a directory: ${root}`)
  }

  if (rootStats.isSymbolicLink()) {
    throw new Error(`Scanner root must not be a symbolic link: ${root}`)
  }

  for (const sourceRoot of evidenceSourceRoots) {
    if (isInsidePath(path.resolve(sourceRoot), root)) {
      throw new Error(`Refusing to scan read-only evidence source root: ${root}`)
    }
  }

  return {
    root,
    findings: [],
    skipped: [],
  }
}

export function addFinding(context, finding) {
  context.findings.push({
    severity: 'blocking',
    ...finding,
  })
}

function addSkipped(context, filePath, reason) {
  context.skipped.push({
    path: path.isAbsolute(filePath) ? relativePath(context.root, filePath) : filePath,
    reason,
  })
}

function isGeneratedOrLocal(relativeFilePath) {
  const segments = relativeFilePath.split('/')

  if (segments.some((segment) => permanentExcludedDirectories.includes(segment))) {
    return true
  }

  return generatedOrLocalPatterns.some((pattern) => pattern.test(relativeFilePath))
}

function isDirectoryExcluded(relativeDirectoryPath, extraExcludedDirectories = []) {
  const segments = relativeDirectoryPath.split('/').filter(Boolean)
  const excluded = new Set([...permanentExcludedDirectories, ...extraExcludedDirectories])

  return segments.some((segment) => excluded.has(segment))
}

export function listFiles(context, options = {}) {
  const {
    scopes = ['.'],
    extensions,
    includeFiles,
    excludeDirectories = [],
    excludePaths = [],
    useGit = false,
  } = options

  const files = useGit
    ? listTrackedFiles(context)
    : listFilesByTraversal(context, scopes, excludeDirectories)
  const includeSet = includeFiles ? new Set(includeFiles.map(toPosixPath)) : null
  const excludeSet = new Set(excludePaths.map(toPosixPath))

  return files
    .filter((relativeFilePath) => {
      if (includeSet?.has(relativeFilePath)) {
        return true
      }

      if (excludeSet.has(relativeFilePath)) {
        return false
      }

      if (isGeneratedOrLocal(relativeFilePath)) {
        return false
      }

      if (isDirectoryExcluded(path.dirname(relativeFilePath), excludeDirectories)) {
        return false
      }

      if (extensions && !extensions.includes(path.extname(relativeFilePath))) {
        return false
      }

      return scopes.some((scope) => {
        const normalizedScope = toPosixPath(scope)

        if (normalizedScope === '.' || normalizedScope === './') {
          return true
        }

        return (
          relativeFilePath === normalizedScope ||
          relativeFilePath.startsWith(`${normalizedScope.replace(/\/$/u, '')}/`) ||
          minimatchSingleFile(relativeFilePath, normalizedScope)
        )
      })
    })
    .sort((left, right) => left.localeCompare(right))
}

function listTrackedFiles(context) {
  try {
    const output = execFileSync('git', ['-C', context.root, 'ls-files', '-z'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    return output
      .split('\0')
      .filter(Boolean)
      .map(toPosixPath)
      .filter((relativeFilePath) => !isDeletedWorkingTreePath(context.root, relativeFilePath))
      .sort((left, right) => left.localeCompare(right))
  } catch {
    return listFilesByTraversal(context, ['.'], [])
  }
}

function isDeletedWorkingTreePath(root, relativeFilePath) {
  try {
    fs.lstatSync(path.resolve(root, relativeFilePath))
    return false
  } catch (error) {
    return error?.code === 'ENOENT'
  }
}

function listFilesByTraversal(context, scopes, excludeDirectories) {
  const output = []

  for (const scope of scopes) {
    const absoluteScope = path.resolve(context.root, scope)

    if (!isInsidePath(context.root, absoluteScope) || !fs.existsSync(absoluteScope)) {
      continue
    }

    const stats = fs.lstatSync(absoluteScope)

    if (stats.isFile()) {
      output.push(relativePath(context.root, absoluteScope))
      continue
    }

    if (stats.isDirectory()) {
      walkDirectory(context, absoluteScope, output, excludeDirectories)
    }
  }

  return [...new Set(output)].sort((left, right) => left.localeCompare(right))
}

function walkDirectory(context, directoryPath, output, excludeDirectories) {
  const relativeDirectoryPath = relativePath(context.root, directoryPath)

  if (
    relativeDirectoryPath !== '' &&
    isDirectoryExcluded(relativeDirectoryPath, excludeDirectories)
  ) {
    return
  }

  let entries

  try {
    entries = fs.readdirSync(directoryPath, { withFileTypes: true })
  } catch (error) {
    addSkipped(context, directoryPath, `unreadable directory: ${error.message}`)
    return
  }

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(directoryPath, entry.name)
    const relativeFilePath = relativePath(context.root, absolutePath)

    if (entry.isSymbolicLink()) {
      const realPath = fs.realpathSync(absolutePath)

      if (!isInsidePath(context.root, realPath)) {
        addSkipped(context, absolutePath, 'symbolic link outside scanner root')
        continue
      }
    }

    if (entry.isDirectory()) {
      walkDirectory(context, absolutePath, output, excludeDirectories)
      continue
    }

    if (entry.isFile()) {
      output.push(relativeFilePath)
    }
  }
}

function minimatchSingleFile(filePath, pattern) {
  if (!pattern.includes('*')) {
    return false
  }

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/gu, '\\$&')
    .replace(/\\\*\\\*/gu, '.*')
    .replace(/\\\*/gu, '[^/]*')

  return new RegExp(`^${escaped}$`, 'u').test(filePath)
}

export function readTextFile(context, relativeFilePath) {
  const absolutePath = path.resolve(context.root, relativeFilePath)

  if (!isInsidePath(context.root, absolutePath)) {
    throw new Error(`Refusing to read outside scanner root: ${relativeFilePath}`)
  }

  let stats

  try {
    stats = fs.lstatSync(absolutePath)
  } catch (error) {
    addSkipped(context, relativeFilePath, `unreadable file metadata: ${error.message}`)
    return null
  }

  if (stats.isSymbolicLink()) {
    const realPath = fs.realpathSync(absolutePath)

    if (!isInsidePath(context.root, realPath)) {
      addSkipped(context, relativeFilePath, 'symbolic link outside scanner root')
      return null
    }
  }

  try {
    return fs.readFileSync(absolutePath, 'utf8')
  } catch (error) {
    addSkipped(context, relativeFilePath, `unreadable file: ${error.message}`)
    return null
  }
}

export function readJsonFile(context, relativeFilePath) {
  const text = readTextFile(context, relativeFilePath)

  if (text === null) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    addFinding(context, {
      ruleId: 'GOVERNANCE_CONFIG_INVALID_JSON',
      file: relativeFilePath,
      line: 1,
      excerpt: '<invalid json>',
      reason: error.message,
      remediationOwner: 'toolchain-governance',
    })
    return null
  }
}

export function lineAndExcerpt(text, index, options = {}) {
  const maxLength = options.maxLength ?? 140
  const before = text.slice(0, index)
  const line = before.split('\n').length
  const lineStart = text.lastIndexOf('\n', index - 1) + 1
  const lineEnd = text.indexOf('\n', index)
  const rawLine = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd).trim()

  return {
    line,
    excerpt: rawLine.length > maxLength ? `${rawLine.slice(0, maxLength)}...` : rawLine,
  }
}

export function redact(value) {
  const text = String(value)
  const hash = createHash('sha256').update(text).digest('hex').slice(0, 12)

  if (text.length <= 8) {
    return `<redacted:${hash}>`
  }

  return `${text.slice(0, 3)}...${text.slice(-2)}<sha256:${hash}>`
}

export function normalizeExcerpt(excerpt, secrets = []) {
  let output = excerpt

  for (const secret of secrets) {
    if (secret) {
      output = output.split(secret).join(redact(secret))
    }
  }

  return output
}

export function report(context, scannerName, args) {
  const result = {
    scanner: scannerName,
    root: context.root,
    platform: os.platform(),
    findingCount: context.findings.length,
    skippedCount: context.skipped.length,
    findings: context.findings.sort(compareFindings),
    skipped: context.skipped.sort((left, right) => left.path.localeCompare(right.path)),
  }

  if (args.json) {
    console.log(JSON.stringify(result, null, 2))
  } else if (context.findings.length === 0 && context.skipped.length === 0) {
    console.log(`${scannerName}: PASS`)
  } else {
    for (const skipped of result.skipped) {
      console.log(`${scannerName}: SKIP ${skipped.path} ${skipped.reason}`)
    }

    for (const finding of result.findings) {
      const location = finding.line ? `${finding.file}:${finding.line}` : finding.file
      console.log(`${scannerName}: ${finding.ruleId} ${location} ${finding.reason}`)

      if (finding.excerpt) {
        console.log(`  ${finding.excerpt}`)
      }
    }
  }

  process.exitCode = context.findings.length > 0 || context.skipped.length > 0 ? 1 : 0
}

function compareFindings(left, right) {
  return (
    left.file.localeCompare(right.file) ||
    Number(left.line ?? 0) - Number(right.line ?? 0) ||
    left.ruleId.localeCompare(right.ruleId)
  )
}
