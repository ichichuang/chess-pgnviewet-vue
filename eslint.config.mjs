import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

const ignores = [
  '**/node_modules/**',
  '**/.pnpm-store/**',
  '**/dist/**',
  '**/.vite/**',
  '**/coverage/**',
  '**/.serena/**',
  '**/.git/**',
  '**/.DS_Store',
  '/Users/cc/Work/neobv/Chess/pgnViewer-new/**',
  '/Users/cc/Work/neobv/Chess/pgnViewer/**',
  '/Users/cc/Work/neobv/Chess/chess-pgnviewer/**',
]

const readonlySourcePatterns = [
  '/Users/cc/Work/neobv/Chess/pgnViewer-new/**',
  '/Users/cc/Work/neobv/Chess/pgnViewer/**',
  '/Users/cc/Work/neobv/Chess/chess-pgnviewer/**',
  '../pgnViewer-new/**',
  '../pgnViewer/**',
  '../chess-pgnviewer/**',
]

const browserGlobals = {
  console: 'readonly',
  document: 'readonly',
  Event: 'readonly',
  HTMLElement: 'readonly',
  localStorage: 'readonly',
  navigator: 'readonly',
  requestAnimationFrame: 'readonly',
  sessionStorage: 'readonly',
  window: 'readonly',
}

const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  URL: 'readonly',
}

const vueCompilerMacros = {
  defineEmits: 'readonly',
  defineExpose: 'readonly',
  defineModel: 'readonly',
  defineOptions: 'readonly',
  defineProps: 'readonly',
  withDefaults: 'readonly',
}

const restrictedRuntimeImports = [
  {
    paths: [
      { name: 'react', message: 'React runtime is not part of this Vue target.' },
      { name: 'react-dom', message: 'React runtime is not part of this Vue target.' },
      { name: 'react/jsx-runtime', message: 'React runtime is not part of this Vue target.' },
    ],
    patterns: [
      ...readonlySourcePatterns.map((group) => ({
        group: [group],
        message: 'Read-only source projects are evidence only and must not be imported.',
      })),
    ],
  },
]

export default tseslint.config(
  { ignores },
  js.configs.recommended,
  tseslint.configs.base,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['src/**/*.ts'],
  })),
  ...vue.configs['flat/recommended'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...browserGlobals,
        ...vueCompilerMacros,
      },
    },
    rules: {
      'no-restricted-imports': ['error', restrictedRuntimeImports[0]],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    ignores: ['src/ui/**', 'src/app/providers/**', 'src/providers/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          ...restrictedRuntimeImports[0],
          paths: [
            ...restrictedRuntimeImports[0].paths,
            {
              name: 'naive-ui',
              message:
                'Naive UI may be imported only through approved root providers or src/ui adapters.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '*.config.{js,mjs,cjs,ts}',
      'eslint.config.mjs',
      'prettier.config.mjs',
      'stylelint.config.mjs',
      'scripts/governance/**/*.mjs',
    ],
    languageOptions: {
      globals: nodeGlobals,
      parserOptions: {
        sourceType: 'module',
      },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: restrictedRuntimeImports[0].paths,
          patterns: restrictedRuntimeImports[0].patterns,
        },
      ],
    },
  },
  prettier
)
