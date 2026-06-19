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
