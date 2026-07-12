#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

import { dependencyPolicy, approvedVersions, versionExceptions } from './policy.mjs'
import { addFinding, createContext, parseArgs, readJsonFile, report } from './utils.mjs'

const scannerName = 'dependency-policy'
const args = parseArgs()
const context = createContext(args)

const packageJson = readJsonFile(context, 'package.json')

if (packageJson) {
  validatePackageManager(packageJson)
  validateDirectDependencies(packageJson)
  validateVersionExceptions()
}

validateLockfiles()

report(context, scannerName, args)

function validatePackageManager(packageJson) {
  if (packageJson.packageManager !== dependencyPolicy.packageManager) {
    addFinding(context, {
      ruleId: 'DEP_PACKAGE_MANAGER_PIN',
      file: 'package.json',
      line: 1,
      excerpt: `"packageManager": ${JSON.stringify(packageJson.packageManager)}`,
      reason: `packageManager must be ${dependencyPolicy.packageManager}.`,
      remediationOwner: 'toolchain-governance',
    })
  }

  for (const [engineName, expectedVersion] of Object.entries(dependencyPolicy.engines)) {
    if (packageJson.engines?.[engineName] !== expectedVersion) {
      addFinding(context, {
        ruleId: 'DEP_ENGINE_PIN',
        file: 'package.json',
        line: 1,
        excerpt: `"engines.${engineName}": ${JSON.stringify(packageJson.engines?.[engineName])}`,
        reason: `${engineName} engine must be pinned to ${expectedVersion}.`,
        remediationOwner: 'toolchain-governance',
      })
    }
  }

  if (Object.hasOwn(packageJson.scripts ?? {}, 'test')) {
    addFinding(context, {
      ruleId: 'DEP_TEST_SCRIPT_FORBIDDEN',
      file: 'package.json',
      line: 1,
      excerpt: '"scripts.test"',
      reason: 'Automated test scripts are forbidden by the active owner policy.',
      remediationOwner: 'toolchain-governance',
    })
  }
}

function validateDirectDependencies(packageJson) {
  const dependencies = packageJson.dependencies ?? {}
  const devDependencies = packageJson.devDependencies ?? {}
  const allSections = { dependencies, devDependencies }

  for (const name of Object.keys(dependencies)) {
    if (Object.hasOwn(devDependencies, name)) {
      addFinding(context, {
        ruleId: 'DEP_DUPLICATE_DIRECT_DEPENDENCY',
        file: 'package.json',
        line: 1,
        excerpt: name,
        reason: 'Dependency is declared in both dependencies and devDependencies.',
        remediationOwner: 'toolchain-governance',
      })
    }
  }

  for (const [sectionName, section] of Object.entries(allSections)) {
    const approvedSection = approvedVersions[sectionName]

    for (const [name, version] of Object.entries(section)) {
      if (dependencyPolicy.forbiddenDirectDependencies.includes(name)) {
        addFinding(context, {
          ruleId: 'DEP_FORBIDDEN_DIRECT_DEPENDENCY',
          file: 'package.json',
          line: 1,
          excerpt: `${name}: ${version}`,
          reason: `${name} is forbidden in the active Vue/no-automated-test toolchain.`,
          remediationOwner: 'toolchain-governance',
        })
      }

      if (!isExactStableVersion(version)) {
        addFinding(context, {
          ruleId: 'DEP_DIRECT_VERSION_NOT_EXACT_STABLE',
          file: 'package.json',
          line: 1,
          excerpt: `${name}: ${version}`,
          reason:
            'Direct dependencies must use exact stable versions without ranges or source refs.',
          remediationOwner: 'toolchain-governance',
        })
      }

      if (containsPrereleaseMarker(version)) {
        addFinding(context, {
          ruleId: 'DEP_PRERELEASE_DIRECT_DEPENDENCY',
          file: 'package.json',
          line: 1,
          excerpt: `${name}: ${version}`,
          reason: 'Prerelease, canary, nightly, experimental, or preview versions are forbidden.',
          remediationOwner: 'toolchain-governance',
        })
      }

      if (approvedSection?.[name] !== version) {
        addFinding(context, {
          ruleId: 'DEP_APPROVED_VERSION_DRIFT',
          file: 'package.json',
          line: 1,
          excerpt: `${name}: ${version}`,
          reason: `${name} must remain at approved ${approvedSection?.[name] ?? '<not approved>'}.`,
          remediationOwner: 'toolchain-governance',
        })
      }
    }

    for (const [name, expectedVersion] of Object.entries(approvedSection)) {
      if (section[name] !== expectedVersion) {
        addFinding(context, {
          ruleId: 'DEP_REQUIRED_DIRECT_DEPENDENCY_MISSING',
          file: 'package.json',
          line: 1,
          excerpt: `${sectionName}.${name}`,
          reason: `${name}@${expectedVersion} is required by the active dependency authority.`,
          remediationOwner: 'toolchain-governance',
        })
      }
    }
  }
}

function validateVersionExceptions() {
  for (const exception of versionExceptions) {
    for (const key of [
      'authority',
      'rationale',
      'risk',
      'reviewTrigger',
      'removalCondition',
      'selectedVersion',
    ]) {
      if (!exception[key]) {
        addFinding(context, {
          ruleId: 'DEP_VERSION_EXCEPTION_INCOMPLETE',
          file: 'scripts/governance/policy.mjs',
          line: 1,
          excerpt: `${exception.package}.${key}`,
          reason:
            'Every version exception needs authority, rationale, risk, review trigger, and removal condition.',
          remediationOwner: 'toolchain-governance',
        })
      }
    }
  }
}

function validateLockfiles() {
  const requiredPath = path.join(context.root, dependencyPolicy.requiredLockfile)

  if (!fs.existsSync(requiredPath)) {
    addFinding(context, {
      ruleId: 'DEP_PNPM_LOCKFILE_REQUIRED',
      file: dependencyPolicy.requiredLockfile,
      line: 1,
      excerpt: dependencyPolicy.requiredLockfile,
      reason: 'Exactly one pnpm lockfile must exist.',
      remediationOwner: 'toolchain-governance',
    })
  }

  const foundCompeting = dependencyPolicy.competingLockfiles.filter((fileName) =>
    fs.existsSync(path.join(context.root, fileName))
  )

  for (const fileName of foundCompeting) {
    addFinding(context, {
      ruleId: 'DEP_COMPETING_LOCKFILE_FORBIDDEN',
      file: fileName,
      line: 1,
      excerpt: fileName,
      reason: 'Competing package-manager lockfiles are forbidden.',
      remediationOwner: 'toolchain-governance',
    })
  }
}

function isExactStableVersion(version) {
  return /^\d+\.\d+\.\d+$/u.test(version)
}

function containsPrereleaseMarker(version) {
  const lowered = version.toLowerCase()
  return dependencyPolicy.prereleaseMarkers.some((marker) =>
    new RegExp(`(?:^|[._-])${marker}(?:$|[._-])`, 'u').test(lowered)
  )
}
