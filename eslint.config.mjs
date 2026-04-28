import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      },
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-console': 'warn'
    }
  },
  {
    ignores: [
      'dist/**',
      'jest.config.cjs',
      'coverage/**',
      'node_modules/**',
      'playwright.config.ts'
    ]
  }
);
