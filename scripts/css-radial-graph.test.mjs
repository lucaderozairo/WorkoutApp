import { describe, expect, it } from 'vitest';
import { stripCommentsAndStrings, tokenize } from './css-radial-graph.mjs';

describe('stripCommentsAndStrings', () => {
  it('masks comments and string literals without changing length', () => {
    const css = `.a { content: "{ not a brace }"; color: red; } /* comment { } */`;
    const out = stripCommentsAndStrings(css);
    expect(out).not.toContain('{ not a brace }');
    expect(out.length).toBe(css.length);
  });
});

describe('tokenize', () => {
  it('captures property keys and values, scoped to one block, with no parent leakage', () => {
    const css = `.card { padding: var(--s-3); @media (min-width: 600px) { .card-inner { padding: var(--s-4); } } }`;
    const blocks = tokenize(css, 'molecules.css');
    const card = blocks.find((b) => b.selector === '.card');
    const inner = blocks.find((b) => b.selector === '.card-inner');
    expect(card.declarations.get('padding')).toBe('var(--s-3)');
    expect(inner.declarations.get('padding')).toBe('var(--s-4)');
  });

  it('skips @property, @keyframes, and @font-face entirely', () => {
    const css = `
      @property --foo { syntax: "<color>"; inherits: false; initial-value: red; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @font-face { font-family: "Foo"; src: url(foo.woff2); }
      .real { display: flex; }
    `;
    const blocks = tokenize(css, 'tokens.css');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].selector).toBe('.real');
  });

  it('does not desync brace depth on a string value containing braces or colons', () => {
    const css = `.weird::before { content: "a: b; c { d }"; } .after { display: flex; }`;
    const blocks = tokenize(css, 'patterns.css');
    expect(blocks.find((b) => b.selector === '.after').declarations.get('display')).toBe('flex');
  });

  it('keeps a literal :is(...) selector intact for later owner expansion', () => {
    const css = `:is(.row, .column, .scroll-row) { gap: var(--s-3); }`;
    const blocks = tokenize(css, 'layout.css');
    expect(blocks[0].selector).toBe(':is(.row, .column, .scroll-row)');
    expect(blocks[0].declarations.get('gap')).toBe('var(--s-3)');
  });
});
