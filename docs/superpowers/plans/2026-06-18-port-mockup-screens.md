# Port Mockup Screens (Workout, Social, Profile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three self-contained, high-fidelity HTML mockup files — `workout-port-mockup.html`, `social-port-mockup.html`, `profile-port-mockup.html` — matching the architecture and fidelity of `docs/prototypes/home-port-mockup.html`.

**Architecture:** Each file is a standalone HTML document with an embedded `<style>` block using `@layer tokens, base, project`. Visual primitives (`.surface`, `.button`, `.icon-box`, `.column`/`.row`/`.gap-*`, etc.) are copied verbatim from `home-port-mockup.html` where used; each file only includes the primitives it actually needs (no dead CSS). No build step, no external dependencies — open directly in a browser.

**Tech Stack:** Plain HTML5, CSS (`@layer`, custom properties, nesting via `&`), vanilla JS (tab switching only, same pattern as `home-port-mockup.html`).

## Global Constraints

- No inline `style=` attributes anywhere (per `CLAUDE.md` CSS conventions).
- All spacing/color/radius/typography values come from CSS custom properties (tokens) — no hardcoded raw values.
- CSS nesting via `&` for variants/states, not flat `.x:hover`-style selectors.
- Each file is fully self-contained (own `<style>`, own tokens) — no shared stylesheet, no cross-file links, no bottom nav bar (matches `home-port-mockup.html`'s current scope).
- Sample content continues Alex's storyline (the same fictional user as `home-port-mockup.html`) with invented, consistent data.
- Out of scope for this plan: active workout/session-in-progress screen, session review/detail screen, settings screen.

---

### Task 1: Workout screen (`workout-port-mockup.html`)

**Files:**
- Create: `docs/prototypes/workout-port-mockup.html`

**Interfaces:**
- Consumes: nothing (standalone file).
- Produces: nothing consumed by other tasks (each file is independent).

- [ ] **Step 1: Create the file with full content**

```html
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Workout Port Mockup</title>
    <style>
      @layer tokens, base, project;

      @layer tokens {
        :root {
          color-scheme: light;
          --c-strength: #e8785a;
          --c-cardio: #ef4a4a;
          --c-recovery: #7b9ef8;
          --ok: #6fbf73;
          --warn: #e8a33d;
          --bad: #e25555;
          --font-ui: "Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          --font-mono: "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
          --t-xs: 12px;
          --t-sm: 14px;
          --t-md: 16px;
          --t-lg: 18px;
          --t-xl: 22px;
          --t-2xl: 28px;
          --s-1: 4px;
          --s-2: 8px;
          --s-3: 12px;
          --s-4: 16px;
          --s-5: 24px;
          --s-6: 32px;
          --r-xs: 4px;
          --r-sm: 8px;
          --r-md: 14px;
          --r-lg: 20px;
          --r-pill: 999px;
          --surface-0: #f4f6fb;
          --surface-1: #ffffff;
          --surface-2: #ebf0fa;
          --surface-3: #dde5f5;
          --ink: #0e1320;
          --ink-muted: #4a5270;
          --ink-faint: #8e96b0;
          --line: #dde5f5;
          --line-strong: #c5d0e8;
          --accent: #4f8ef7;
          --accent-ink: #ffffff;
          --accent-soft: #c5d9fc;
          --shadow-1: 0 1px 2px rgb(14 19 32 / 6%), 0 1px 1px rgb(14 19 32 / 4%);
          --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
          --duration-short: 150ms;
        }
      }

      @layer base {
        * {
          box-sizing: border-box;
        }

        body {
          min-height: 100vh;
          margin: 0;
          background:
            linear-gradient(180deg, rgb(255 255 255 / 72%), transparent 220px),
            var(--surface-0);
          color: var(--ink);
          font-family: var(--font-ui);
          line-height: 1.4;
        }

        button {
          font: inherit;
        }

        svg {
          display: block;
          flex: none;
        }
      }

      @layer project {
        .phone-screen {
          width: min(100%, 430px);
          min-height: 100vh;
          margin: 0 auto;
          padding: var(--s-4) var(--s-4) var(--s-6);
        }

        .grid {
          display: grid;
        }

        .column {
          display: flex;
          flex-direction: column;
        }

        .row {
          display: flex;
          flex-direction: row;
        }

        .gap-1 {
          gap: var(--s-1);
        }

        .gap-2 {
          gap: var(--s-2);
        }

        .gap-3 {
          gap: var(--s-3);
        }

        .gap-4 {
          gap: var(--s-4);
        }

        .align-center {
          align-items: center;
        }

        .justify-between {
          justify-content: space-between;
        }

        .min-w-0 {
          min-width: 0;
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .page-greeting {
          padding-block: var(--s-2) var(--s-1);
        }

        .eyebrow {
          color: var(--ink-muted);
          font-size: var(--t-xs);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        h1 {
          color: var(--ink);
          font-size: var(--t-2xl);
          font-weight: 650;
          letter-spacing: 0;
          line-height: 1.12;
          text-wrap: balance;
        }

        .detail {
          color: var(--ink-muted);
          font-size: var(--t-sm);
        }

        .caption {
          color: var(--ink-muted);
          font-weight: 600;
          font-size: var(--t-xs);
        }

        .muted {
          color: var(--ink-muted);
        }

        .mono {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
        }

        .surface {
          background: var(--surface-1);
          border: 1px solid var(--line);
          border-radius: var(--r-md);
          box-shadow: var(--shadow-1);

          &.ghost {
            background: transparent;
            border-color: transparent;
            box-shadow: none;
          }
        }

        .pad-sm {
          padding: var(--s-4);
        }

        .pad-xs {
          padding: var(--s-2);
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          border: 1px solid var(--line-strong);
          border-radius: var(--r-sm);
          background: var(--surface-1);
          color: var(--ink);
          cursor: pointer;
          font-size: var(--t-sm);
          font-weight: 500;
          padding: var(--s-1) var(--s-3);
          white-space: nowrap;

          &.ghost {
            border-color: transparent;
            background: transparent;
            color: var(--ink);
          }

          &.primary {
            border-color: transparent;
            background: var(--accent);
            color: var(--accent-ink);
            font-weight: 600;
          }

          &.sm {
            min-height: 32px;
            padding: var(--s-2) var(--s-3);
            font-size: var(--t-xs);
            font-weight: 600;
          }

          &.block {
            width: 100%;
            min-height: 48px;
            font-size: var(--t-md);
          }
        }

        .quick-tile {
          border: 1px solid var(--line);
          cursor: pointer;
          text-align: center;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--s-2);
        }

        .icon-box {
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border-radius: var(--r-sm);
          background: var(--surface-2);
          color: var(--ink-muted);

          &.accent {
            background: var(--accent-soft);
            color: var(--accent);
          }

          &.strength {
            background: color-mix(in srgb, var(--c-strength) 18%, white);
            color: var(--c-strength);
          }

          &.cardio {
            background: color-mix(in srgb, var(--c-cardio) 14%, white);
            color: var(--c-cardio);
          }

          &.recovery {
            background: color-mix(in srgb, var(--c-recovery) 16%, white);
            color: var(--c-recovery);
          }
        }

        .list-title {
          color: var(--ink);
          font-size: var(--t-sm);
          font-weight: 600;
        }

        .session-head {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: var(--s-3);
        }

        .stat-tile-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--s-2);
        }

        .q-tile {
          min-width: 0;

          strong {
            color: var(--ink);
            font-size: var(--t-sm);
            font-weight: 600;
          }

          span {
            color: var(--ink-faint);
            font-size: var(--t-xs);
            font-weight: 600;
          }
        }

        .surface.flat {
          background: var(--surface-2);
          border-color: transparent;
          box-shadow: none;
        }

        .chevron {
          color: var(--ink-faint);
        }

        @media (max-width: 360px) {
          .phone-screen {
            padding-inline: var(--s-3);
          }
        }
      }
    </style>
  </head>
  <body>
    <main class="phone-screen" aria-label="Workout prototype">
      <div class="column gap-4">
        <header class="surface ghost column gap-1 page-greeting">
          <span class="eyebrow">Friday · June 12</span>
          <h1>Let's get moving, Alex.</h1>
          <p class="detail">Next session: Tempo Run tomorrow at 07:30.</p>
        </header>

        <button class="button primary block" type="button">Start Workout</button>

        <div class="quick-actions">
          <button class="surface quick-tile pad-sm column gap-2 align-center" type="button">
            <span class="icon-box accent" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 5h16M4 5v14a2 2 0 0 0 2 2h3M20 5v14a2 2 0 0 1-2 2h-3M9 21v-6h6v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="caption muted">Templates</span>
          </button>
          <button class="surface quick-tile pad-sm column gap-2 align-center" type="button">
            <span class="icon-box accent" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="caption muted">History</span>
          </button>
          <button class="surface quick-tile pad-sm column gap-2 align-center" type="button">
            <span class="icon-box accent" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="caption muted">Routes</span>
          </button>
        </div>

        <section class="column gap-3" aria-labelledby="upcoming-title">
          <div class="row align-center justify-between">
            <h2 class="eyebrow" id="upcoming-title">Upcoming Session</h2>
            <button class="button ghost sm" type="button">See all</button>
          </div>
          <article class="surface pad-sm column gap-3">
            <div class="session-head">
              <span class="icon-box cardio" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 14h3l2-5 4 10 2-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <div class="column gap-1 min-w-0">
                <p class="list-title truncate">5 km Tempo Run</p>
                <p class="caption muted">Tomorrow · 07:30</p>
              </div>
            </div>
            <div class="row gap-2">
              <button class="button primary sm" type="button">Start</button>
              <button class="button ghost sm" type="button">Reschedule</button>
            </div>
          </article>
        </section>

        <section class="column gap-3" aria-labelledby="last-sessions-title">
          <div class="row align-center justify-between">
            <h2 class="eyebrow" id="last-sessions-title">Last Sessions</h2>
            <button class="button ghost sm" type="button">See all</button>
          </div>
          <div class="grid gap-2">
            <article class="surface pad-sm grid gap-3">
              <div class="session-head">
                <span class="icon-box strength" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </span>
                <div class="column gap-1 min-w-0">
                  <p class="list-title truncate">Upper Body Strength</p>
                  <p class="caption muted">Yesterday</p>
                </div>
                <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="stat-tile-row">
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">52 min</strong>
                  <span class="truncate">Duration</span>
                </div>
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">18 sets</strong>
                  <span class="truncate">Volume</span>
                </div>
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">6 ex</strong>
                  <span class="truncate">Exercises</span>
                </div>
              </div>
            </article>

            <article class="surface pad-sm grid gap-3">
              <div class="session-head">
                <span class="icon-box cardio" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 14h3l2-5 4 10 2-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div class="column gap-1 min-w-0">
                  <p class="list-title truncate">5 km Easy Run</p>
                  <p class="caption muted">Monday</p>
                </div>
                <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="stat-tile-row">
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">28 min</strong>
                  <span class="truncate">Duration</span>
                </div>
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">5.1 km</strong>
                  <span class="truncate">Distance</span>
                </div>
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">5:29</strong>
                  <span class="truncate">Pace</span>
                </div>
              </div>
            </article>

            <article class="surface pad-sm grid gap-3">
              <div class="session-head">
                <span class="icon-box strength" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </span>
                <div class="column gap-1 min-w-0">
                  <p class="list-title truncate">Leg Day Strength</p>
                  <p class="caption muted">Saturday</p>
                </div>
                <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="stat-tile-row">
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">48 min</strong>
                  <span class="truncate">Duration</span>
                </div>
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">15 sets</strong>
                  <span class="truncate">Volume</span>
                </div>
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">5 ex</strong>
                  <span class="truncate">Exercises</span>
                </div>
              </div>
            </article>

            <article class="surface pad-sm grid gap-3">
              <div class="session-head">
                <span class="icon-box recovery" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3c4 0 7 3 7 7 0 4-7 11-7 11S5 14 5 10c0-4 3-7 7-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div class="column gap-1 min-w-0">
                  <p class="list-title truncate">Recovery Yoga</p>
                  <p class="caption muted">Thursday</p>
                </div>
                <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="stat-tile-row">
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">30 min</strong>
                  <span class="truncate">Duration</span>
                </div>
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">120 kcal</strong>
                  <span class="truncate">Calories</span>
                </div>
                <div class="surface flat pad-xs q-tile column gap-1">
                  <strong class="mono truncate">98 bpm</strong>
                  <span class="truncate">Avg HR</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Serve the prototypes directory and open the file**

Run: `python -m http.server 8731 --directory "docs/prototypes"` (background)
Then open: `http://localhost:8731/workout-port-mockup.html`

Expected: page renders with no horizontal scroll, no console errors, "Start Workout" button is full-width blue, three quick-action tiles sit in one row, the upcoming session card shows Start/Reschedule buttons, and four "Last Sessions" cards render with icon, title, date, chevron, and three stat tiles each (visually consistent with the equivalent section already working in `home-port-mockup.html`).

- [ ] **Step 3: Visual check against reference**

Compare against `docs/prototypes/figma template/iPhone 16 - WorkoutPage.png` for overall section order (CTA → quick actions → upcoming → last sessions). Exact pixel match is not required — this is an intentionally different, higher-fidelity redesign — only the section order and information hierarchy should track the reference.

- [ ] **Step 4: Commit**

```bash
git add docs/prototypes/workout-port-mockup.html
git commit -m "docs(prototypes): add workout tab port mockup"
```

---

### Task 2: Social screen (`social-port-mockup.html`)

**Files:**
- Create: `docs/prototypes/social-port-mockup.html`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Create the file with full content**

```html
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Social Port Mockup</title>
    <style>
      @layer tokens, base, project;

      @layer tokens {
        :root {
          color-scheme: light;
          --font-ui: "Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          --font-mono: "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
          --t-xs: 12px;
          --t-sm: 14px;
          --t-md: 16px;
          --t-lg: 18px;
          --t-2xl: 28px;
          --s-1: 4px;
          --s-2: 8px;
          --s-3: 12px;
          --s-4: 16px;
          --s-5: 24px;
          --s-6: 32px;
          --r-xs: 4px;
          --r-sm: 8px;
          --r-md: 14px;
          --r-pill: 999px;
          --surface-0: #f4f6fb;
          --surface-1: #ffffff;
          --surface-2: #ebf0fa;
          --ink: #0e1320;
          --ink-muted: #4a5270;
          --ink-faint: #8e96b0;
          --line: #dde5f5;
          --line-strong: #c5d0e8;
          --accent: #4f8ef7;
          --accent-ink: #ffffff;
          --accent-soft: #c5d9fc;
          --shadow-1: 0 1px 2px rgb(14 19 32 / 6%), 0 1px 1px rgb(14 19 32 / 4%);
        }
      }

      @layer base {
        * {
          box-sizing: border-box;
        }

        body {
          min-height: 100vh;
          margin: 0;
          background:
            linear-gradient(180deg, rgb(255 255 255 / 72%), transparent 220px),
            var(--surface-0);
          color: var(--ink);
          font-family: var(--font-ui);
          line-height: 1.4;
        }

        button {
          font: inherit;
        }

        svg {
          display: block;
          flex: none;
        }
      }

      @layer project {
        .phone-screen {
          width: min(100%, 430px);
          min-height: 100vh;
          margin: 0 auto;
          padding: var(--s-4) var(--s-4) var(--s-6);
        }

        .column {
          display: flex;
          flex-direction: column;
        }

        .row {
          display: flex;
          flex-direction: row;
        }

        .gap-1 {
          gap: var(--s-1);
        }

        .gap-2 {
          gap: var(--s-2);
        }

        .gap-3 {
          gap: var(--s-3);
        }

        .gap-4 {
          gap: var(--s-4);
        }

        .align-center {
          align-items: center;
        }

        .justify-between {
          justify-content: space-between;
        }

        .min-w-0 {
          min-width: 0;
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .page-greeting {
          padding-block: var(--s-2) var(--s-1);
        }

        .eyebrow {
          color: var(--ink-muted);
          font-size: var(--t-xs);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        h1 {
          color: var(--ink);
          font-size: var(--t-2xl);
          font-weight: 650;
          line-height: 1.12;
          text-wrap: balance;
        }

        .detail {
          color: var(--ink-muted);
          font-size: var(--t-sm);
        }

        .caption {
          color: var(--ink-muted);
          font-weight: 600;
          font-size: var(--t-xs);
        }

        .muted {
          color: var(--ink-muted);
        }

        .surface {
          background: var(--surface-1);
          border: 1px solid var(--line);
          border-radius: var(--r-md);
          box-shadow: var(--shadow-1);

          &.ghost {
            background: transparent;
            border-color: transparent;
            box-shadow: none;
          }
        }

        .pad-sm {
          padding: var(--s-4);
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          border: 1px solid var(--line-strong);
          border-radius: var(--r-sm);
          background: var(--surface-1);
          color: var(--ink);
          cursor: pointer;
          font-size: var(--t-sm);
          font-weight: 500;
          padding: var(--s-1) var(--s-3);
          white-space: nowrap;

          &.primary {
            border-color: transparent;
            background: var(--accent);
            color: var(--accent-ink);
            font-weight: 600;
          }

          &.block {
            width: 100%;
            min-height: 48px;
            font-size: var(--t-md);
          }
        }

        .icon-box {
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border-radius: var(--r-sm);
          background: var(--surface-2);
          color: var(--ink-muted);

          &.accent {
            background: var(--accent-soft);
            color: var(--accent);
          }
        }

        .avatar {
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          border-radius: var(--r-pill);
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 700;
          font-size: var(--t-sm);
        }

        .list-title {
          color: var(--ink);
          font-size: var(--t-sm);
          font-weight: 600;
        }

        .home-list-item {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: var(--s-3);
          min-height: 44px;
        }

        .chevron {
          color: var(--ink-faint);
        }

        /* Three-way segmented control, same data-active panel pattern as the
           two-way tabs in home-port-mockup.html, generalized to N tabs. */
        .segmented {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--s-1);
          padding: var(--s-1);
          background: var(--surface-2);
          border-radius: var(--r-sm);
        }

        .segment {
          min-height: 36px;
          border: 0;
          border-radius: var(--r-xs);
          background: transparent;
          color: var(--ink-muted);
          cursor: pointer;
          font-size: var(--t-xs);
          font-weight: 600;

          &[aria-selected="true"] {
            background: var(--surface-1);
            color: var(--ink);
            box-shadow: var(--shadow-1);
          }
        }

        .segmented-panel {
          display: none;

          &[data-active="true"] {
            display: grid;
            gap: var(--s-3);
          }
        }

        .post-card {
          display: grid;
          gap: var(--s-3);
        }

        .post-actions {
          display: flex;
          gap: var(--s-4);
          color: var(--ink-muted);
          font-size: var(--t-xs);
          font-weight: 600;
        }

        .post-action {
          display: inline-flex;
          align-items: center;
          gap: var(--s-1);
        }

        .group-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--s-2);
        }

        .group-card {
          border: 1px solid var(--line);
          text-align: center;
        }

        @media (max-width: 360px) {
          .phone-screen {
            padding-inline: var(--s-3);
          }

          .group-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      }
    </style>
  </head>
  <body>
    <main class="phone-screen" aria-label="Social prototype">
      <div class="column gap-4">
        <header class="surface ghost column gap-1 page-greeting">
          <span class="eyebrow">Friday · June 12</span>
          <h1>Social</h1>
          <p class="detail">See what your friends are up to.</p>
        </header>

        <div class="segmented" role="tablist" aria-label="Social sections">
          <button class="segment" id="tab-feed" type="button" role="tab" aria-selected="true" aria-controls="panel-feed">Feed</button>
          <button class="segment" id="tab-groups" type="button" role="tab" aria-selected="false" aria-controls="panel-groups">Groups</button>
          <button class="segment" id="tab-events" type="button" role="tab" aria-selected="false" aria-controls="panel-events">Events</button>
        </div>

        <div class="segmented-panel" id="panel-feed" role="tabpanel" aria-labelledby="tab-feed" data-active="true">
          <button class="button primary block" type="button">Share a workout</button>

          <article class="surface pad-sm post-card">
            <div class="row align-center gap-3">
              <span class="avatar" aria-hidden="true">J</span>
              <div class="column gap-1 min-w-0">
                <p class="list-title truncate">Jamie Ortiz</p>
                <p class="caption muted">2 hours ago</p>
              </div>
            </div>
            <p class="detail">Finished a 10 km run along the river trail. Legs are done. 🏃</p>
            <div class="post-actions">
              <span class="post-action">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
                14
              </span>
              <span class="post-action">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12c0 4-4 7-9 7-1.1 0-2.2-.15-3.2-.43L4 20l1.2-3.6C4.4 15.2 4 13.65 4 12c0-4 4-7 9-7s8 3 8 7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
                3
              </span>
            </div>
          </article>

          <article class="surface pad-sm post-card">
            <div class="row align-center gap-3">
              <span class="avatar" aria-hidden="true">P</span>
              <div class="column gap-1 min-w-0">
                <p class="list-title truncate">Priya Shah</p>
                <p class="caption muted">5 hours ago</p>
              </div>
            </div>
            <p class="detail">New PR on bench press today: 80 kg for a single. Felt great.</p>
            <div class="post-actions">
              <span class="post-action">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
                27
              </span>
              <span class="post-action">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12c0 4-4 7-9 7-1.1 0-2.2-.15-3.2-.43L4 20l1.2-3.6C4.4 15.2 4 13.65 4 12c0-4 4-7 9-7s8 3 8 7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
                8
              </span>
            </div>
          </article>
        </div>

        <div class="segmented-panel" id="panel-groups" role="tabpanel" aria-labelledby="tab-groups" data-active="false">
          <button class="button primary block" type="button">Find a group</button>

          <h2 class="eyebrow">Groups nearby</h2>
          <div class="group-grid">
            <article class="surface group-card pad-sm column gap-2 align-center">
              <span class="icon-box accent" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 14h3l2-5 4 10 2-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <p class="caption truncate">Riverside Runners</p>
              <p class="caption muted">128 members</p>
            </article>
            <article class="surface group-card pad-sm column gap-2 align-center">
              <span class="icon-box accent" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </span>
              <p class="caption truncate">Iron & Grit Lifting</p>
              <p class="caption muted">342 members</p>
            </article>
            <article class="surface group-card pad-sm column gap-2 align-center">
              <span class="icon-box accent" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3c4 0 7 3 7 7 0 4-7 11-7 11S5 14 5 10c0-4 3-7 7-7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
              </span>
              <p class="caption truncate">Sunrise Yoga Collective</p>
              <p class="caption muted">76 members</p>
            </article>
          </div>
        </div>

        <div class="segmented-panel" id="panel-events" role="tabpanel" aria-labelledby="tab-events" data-active="false">
          <button class="button primary block" type="button">Browse events</button>

          <h2 class="eyebrow">Events coming up</h2>
          <div class="column gap-2">
            <div class="home-list-item">
              <span class="icon-box accent" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 14h3l2-5 4 10 2-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <div class="column gap-1 min-w-0">
                <p class="list-title truncate">Saturday Parkrun</p>
                <p class="caption muted">Sat · 09:00 · Riverside Park</p>
              </div>
              <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="home-list-item">
              <span class="icon-box accent" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <div class="column gap-1 min-w-0">
                <p class="list-title truncate">5-a-side Football</p>
                <p class="caption muted">Sun · 18:00 · Community Pitch</p>
              </div>
              <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="home-list-item">
              <span class="icon-box accent" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
              </span>
              <div class="column gap-1 min-w-0">
                <p class="list-title truncate">Hill Sprint Session</p>
                <p class="caption muted">Tue · 06:30 · Beacon Hill</p>
              </div>
              <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>

    <script>
      const tabs = document.querySelectorAll('[role="tab"]');
      const panels = document.querySelectorAll('[role="tabpanel"]');

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          tabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
          panels.forEach((panel) => {
            panel.dataset.active = String(panel.id === tab.getAttribute('aria-controls'));
          });
        });
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2: Serve and open**

Run: `python -m http.server 8731 --directory "docs/prototypes"` (background, reuse the same server as Task 1 if still running)
Then open: `http://localhost:8731/social-port-mockup.html`

Expected: "Feed" tab active by default, showing the "Share a workout" button and two post cards. No console errors.

- [ ] **Step 3: Manually verify tab switching**

Click the "Groups" segment. Expected: the Feed panel hides, the Groups panel shows (Find a group button + 3-card grid), and the "Groups" segment gets the white/elevated active styling. Click "Events" — expected: Events panel shows the 3-row list with chevrons. Click back to "Feed" — expected: original feed content reappears. This is the only interactive logic in this file; there is no automated test for it, so this manual check is the verification step.

- [ ] **Step 4: Visual check against reference**

Compare panel-by-panel against `docs/prototypes/figma template/iPhone 16 - SocialPage - Feed.png`, `- Groups.png`, and `- Events.png` for section order and information hierarchy (not pixel-exact match).

- [ ] **Step 5: Commit**

```bash
git add docs/prototypes/social-port-mockup.html
git commit -m "docs(prototypes): add social tab port mockup"
```

---

### Task 3: Profile screen (`profile-port-mockup.html`)

**Files:**
- Create: `docs/prototypes/profile-port-mockup.html`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Create the file with full content**

```html
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Profile Port Mockup</title>
    <style>
      @layer tokens, base, project;

      @layer tokens {
        :root {
          color-scheme: light;
          --font-ui: "Geist", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          --font-mono: "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
          --t-xs: 12px;
          --t-sm: 14px;
          --t-md: 16px;
          --t-2xl: 28px;
          --s-1: 4px;
          --s-2: 8px;
          --s-3: 12px;
          --s-4: 16px;
          --s-5: 24px;
          --s-6: 32px;
          --r-sm: 8px;
          --r-md: 14px;
          --r-pill: 999px;
          --surface-0: #f4f6fb;
          --surface-1: #ffffff;
          --surface-2: #ebf0fa;
          --ink: #0e1320;
          --ink-muted: #4a5270;
          --ink-faint: #8e96b0;
          --line: #dde5f5;
          --line-strong: #c5d0e8;
          --accent: #4f8ef7;
          --accent-soft: #c5d9fc;
          --shadow-1: 0 1px 2px rgb(14 19 32 / 6%), 0 1px 1px rgb(14 19 32 / 4%);
        }
      }

      @layer base {
        * {
          box-sizing: border-box;
        }

        body {
          min-height: 100vh;
          margin: 0;
          background:
            linear-gradient(180deg, rgb(255 255 255 / 72%), transparent 220px),
            var(--surface-0);
          color: var(--ink);
          font-family: var(--font-ui);
          line-height: 1.4;
        }

        button {
          font: inherit;
        }

        svg {
          display: block;
          flex: none;
        }
      }

      @layer project {
        .phone-screen {
          width: min(100%, 430px);
          min-height: 100vh;
          margin: 0 auto;
          padding: var(--s-4) var(--s-4) var(--s-6);
        }

        .column {
          display: flex;
          flex-direction: column;
        }

        .row {
          display: flex;
          flex-direction: row;
        }

        .gap-1 {
          gap: var(--s-1);
        }

        .gap-2 {
          gap: var(--s-2);
        }

        .gap-3 {
          gap: var(--s-3);
        }

        .gap-4 {
          gap: var(--s-4);
        }

        .align-center {
          align-items: center;
        }

        .justify-between {
          justify-content: space-between;
        }

        .min-w-0 {
          min-width: 0;
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .eyebrow {
          color: var(--ink-muted);
          font-size: var(--t-xs);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1,
        h2,
        p {
          margin: 0;
        }

        h1 {
          color: var(--ink);
          font-size: var(--t-md);
          font-weight: 650;
        }

        .caption {
          color: var(--ink-muted);
          font-weight: 600;
          font-size: var(--t-xs);
        }

        .muted {
          color: var(--ink-muted);
        }

        .mono {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
        }

        .surface {
          background: var(--surface-1);
          border: 1px solid var(--line);
          border-radius: var(--r-md);
          box-shadow: var(--shadow-1);
        }

        .surface.flat {
          background: var(--surface-2);
          border-color: transparent;
          box-shadow: none;
        }

        .pad-sm {
          padding: var(--s-4);
        }

        .pad-xs {
          padding: var(--s-2);
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          border: 1px solid var(--line-strong);
          border-radius: var(--r-sm);
          background: var(--surface-1);
          color: var(--ink);
          cursor: pointer;
          font-size: var(--t-xs);
          font-weight: 600;
          padding: var(--s-2) var(--s-3);
          white-space: nowrap;
        }

        .avatar-lg {
          display: grid;
          width: 56px;
          height: 56px;
          place-items: center;
          border-radius: var(--r-pill);
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 700;
          font-size: var(--t-md);
        }

        .icon-box {
          display: grid;
          width: 28px;
          height: 28px;
          place-items: center;
          border-radius: var(--r-sm);
          background: var(--surface-1);
          color: var(--accent);
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--s-2);
        }

        .health-tile {
          display: flex;
          align-items: center;
          gap: var(--s-2);
        }

        .health-tile-text {
          display: flex;
          flex-direction: column;
          min-width: 0;

          strong {
            font-size: var(--t-sm);
            font-weight: 700;
          }

          span {
            color: var(--ink-faint);
            font-size: var(--t-xs);
            font-weight: 600;
          }
        }

        .heatmap {
          display: grid;
          grid-auto-flow: column;
          grid-template-rows: repeat(7, 1fr);
          gap: 3px;
          height: 100px;
        }

        .heatmap-cell {
          width: 11px;
          border-radius: 2px;
          background: var(--surface-2);

          &[data-level="1"] {
            background: color-mix(in srgb, var(--accent) 30%, var(--surface-2));
          }

          &[data-level="2"] {
            background: color-mix(in srgb, var(--accent) 60%, var(--surface-2));
          }

          &[data-level="3"] {
            background: var(--accent);
          }
        }

        .heatmap-months {
          display: flex;
          justify-content: space-between;
          margin-top: var(--s-2);
        }
      }
    </style>
  </head>
  <body>
    <main class="phone-screen" aria-label="Profile prototype">
      <div class="column gap-4">
        <header class="surface pad-sm row align-center justify-between gap-3">
          <div class="row align-center gap-3">
            <span class="avatar-lg" aria-hidden="true">A</span>
            <div class="column gap-1 min-w-0">
              <h1 class="truncate">Alex Morgan</h1>
              <p class="caption muted">@alexmorgan · Joined March 2024</p>
            </div>
          </div>
          <button class="button" type="button">Edit Profile</button>
        </header>

        <section class="column gap-3" aria-labelledby="health-title">
          <div class="row align-center justify-between">
            <h2 class="eyebrow" id="health-title">Health Data</h2>
            <button class="button" type="button">See all</button>
          </div>
          <div class="health-grid">
            <div class="surface flat pad-xs health-tile">
              <span class="icon-box" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 14h3l2-5 4 10 2-5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="health-tile-text">
                <strong class="mono">8,412</strong>
                <span>Steps</span>
              </span>
            </div>
            <div class="surface flat pad-xs health-tile">
              <span class="icon-box" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="health-tile-text">
                <strong class="mono">72 bpm</strong>
                <span>Heart Rate</span>
              </span>
            </div>
            <div class="surface flat pad-xs health-tile">
              <span class="icon-box" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="health-tile-text">
                <strong class="mono">78.2 kg</strong>
                <span>Weight</span>
              </span>
            </div>
            <div class="surface flat pad-xs health-tile">
              <span class="icon-box" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v6l4 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" stroke-width="1.8"/>
                </svg>
              </span>
              <span class="health-tile-text">
                <strong class="mono">7h 24m</strong>
                <span>Sleep</span>
              </span>
            </div>
            <div class="surface flat pad-xs health-tile">
              <span class="icon-box" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2s5 5.5 5 10a5 5 0 1 1-10 0c0-4.5 5-10 5-10Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="health-tile-text">
                <strong class="mono">2,180 kcal</strong>
                <span>Calories</span>
              </span>
            </div>
            <div class="surface flat pad-xs health-tile">
              <span class="icon-box" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 18h4l2-10 3 14 2-8 2 4h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="health-tile-text">
                <strong class="mono">46</strong>
                <span>VO2 Max</span>
              </span>
            </div>
            <div class="surface flat pad-xs health-tile">
              <span class="icon-box" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" stroke-width="1.8"/>
                </svg>
              </span>
              <span class="health-tile-text">
                <strong class="mono">16%</strong>
                <span>Body Fat</span>
              </span>
            </div>
            <div class="surface flat pad-xs health-tile">
              <span class="icon-box" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2s5 5.5 5 10a5 5 0 1 1-10 0c0-4.5 5-10 5-10Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
              </span>
              <span class="health-tile-text">
                <strong class="mono">1.8 L</strong>
                <span>Hydration</span>
              </span>
            </div>
          </div>
        </section>

        <section class="column gap-3" aria-labelledby="activity-title">
          <div class="row align-center justify-between">
            <h2 class="eyebrow" id="activity-title">Activity History</h2>
            <button class="button" type="button">See all</button>
          </div>
          <div class="surface pad-sm">
            <div class="heatmap" id="activity-heatmap" aria-label="Activity over the last 18 weeks"></div>
            <div class="heatmap-months">
              <span class="caption muted">Jan</span>
              <span class="caption muted">Feb</span>
              <span class="caption muted">Mar</span>
              <span class="caption muted">Apr</span>
              <span class="caption muted">May</span>
              <span class="caption muted">Jun</span>
            </div>
          </div>
        </section>
      </div>
    </main>

    <script>
      // ponytail: deterministic pseudo-activity pattern, not real data — fine for a static mockup.
      const levels = [0, 1, 2, 3];
      const weeks = 18;
      const days = 7;
      const heatmap = document.getElementById('activity-heatmap');
      const fragment = document.createDocumentFragment();

      for (let w = 0; w < weeks; w += 1) {
        for (let d = 0; d < days; d += 1) {
          const cell = document.createElement('span');
          const level = levels[(w * 3 + d * 5) % levels.length];
          cell.className = 'heatmap-cell';
          cell.setAttribute('data-level', String(level));
          fragment.appendChild(cell);
        }
      }

      heatmap.appendChild(fragment);
    </script>
  </body>
</html>
```

- [ ] **Step 2: Serve and open**

Run: `python -m http.server 8731 --directory "docs/prototypes"` (background, reuse the same server if still running)
Then open: `http://localhost:8731/profile-port-mockup.html`

Expected: header with avatar/name/Edit button, an 8-tile 2-column "Health Data" grid (each tile shows an icon, a bold value, and a label), and an "Activity History" card showing a grid of small colored squares (varying opacity) with month labels beneath. No console errors.

- [ ] **Step 3: Visual check against reference**

Compare against `docs/prototypes/figma template/iPhone 16 - ProfilePage.png` for section order (header → Health Data grid → Activity History heatmap) and the 2-column grid / heatmap shape. Exact pixel match not required.

- [ ] **Step 4: Commit**

```bash
git add docs/prototypes/profile-port-mockup.html
git commit -m "docs(prototypes): add profile tab port mockup"
```

---

## Plan self-review notes

- **Spec coverage:** All three screens from the spec are covered (Task 1: Workout, Task 2: Social with all 3 sub-panels, Task 3: Profile with Health Data + Activity History). Out-of-scope items (active session, session review, settings) are not included, matching the spec's non-goals.
- **No placeholders:** Every step contains complete file content or exact commands — no TBD/TODO, no "similar to Task N" shortcuts.
- **Type/class consistency:** `.button.primary`, `.button.block`, `.icon-box` variants, `.surface`/`.surface.flat`, `.column`/`.row`/`.gap-*` are spelled identically across all three files where reused. The `[role="tab"]`/`[role="tabpanel"]`/`data-active` JS contract in Task 2 matches the existing pattern in `home-port-mockup.html` exactly, generalized from 2 to 3 tabs (no code change needed to the script itself).
