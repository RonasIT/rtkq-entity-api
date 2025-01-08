import unusedImports from 'eslint-plugin-unused-imports';
import react from 'eslint-plugin-react';
import _import from 'eslint-plugin-import';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  {
    ignores: ['**/node_modules', '**/dist', 'eslint.config.mjs']
  },
  ...compat.extends(
    'eslint:recommended',
    'plugin:react/recommended',
    'prettier'
  ),
  eslintConfigPrettier,
  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'unused-imports': unusedImports,
      react,
      import: fixupPluginRules(_import),
      '@stylistic': stylistic
    },

    languageOptions: {
      globals: {
        ...globals.node
      },

      parser: tseslint.parser,
      ecmaVersion: 6,
      sourceType: 'commonjs',

      parserOptions: {
        projectService: 'tsconfig.json',

        ecmaFeatures: {
          jsx: true
        }
      }
    },

    settings: {
      react: {
        version: 'detect'
      },

      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },

      'import/resolver': {
        typescript: {
          alwaysTryTypes: true
        },

        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    },

    rules: {
      '@stylistic/quotes': ['warn', 'single', {
        allowTemplateLiterals: true
      }],

      'object-shorthand': 'warn',
      '@stylistic/arrow-parens': ['warn', 'always'],
      '@stylistic/comma-dangle': ['warn', 'never'],
      'no-var': 'warn',
      'no-dupe-class-members': 'off',
      'import/prefer-default-export': 'off',
      '@stylistic/implicit-arrow-linebreak': ['warn', 'beside'],

      '@stylistic/newline-per-chained-call': ['warn', {
        ignoreChainWithDepth: 2
      }],

      '@stylistic/function-call-argument-newline': ['warn', 'consistent'],
      '@stylistic/function-paren-newline': ['warn', 'consistent'],
      '@stylistic/array-element-newline': ['warn', 'consistent'],

      '@stylistic/array-bracket-newline': ['warn', {
        multiline: true
      }],

      '@stylistic/padding-line-between-statements': ['warn',
        {
          blankLine: 'always',
          prev: '*',
          next: 'return'
        },
        {
          blankLine: 'always',
          prev: '*',
          next: 'multiline-block-like'
        }
      ],

      '@typescript-eslint/no-use-before-define': ['warn', {
        variables: false
      }],

      '@stylistic/lines-between-class-members': ['warn'],

      '@typescript-eslint/no-inferrable-types': ['warn', {
        ignoreParameters: true
      }],

      '@typescript-eslint/explicit-module-boundary-types': ['warn', {
        allowArgumentsExplicitlyTypedAsAny: true
      }],

      '@typescript-eslint/no-explicit-any': 'off',

      '@typescript-eslint/explicit-member-accessibility': ['warn', {
        accessibility: 'explicit',

        overrides: {
          constructors: 'no-public'
        }
      }],

      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true
      }],

      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      '@typescript-eslint/array-type': ['warn', {
        default: 'generic',
        readonly: 'generic'
      }],

      '@typescript-eslint/member-ordering': ['warn', {
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
          'private-instance-method'
        ]
      }],

      '@typescript-eslint/naming-convention': ['warn',
        {
          selector: 'typeLike',
          format: ['PascalCase']
        },
        {
          selector: ['parameter'],
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow'
        },
        {
          selector: ['classProperty'],
          format: ['camelCase', 'snake_case'],
          leadingUnderscore: 'allow'
        },
        {
          selector: ['method', 'accessor'],
          format: ['camelCase']
        },
        {
          selector: ['function', 'typeProperty'],
          format: ['camelCase', 'PascalCase']
        },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE']
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE']
        }],

      'unused-imports/no-unused-imports': 'warn',

      'unused-imports/no-unused-vars': ['warn', {
        vars: 'all',
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],

      '@stylistic/jsx-quotes': ['warn', 'prefer-single'],
      'react/jsx-boolean-value': 'off',

      'react/self-closing-comp': ['warn', {
        component: true,
        html: true
      }],

      'react/jsx-max-props-per-line': [1, {
        maximum: {
          single: 2,
          multi: 1
        }
      }],

      '@stylistic/jsx-first-prop-new-line': ['warn', 'multiline'],
      'react/prop-types': 'off',
      'import/newline-after-import': 'warn',
      'import/no-unresolved': 'warn',

      'import/order': ['warn', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type'
        ],

        alphabetize: {
          order: 'asc'
        }
      }],

      'import/no-duplicates': 'warn'
    }
  }];
