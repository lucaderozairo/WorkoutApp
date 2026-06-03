// eslint.config.js
// Architecture-enforcement ESLint config. Intentionally does NOT extend
// js/tseslint "recommended" — its sole job is to enforce the layer
// dependency boundaries and project-specific rules, not general TS hygiene.
// react-hooks is registered (rules off) only so existing inline
// `react-hooks/exhaustive-deps` disable directives resolve; enabling its
// rules is a separate follow-up.
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'eslint-fixtures/**', 'graphify-out/**', 'docs/**'] },
  tseslint.configs.base,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { boundaries, 'react-hooks': reactHooks },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    settings: {
      'boundaries/elements': [
        { type: 'tokens',         pattern: 'styling/*' },
        { type: 'primitives',     pattern: 'ui/atoms/*' },
        { type: 'primitives',     pattern: 'ui/molecules/*' },
        { type: 'layouts',        pattern: 'ui/layout/*' },
        { type: 'patterns',       pattern: 'ui/patterns/*' },
        { type: 'feature-ui',     pattern: 'ui/components/*' },
        { type: 'screens',        pattern: 'ui/screens/*' },
        { type: 'screens',        pattern: 'ui/navigation/*' },
        { type: 'feature-logic',  pattern: 'features/*', capture: ['feature'] },
        { type: 'infrastructure', pattern: 'data/*' },
        { type: 'infrastructure', pattern: 'core/*' },
        { type: 'shared',         pattern: 'shared/*' },
        { type: 'app',            pattern: 'app/*' },
      ],
      'boundaries/ignore': ['**/*.test.{ts,tsx}', '**/*.d.ts'],
    },
    rules: {},
  },
);
