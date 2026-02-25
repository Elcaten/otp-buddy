import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importXPlugin from 'eslint-plugin-import-x';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'extension/**',
      '*.js',
      '*.mjs',
      'vite.config.ts',
    ],
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.es2024,
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import-x': importXPlugin,
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
    },
    rules: {
      'arrow-body-style': [
        'error',
        'as-needed',
        {requireReturnForObjectLiteral: true},
      ],
      'no-alert': 'error',
      'no-console': 'off',
      'no-param-reassign': ['error', {props: false}],
      'no-restricted-syntax': [
        'error',
        'ForInStatement',
        'LabeledStatement',
        'WithStatement',
      ],
      'no-return-assign': ['error', 'except-parens'],
      'no-unused-expressions': [
        'error',
        {
          allowTaggedTemplates: true,
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
      'prefer-const': ['error', {destructuring: 'all'}],
      'no-undef': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',

      'import-x/first': 'error',
      'import-x/no-absolute-path': 'error',
      'import-x/no-anonymous-default-export': 'error',
      'import-x/no-mutable-exports': 'error',
      'import-x/no-webpack-loader-syntax': 'error',

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: 'res|next|^err|^_',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
        },
      ],
      '@typescript-eslint/no-shadow': 'error',
    },
  },

  {
    files: ['**/*.tsx'],
    plugins: {
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      'react/button-has-type': 'error',
      'react/no-array-index-key': 'error',
      'react/no-danger': 'error',
      'react/no-this-in-sfc': 'error',
      'react/no-typos': 'error',
      'react/no-unsafe': 'error',
      'react/self-closing-comp': ['error', {component: true, html: true}],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',

      ...jsxA11yPlugin.flatConfigs.recommended.rules,
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },

  eslintConfigPrettier,
];
