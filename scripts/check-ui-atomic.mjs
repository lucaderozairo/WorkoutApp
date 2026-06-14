#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_ROOTS = ['ui/screens', 'ui/components'];
const BASELINE_PATH = 'scripts/ui-atomic-baseline.json';
const VERSION = 1;

const RAW_CONTROL = /<(button|input|select|textarea)\b/g;
const RAW_OVERLAY_PATTERNS = [
  { test: /\bmodal-overlay\b/, suggestion: 'Use Modal or Dialog from @ui/molecules.' },
  { test: /\boverlay-backdrop\b/, suggestion: 'Use Modal, Dialog, ActionSheet, or Popover from @ui/molecules.' },
  { test: /className=(?:"[^"]*\bdropdown\b[^"]*"|`[^`]*\bdropdown\b[^`]*`|\{`[^`]*\bdropdown\b[^`]*`\})/, suggestion: 'Use Popover or FloatingPanel instead of a custom dropdown shell.' },
];
const LAYERING_CLASS = /className=(?:"[^"]*\b(?:absolute|relative)\b[^"]*"|`[^`]*\b(?:absolute|relative)\b[^`]*`|\{`[^`]*\b(?:absolute|relative)\b[^`]*`\})/;
const SCREEN_CLASS = /className=(?:"([^"]+)"|`([^`]+)`|\{`([^`]+)`\})/g;
const SCREEN_CLASS_ALLOW = new Set([
  'row', 'column', 'cluster', 'grid', 'surface', 'button', 'primary', 'secondary', 'ghost',
  'destructive', 'badge', 'chip', 'pill', 'tabs', 'tab', 'caption', 'label', 'value',
  'mono', 'muted', 'faint', 'good', 'warning', 'bad', 'ok', 'active', 'selected',
  'small', 'sm', 'lg', 'icon', 'block', 'flush', 'center', 'centered', 'between',
  'start', 'end', 'wrap', 'nowrap', 'scroll', 'scroll-y', 'min-w-0', 'shrink-0', 'self-fill',
  'h-full', 'w-full', 'clip', 'desktop-only', 'mobile-only', 'pad-sm', 'pad-xs',
  'pad-none', 'gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'align-center',
  'align-start', 'align-end', 'justify-center', 'justify-between', 'justify-end',
  'justify-start',
]);

const CATEGORY_MESSAGE = {
  'raw-control': 'Raw control bypasses the atomic control layer.',
  'raw-overlay': 'Raw overlay bypasses the official top-layer or floating UI APIs.',
  'ad-hoc-layering': 'Manual positioning bypasses Layered/Layer floating composition.',
  'inline-style': 'Inline style bypasses tokenized CSS, except documented CSS custom properties.',
  'screen-visual-class': 'Screen-local visual class should move to a component, pattern, or primitive.',
};

const CATEGORY_SUGGESTION = {
  'raw-control': 'Use Button, Input, Select, Textarea, Checkbox, Switch, ToggleGroup, or Field.',
  'ad-hoc-layering': 'Use Layered with Layer, FloatingPanel, or FloatingToolbar.',
  'inline-style': 'Move static styles to styling/*; keep only documented runtime CSS custom properties.',
  'screen-visual-class': 'Move reusable visual styling below ui/screens or use an existing primitive class.',
};

function normalizePath(file) {
  return file.split(path.sep).join('/');
}

function normalizeSnippet(snippet) {
  return snippet.trim().replace(/\s+/g, ' ');
}

export function violationKey(violation) {
  return `${violation.category}|${violation.file}|${normalizeSnippet(violation.snippet)}`;
}

function lineForIndex(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function lineText(source, line) {
  return source.split(/\r?\n/)[line - 1] ?? '';
}

function previousLineHasDisable(lines, index) {
  const prev = lines[index - 1] ?? '';
  const prevPrev = lines[index - 2] ?? '';
  return /eslint-disable-next-line\s+no-restricted-syntax/.test(prev)
    || /eslint-disable-line\s+no-restricted-syntax/.test(lines[index] ?? '')
    || /eslint-disable-next-line\s+no-restricted-syntax/.test(prevPrev);
}

function add(violations, file, category, line, snippet, suggestion = CATEGORY_SUGGESTION[category]) {
  violations.push({
    category,
    file: normalizePath(file),
    line,
    message: CATEGORY_MESSAGE[category],
    suggestion,
    snippet: normalizeSnippet(snippet),
  });
}

export function scanSource(source, file) {
  const violations = [];
  const normalized = normalizePath(file);
  const lines = source.split(/\r?\n/);

  for (const match of source.matchAll(RAW_CONTROL)) {
    const tag = match[1];
    const line = lineForIndex(source, match.index ?? 0);
    add(violations, normalized, 'raw-control', line, lineText(source, line), `Use the ${tag === 'button' ? 'Button' : tag === 'textarea' ? 'Textarea' : tag === 'select' ? 'Select' : 'Input'} molecule or a dedicated wrapper molecule.`);
  }

  lines.forEach((lineSource, index) => {
    const line = index + 1;
    if (/style=\{/.test(lineSource) && !previousLineHasDisable(lines, index)) {
      add(violations, normalized, 'inline-style', line, lineSource);
    }
    for (const pattern of RAW_OVERLAY_PATTERNS) {
      if (pattern.test.test(lineSource)) {
        add(violations, normalized, 'raw-overlay', line, lineSource, pattern.suggestion);
      }
    }
    if (LAYERING_CLASS.test(lineSource)) {
      add(violations, normalized, 'ad-hoc-layering', line, lineSource);
    }
  });

  if (normalized.startsWith('ui/screens/')) {
    for (const match of source.matchAll(SCREEN_CLASS)) {
      const value = match[1] ?? match[2] ?? match[3] ?? '';
      if (value.includes('${')) continue;
      const unknown = value
        .split(/\s+/)
        .filter(Boolean)
        .filter((token) => !SCREEN_CLASS_ALLOW.has(token))
        .filter((token) => !/^grid-|^gap-|^align-|^justify-|^route-planner-|^bottom-sheet|^screen-|^layer-/.test(token));
      if (unknown.length > 0) {
        const line = lineForIndex(source, match.index ?? 0);
        add(violations, normalized, 'screen-visual-class', line, lineText(source, line), `Move or replace screen-local class(es): ${unknown.join(', ')}.`);
      }
    }
  }

  return violations;
}

function collectFiles(root, roots = DEFAULT_ROOTS) {
  const files = [];
  function walk(relative) {
    const absolute = path.join(root, relative);
    if (!existsSync(absolute)) return;
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(absolute)) {
        walk(path.join(relative, entry));
      }
      return;
    }
    if (/\.(ts|tsx)$/.test(relative) && !/\.test\.(ts|tsx)$/.test(relative)) {
      files.push(relative);
    }
  }
  roots.forEach(walk);
  return files.sort();
}

export function scanProject(root = process.cwd(), roots = DEFAULT_ROOTS) {
  return collectFiles(root, roots).flatMap((file) => {
    const source = readFileSync(path.join(root, file), 'utf8');
    return scanSource(source, file);
  }).sort((a, b) => violationKey(a).localeCompare(violationKey(b)));
}

export function readBaseline(root = process.cwd(), baselinePath = BASELINE_PATH) {
  const absolute = path.join(root, baselinePath);
  if (!existsSync(absolute)) return { version: VERSION, violations: [] };
  const parsed = JSON.parse(readFileSync(absolute, 'utf8'));
  return { version: parsed.version ?? VERSION, violations: parsed.violations ?? [] };
}

export function compareViolations(violations, baseline) {
  const baselineKeys = new Set((baseline.violations ?? []).map(violationKey));
  const currentKeys = new Set(violations.map(violationKey));
  return {
    newViolations: violations.filter((violation) => !baselineKeys.has(violationKey(violation))),
    baselineViolations: violations.filter((violation) => baselineKeys.has(violationKey(violation))),
    resolvedViolations: (baseline.violations ?? []).filter((violation) => !currentKeys.has(violationKey(violation))),
  };
}

function writeBaseline(root, violations, baselinePath = BASELINE_PATH) {
  const absolute = path.join(root, baselinePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  const payload = {
    version: VERSION,
    generatedBy: 'node scripts/check-ui-atomic.mjs --update-baseline',
    violations: violations.map(({ category, file, snippet }) => ({ category, file, snippet })),
  };
  writeFileSync(absolute, `${JSON.stringify(payload, null, 2)}\n`);
}

function formatViolation(violation, prefix) {
  return `${prefix} ${violation.file}:${violation.line} ${violation.category} - ${violation.suggestion}`;
}

export function formatReport({ newViolations, baselineViolations, resolvedViolations }) {
  const lines = [];
  if (newViolations.length > 0) {
    lines.push(`Atomic UI violations: ${newViolations.length} new violation(s)`);
    newViolations.forEach((violation) => lines.push(formatViolation(violation, 'ERROR')));
  }
  if (baselineViolations.length > 0) {
    lines.push(`Atomic UI baseline: ${baselineViolations.length} existing violation(s)`);
    baselineViolations.forEach((violation) => lines.push(formatViolation(violation, 'WARN ')));
  }
  if (resolvedViolations.length > 0) {
    lines.push(`Atomic UI resolved since baseline: ${resolvedViolations.length}`);
  }
  if (lines.length === 0) lines.push('Atomic UI check passed: no violations.');
  return lines.join('\n');
}

function runCli() {
  const root = process.cwd();
  const update = process.argv.includes('--update-baseline');
  const violations = scanProject(root);

  if (update) {
    writeBaseline(root, violations);
    console.log(`Updated ${BASELINE_PATH} with ${violations.length} violation(s).`);
    return 0;
  }

  const comparison = compareViolations(violations, readBaseline(root));
  console.log(formatReport(comparison));
  return comparison.newViolations.length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = runCli();
}
