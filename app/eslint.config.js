import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Contenido como código: cada archivo exporta metadata (objeto) + componente
    // a propósito (ver content/errores/index.ts). Rompe Fast Refresh pero es
    // arquitectura deliberada, no un code smell.
    files: ['src/content/errores/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
