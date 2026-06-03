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

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'eslint-fixtures/**', 'graphify-out/**', 'docs/**'] },
  tseslint.configs.base,
  {
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
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: ['tokens'],        allow: [] },
          { from: ['core'],          allow: ['core', 'shared'] },
          { from: ['shared'],        allow: ['shared', 'core'] },
          { from: ['read-models'],   allow: ['read-models', 'data-io', 'core', 'shared'] },
          { from: ['data-io'],       allow: ['data-io', 'read-models', 'core', 'shared'] },
          { from: ['fixtures'],      allow: ['fixtures', 'feature-logic', 'read-models', 'data-io', 'core', 'shared'] },
          { from: ['feature-logic'], allow: ['core', 'read-models', 'data-io', 'shared', ['feature-logic', { feature: '${from.feature}' }]] },
          { from: ['primitives'],    allow: ['primitives', 'layouts', 'core', 'shared'] },
          { from: ['layouts'],       allow: ['primitives', 'layouts', 'core', 'shared'] },
          { from: ['patterns'],      allow: ['primitives', 'layouts', 'patterns', 'read-models', 'core', 'shared'] },
          { from: ['feature-ui'],    allow: ['primitives', 'layouts', 'patterns', 'feature-ui', 'feature-logic', 'read-models', 'core', 'shared'] },
          { from: ['screens'],       allow: ['primitives', 'layouts', 'patterns', 'feature-ui', 'screens', 'feature-logic', 'read-models', 'core', 'shared'] },
          { from: ['app'],           allow: ['*'] },
        ],
      }],
    },
  },
);
