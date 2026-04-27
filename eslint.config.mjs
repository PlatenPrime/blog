// @ts-check
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.join(repoRoot, 'apps', 'api');
const apiTsFiles = ['apps/api/**/*.ts'];

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: apiTsFiles,
  })),
  eslintPluginPrettierRecommended,
  {
    files: apiTsFiles,
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: apiRoot,
      },
    },
  },
  {
    files: apiTsFiles,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
