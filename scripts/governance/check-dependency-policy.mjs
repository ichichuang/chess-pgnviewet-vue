#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

import {
  allowedDependencyClasses,
  allowedOwnershipStatuses,
  approvedVersions,
  conditionalGatedPackages,
  dependencyOwnershipMatrixPath,
  dependencyOwnershipRequiredFields,
  dependencyOwnershipSchemaVersion,
  dependencyPolicy,
  duplicateCapabilityAlternatives,
  versionExceptions,
} from './policy.mjs'
import { addFinding, createContext, parseArgs, readJsonFile, report } from './utils.mjs'

const scannerName = 'dependency-policy'
const args = parseArgs()
const context = createContext(args)

const packageJson = readJsonFile(context, 'package.json')

if (packageJson) {
  validatePackageManager(packageJson)
  validateDirectDependencies(packageJson)
  const matrix = loadOwnershipMatrix(context)
  if (matrix) {
    validateOwnershipCoverage(packageJson, matrix)
    validateConditionalPackages(packageJson, matrix)
  }
  validateDuplicateCapabilities(packageJson)
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

function loadOwnershipMatrix(context) {
  const matrix = readJsonFile(context, dependencyOwnershipMatrixPath)

  if (matrix === null) {
    addFinding(context, {
      ruleId: 'DEP_OWNERSHIP_MATRIX_MISSING',
      file: dependencyOwnershipMatrixPath,
      line: 1,
      excerpt: dependencyOwnershipMatrixPath,
      reason: 'Dependency ownership matrix is required by TECH_STACK_DECISION.md.',
      remediationOwner: 'toolchain-governance',
    })
    return null
  }

  let schemaValid = true

  if (matrix.schemaVersion !== dependencyOwnershipSchemaVersion) {
    schemaValid = false
    addFinding(context, {
      ruleId: 'DEP_OWNERSHIP_MATRIX_SCHEMA',
      file: dependencyOwnershipMatrixPath,
      line: 1,
      excerpt: JSON.stringify(matrix.schemaVersion),
      reason: `Ownership matrix schemaVersion must be ${dependencyOwnershipSchemaVersion}.`,
      remediationOwner: 'toolchain-governance',
    })
  }

  if (!Array.isArray(matrix.packages)) {
    schemaValid = false
    addFinding(context, {
      ruleId: 'DEP_OWNERSHIP_MATRIX_SCHEMA',
      file: dependencyOwnershipMatrixPath,
      line: 1,
      excerpt: '"packages"',
      reason: 'Ownership matrix must contain a packages array.',
      remediationOwner: 'toolchain-governance',
    })
  }

  if (!Array.isArray(matrix.conditionalGated)) {
    schemaValid = false
    addFinding(context, {
      ruleId: 'DEP_OWNERSHIP_MATRIX_SCHEMA',
      file: dependencyOwnershipMatrixPath,
      line: 1,
      excerpt: '"conditionalGated"',
      reason: 'Ownership matrix must contain a conditionalGated array.',
      remediationOwner: 'toolchain-governance',
    })
  }

  if (!schemaValid) {
    return null
  }

  const allEntries = [...matrix.packages, ...matrix.conditionalGated]

  for (const entry of allEntries) {
    for (const field of dependencyOwnershipRequiredFields) {
      if (!Object.hasOwn(entry, field)) {
        addFinding(context, {
          ruleId: 'DEP_OWNERSHIP_MATRIX_SCHEMA',
          file: dependencyOwnershipMatrixPath,
          line: 1,
          excerpt: `${entry.package}.${field}`,
          reason: `Ownership matrix entry is missing required field ${field}.`,
          remediationOwner: 'toolchain-governance',
        })
      }
    }

    if (!allowedOwnershipStatuses.includes(entry.status)) {
      addFinding(context, {
        ruleId: 'DEP_OWNERSHIP_MATRIX_SCHEMA',
        file: dependencyOwnershipMatrixPath,
        line: 1,
        excerpt: `${entry.package}.status = ${JSON.stringify(entry.status)}`,
        reason: `Ownership status must be one of ${allowedOwnershipStatuses.join(', ')}.`,
        remediationOwner: 'toolchain-governance',
      })
    }

    if (!allowedDependencyClasses.includes(entry.dependencyClass)) {
      addFinding(context, {
        ruleId: 'DEP_OWNERSHIP_MATRIX_SCHEMA',
        file: dependencyOwnershipMatrixPath,
        line: 1,
        excerpt: `${entry.package}.dependencyClass = ${JSON.stringify(entry.dependencyClass)}`,
        reason: `Dependency class must be one of ${allowedDependencyClasses.join(', ')}.`,
        remediationOwner: 'toolchain-governance',
      })
    }
  }

  return matrix
}

function validateOwnershipCoverage(packageJson, matrix) {
  const dependencies = packageJson.dependencies ?? {}
  const devDependencies = packageJson.devDependencies ?? {}
  const matrixEntries = new Map([
    ...(matrix.packages ?? []).map((entry) => [entry.package, entry]),
    ...(matrix.conditionalGated ?? []).map((entry) => [entry.package, entry]),
  ])

  for (const [sectionName, section] of Object.entries({ dependencies, devDependencies })) {
    for (const [name, version] of Object.entries(section)) {
      const entry = matrixEntries.get(name)

      if (!entry) {
        addFinding(context, {
          ruleId: 'DEP_PACKAGE_NOT_IN_MATRIX',
          file: 'package.json',
          line: 1,
          excerpt: `${sectionName}.${name}: ${version}`,
          reason: `${name} is declared in package.json but has no entry in the ownership matrix.`,
          remediationOwner: 'toolchain-governance',
        })
        continue
      }

      if (entry.version !== version) {
        addFinding(context, {
          ruleId: 'DEP_MATRIX_VERSION_MISMATCH',
          file: 'package.json',
          line: 1,
          excerpt: `${sectionName}.${name}: ${version}`,
          reason: `Ownership matrix records ${name}@${entry.version}, which differs from package.json.`,
          remediationOwner: 'toolchain-governance',
        })
      }

      if (entry.status === 'UNOWNED_BLOCKED') {
        addFinding(context, {
          ruleId: 'DEP_MATRIX_STATUS_UNOWNED_FOR_INSTALLED_PACKAGE',
          file: dependencyOwnershipMatrixPath,
          line: 1,
          excerpt: `${name}.status = UNOWNED_BLOCKED`,
          reason: `Installed package ${name} cannot have status UNOWNED_BLOCKED in the ownership matrix.`,
          remediationOwner: 'toolchain-governance',
        })
      }

      if (isMissingOwnerValue(entry.architectureOwner)) {
        addFinding(context, {
          ruleId: 'DEP_MATRIX_ENTRY_MISSING_OWNER',
          file: dependencyOwnershipMatrixPath,
          line: 1,
          excerpt: `${name}.architectureOwner`,
          reason: `Ownership matrix entry for ${name} is missing an architecture owner.`,
          remediationOwner: 'toolchain-governance',
        })
      }

      if (isMissingOwnerValue(entry.approvedResponsibility)) {
        addFinding(context, {
          ruleId: 'DEP_MATRIX_ENTRY_MISSING_ROLE',
          file: dependencyOwnershipMatrixPath,
          line: 1,
          excerpt: `${name}.approvedResponsibility`,
          reason: `Ownership matrix entry for ${name} is missing an approved responsibility.`,
          remediationOwner: 'toolchain-governance',
        })
      }

      if (
        isMissingOwnerValue(entry.initializationImportOwner) ||
        !Array.isArray(entry.primaryPaths) ||
        entry.primaryPaths.length === 0
      ) {
        addFinding(context, {
          ruleId: 'DEP_MATRIX_ENTRY_MISSING_INIT_PATH',
          file: dependencyOwnershipMatrixPath,
          line: 1,
          excerpt: `${name}.initializationImportOwner / primaryPaths`,
          reason: `Ownership matrix entry for ${name} is missing an initialization/import owner or primary paths.`,
          remediationOwner: 'toolchain-governance',
        })
      }
    }
  }
}

function validateConditionalPackages(packageJson, matrix) {
  const declaredNames = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ])
  const matrixEntries = new Map([
    ...(matrix.packages ?? []).map((entry) => [entry.package, entry]),
    ...(matrix.conditionalGated ?? []).map((entry) => [entry.package, entry]),
  ])

  for (const gated of conditionalGatedPackages) {
    if (!declaredNames.has(gated.name)) {
      continue
    }

    const entry = matrixEntries.get(gated.name)
    const authorityMissing =
      !entry ||
      !entry.conditionalGated ||
      isMissingOwnerValue(entry.prerequisiteAuthority) ||
      !fs.existsSync(path.join(context.root, entry.prerequisiteAuthority))

    if (authorityMissing) {
      addFinding(context, {
        ruleId: 'DEP_CONDITIONAL_PACKAGE_UNAUTHORIZED',
        file: 'package.json',
        line: 1,
        excerpt: `${gated.name}: ${packageJson.dependencies?.[gated.name] ?? packageJson.devDependencies?.[gated.name]}`,
        reason: `${gated.name} is a conditional gated package and requires prerequisite authority ${gated.prerequisiteAuthority}.`,
        remediationOwner: 'toolchain-governance',
      })
    }
  }
}

function validateDuplicateCapabilities(packageJson) {
  const allSections = {
    dependencies: packageJson.dependencies ?? {},
    devDependencies: packageJson.devDependencies ?? {},
  }

  for (const [sectionName, section] of Object.entries(allSections)) {
    for (const [name, version] of Object.entries(section)) {
      if (duplicateCapabilityAlternatives.includes(name)) {
        addFinding(context, {
          ruleId: 'DEP_FORBIDDEN_FRAMEWORK_DUPLICATE_CAPABILITY',
          file: 'package.json',
          line: 1,
          excerpt: `${sectionName}.${name}: ${version}`,
          reason: `${name} duplicates an approved capability and is forbidden without explicit owner authority.`,
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

function isMissingOwnerValue(value) {
  if (typeof value !== 'string') {
    return true
  }
  const trimmed = value.trim()
  return trimmed === '' || trimmed === 'Not assigned' || trimmed === 'N/A'
}
