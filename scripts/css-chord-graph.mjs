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
