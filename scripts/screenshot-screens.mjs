import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
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
  { dir: 'mobile',  width: 414,  height: 896,  dpr: 2, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148' },
  { dir: 'desktop', width: 1440, height: 900,  dpr: 1, ua: undefined },
];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const outDir = join(process.cwd(), 'docs', 'screenshots', vp.dir);
  await mkdir(outDir, { recursive: true });

  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    ...(vp.ua ? { userAgent: vp.ua } : {}),
  });
  const page = await ctx.newPage();

  console.log(`\n[${vp.dir}] Booting app, switching to prototype mode...`);
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
    } catch (err) {
      console.error(`    ✗ ${name}: ${err.message}`);
    }
  }

  await ctx.close();
}

await browser.close();
console.log('\nDone.');
