import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = 'http://localhost:5173/WorkoutApp/';

const SCREENS = [
  { name: '01-home',              route: '#/home' },
  { name: '02-training-log',      route: '#/sessions' },
  { name: '03-new-session',       route: '#/sessions/new' },
  { name: '04-session-detail',    route: '#/sessions/sess-12' },
  { name: '05-finish-session',    route: '#/sessions/sess-12/summary' },
  { name: '06-edit-session',      route: '#/sessions/sess-12/edit' },
  { name: '07-social',            route: '#/social' },
  { name: '08-messages',          route: '#/messages' },
  { name: '09-profile',           route: '#/profile' },
  { name: '10-health-category',   route: '#/profile/health/sleep' },
  { name: '11-settings',          route: '#/settings' },
  { name: '12-exercise-history',  route: '#/exercise/Bench%20Press' },
  { name: '13-weather',           route: '#/weather' },
  { name: '14-route-planner',     route: '#/plan-route' },
  { name: '15-saved-routes',      route: '#/saved-routes' },
  { name: '16-notifications',     route: '#/notifications' },
];

const VIEWPORTS = [
  { width: 320,  height: 568,  dpr: 2 },  // iPhone SE 1st gen
  { width: 360,  height: 780,  dpr: 2 },  // narrow-phone breakpoint
  { width: 375,  height: 812,  dpr: 2 },  // iPhone 14 Mini baseline
  { width: 390,  height: 844,  dpr: 2 },  // iPhone 14/15
  { width: 430,  height: 932,  dpr: 2 },  // iPhone 14 Plus / Pro Max
  { width: 599,  height: 900,  dpr: 1 },  // last mobile pixel (pre-breakpoint)
  { width: 600,  height: 900,  dpr: 1 },  // first desktop pixel (post-breakpoint)
  { width: 780,  height: 1024, dpr: 1 },  // route-planner panel swap point
  { width: 1024, height: 768,  dpr: 1 },  // tablet landscape / small laptop
  { width: 1440, height: 900,  dpr: 1 },  // standard desktop
];

async function detectOverflow(page, viewportWidth) {
  return page.evaluate((vpWidth) => {
    // Only report if page actually scrolls horizontally
    if (document.documentElement.scrollWidth <= vpWidth + 1) return [];

    const findings = [];
    document.querySelectorAll('*').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right <= vpWidth + 1) return;

      // Skip elements clipped by an overflow-hidden ancestor before body
      let ancestor = el.parentElement;
      let clipped = false;
      while (ancestor && ancestor !== document.body) {
        const s = window.getComputedStyle(ancestor);
        if (s.overflow === 'hidden' || s.overflowX === 'hidden' ||
            s.overflow === 'clip'   || s.overflowX === 'clip') {
          clipped = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (clipped) return;

      findings.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: el.className && typeof el.className === 'string'
          ? el.className.trim().split(/\s+/).slice(0, 4).join(' ')
          : null,
        right: Math.round(rect.right),
        overflow: Math.round(rect.right - vpWidth),
      });
    });
    return findings.slice(0, 20);
  }, viewportWidth);
}

async function writeReport(report, outDir) {
  const lines = ['# Overflow Report\n\n'];
  if (report.length === 0) {
    lines.push('No overflow detected across all viewports. ✅\n');
  } else {
    const byViewport = {};
    for (const entry of report) {
      (byViewport[entry.viewport] ??= []).push(entry);
    }
    for (const [width, entries] of Object.entries(byViewport).sort((a, b) => +a[0] - +b[0])) {
      lines.push(`## ${width}px\n\n`);
      for (const { screen, findings } of entries) {
        lines.push(`### ${screen}\n\n`);
        lines.push('| Element | Classes | Right edge | Overflow |\n');
        lines.push('|---------|---------|-----------|----------|\n');
        for (const f of findings) {
          const el = f.id ? `\`${f.tag}#${f.id}\`` : `\`${f.tag}\``;
          const cls = f.classes ? `\`${f.classes}\`` : '—';
          lines.push(`| ${el} | ${cls} | ${f.right}px | +${f.overflow}px |\n`);
        }
        lines.push('\n');
      }
    }
  }
  const reportPath = join(outDir, 'overflow-report.md');
  await writeFile(reportPath, lines.join(''));
  console.log(`\nOverflow report → ${reportPath}`);
}

const report = [];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const outDir = join(process.cwd(), 'docs', 'screenshots', `${vp.width}px`);
  await mkdir(outDir, { recursive: true });

  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
  });
  const page = await ctx.newPage();

  console.log(`\n[${vp.width}px] Booting app, switching to prototype mode...`);
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.evaluate(() => {
    localStorage.setItem('workout-app:mode', 'prototype');
  });
  await page.reload({ waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(2_000);

  for (const { name, route } of SCREENS) {
    const url = BASE + route;
    console.log(`  → ${name}  ${route}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(1_200);
      await page.screenshot({
        path: join(outDir, `${name}.png`),
        fullPage: true,
      });
      const findings = await detectOverflow(page, vp.width);
      if (findings.length > 0) {
        report.push({ viewport: vp.width, screen: name, findings });
        console.log(`    ⚠  ${findings.length} overflow(s) detected`);
      }
    } catch (err) {
      console.error(`    ✗ ${name}: ${err.message}`);
    }
  }

  await ctx.close();
}

await browser.close();
const reportOutDir = join(process.cwd(), 'docs', 'screenshots');
await writeReport(report, reportOutDir);
console.log('\nDone.');
