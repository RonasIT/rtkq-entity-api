module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 6,
    project: 'tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  ignorePatterns: ['node_modules', 'dist', '.eslintrc.js'],
  settings: {
    react: {
      version: 'detect',
    },
    'react-native/style-sheet-object-names': ['EStyleSheet'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  plugins: ['@typescript-eslint', 'unused-imports', 'react', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier',
  ],
  rules: {
    quotes: ['warn', 'single', { allowTemplateLiterals: true }],
    'object-shorthand': 'warn',
    'arrow-parens': ['warn', 'always'],
    'comma-dangle': ['warn', 'never'],
    'no-var': 'warn',
    'no-dupe-class-members': 'off',
    'import/prefer-default-export': 'off',
    'implicit-arrow-linebreak': ['warn', 'beside'],
    'newline-per-chained-call': ['warn', { ignoreChainWithDepth: 2 }],
    'function-call-argument-newline': ['warn', 'consistent'],
    'function-paren-newline': ['warn', 'consistent'],
    'array-element-newline': ['warn', 'consistent'],
    'array-bracket-newline': ['warn', { multiline: true }],
    'padding-line-between-statements': [
      'warn',
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: '*', next: 'multiline-block-like' },
    ],
    '@typescript-eslint/no-use-before-define': ['warn', { variables: false }],
    '@typescript-eslint/lines-between-class-members': ['warn'],
    '@typescript-eslint/no-inferrable-types': ['warn', { ignoreParameters: true }],
    '@typescript-eslint/explicit-module-boundary-types': ['warn', { allowArgumentsExplicitlyTypedAsAny: true }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-member-accessibility': [
      'warn',
      { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
    ],
    '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/array-type': ['warn', { default: 'generic', readonly: 'generic' }],
    '@typescript-eslint/member-ordering': [
      'warn',
      {
        default: [
          'public-static-field',
          'protected-static-field',
          'private-static-field',
          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',
          'public-constructor',
          'protected-constructor',
          'private-constructor',
          'public-static-method',
          'public-instance-method',
          'protected-static-method',
          'protected-instance-method',
          'private-static-method',
          'private-instance-method',
        ],
      },
    ],
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: ['parameter'],
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: ['classProperty'],
        format: ['camelCase', 'snake_case'],
        leadingUnderscore: 'allow',
      },
      {
        selector: ['method', 'accessor'],
        format: ['camelCase'],
      },
      {
        selector: ['function', 'typeProperty'],
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
    ],
    'unused-imports/no-unused-imports-ts': 'warn',
    'unused-imports/no-unused-vars-ts': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'jsx-quotes': ['warn', 'prefer-single'],
    'react/jsx-boolean-value': 'off',
    'react/self-closing-comp': ['warn', { component: true, html: true }],
    'react/jsx-max-props-per-line': [1, { maximum: { single: 2, multi: 1 } }],
    'react/jsx-first-prop-new-line': ['warn', 'multiline'],
    'react/prop-types': 'off',
    'import/newline-after-import': 'warn',
    'import/no-unresolved': 'warn',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        alphabetize: { order: 'asc' },
      },
    ],
    'import/no-duplicates': 'warn',
  },
};
