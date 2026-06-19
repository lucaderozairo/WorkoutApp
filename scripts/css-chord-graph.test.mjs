import { describe, expect, it } from 'vitest';
import { stripCommentsAndStrings, tokenize, detectKnownPattern, resolveLayerFiles, computeCoverage, isSubset, buildModel, renderHtml } from './css-chord-graph.mjs';

describe('stripCommentsAndStrings', () => {
  it('masks comments and string literals without changing length', () => {
    const css = `.a { content: "{ not a brace }"; color: red; } /* comment { } */`;
    const out = stripCommentsAndStrings(css);
    expect(out).not.toContain('{ not a brace }');
    expect(out.length).toBe(css.length);
  });
});

describe('tokenize', () => {
  it('emits independent property sets for nested & blocks', () => {
    const css = `.row { display: flex; & .compact { gap: var(--s-1); } }`;
    const blocks = tokenize(css, 'layout.css');
    const row = blocks.find((b) => b.selector === '.row');
    const nested = blocks.find((b) => b.selector === '& .compact');
    expect([...row.properties]).toEqual(['display']);
    expect([...nested.properties]).toEqual(['gap']);
  });

  it('does not leak nested @media declarations into the parent block', () => {
    const css = `.card { padding: var(--s-3); @media (min-width: 600px) { .card-inner { padding: var(--s-4); } } }`;
    const blocks = tokenize(css, 'molecules.css');
    const card = blocks.find((b) => b.selector === '.card');
    const inner = blocks.find((b) => b.selector === '.card-inner');
    expect([...card.properties]).toEqual(['padding']);
    expect([...inner.properties]).toEqual(['padding']);
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

  it('keeps vendor-prefixed properties distinct from the unprefixed key', () => {
    const css = `.box { -webkit-mask-image: url(x); mask-image: url(x); }`;
    const blocks = tokenize(css, 'media.css');
    expect([...blocks[0].properties].sort()).toEqual(['-webkit-mask-image', 'mask-image']);
  });

  it('handles @supports and @container wrapping a rule, and nested inside a rule', () => {
    const css = `
      @supports (gap: 1px) { .grid { display: grid; } }
      .panel { display: block; @container (min-width: 400px) { & { display: grid; } } }
    `;
    const blocks = tokenize(css, 'patterns.css');
    expect(blocks.find((b) => b.selector === '.grid')).toBeTruthy();
    expect(blocks.find((b) => b.selector === '.panel').properties.has('display')).toBe(true);
  });

  it('does not desync brace depth on a string value containing braces or colons', () => {
    const css = `.weird::before { content: "a: b; c { d }"; } .after { display: flex; }`;
    const blocks = tokenize(css, 'patterns.css');
    expect(blocks.find((b) => b.selector === '.after').properties.has('display')).toBe(true);
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
  it('still detects column alongside unrelated typography properties', () => {
    const decls = new Map([['display', 'flex'], ['flex-direction', 'column'], ['font-size', 'var(--t-lg)']]);
    expect(detectKnownPattern(decls)).toBe('column');
  });
  it('returns null when there is no display key', () => {
    expect(detectKnownPattern(new Map([['color', 'red']]))).toBeNull();
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
const LAYERS = {
  baselineLayers: ['layout', 'atoms', 'base'],
  rawLayers: ['molecules', 'patterns', 'project', 'utilities', 'overrides'],
};

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

function block(props, decls = {}) {
  return { properties: new Set(props), declarations: new Map(Object.entries(decls)) };
}
function baselineBlock(file, selector, props, tier) {
  return { file, selector, tier, properties: new Set(props) };
}

describe('isSubset', () => {
  it('returns true only when every key of a is in b', () => {
    expect(isSubset(new Set(['x']), new Set(['x', 'y']))).toBe(true);
    expect(isSubset(new Set(['x', 'z']), new Set(['x', 'y']))).toBe(false);
  });
});

describe('computeCoverage', () => {
  const baselineBlocks = [
    baselineBlock('layout.css', '.row', ['display', 'flex-direction', 'gap'], 'layout'),
    baselineBlock('layout.css', '.grid-center', ['display', 'place-items'], 'layout'),
    baselineBlock('typography.css', '.muted', ['color'], 'base'),
  ];

  it('does not classify a raw block under the size-3 gate as covered, even if it is a literal subset', () => {
    const result = computeCoverage(block(['display', 'gap']), baselineBlocks);
    expect(result.coveredBySubset).toBe(false);
    expect(result.covered).toBe(false);
  });

  it('marks a 3+-key raw block with overlap >= 0.8 as nearExact', () => {
    const result = computeCoverage(block(['display', 'flex-direction', 'gap']), baselineBlocks);
    expect(result.coveredBySubset).toBe(true);
    expect(result.nearExact).toBe(true);
  });

  it('finds a 2-part composite match for the route-preview-empty worked example', () => {
    const raw = block(['display', 'place-items', 'color'], { display: 'grid' });
    const result = computeCoverage(raw, baselineBlocks);
    expect(result.coveredBySubset).toBe(false);
    expect(result.compositeMatch).not.toBeNull();
    expect(result.compositeMatch.uncoveredKeys).toEqual([]);
    expect(result.covered).toBe(true);
  });

  it('classifies a block as covered via knownPattern even when no baseline block matches', () => {
    const raw = block(['display', 'flex-direction', 'animation-delay'], { display: 'flex', 'flex-direction': 'column' });
    const result = computeCoverage(raw, baselineBlocks);
    expect(result.knownPattern).toBe('column');
    expect(result.covered).toBe(true);
  });
});

describe('buildModel', () => {
  it('builds a symmetric co-occurrence matrix and marks covered pairs from a covered block', () => {
    const baselineBlocks = [
      { file: 'layout.css', selector: '.row', tier: 'layout', properties: new Set(['display', 'flex-direction', 'gap']) },
    ];
    const rawBlocks = [
      {
        file: 'home-widgets.css',
        selector: '.stat-row',
        tier: 'project',
        properties: new Set(['display', 'flex-direction', 'gap']),
        declarations: new Map([['display', 'flex'], ['flex-direction', 'row']]),
      },
      {
        file: 'route-planner.css',
        selector: '.weird',
        tier: 'project',
        properties: new Set(['color', 'cursor']),
        declarations: new Map([['color', 'red']]),
      },
    ];
    const model = buildModel({ rawBlocks, baselineBlocks, meta: {} }, { minOccurrence: 1 });

    expect(model.matrix.length).toBe(model.properties.length);
    const displayIdx = model.properties.findIndex((p) => p.key === 'display');
    const gapIdx = model.properties.findIndex((p) => p.key === 'gap');
    expect(model.matrix[displayIdx][gapIdx]).toBe(model.matrix[gapIdx][displayIdx]);
    expect(model.matrix[displayIdx][gapIdx]).toBe(1);

    const pair = model.pairCoverage.find(
      (p) => (p.a === 'display' && p.b === 'flex-direction') || (p.a === 'flex-direction' && p.b === 'display'),
    );
    expect(pair.covered).toBe(true);

    expect(model.meta.rawRuleBlockCount).toBe(2);
    expect(model.meta.coveredRawRuleBlockCount).toBe(1);
  });
});

describe('renderHtml', () => {
  it('embeds the model JSON, d3.chord usage, and metadata', () => {
    const model = buildModel({
      rawBlocks: [],
      baselineBlocks: [],
      meta: { scannedFiles: [], baselineFiles: [], orphanFiles: [] },
    });
    const html = renderHtml(model);
    expect(html).toContain('d3.chord(');
    expect(html).toContain('"generatedAt"');
    expect(html).toContain('"baselineFiles"');
  });
});
