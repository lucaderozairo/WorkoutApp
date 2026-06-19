#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP_AT_RULES = new Set(['@property', '@keyframes', '@font-face']);

export function stripCommentsAndStrings(css) {
  let result = css.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
  result = result.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, (m) => ' '.repeat(m.length));
  return result;
}

export function detectKnownPattern(declarations) {
  const display = declarations.get('display');
  if (display === 'flex') {
    const direction = declarations.get('flex-direction');
    if (!direction || direction === 'row' || direction === 'row-reverse') return 'row';
    if (direction === 'column' || direction === 'column-reverse') return 'column';
    return null;
  }
  if (display === 'grid' || display === 'inline-grid') return 'grid';
  return null;
}

const IMPORT_RE = /@import\s+["']\.\/([^"']+)["']\s+layer\(([\w-]+)\)/g;

export function resolveLayerFiles(globalCssText, allFiles, { baselineLayers, rawLayers }) {
  const fileLayer = new Map();
  const warnings = [];
  let match;
  IMPORT_RE.lastIndex = 0;
  while ((match = IMPORT_RE.exec(globalCssText))) {
    const [, fileName, layer] = match;
    if (fileLayer.has(fileName)) {
      warnings.push(`${fileName} imported under multiple layers: ${fileLayer.get(fileName)}, ${layer}`);
      continue;
    }
    fileLayer.set(fileName, layer);
  }

  const baselineFiles = [];
  const rawFiles = [];
  const ignoredFiles = [];
  for (const [fileName, layer] of fileLayer) {
    if (baselineLayers.includes(layer)) baselineFiles.push(fileName);
    else if (rawLayers.includes(layer)) rawFiles.push(fileName);
    else ignoredFiles.push(fileName);
  }

  const imported = new Set(fileLayer.keys());
  const orphanFiles = allFiles.filter((f) => !imported.has(f));

  return { baselineFiles, rawFiles, ignoredFiles, orphanFiles, fileLayer, warnings };
}

export function isSubset(a, b) {
  for (const key of a) if (!b.has(key)) return false;
  return true;
}

function intersect(a, b) {
  const out = new Set();
  for (const key of a) if (b.has(key)) out.add(key);
  return out;
}

function findCompositeMatch(rawProperties, baselineBlocks) {
  for (const b1 of baselineBlocks) {
    const r1 = intersect(rawProperties, b1.properties);
    if (r1.size === 0) continue;
    for (const b2 of baselineBlocks) {
      if (b2.tier === b1.tier) continue;
      const r2 = intersect(rawProperties, b2.properties);
      if (r2.size === 0) continue;
      const union = new Set([...r1, ...r2]);
      if (union.size === rawProperties.size) {
        return {
          parts: [
            { baseline: { file: b1.file, selector: b1.selector }, matchedKeys: [...r1] },
            { baseline: { file: b2.file, selector: b2.selector }, matchedKeys: [...r2] },
          ],
          uncoveredKeys: [],
        };
      }
    }
  }
  return null;
}

const MIN_COVERAGE_SIZE = 3;
const NEAR_EXACT_THRESHOLD = 0.8;

export function computeCoverage(rawBlock, baselineBlocks) {
  const R = rawBlock.properties;
  const knownPattern = detectKnownPattern(rawBlock.declarations);

  let coveredBySubset = false;
  let overlapRatio = 0;
  let coveringBaseline = null;
  if (R.size >= MIN_COVERAGE_SIZE) {
    for (const baseline of baselineBlocks) {
      if (!isSubset(R, baseline.properties)) continue;
      coveredBySubset = true;
      const ratio = R.size / baseline.properties.size;
      if (ratio > overlapRatio) {
        overlapRatio = ratio;
        coveringBaseline = baseline;
      }
    }
  }

  const compositeMatch = coveredBySubset ? null : findCompositeMatch(R, baselineBlocks);
  const nearExact = overlapRatio >= NEAR_EXACT_THRESHOLD;
  const covered = coveredBySubset || compositeMatch !== null || knownPattern !== null;

  return {
    covered,
    coveredBySubset,
    overlapRatio,
    nearExact,
    coveringBaseline: coveringBaseline
      ? { file: coveringBaseline.file, selector: coveringBaseline.selector, overlapRatio, nearExact }
      : null,
    compositeMatch,
    knownPattern,
  };
}

const MIN_OCCURRENCE_DEFAULT = 2;
const MAX_PROPERTIES_DEFAULT = 40;

export function buildModel({ rawBlocks, baselineBlocks, meta }, options = {}) {
  const minOccurrence = options.minOccurrence ?? MIN_OCCURRENCE_DEFAULT;
  const maxProperties = options.maxProperties ?? MAX_PROPERTIES_DEFAULT;

  const enrichedRawBlocks = rawBlocks.map((rawBlock) => ({
    ...rawBlock,
    properties: [...rawBlock.properties],
    ...computeCoverage(rawBlock, baselineBlocks),
  }));

  const propertyCounts = new Map();
  for (const block of enrichedRawBlocks) {
    for (const key of block.properties) {
      propertyCounts.set(key, (propertyCounts.get(key) ?? 0) + 1);
    }
  }

  const properties = [...propertyCounts.entries()]
    .filter(([, count]) => count >= minOccurrence)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxProperties)
    .map(([key, count]) => ({ key, count }));
  const index = new Map(properties.map((p, i) => [p.key, i]));

  const n = properties.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  const pairCoverage = new Map();

  for (const block of enrichedRawBlocks) {
    const keys = block.properties.filter((k) => index.has(k));
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const [a, b] = [keys[i], keys[j]].sort();
        const ia = index.get(a);
        const ib = index.get(b);
        matrix[ia][ib] += 1;
        matrix[ib][ia] += 1;

        const pairKey = `${a}|${b}`;
        const existing = pairCoverage.get(pairKey) ?? {
          a,
          b,
          count: 0,
          covered: false,
          coveringBaseline: null,
          exampleRawRule: { file: block.file, selector: block.selector },
        };
        existing.count += 1;
        if (block.covered) {
          existing.covered = true;
          if (!existing.coveringBaseline && block.coveringBaseline) {
            existing.coveringBaseline = block.coveringBaseline;
          }
        }
        pairCoverage.set(pairKey, existing);
      }
    }
  }

  return {
    properties,
    matrix,
    pairCoverage: [...pairCoverage.values()],
    rawBlocks: enrichedRawBlocks,
    meta: {
      generatedAt: new Date().toISOString(),
      ...meta,
      totalRuleBlocks: rawBlocks.length + baselineBlocks.length,
      totalPropertyKeys: properties.length,
      baselineRuleBlockCount: baselineBlocks.length,
      rawRuleBlockCount: rawBlocks.length,
      coveredRawRuleBlockCount: enrichedRawBlocks.filter((b) => b.covered).length,
    },
  };
}

export function buildModelFromDir(stylingDir, options = {}) {
  const baselineLayers = options.baselineLayers ?? ['layout', 'atoms', 'base'];
  const rawLayers = options.rawLayers ?? ['molecules', 'patterns', 'project', 'utilities', 'overrides'];

  const allFiles = readdirSync(stylingDir).filter((f) => f.endsWith('.css'));
  const globalCssText = readFileSync(path.join(stylingDir, 'global.css'), 'utf8');
  const layerResult = resolveLayerFiles(globalCssText, allFiles, { baselineLayers, rawLayers });

  const collect = (fileNames) => {
    const blocks = [];
    for (const fileName of fileNames) {
      const text = readFileSync(path.join(stylingDir, fileName), 'utf8');
      const tier = layerResult.fileLayer.get(fileName);
      for (const rawBlock of tokenize(text, fileName)) {
        blocks.push({ ...rawBlock, tier });
      }
    }
    return blocks;
  };

  return buildModel(
    {
      rawBlocks: collect(layerResult.rawFiles),
      baselineBlocks: collect(layerResult.baselineFiles),
      meta: {
        scannedFiles: allFiles,
        rawFiles: layerResult.rawFiles,
        baselineFiles: layerResult.baselineFiles,
        ignoredFiles: layerResult.ignoredFiles,
        orphanFiles: layerResult.orphanFiles,
        layerWarnings: layerResult.warnings,
      },
    },
    options,
  );
}

function parseDeclarations(text, frame) {
  const decls = text.split(';');
  for (const statement of decls) {
    const idx = statement.indexOf(':');
    if (idx === -1) continue;
    const rawKey = statement.slice(0, idx).trim();
    if (!/^[\w-]+$/.test(rawKey) || rawKey.startsWith('--')) continue;
    const key = rawKey.toLowerCase();
    const value = statement.slice(idx + 1).trim();
    frame.properties.add(key);
    frame.declarations.set(key, value);
  }
}

export function tokenize(cssText, file) {
  const css = stripCommentsAndStrings(cssText);
  const blocks = [];
  const stack = [];
  let headerStart = 0;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const header = css.slice(headerStart, i).trim();
      const top = stack[stack.length - 1];
      // When inside a rule body, the selector starts after the last ';'
      // (which terminates preceding declarations before a nested rule)
      const lastSemi = header.lastIndexOf(';');
      const cleanHeader = lastSemi >= 0 ? header.slice(lastSemi + 1).trim() : header;

      if (top && top.type === 'skip') {
        stack.push({ type: 'skip' });
      } else if (cleanHeader.startsWith('@')) {
        const name = cleanHeader.split(/[\s({]/)[0].toLowerCase();
        stack.push(SKIP_AT_RULES.has(name) ? { type: 'skip' } : { type: 'at-rule' });
      } else {
        stack.push({ type: 'rule', selector: cleanHeader, properties: new Set(), declarations: new Map(), bodyStart: i + 1 });
      }
      headerStart = i + 1;
    } else if (ch === '}') {
      const frame = stack.pop();
      headerStart = i + 1;
      if (frame && frame.type === 'rule') {
        const body = css.slice(frame.bodyStart, i);
        parseDeclarations(body, frame);
        if (frame.properties.size > 0) {
          blocks.push({ file, selector: frame.selector, properties: frame.properties, declarations: frame.declarations });
        }
      }
    }
  }
  return blocks;
}

const CHART_SCRIPT = `
(function () {
  const props = MODEL.properties;
  const color = d3.scaleOrdinal(d3.schemeTableau10.concat(d3.schemeSet3));
  const width = 900, height = 900, outerR = Math.min(width, height) * 0.5 - 60, innerR = outerR - 20;

  const chord = d3.chord().padAngle(0.02).sortSubgroups(d3.descending);
  const chords = chord(MODEL.matrix);
  const arcGen = d3.arc().innerRadius(innerR).outerRadius(outerR);
  const ribbonGen = d3.ribbon().radius(innerR);

  const svg = d3.select('#chart').attr('viewBox', [-width / 2, -height / 2, width, height]);

  const pairCoverageByIndex = new Map();
  for (const pc of MODEL.pairCoverage) {
    const ia = props.findIndex((p) => p.key === pc.a);
    const ib = props.findIndex((p) => p.key === pc.b);
    pairCoverageByIndex.set(ia + '-' + ib, pc);
    pairCoverageByIndex.set(ib + '-' + ia, pc);
  }

  const tooltip = d3.select('#tooltip');
  function showTooltip(html, event) {
    tooltip.style('display', 'block').style('left', event.pageX + 10 + 'px').style('top', event.pageY + 10 + 'px').html(html);
  }
  function hideTooltip() { tooltip.style('display', 'none'); }

  svg.append('g').selectAll('path').data(chords).join('path')
    .attr('d', ribbonGen)
    .attr('fill', (d) => {
      const pc = pairCoverageByIndex.get(d.source.index + '-' + d.target.index);
      return pc && pc.covered ? '#2e7d32' : '#9e9e9e';
    })
    .attr('opacity', 0.75)
    .on('mouseover', (event, d) => {
      const pc = pairCoverageByIndex.get(d.source.index + '-' + d.target.index);
      showTooltip(pc ? pc.a + ' + ' + pc.b + '<br/>count: ' + pc.count + '<br/>covered: ' + pc.covered : '', event);
    })
    .on('mouseout', hideTooltip);

  svg.append('g').selectAll('path').data(chords.groups).join('path')
    .attr('d', arcGen)
    .attr('fill', (d) => color(props[d.index].key))
    .on('mouseover', (event, d) => showTooltip(props[d.index].key + '<br/>count: ' + props[d.index].count, event))
    .on('mouseout', hideTooltip);

  function renderTable(id, rows, columns) {
    const table = d3.select(id);
    const header = table.append('thead').append('tr');
    columns.forEach((c) => header.append('th').text(c));
    const tbody = table.append('tbody');
    rows.forEach((row) => {
      const tr = tbody.append('tr');
      columns.forEach((c) => tr.append('td').text(row[c] ?? ''));
    });
  }

  const tierRank = { project: 0, utilities: 1, overrides: 2, patterns: 3, molecules: 4 };
  const byTierThenCount = (a, b) => (tierRank[a.tier] - tierRank[b.tier]) || ((b.count ?? 0) - (a.count ?? 0));

  renderTable('#uncovered-pairs', MODEL.pairCoverage.filter((p) => !p.covered).sort((a, b) => b.count - a.count).slice(0, 25), ['a', 'b', 'count']);
  renderTable('#covered-pairs', MODEL.pairCoverage.filter((p) => p.covered).sort((a, b) => b.count - a.count).slice(0, 25), ['a', 'b', 'count']);
  renderTable('#near-exact', MODEL.rawBlocks.filter((b) => b.covered && b.nearExact).sort(byTierThenCount).slice(0, 25)
    .map((b) => ({ tier: b.tier, file: b.file, selector: b.selector, overlapRatio: b.overlapRatio.toFixed(2) })), ['tier', 'file', 'selector', 'overlapRatio']);
  renderTable('#composite', MODEL.rawBlocks.filter((b) => b.compositeMatch).sort(byTierThenCount).slice(0, 25)
    .map((b) => ({ tier: b.tier, file: b.file, selector: b.selector, parts: b.compositeMatch.parts.map((p) => p.baseline.selector).join(' + ') })), ['tier', 'file', 'selector', 'parts']);
  renderTable('#known-pattern', MODEL.rawBlocks.filter((b) => b.knownPattern).sort(byTierThenCount).slice(0, 25)
    .map((b) => ({ tier: b.tier, file: b.file, selector: b.selector, knownPattern: b.knownPattern })), ['tier', 'file', 'selector', 'knownPattern']);
})();
`;

export function renderHtml(model) {
  const modelJson = JSON.stringify(model);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>CSS property co-occurrence — component coverage</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js" integrity="sha512-vc58qvvBdrDR4etbxMdlTt4GBQk1qjvyORR2nrsPsFPyrs+/u5c3+1Ct6upOgdZoIl7eq6k3a1UPDSNAQi/32A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; }
  .legend { font-size: 0.9rem; color: #444; max-width: 720px; }
  table { border-collapse: collapse; margin: 1.5rem 0; font-size: 0.85rem; }
  th, td { border: 1px solid #ddd; padding: 0.25rem 0.5rem; text-align: left; }
  .tooltip { position: absolute; pointer-events: none; background: #222; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
</style>
</head>
<body>
<h1>CSS property co-occurrence</h1>
<p class="legend">
  The atomic unit here is the <strong>React component</strong> (Row/Column/Grid/Text), not CSS. Green means a primitive
  component's own CSS already produces this property shape — the matching raw selector should likely become that
  component instead of bespoke CSS. Grey means no component shape matches. Because <code>project</code>/<code>utilities</code>/
  <code>overrides</code> sit at higher cascade priority than <code>layout</code>/<code>atoms</code>/<code>base</code>, a shape
  match is a silent-override risk, not just duplication.
</p>
<svg id="chart" width="900" height="900"></svg>
<div id="tooltip" class="tooltip" style="display:none;"></div>
<h2>Top uncovered pairs</h2>
<table id="uncovered-pairs"></table>
<h2>Top covered pairs</h2>
<table id="covered-pairs"></table>
<h2>Most primitive-looking raw blocks</h2>
<table id="near-exact"></table>
<h2>Composite candidates (layout + atom)</h2>
<table id="composite"></table>
<h2>Obvious Row/Column/Grid candidates</h2>
<table id="known-pattern"></table>
<script>
const MODEL = ${modelJson};
${CHART_SCRIPT}
</script>
</body>
</html>`;
}

function parseArgs(argv) {
  const args = {
    stylingDir: 'styling',
    out: 'graphify-out/css-chord-graph.html',
    minOccurrence: 2,
    maxProperties: 40,
    baselineLayers: ['layout', 'atoms', 'base'],
    rawLayers: ['molecules', 'patterns', 'project', 'utilities', 'overrides'],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--styling-dir') args.stylingDir = argv[++i];
    else if (arg === '--out') args.out = argv[++i];
    else if (arg === '--min-occurrence') args.minOccurrence = Number(argv[++i]);
    else if (arg === '--max-properties') args.maxProperties = Number(argv[++i]);
    else if (arg === '--baseline-layers') args.baselineLayers = argv[++i].split(',');
    else if (arg === '--raw-layers') args.rawLayers = argv[++i].split(',');
  }
  return args;
}

export function runCli(argv) {
  const args = parseArgs(argv);
  const model = buildModelFromDir(args.stylingDir, args);
  const html = renderHtml(model);
  mkdirSync(path.dirname(args.out), { recursive: true });
  writeFileSync(args.out, html);
  console.log(`Wrote ${args.out} (${model.meta.rawRuleBlockCount} raw blocks, ${model.meta.coveredRawRuleBlockCount} covered)`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli(process.argv.slice(2));
}
