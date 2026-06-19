import { describe, expect, it } from 'vitest';
import { stripCommentsAndStrings, tokenize, expandOwnerSelectors, detectKnownPattern, resolveLayerFiles, buildPointIndex, computeOwnership, pointKey, buildModel, renderHtml } from './css-radial-graph.mjs';

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

  it('does not swallow declarations into the selector of a nested rule that follows them', () => {
    const css = `.layout {
      display: grid;
      gap: var(--gap);

      .header {
        grid-area: header;
      }
    }`;
    const blocks = tokenize(css, 'layout.css');
    const layout = blocks.find((b) => b.selector === '.layout');
    const header = blocks.find((b) => b.selector === '.header');
    expect(layout.declarations.get('display')).toBe('grid');
    expect(layout.declarations.get('gap')).toBe('var(--gap)');
    expect(header.declarations.get('grid-area')).toBe('header');
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

  it('expands a whole-selector :is(...) group whose members contain their own parens', () => {
    const selector = ':is(.input, .textarea, input:not([type="checkbox"]):not([type="radio"]), select)';
    expect(expandOwnerSelectors(selector)).toEqual(['.input', '.textarea', 'input:not([type="checkbox"]):not([type="radio"])', 'select']);
  });
});

const SAMPLE_GLOBAL_CSS = `
  @import "./reset.css" layer(reset);
  @import "./tokens.css" layer(tokens);
  @import "./typography.css" layer(base);
  @import "./layout.css" layer(layout);
  @import "./surface.css" layer(atoms);
  @import "./controls.css" layer(molecules);
  @import "./patterns.css" layer(patterns);
  @import "./home-widgets.css" layer(project);
  @import "./utilities.css" layer(utilities);
  @import "./map.css" layer(overrides);
`;
const LAYERS = { baselineLayers: ['layout', 'atoms', 'base'], rawLayers: ['molecules', 'patterns', 'project', 'utilities', 'overrides'] };

function decls(obj) {
  return new Map(Object.entries(obj));
}

describe('pointKey', () => {
  it('produces a distinct key per (property, value) pair, not per property alone', () => {
    expect(pointKey('font-weight', '500')).not.toBe(pointKey('font-weight', '400'));
  });
});

describe('buildPointIndex / computeOwnership', () => {
  const baselineBlocks = [
    { owners: ['.row', '.column', '.scroll-row'], declarations: decls({ gap: 'var(--s-3)' }) },
    { owners: ['.row'], declarations: decls({ display: 'flex', 'flex-direction': 'row' }) },
    { owners: ['.column'], declarations: decls({ display: 'flex', 'flex-direction': 'column' }) },
    { owners: ['.text-detail'], declarations: decls({ 'font-size': 'var(--t-md)', 'font-weight': '500' }) },
  ];
  const pointIndex = buildPointIndex(baselineBlocks);

  it('attributes a shared declaration to every owner in an expanded :is() group', () => {
    expect(pointIndex.get(pointKey('gap', 'var(--s-3)'))).toEqual(new Set(['.row', '.column', '.scroll-row']));
  });

  it('does not match a raw declaration whose value differs from the baseline value', () => {
    const raw = { declarations: decls({ gap: 'var(--s-7)' }) };
    const result = computeOwnership(raw, pointIndex);
    expect(result.matchedPoints).toHaveLength(0);
  });

  it('identifies a composition of two owners (Row + Text) via exact-value point matches', () => {
    const raw = { declarations: decls({ display: 'flex', 'flex-direction': 'row', gap: 'var(--s-3)', 'font-size': 'var(--t-md)', 'font-weight': '500' }) };
    const result = computeOwnership(raw, pointIndex);
    expect(result.covered).toBe(true);
    const owners = result.composition.map((c) => c.owner);
    expect(owners).toContain('.row');
    expect(owners).toContain('.text-detail');
    expect(result.uncoveredPoints).toHaveLength(0);
  });

  it('does not classify a single coincidental matched point as covered', () => {
    const raw = { declarations: decls({ gap: 'var(--s-3)', cursor: 'pointer' }) };
    const result = computeOwnership(raw, pointIndex);
    expect(result.matchedPoints).toHaveLength(1);
    expect(result.covered).toBe(false);
  });

  it('classifies a block as covered via knownPattern even with zero matched points', () => {
    const raw = { declarations: decls({ display: 'flex', 'flex-direction': 'column', 'animation-delay': '200ms' }) };
    const result = computeOwnership(raw, pointIndex);
    expect(result.knownPattern).toBe('column');
    expect(result.covered).toBe(true);
  });
});

describe('renderHtml', () => {
  it('embeds the model JSON and the radial-network rendering call', () => {
    const model = buildModel({ rawBlocks: [], baselineBlocks: [], meta: { scannedFiles: [], baselineFiles: [], orphanFiles: [] } });
    const html = renderHtml(model);
    expect(html).toContain('"generatedAt"');
    expect(html).toContain('d3.lineRadial(');
  });
});

describe('buildModel', () => {
  it('assigns one angle per distinct key and places a raw composition selector with matched points', () => {
    const baselineBlocks = [
      { file: 'layout.css', selector: '.row', tier: 'layout', declarations: decls({ display: 'flex', 'flex-direction': 'row' }) },
      { file: 'typography.css', selector: '.text-detail', tier: 'base', declarations: decls({ 'font-size': 'var(--t-md)', 'font-weight': '500' }) },
    ];
    const rawBlocks = [
      {
        file: 'home-widgets.css',
        selector: '.stat-label',
        tier: 'project',
        declarations: decls({ display: 'flex', 'flex-direction': 'row', 'font-size': 'var(--t-md)', 'font-weight': '500' }),
      },
    ];
    const model = buildModel({ rawBlocks, baselineBlocks, meta: {} });

    const distinctKeys = new Set(model.keys.map((k) => k.key));
    expect(distinctKeys).toEqual(new Set(['display', 'flex-direction', 'font-size', 'font-weight']));
    expect(new Set(model.keys.map((k) => k.angle)).size).toBe(model.keys.length);

    const statLabel = model.selectors.find((s) => s.selector === '.stat-label');
    expect(statLabel.covered).toBe(true);
    expect(statLabel.matchedPoints).toHaveLength(4);
    const owners = statLabel.composition.map((c) => c.owner);
    expect(owners).toContain('.row');
    expect(owners).toContain('.text-detail');

    expect(model.meta.rawRuleBlockCount).toBe(1);
    expect(model.meta.coveredRawRuleBlockCount).toBe(1);
  });
});

describe('resolveLayerFiles', () => {
  it('classifies files into baseline, raw, and ignored per layer', () => {
    const result = resolveLayerFiles(
      SAMPLE_GLOBAL_CSS,
      ['reset.css', 'tokens.css', 'typography.css', 'layout.css', 'surface.css', 'controls.css', 'patterns.css', 'home-widgets.css', 'utilities.css', 'map.css'],
      LAYERS,
    );
    expect(result.baselineFiles.sort()).toEqual(['layout.css', 'surface.css', 'typography.css']);
    expect(result.rawFiles.sort()).toEqual(['controls.css', 'home-widgets.css', 'map.css', 'patterns.css', 'utilities.css']);
    expect(result.ignoredFiles.sort()).toEqual(['reset.css', 'tokens.css']);
  });

  it('reports files present on disk but not imported as orphans', () => {
    const result = resolveLayerFiles(SAMPLE_GLOBAL_CSS, ['layout.css', 'orphan.css'], LAYERS);
    expect(result.orphanFiles).toEqual(['orphan.css']);
  });

  it('warns and keeps the first layer when a file is imported twice under different layers', () => {
    const dup = SAMPLE_GLOBAL_CSS + `\n@import "./layout.css" layer(project);`;
    const result = resolveLayerFiles(dup, ['layout.css'], LAYERS);
    expect(result.baselineFiles).toContain('layout.css');
    expect(result.rawFiles).not.toContain('layout.css');
    expect(result.warnings.some((w) => w.includes('layout.css'))).toBe(true);
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
