export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    '**/node_modules/**',
    '**/.pnpm-store/**',
    '**/dist/**',
    '**/.vite/**',
    '**/coverage/**',
    '**/.git/**',
    '/Users/cc/Work/neobv/Chess/pgnViewer-new/**',
    '/Users/cc/Work/neobv/Chess/pgnViewer/**',
    '/Users/cc/Work/neobv/Chess/chess-pgnviewer/**',
  ],
  rules: {
    'custom-property-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
      {
        message: 'Custom properties must use lower-kebab-case token names.',
      },
    ],
    'import-notation': 'string',
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'slotted', 'global'],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
}
