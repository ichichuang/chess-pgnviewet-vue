import path from 'node:path'

export const projectRoot = path.resolve(import.meta.dirname, '../..')

export const evidenceSourceRoots = [
  '/Users/cc/Work/neobv/Chess/pgnViewer-new',
  '/Users/cc/Work/neobv/Chess/pgnViewer',
  '/Users/cc/Work/neobv/Chess/chess-main-overseas',
  '/Users/cc/Work/neobv/Chess/chess-pgnviewer',
]

export const permanentExcludedDirectories = [
  '.git',
  'node_modules',
  '.pnpm-store',
  'dist',
  '.vite',
  'coverage',
]

export const generatedOrLocalPatterns = [
  /^.*\.log$/u,
  /^.*\.local$/u,
  /^.*\.sqlite(?:3)?$/u,
  /^.*\.db(?:-(?:wal|shm))?$/u,
  /^.*\.DS_Store$/u,
]

export const approvedVersions = {
  dependencies: {
    '@tanstack/vue-query': '5.101.2',
    axios: '1.18.1',
    'chess.js': '1.4.0',
    dexie: '4.4.4',
    gsap: '3.15.0',
    'js-md5': '0.8.3',
    'naive-ui': '2.44.1',
    pinia: '3.0.4',
    vue: '3.5.39',
    'vue-router': '5.1.0',
    zod: '4.4.3',
  },
  devDependencies: {
    '@eslint/js': '10.0.1',
    '@types/node': '26.1.1',
    '@types/js-md5': '0.8.0',
    '@vitejs/plugin-vue': '6.0.7',
    '@vue/tsconfig': '0.9.1',
    eslint: '10.7.0',
    'eslint-config-prettier': '10.1.8',
    'eslint-plugin-vue': '10.9.2',
    knip: '6.26.0',
    'npm-run-all2': '9.0.2',
    'postcss-html': '1.8.1',
    prettier: '3.9.5',
    stylelint: '17.14.0',
    'stylelint-config-standard': '40.0.0',
    typescript: '6.0.3',
    'typescript-eslint': '8.63.0',
    vite: '8.1.4',
    'vue-eslint-parser': '10.4.1',
    'vue-tsc': '3.3.7',
  },
}

export const versionExceptions = [
  {
    package: 'typescript',
    selectedVersion: '6.0.3',
    latestStableObserved: '7.0.2',
    authority: 'docs/architecture/TOOLCHAIN_AND_STATIC_GOVERNANCE_BASELINE.md',
    rationale:
      'typescript-eslint supports TypeScript >=4.8.4 <6.1.0 and Vue tooling keeps TypeScript 7 gated.',
    risk: 'TypeScript 7 language and API changes remain unavailable until the Vue stack supports them.',
    reviewTrigger: 'typescript-eslint, Vue Language Tools, and vue-tsc support TypeScript 7.',
    removalCondition:
      'Full typecheck, production build, static governance, browser validation, and owner approval pass.',
  },
  {
    package: 'pnpm',
    selectedVersion: '11.11.0',
    latestStableObserved: '11.12.0',
    authority: 'docs/architecture/TOOLCHAIN_AND_STATIC_GOVERNANCE_BASELINE.md',
    rationale:
      'The repository pins mise, packageManager, and lockfile behavior as one toolchain contract.',
    risk: 'Pinned package-manager behavior remains fixed until an approved baseline update.',
    reviewTrigger: 'Owner approves a package-manager baseline update.',
    removalCondition:
      'Lockfile integrity and full static validation pass after the approved update.',
  },
]

export const dependencyPolicy = {
  packageManager: 'pnpm@11.11.0',
  engines: {
    node: '26.5.0',
    pnpm: '11.11.0',
  },
  requiredLockfile: 'pnpm-lock.yaml',
  competingLockfiles: [
    'package-lock.json',
    'npm-shrinkwrap.json',
    'yarn.lock',
    'bun.lock',
    'bun.lockb',
  ],
  prereleaseMarkers: [
    'alpha',
    'beta',
    'canary',
    'dev',
    'experimental',
    'next',
    'nightly',
    'pre',
    'preview',
    'rc',
    'snapshot',
  ],
  forbiddenDirectDependencies: [
    '@biomejs/biome',
    '@playwright/test',
    '@testing-library/vue',
    '@vue/test-utils',
    'biome',
    'bun-types',
    'cypress',
    'dependency-cruiser',
    'depcheck',
    'happy-dom',
    'jest',
    'jsdom',
    'madge',
    'playwright',
    'react',
    'react-dom',
    'secretlint',
    'vitest',
  ],
}

export const architecturePolicy = {
  runtimeScopes: ['src'],
  implementationScopes: [
    'src',
    'server',
    'api',
    'functions',
    'middleware',
    'vite.config.ts',
    'vercel.json',
    '*.config.mjs',
  ],
  approvedVueBootstrap: 'src/main.ts',
  approvedRouterOwner: 'src/router/index.ts',
  approvedPiniaOwner: 'src/stores/index.ts',
  naiveUiAllowlist: ['src/ui/', 'src/app/providers/', 'src/providers/'],
  iconAllowlist: ['src/ui/icons/', 'src/ui/', 'src/app/providers/'],
  apiAllowlist: ['src/api/', 'src/repositories/', 'src/sources/', 'src/runtime/http/'],
  axiosImportAllowlist: ['src/api/client.ts'],
  browserAuthHeaderAllowlist: ['src/api/client.ts', 'src/api/legacyWebCompatibility.ts'],
  browserCompatibilityIdentityAllowlist: ['src/api/legacyWebCompatibility.ts'],
  browserCompatibilityConstantOwner: 'src/api/legacyWebCompatibility.ts',
  authPersistenceOwner: 'src/persistence/auth/authPersistence.ts',
  protectedAuthBoundaryAllowlist: [
    'src/api/authRepository.ts',
    'src/api/client.ts',
    'src/api/legacyWebCompatibility.ts',
    'src/api/privateAuthLifecycle.ts',
    'src/persistence/auth/authPersistence.ts',
    'src/stores/auth.ts',
  ],
  urlTokenCompatibilityAllowlist: ['vite.config.ts'],
  nativeHttpAllowlist: [],
  persistenceAllowlist: [
    'src/persistence/',
    'src/bootstrap/preferences/',
    'src/runtime/preferences/',
  ],
  runtimeConfigAllowlist: ['src/runtime/config/', 'src/config/runtime.ts', 'src/router/index.ts'],
  writeEndpointAllowlist: ['src/api/client.ts', 'vite.config.ts'],
}

export const obsoleteArchitecturePolicy = {
  activeAuthorityExactPaths: [
    '.ai/skills/project-ui/SKILL.md',
    'AGENTS.md',
    'CLAUDE.md',
    'docs/migration/CAPABILITY_MATRIX.json',
    'docs/migration/DEPENDENCY_VERSION_BASELINE.json',
    'docs/migration/DOCUMENT_INVENTORY.json',
    'docs/migration/SOURCE_PROVENANCE.md',
    'package.json',
    'scripts/governance/check-architecture-boundaries.mjs',
    'scripts/governance/check-obsolete-architecture-residue.mjs',
    'scripts/governance/check-user-visible-copy.mjs',
    'scripts/governance/policy.mjs',
  ],
  activeAuthorityPrefixes: ['docs/architecture/', 'docs/product/', 'docs/ui/'],
  authorityPatternDefinitionAllowlist: [
    'scripts/governance/check-obsolete-architecture-residue.mjs',
    'scripts/governance/check-user-visible-copy.mjs',
    'scripts/governance/policy.mjs',
  ],
  forbiddenActiveAuthorityPaths: [
    'docs/architecture/CANONICAL_TOKEN_THEME_INVENTORY.json',
    'docs/architecture/F2_TOOLCHAIN_AND_STATIC_GOVERNANCE_CLOSURE.md',
    'docs/architecture/PRETTIER_FORMATTING_DEBT_BASELINE.json',
    'docs/architecture/PRODUCT_FIRST_DELIVERY_REBASE.md',
    'docs/migration/ASSET_INVENTORY.json',
    'docs/migration/CANONICAL_RUNTIME_CLOSURE.json',
    'docs/migration/CANONICAL_TOOLCHAIN_PARITY.json',
    'docs/migration/TYPESCRIPT_7_VUE_TOOLING_COMPATIBILITY_BRIDGE.json',
    'docs/migration/VUE_TYPESCRIPT_COMPATIBILITY_BASELINE.json',
  ],
  historicalAuthStatusAllowlist: [
    '.ai/reports/WEB_LOGIN_TOKEN_AUTH_FLOW_IMPLEMENTATION_REPORT.json',
  ],
  explicitProhibitionAllowlist: [
    '.ai/skills/project-ui/SKILL.md',
    'AGENTS.md',
    'CLAUDE.md',
    'docs/architecture/API_BOUNDARY_ADR.md',
    'docs/architecture/FRONTEND_ARCHITECTURE_RFC.md',
    'docs/architecture/PERSISTENCE_ADR.md',
    'docs/architecture/PRODUCTION_DEPLOYMENT_BOUNDARY.md',
    'docs/architecture/SOURCE_ADAPTER_ADR.md',
    'docs/architecture/TOOLCHAIN_AND_STATIC_GOVERNANCE_BASELINE.md',
    'docs/architecture/WEB_API_ENDPOINT_INVENTORY.json',
    'docs/architecture/WEB_API_SOURCE_AUTHORITY.md',
    'docs/product/PRODUCT_DEFINITION.md',
    'docs/migration/SOURCE_PROVENANCE.md',
    'docs/ui/PERSISTENCE_RECOVERY_SPEC.md',
    'docs/ui/UI_ACCEPTANCE_CHECKLIST.md',
    'scripts/governance/check-architecture-boundaries.mjs',
  ],
}

export const visualValuePolicy = {
  scopes: ['src'],
  extensions: ['.css', '.vue', '.ts', '.js', '.mjs'],
  tokenAuthorities: ['src/styles/tokens.css'],
  allowedKeywordValues: [
    'transparent',
    'currentColor',
    'inherit',
    'initial',
    'unset',
    'revert',
    'none',
  ],
  allowedExactDeclarations: [
    { path: 'src/styles/base.css', property: 'margin', value: '0', reason: 'reset geometry' },
    { path: 'src/styles/base.css', property: 'padding', value: '0', reason: 'reset geometry' },
    {
      path: 'src/styles/base.css',
      property: 'animation-duration',
      value: '0.01ms !important',
      reason: 'reduced-motion accessibility override',
    },
    {
      path: 'src/styles/base.css',
      property: 'transition-duration',
      value: '0.01ms !important',
      reason: 'reduced-motion accessibility override',
    },
  ],
  namedColors: [
    'aliceblue',
    'antiquewhite',
    'aqua',
    'aquamarine',
    'azure',
    'beige',
    'bisque',
    'black',
    'blue',
    'brown',
    'chocolate',
    'coral',
    'crimson',
    'cyan',
    'gold',
    'gray',
    'green',
    'grey',
    'indigo',
    'lime',
    'magenta',
    'maroon',
    'navy',
    'orange',
    'pink',
    'purple',
    'red',
    'silver',
    'teal',
    'violet',
    'white',
    'yellow',
  ],
}

export const mockDataPolicy = {
  scopes: ['src'],
  excludedPaths: ['src/types/index.ts', 'src/ui/index.ts'],
  neutralAllowedPhrases: ['foundation preview', 'empty bootstrap', 'development-only foundation'],
}

export const secretPolicy = {
  placeholderAllowlist: [
    {
      path: '.env.example',
      pattern: 'example',
      reason: 'placeholder-only environment documentation',
      reviewTrigger: 'Reopen if a non-placeholder value is added.',
    },
  ],
  excludedPaths: ['pnpm-lock.yaml'],
  excludedDirectories: ['.ai/reports', 'docs/archive'],
}

export const userVisibleCopyPolicy = {
  scopes: ['src'],
  forbiddenTerms: [
    { id: 'development', pattern: /\bdevelopment\b|开发环境|开发状态/giu },
    { id: 'audit', pattern: /\baudit\b|审计/giu },
    { id: 'contract', pattern: /\bcontract\b|合同/giu },
    { id: 'mock', pattern: /\bmock\b|模拟数据/giu },
    { id: 'fixture', pattern: /\bfixture\b|固定样例/giu },
    { id: 'test', pattern: /\btest(?:ing)?\b|测试/giu },
    { id: 'debug', pattern: /\bdebug\b|调试/giu },
    { id: 'blocked', pattern: /\bblocked\b|阻断|已阻止/giu },
    { id: 'unconfirmed', pattern: /\bunconfirmed\b|未确认/giu },
    { id: 'cors', pattern: /\bcors\b|跨域/giu },
    { id: 'endpoint', pattern: /\bendpoint\b|端点/giu },
    { id: 'token', pattern: /\btoken\b|令牌/giu },
    { id: 'dto', pattern: /\bdto\b/giu },
    { id: 'axios', pattern: /\baxios\b/giu },
    { id: 'stack', pattern: /\bstack\b|调用栈|堆栈/giu },
    { id: 'source-authority', pattern: /\bsource[- ]authority\b|来源权威|源权威/giu },
  ],
  approvedNormalProductCopy: [],
}

export const dependencyOwnershipMatrixPath = 'docs/architecture/DEPENDENCY_OWNERSHIP_MATRIX.json'

export const dependencyOwnershipSchemaVersion = 1

export const dependencyOwnershipRequiredFields = [
  'package',
  'version',
  'dependencyClass',
  'approvedResponsibility',
  'architectureOwner',
  'initializationImportOwner',
  'primaryPaths',
  'whyExistingPlatformCannotReplaceIt',
  'duplicateCapabilityAssessment',
  'securityPrivacyImplications',
  'validationCommand',
  'upgradeTrigger',
  'removalCondition',
  'status',
]

export const allowedOwnershipStatuses = [
  'ACTIVE_OWNED',
  'TOOLING_OWNED',
  'COMPATIBILITY_EXCEPTION',
  'DEPRECATION_CANDIDATE',
  'UNOWNED_BLOCKED',
]

export const allowedDependencyClasses = [
  'runtime',
  'build',
  'typecheck',
  'lint',
  'format',
  'cssValidation',
  'aggregate',
  'types',
]

export const conditionalGatedPackages = [
  {
    name: 'vue-i18n',
    prerequisiteAuthority: 'docs/product/I18N_AUTHORITY.md',
    rationale: 'Internationalization is gated until product authority explicitly authorizes it.',
  },
  {
    name: 'mqtt',
    prerequisiteAuthority: 'docs/architecture/REALTIME_TRANSPORT_ADR.md',
    rationale: 'MQTT client is gated until a real-time transport ADR is approved.',
  },
  {
    name: 'socket.io-client',
    prerequisiteAuthority: 'docs/architecture/REALTIME_TRANSPORT_ADR.md',
    rationale: 'WebSocket client is gated until a real-time transport ADR is approved.',
  },
  {
    name: 'eventsource',
    prerequisiteAuthority: 'docs/architecture/REALTIME_TRANSPORT_ADR.md',
    rationale: 'SSE client is gated until a real-time transport ADR is approved.',
  },
  {
    name: '@tanstack/vue-virtual',
    prerequisiteAuthority: 'docs/architecture/VIRTUALIZATION_ADR.md',
    rationale:
      'Virtualization library is gated until an approved ADR identifies a list rendering requirement that cannot be met by CSS or project-owned logic.',
  },
  {
    name: 'vue-virtual-scroller',
    prerequisiteAuthority: 'docs/architecture/VIRTUALIZATION_ADR.md',
    rationale:
      'Virtualization library is gated until an approved ADR identifies a list rendering requirement that cannot be met by CSS or project-owned logic.',
  },
  {
    name: 'vuedraggable',
    prerequisiteAuthority: 'docs/architecture/DRAG_DROP_ADR.md',
    rationale:
      'Drag-and-drop library is gated until an approved ADR identifies a requirement that cannot be met by native HTML5 drag events or Pointer Events.',
  },
  {
    name: 'vue-draggable-next',
    prerequisiteAuthority: 'docs/architecture/DRAG_DROP_ADR.md',
    rationale:
      'Drag-and-drop library is gated until an approved ADR identifies a requirement that cannot be met by native HTML5 drag events or Pointer Events.',
  },
]

const duplicateCapabilityMap = {
  vue: ['react', 'react-dom', 'preact', 'solid-js', 'svelte'],
  'vue-router': ['react-router', '@tanstack/react-router', '@tanstack/vue-router'],
  pinia: ['zustand', 'xstate', '@reduxjs/toolkit', 'redux'],
  '@tanstack/vue-query': ['@tanstack/react-query', 'swr', 'react-query'],
  axios: ['undici'],
  'naive-ui': ['element-plus', 'ant-design-vue', 'quasar'],
  'chess.js': ['chessground'],
}

export const duplicateCapabilityAlternatives = Object.values(duplicateCapabilityMap).flat()
