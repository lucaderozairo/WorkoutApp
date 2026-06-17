// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// eslint.config.js
// Architecture-enforcement ESLint config. Sole job: enforce layer dependency
// boundaries + project rules, NOT general TS hygiene (so no js/tseslint
// "recommended"). react-hooks is registered (rules off) only so existing inline
// `react-hooks/exhaustive-deps` disable directives resolve.
//
// Layer model is CQRS-aware:
//   - core          : foundational utilities (id-generator, event bus) — importable by anything
//   - read-models   : data/projections + data/static (query/read side) — importable by UI + features
//   - data-io       : data/sources, store, repositories (write/IO side) — features only
//   - fixtures      : data/mock (dev seed data) — may import features
//   - tokens<-layout/primitives<-patterns<-feature-ui<-screens (design-system + UI tree)
//   - feature-logic : features/* (same-feature only; may use core/read-models/data-io/shared)
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';

// mode 'full' + `**`: components live as files directly inside layer folders
// (ui/atoms/Button.tsx), so the default folder-mode would mis-classify them.
const el = (type, pattern, extra = {}) => ({ type, pattern, mode: 'full', ...extra });

export default tseslint.config({
  ignores: [
    'dist/**',
    'node_modules/**',
    'eslint-fixtures/**',
    'graphify-out/**',
    'docs/**',
    '.agents/**',
    '.claude/**',
    '.codex/**',
    '.impeccable/**',
    '.playwright-mcp/**',
    '.worktrees/**',
  ],
}, tseslint.configs.base, {
  files: ['**/*.{ts,tsx}'],
  plugins: { boundaries, 'react-hooks': reactHooks },
  linterOptions: { reportUnusedDisableDirectives: 'off' },
  settings: {
    'import/resolver': { typescript: { project: './tsconfig.json' } },
    'boundaries/elements': [
      el('tokens',         'styling/**'),
      el('primitives',     'ui/atoms/**'),
      el('primitives',     'ui/molecules/**'),
      el('layouts',        'ui/layout/**'),
      el('patterns',       'ui/patterns/**'),
      el('feature-ui',     'ui/components/**'),
      el('screens',        'ui/screens/**'),
      el('screens',        'ui/navigation/**'),
      // The public type surface of a feature. Listed BEFORE feature-logic so
      // `features/<x>/contract.ts` classifies as feature-contract, not feature-logic.
      el('feature-contract', 'features/*/contract.{ts,tsx}', { capture: ['feature'] }),
      el('feature-logic',  'features/*/**', { capture: ['feature'] }),
      el('core',           'core/**'),
      el('read-models',    'data/projections/**'),
      el('read-models',    'data/static/**'),
      el('fixtures',       'data/mock/**'),
      el('data-io',        'data/sources/**'),
      el('data-io',        'data/store/**'),
      el('data-io',        'data/repositories/**'),
      el('shared',         'shared/**'),
      el('app',            'app/**'),
    ],
    'boundaries/ignore': ['**/*.test.{ts,tsx}', '**/*.d.ts'],
  },
  rules: {
    // Rules 6/7 — no inline styles. Dynamic CSS custom properties are the only
    // allowed exception (keep an eslint-disable with justification).
    'no-restricted-syntax': ['error', {
      selector: 'JSXAttribute[name.name="style"]',
      message: 'No inline styles (Rules 6/7): use CSS classes + tokens. Dynamic CSS custom properties are the only allowed exception — add an eslint-disable with justification.',
    }],
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: ['tokens'],        allow: [] },
        { from: ['core'],          allow: ['core', 'shared'] },
        { from: ['shared'],        allow: ['shared', 'core'] },
        { from: ['read-models'],   allow: ['read-models', 'data-io', 'core', 'shared'] },
        // The ViewRegistry (data/projections/views/schema.ts) is the typed seam
        // between infrastructure and feature view-models. It may reference a
        // feature's published TYPE contract only — never its runtime internals.
        { from: ['read-models'],   importKind: 'type', allow: ['read-models', 'data-io', 'core', 'shared', 'feature-contract'] },
        { from: ['data-io'],       allow: ['data-io', 'read-models', 'core', 'shared'] },
        { from: ['fixtures'],      allow: ['fixtures', 'feature-logic', 'read-models', 'data-io', 'core', 'shared'] },
        // A feature's contract re-exports its own feature's public types only.
        { from: ['feature-contract'], allow: ['core', 'read-models', 'data-io', 'shared', ['feature-logic', { feature: '${from.feature}' }], ['feature-contract', { feature: '${from.feature}' }]] },
        // feature-logic (handlers, policies, projections) imports same-feature internals.
        // Policies also cross-feature contracts for event subscriptions:
        //   - TYPE imports for payload/state types from peer feature contracts
        //   - VALUE imports for typed event-name manifest constants (e.g. TrainingLogEvents)
        { from: ['feature-logic'], allow: ['core', 'read-models', 'data-io', 'shared', ['feature-logic', { feature: '${from.feature}' }], ['feature-contract', { feature: '${from.feature}' }]] },
        { from: ['feature-logic'], importKind: 'type',  allow: ['feature-contract'] },
        { from: ['feature-logic'], importKind: 'value', allow: ['core', 'read-models', 'data-io', 'shared', ['feature-logic', { feature: '${from.feature}' }], 'feature-contract'] },
        { from: ['primitives'],    allow: ['primitives', 'layouts', 'core', 'shared'] },
        { from: ['layouts'],       allow: ['primitives', 'layouts', 'core', 'shared'] },
        { from: ['patterns'],      allow: ['primitives', 'layouts', 'patterns', 'read-models', 'core', 'shared'] },
        // feature-ui / screens consume a feature ONLY through its contract for
        // TYPE imports (Rule 4 / contract discipline). Runtime values (command
        // handlers, queries) still come from feature-logic — contract.ts is
        // type-only — so a separate importKind:'value' rule permits those.
        { from: ['feature-ui'],    allow: ['primitives', 'layouts', 'patterns', 'feature-ui', 'feature-contract', 'feature-logic', 'read-models', 'core', 'shared'] },
        { from: ['feature-ui'],    importKind: 'value', allow: ['primitives', 'layouts', 'patterns', 'feature-ui', 'feature-contract', 'feature-logic', 'read-models', 'core', 'shared'] },
        { from: ['screens'],       allow: ['primitives', 'layouts', 'patterns', 'feature-ui', 'screens', 'feature-contract', 'feature-logic', 'read-models', 'core', 'shared'] },
        { from: ['screens'],       importKind: 'value', allow: ['primitives', 'layouts', 'patterns', 'feature-ui', 'screens', 'feature-contract', 'feature-logic', 'read-models', 'core', 'shared'] },
        { from: ['app'],           allow: ['*'] },
      ],
    }],
  },
}, {
  files: ['ui/screens/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': ['error',
      {
        selector: 'JSXAttribute[name.name="style"]',
        message: 'No inline styles (Rules 6/7): use CSS classes + tokens. Dynamic CSS custom properties are the only allowed exception - add an eslint-disable with justification.',
      },
      {
        selector: 'JSXOpeningElement[name.name=/^(button|input|select|textarea)$/]',
        message: 'Screens must compose atomic controls. Use Button, Input, Select, Textarea, Checkbox, Switch, ToggleGroup, Field, or a project component.',
      },
    ],
  },
}, {
  files: ['features/**/*.ts', 'features/**/*.tsx'],
  rules: {
    // Cross-feature domain imports must go through contract.ts.
    // Own-feature internal imports must use relative paths (e.g. '../domain/types')
    // rather than absolute aliases (e.g. '@features/cardio/domain/types') to avoid
    // triggering this rule.
    // No self-exemption via `allow` is possible here — `no-restricted-imports` cannot
    // condition on the importing file's path, only on the import string itself.
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: [
            '@features/*/domain/**',
            '@features/*/commands/**',
            '@features/*/projections/**',
            '@features/*/queries/**',
            '@features/*/policies/**',
            '@features/*/events/**',
          ],
          message: 'Cross-feature imports must go through contract.ts only. Import from @features/<name>/contract instead.',
        },
      ],
    }],
  },
}, storybook.configs["flat/recommended"]);
