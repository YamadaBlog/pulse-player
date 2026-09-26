// @ts-check
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import lit from 'eslint-plugin-lit'
import reactHooks from 'eslint-plugin-react-hooks'
import vue from 'eslint-plugin-vue'
import wc from 'eslint-plugin-wc'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      'playwright-report/**',
      'test-results/**',
      'apps/demo-react-native/**',
      'packages/react-native/**',
      '**/custom-elements.json',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] } },
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  {
    files: ['packages/web-component/src/**/*.ts'],
    ...lit.configs['flat/recommended'],
  },
  {
    files: ['packages/web-component/src/**/*.ts'],
    ...wc.configs['flat/recommended'],
  },
  {
    files: ['packages/react/**/*.{ts,tsx}', 'apps/demo-react/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // Render-function wrappers: undefined props are meaningful (element defaults).
    files: ['packages/vue/src/**'],
    rules: { 'vue/require-default-prop': 'off', 'vue/one-component-per-file': 'off' },
  },
  {
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/tests/**', '**/*.test.*', 'e2e/**'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  prettier,
)
