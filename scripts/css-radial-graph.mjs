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

function parseDeclarations(text, frame) {
  for (const statement of text.split(';')) {
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

export function expandOwnerSelectors(selectorText) {
  const trimmed = selectorText.trim();
  const match = /^:(?:is|where)\(([^)]*)\)$/.exec(trimmed);
  if (match) {
    return match[1].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [trimmed];
}

const IMPORT_RE = /@import\s+["']\.\/([^"']+)["']\s+layer\(([\w-]+)\)/g;

export function pointKey(key, value) {
  return `${key}❖${value}`;
}

export function buildPointIndex(baselineBlocks) {
  const index = new Map();
  for (const block of baselineBlocks) {
    for (const owner of block.owners) {
      for (const [key, value] of block.declarations) {
        const pk = pointKey(key, value);
        if (!index.has(pk)) index.set(pk, new Set());
        index.get(pk).add(owner);
      }
    }
  }
  return index;
}

const MIN_MATCHED_POINTS = 2;

export function computeOwnership(rawBlock, pointIndex) {
  const matchedPoints = [];
  const uncoveredPoints = [];
  for (const [key, value] of rawBlock.declarations) {
    const owners = pointIndex.get(pointKey(key, value));
    if (owners && owners.size > 0) matchedPoints.push({ key, value, owners: [...owners] });
    else uncoveredPoints.push({ key, value });
  }

  const remaining = new Set(matchedPoints.map((m) => pointKey(m.key, m.value)));
  const ownerCoverage = new Map();
  for (const m of matchedPoints) {
    const pk = pointKey(m.key, m.value);
    for (const owner of m.owners) {
      if (!ownerCoverage.has(owner)) ownerCoverage.set(owner, new Set());
      ownerCoverage.get(owner).add(pk);
    }
  }

  const composition = [];
  while (remaining.size > 0) {
    let bestOwner = null;
    let bestCount = 0;
    for (const [owner, pts] of ownerCoverage) {
      const count = [...pts].filter((pt) => remaining.has(pt)).length;
      if (count > bestCount) {
        bestCount = count;
        bestOwner = owner;
      }
    }
    if (!bestOwner) break;
    const covered = [...ownerCoverage.get(bestOwner)].filter((pt) => remaining.has(pt));
    composition.push({ owner: bestOwner, matchedPointCount: covered.length });
    for (const pt of covered) remaining.delete(pt);
  }

  const knownPattern = detectKnownPattern(rawBlock.declarations);
  const covered = matchedPoints.length >= MIN_MATCHED_POINTS || knownPattern !== null;

  return { covered, knownPattern, matchedPoints, uncoveredPoints, composition };
}

function assignAngles(keys) {
  const sorted = [...keys].sort();
  return new Map(sorted.map((key, i) => [key, (i / sorted.length) * 2 * Math.PI]));
}

function assignRadii(blocksWithDeclarations, key, innerR, outerR) {
  const values = [...new Set(blocksWithDeclarations.flatMap((b) => (b.declarations.has(key) ? [b.declarations.get(key)] : [])))];
  const allNumeric = values.length > 0 && values.every((v) => v !== '' && !Number.isNaN(Number(v)));
  values.sort(allNumeric ? (a, b) => Number(a) - Number(b) : undefined);
  const radiusFor = new Map();
  values.forEach((v, i) => {
    radiusFor.set(v, values.length > 1 ? innerR + (i / (values.length - 1)) * (outerR - innerR) : (innerR + outerR) / 2);
  });
  return radiusFor;
}

export function buildModel({ rawBlocks, baselineBlocks, meta }) {
  const ownedBaselineBlocks = baselineBlocks.map((b) => ({ ...b, owners: expandOwnerSelectors(b.selector) }));
  const pointIndex = buildPointIndex(ownedBaselineBlocks);

  const allDeclaringBlocks = [...ownedBaselineBlocks, ...rawBlocks];
  const allKeys = new Set();
  for (const block of allDeclaringBlocks) for (const key of block.declarations.keys()) allKeys.add(key);
  const angleByKey = assignAngles(allKeys);

  const innerR = 80;
  const outerR = 380;
  const radiusByKey = new Map([...allKeys].map((key) => [key, assignRadii(allDeclaringBlocks, key, innerR, outerR)]));

  const toPlottedPoint = (key, value, owners) => ({
    key,
    value,
    angle: angleByKey.get(key),
    radius: radiusByKey.get(key).get(value),
    owners,
  });

  const points = [];
  const seenPoints = new Set();
  for (const block of ownedBaselineBlocks) {
    for (const [key, value] of block.declarations) {
      const pk = pointKey(key, value);
      if (seenPoints.has(pk)) continue;
      seenPoints.add(pk);
      points.push(toPlottedPoint(key, value, [...pointIndex.get(pk)]));
    }
  }

  const selectors = rawBlocks.map((block) => {
    const ownership = computeOwnership(block, pointIndex);
    return {
      file: block.file,
      selector: block.selector,
      tier: block.tier,
      covered: ownership.covered,
      knownPattern: ownership.knownPattern,
      matchedPoints: ownership.matchedPoints.map((m) => toPlottedPoint(m.key, m.value, m.owners)),
      uncoveredPoints: ownership.uncoveredPoints,
      composition: ownership.composition,
    };
  });

  return {
    keys: [...angleByKey.entries()].map(([key, angle]) => ({ key, angle })),
    points,
    selectors,
    meta: {
      generatedAt: new Date().toISOString(),
      ...meta,
      baselineRuleBlockCount: baselineBlocks.length,
      rawRuleBlockCount: rawBlocks.length,
      coveredRawRuleBlockCount: selectors.filter((s) => s.covered).length,
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
      for (const block of tokenize(text, fileName)) blocks.push({ ...block, tier });
    }
    return blocks;
  };

  return buildModel({
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
  });
}

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

export function tokenize(cssText, file) {
  const css = stripCommentsAndStrings(cssText);
  const blocks = [];
  const stack = [];
  let scanPos = 0;

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const header = css.slice(scanPos, i).trim();
      const top = stack[stack.length - 1];
      if (top && top.type === 'skip') {
        stack.push({ type: 'skip', bodyStart: i + 1 });
      } else if (header.startsWith('@')) {
        const name = header.split(/[\s({]/)[0].toLowerCase();
        stack.push(SKIP_AT_RULES.has(name) ? { type: 'skip', bodyStart: i + 1 } : { type: 'at-rule', name, bodyStart: i + 1 });
      } else {
        stack.push({ type: 'rule', selector: header, properties: new Set(), declarations: new Map(), bodyStart: i + 1 });
      }
      scanPos = i + 1;
    } else if (ch === '}') {
      const top = stack.pop();
      scanPos = i + 1;
      if (top && top.type === 'rule') {
        const body = css.slice(top.bodyStart, i);
        parseDeclarations(body, top);
        if (top.properties.size > 0) {
          blocks.push({ file, selector: top.selector, properties: top.properties, declarations: top.declarations });
        }
      }
    }
  }
  return blocks;
}

const CHART_SCRIPT = `
(function () {
  const width = 900, height = 900, cx = 0, cy = 0;
  const svg = d3.select('#chart').attr('viewBox', [-width / 2, -height / 2, width, height]);
  const toXY = (angle, radius) => [Math.cos(angle - Math.PI / 2) * radius, Math.sin(angle - Math.PI / 2) * radius];
  const lineRadial = d3.lineRadial().angle((d) => d.angle).radius((d) => d.radius);

  svg.append('g').selectAll('text').data(MODEL.keys).join('text')
    .attr('x', (d) => toXY(d.angle, 400)[0])
    .attr('y', (d) => toXY(d.angle, 400)[1])
    .attr('font-size', 11)
    .attr('text-anchor', 'middle')
    .text((d) => d.key);

  svg.append('g').selectAll('circle').data(MODEL.points).join('circle')
    .attr('cx', (d) => toXY(d.angle, d.radius)[0])
    .attr('cy', (d) => toXY(d.angle, d.radius)[1])
    .attr('r', 5)
    .attr('fill', '#1565c0')
    .append('title')
    .text((d) => d.owners.join(', ') + ': ' + d.key + ' = ' + d.value);

  const tierColor = { project: '#c62828', utilities: '#ef6c00', overrides: '#ad1457', patterns: '#6a1b9a', molecules: '#546e7a' };

  svg.append('g').selectAll('g').data(MODEL.selectors.filter((s) => s.matchedPoints.length > 0)).join('g')
    .each(function (selectorRecord) {
      const g = d3.select(this);
      const hub = [0, 0];
      selectorRecord.matchedPoints.forEach((point) => {
        const [x, y] = toXY(point.angle, point.radius);
        g.append('line')
          .attr('x1', hub[0]).attr('y1', hub[1])
          .attr('x2', x).attr('y2', y)
          .attr('stroke', selectorRecord.covered ? '#2e7d32' : (tierColor[selectorRecord.tier] || '#999'))
          .attr('stroke-width', 1.5)
          .attr('opacity', 0.6)
          .append('title')
          .text(selectorRecord.file + ' ' + selectorRecord.selector + ' -> ' + point.key + ': ' + point.value);
      });
    });

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
  const byTierThenPoints = (a, b) => (tierRank[a.tier] - tierRank[b.tier]) || (b.matchedPoints.length - a.matchedPoints.length);

  renderTable('#compositions',
    MODEL.selectors.filter((s) => s.composition.length >= 2).sort(byTierThenPoints).slice(0, 25)
      .map((s) => ({ tier: s.tier, file: s.file, selector: s.selector, composedOf: s.composition.map((c) => c.owner).join(' + ') })),
    ['tier', 'file', 'selector', 'composedOf']);

  renderTable('#known-pattern',
    MODEL.selectors.filter((s) => s.knownPattern).sort(byTierThenPoints).slice(0, 25)
      .map((s) => ({ tier: s.tier, file: s.file, selector: s.selector, knownPattern: s.knownPattern })),
    ['tier', 'file', 'selector', 'knownPattern']);

  renderTable('#uncovered',
    MODEL.selectors.filter((s) => !s.covered).sort((a, b) => b.uncoveredPoints.length - a.uncoveredPoints.length).slice(0, 25)
      .map((s) => ({ tier: s.tier, file: s.file, selector: s.selector, declaredPoints: s.matchedPoints.length + s.uncoveredPoints.length })),
    ['tier', 'file', 'selector', 'declaredPoints']);
})();
`;

const D3_SRI = 'sha256-8glLv2FBs1lyLE/kVOtsSw8OQswQzHr5IfwVj864ZTk=';

export function renderHtml(model) {
  const modelJson = JSON.stringify(model);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>CSS radial composition network</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js" integrity="${D3_SRI}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; }
  .legend { font-size: 0.9rem; color: #444; max-width: 760px; }
  table { border-collapse: collapse; margin: 1.5rem 0; font-size: 0.85rem; }
  th, td { border: 1px solid #ddd; padding: 0.25rem 0.5rem; text-align: left; }
</style>
</head>
<body>
<h1>CSS radial composition network</h1>
<p class="legend">
  The atomic unit here is the <strong>React component</strong> (Row/Column/Grid/Text), not CSS. Each point is one exact
  <code>(property, value)</code> pair declared by a primitive component's own CSS — angle is the property, radius is the
  value, so two selectors only converge on the same point when both the key <em>and</em> the value match exactly. Lines
  fan out from each raw selector to every point it declares; green lines mean that point is owned by a component. A
  selector whose lines land on two different components' points (e.g. Row's shape points and Text's typography points)
  is an undeclared composition — it should become that component nesting instead of bespoke CSS. Because
  <code>project</code>/<code>utilities</code>/<code>overrides</code> sit at higher cascade priority than
  <code>layout</code>/<code>atoms</code>/<code>base</code>, a match is a silent-override risk, not just duplication.
</p>
<svg id="chart" width="900" height="900"></svg>
<h2>Compositions (2+ owners matched)</h2>
<table id="compositions"></table>
<h2>Obvious Row/Column/Grid candidates</h2>
<table id="known-pattern"></table>
<h2>Most uncovered selectors</h2>
<table id="uncovered"></table>
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
    out: 'graphify-out/css-radial-graph.html',
    baselineLayers: ['layout', 'atoms', 'base'],
    rawLayers: ['molecules', 'patterns', 'project', 'utilities', 'overrides'],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--styling-dir') args.stylingDir = argv[++i];
    else if (arg === '--out') args.out = argv[++i];
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
