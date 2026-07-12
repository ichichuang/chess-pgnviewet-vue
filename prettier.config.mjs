export default {
  arrowParens: 'always',
  endOfLine: 'lf',
  printWidth: 100,
  proseWrap: 'preserve',
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  embeddedLanguageFormatting: 'off',
  overrides: [
    {
      files: ['.ai/reports/*.json', 'docs/**/*.json'],
      options: {
        tabWidth: 4,
      },
    },
    {
      files: ['src/router/index.ts'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
}
