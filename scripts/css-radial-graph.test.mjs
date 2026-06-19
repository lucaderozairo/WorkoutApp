import { describe, expect, it } from 'vitest';
import { stripCommentsAndStrings, tokenize, expandOwnerSelectors, detectKnownPattern } from './css-radial-graph.mjs';

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

describe('expandOwnerSelectors', () => {
  it('expands a whole-selector :is(...) group into its member selectors', () => {
    expect(expandOwnerSelectors(':is(.row, .column, .scroll-row)')).toEqual(['.row', '.column', '.scroll-row']);
  });

  it('expands :where(...) the same way', () => {
    expect(expandOwnerSelectors(':where(.a, .b)')).toEqual(['.a', '.b']);
  });

  it('treats a plain selector as a single owner', () => {
    expect(expandOwnerSelectors('.row')).toEqual(['.row']);
  });

  it('does not expand a compound selector with an embedded :is(...) (out of scope)', () => {
    expect(expandOwnerSelectors('.foo :is(.row, .column) .bar')).toEqual(['.foo :is(.row, .column) .bar']);
  });
});

describe('detectKnownPattern', () => {
  it('detects row from bare display:flex with no flex-direction', () => {
    expect(detectKnownPattern(new Map([['display', 'flex']]))).toBe('row');
  });
  it('detects row from flex-direction: row-reverse', () => {
    expect(detectKnownPattern(new Map([['display', 'flex'], ['flex-direction', 'row-reverse']]))).toBe('row');
  });
  it('detects column from flex-direction: column', () => {
    expect(detectKnownPattern(new Map([['display', 'flex'], ['flex-direction', 'column']]))).toBe('column');
  });
  it('detects grid from display:grid and display:inline-grid', () => {
    expect(detectKnownPattern(new Map([['display', 'grid']]))).toBe('grid');
    expect(detectKnownPattern(new Map([['display', 'inline-grid']]))).toBe('grid');
  });
  it('returns null when there is no display key', () => {
    expect(detectKnownPattern(new Map([['color', 'red']]))).toBeNull();
  });
});
