/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // The codebase uses inline-style attribute bindings with CSS custom
    // properties and brand-coded SVG paths — we keep the chrome verbose
    // intentionally. Loosen the default vue limits.
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/html-self-closing': ['warn', {
      html: { void: 'any', normal: 'any', component: 'always' },
    }],
    'vue/attribute-hyphenation': ['warn', 'always'],
    'vue/v-on-event-hyphenation': ['warn', 'always'],
    'vue/no-v-html': 'error',
    'vue/component-name-in-template-casing': ['warn', 'PascalCase', {
      registeredComponentsOnly: false,
    }],
    'vue/multi-word-component-names': 'off',
    // Optional props that are explicitly typed with `?` already say
    // "this can be undefined". Forcing an explicit default just to
    // satisfy a linter creates noise without value.
    'vue/require-default-prop': 'off',
    // Attribute ordering / first-line-break are cosmetic — our SFCs
    // intentionally group attributes by concern (a11y, layout, events),
    // which Prettier already enforces consistently.
    'vue/attributes-order': 'off',
    'vue/first-attribute-linebreak': 'off',
    // TypeScript safety dials — tight but not paranoid.
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-expect-error': 'allow-with-description' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'warn',
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.d.ts'],
  overrides: [
    {
      files: ['tests/**/*.{ts,vue}', '**/*.test.{ts,vue}'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
}
