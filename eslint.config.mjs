import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import perfectionist from 'eslint-plugin-perfectionist'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig, globalIgnores } from 'eslint/config'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      'better-tailwindcss': betterTailwindcss,
      perfectionist,
      'unused-imports': unusedImports,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/app/globals.css',
      },
    },
    rules: {
      ...betterTailwindcss.configs.recommended.rules,
      // Components no longer use Tailwind utility classes (styling now comes
      // from the legacy stylesheet's classes ported into globals.css), so
      // this rule has no valid Tailwind class set left to check against.
      'better-tailwindcss/no-unregistered-classes': 'off',
      curly: ['error', 'all'],
      'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
      'no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 0.5, 0.6, 0.8, 1, 2, 200],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'perfectionist/sort-imports': [
        'error',
        {
          groups: ['external', 'internal', ['parent', 'sibling', 'index']],
          internalPattern: ['^@/', '^@features/', '^@shared/'],
          newlinesBetween: 'always',
        },
      ],
      'perfectionist/sort-interfaces': [
        'error',
        { type: 'alphabetical', groupKind: 'required-first' },
      ],
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    // Matches both a flat `constants.ts` and a topic-split `constants/<topic>.ts`
    // directory (see rules/constants.md's scope table) — both are "the file",
    // just organized differently once the literal volume warrants splitting.
    files: ['**/constants.ts', '**/constants/*.ts'],
    rules: {
      'no-magic-numbers': 'off',
      'padding-line-between-statements': 'off',
    },
  },
  {
    // The server-side Gamma PDF-injection pipeline: low-level SVG geometry and
    // pdf.js/pdf-lib measurement math where inline numeric layout literals are
    // intrinsic (like a constants file, and ported verbatim from legacy #65/#70).
    files: ['src/shared/gamma/inject/**/*.ts'],
    rules: {
      'no-magic-numbers': 'off',
    },
  },
  // Disable ESLint rules that conflict with Prettier. Keep this last.
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Frozen legacy Vercel functions, copied verbatim — not subject to this
    // project's TypeScript lint rules (migration-plan.md §1.1).
    'api/**',
  ]),
])

export default eslintConfig
