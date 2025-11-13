import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import json from 'eslint-plugin-json';
import markdown from '@eslint/markdown';

export default defineConfig([
  {
    files: ['**/*.js'],
    plugins: {
      js,
    },
    extends: ['js/recommended'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.json'],
    ...json.configs['recommended'],
    rules: {
      'json/*': ['error', 'allowComments'],
    },
  },
  {
    files: ['**/*.md'],
    plugins: {
      markdown,
    },
    extends: ['markdown/recommended'],
  },
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/*.d.ts',
      '**/*.config.js',
      '**/.next/',
      '**/tsconfig.json',
    ],
  },
]);
