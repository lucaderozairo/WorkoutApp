// stylelint.config.js
// Token-discipline enforcement (Rules 5/6/7): visual values must reference design
// tokens (var(--…)) rather than hardcoded literals.
//
// Intentionally does NOT extend stylelint-config-standard — this config's sole job
// is token discipline, not general CSS formatting conventions (which the project
// does not follow). tokens.css / themes / reset are exempt: they are where literal
// values are legitimately defined.
export default {
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/', 'background-color', 'fill', 'stroke',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'gap', 'row-gap', 'column-gap',
        'border-radius', 'box-shadow', 'font-size', 'z-index',
      ],
      {
        ignoreValues: [
          'transparent', 'inherit', 'currentColor', 'currentcolor', 'none',
          'unset', 'initial', 'auto', '0', 'fit-content', 'max-content', 'min-content',
        ],
        severity: 'error',
        disableFix: true,
        message: 'Use a design token (var(--…)) instead of a hardcoded value (Rules 5/6/7).',
      },
    ],
  },
  ignoreFiles: ['dist/**', 'node_modules/**', 'styling/tokens.css', 'styling/themes/**', 'styling/reset.css'],
};
