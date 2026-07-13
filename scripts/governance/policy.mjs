import path from 'node:path'

export const projectRoot = path.resolve(import.meta.dirname, '../..')

export const evidenceSourceRoots = [
  '/Users/cc/Work/neobv/Chess/pgnViewer-new',
  '/Users/cc/Work/neobv/Chess/pgnViewer',
  '/Users/cc/Work/neobv/Chess/chess-pgnviewer',
]

export const permanentExcludedDirectories = [
  '.git',
  'node_modules',
  '.pnpm-store',
  'dist',
  '.vite',
  'coverage',
  '.serena',
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
    'naive-ui': '2.44.1',
    pinia: '3.0.4',
    vue: '3.5.39',
    'vue-router': '5.1.0',
    zod: '4.4.3',
  },
  devDependencies: {
    '@eslint/js': '10.0.1',
    '@types/node': '26.1.1',
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
    rationale: 'F2A and F2B preserve the existing mise and packageManager baseline.',
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
  implementationScopes: ['src', 'vite.config.ts', '*.config.mjs'],
  approvedVueBootstrap: 'src/main.ts',
  approvedRouterOwner: 'src/router/index.ts',
  approvedPiniaOwner: 'src/stores/index.ts',
  naiveUiAllowlist: ['src/ui/', 'src/app/providers/', 'src/providers/'],
  iconAllowlist: ['src/ui/icons/', 'src/ui/', 'src/app/providers/'],
  apiAllowlist: ['src/api/', 'src/repositories/', 'src/sources/', 'src/runtime/http/'],
  axiosImportAllowlist: ['src/api/client.ts'],
  browserAuthHeaderAllowlist: ['src/api/client.ts'],
  nativeHttpAllowlist: [],
  persistenceAllowlist: [
    'src/persistence/',
    'src/bootstrap/preferences/',
    'src/runtime/preferences/',
  ],
  runtimeConfigAllowlist: ['src/runtime/config/', 'src/config/runtime.ts', 'src/router/index.ts'],
  writeEndpointAllowlist: ['src/api/client.ts'],
  futureAllowlists: {
    naiveUi: ['src/ui/', 'src/app/providers/', 'src/providers/'],
    icons: ['src/ui/icons/'],
    api: ['src/api/', 'src/repositories/'],
    persistence: ['src/persistence/', 'src/bootstrap/preferences/'],
    runtimeConfig: ['src/runtime/config/'],
  },
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
