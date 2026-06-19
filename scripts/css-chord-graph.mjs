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
