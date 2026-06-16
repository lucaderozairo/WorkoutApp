# SetRow Grid Layout Design

## Context

`SetRow` currently lays out the label, inputs, separators and menu button using a flex row with a `style={{ minWidth: 28 }}` inline-style hack to hold the label column stable. Across different set modes (wt-reps, reps, time, dist, dist-time) the input area conditionally renders different content, causing visual column drift between rows. The design system already has a `Grid` layout component; this spec replaces the flex approach with two nested `Grid` instances to achieve:

- No inline styles
- Automatic cross-row column alignment
- Natural wrapping on narrow containers for 3+ input modes
- One JSX structure for all modes — no template switching


## Architecture

### Two nested Grids

```
SetRow
└── Grid cols="28px 1fr 28px"          ← outer: label | pairs-area | menu
         └── Grid cols="repeat(auto-fit, minmax(80px, 1fr))"
                   placeItems="center"  ← inner: pairs wrap + align
                   └── [pair, pair, …]  ← Row atom wrapping input + Text
```

**Outer Grid** (`cols="28px 1fr 28px"`, `gap={1}`):
- Column 1 (`28px`): set label — `S1`, `WU`, etc.
- Column 2 (`1fr`): the pairs area — stretches to fill
- Column 3 (`28px`): menu icon button

**Inner Grid** (`cols="repeat(auto-fit, minmax(80px, 1fr))"`, `placeItems="center"`, `gap={1}`):
- `1fr` (not `max-content`) ensures every row divides the **same outer width** into equal tracks — so `sec` in S1 and `sec` in S2 always share the same x-position regardless of digit count
- `place-items: center` centers each pair within its track, absorbing value-length variation without drift
- Wraps automatically when the container is too narrow — no media queries, no JS

### The pair atom

Each `[input, unit]` pair is a `<Row gap={1} align="center">`:

```tsx
<Row gap={1} align="center">
  <input type="number" className="num" ... />
  <Text size="caption" color="muted">{unit}</Text>
</Row>
```

This is the only sub-structure. The inner Grid places pairs; each pair is self-contained.

---

## Input widths

| Mode fields | Input width | Rationale |
|---|---|---|
| reps, sec, W, kg, % | `6ch` | Fits up to "999.9" |
| m (distance) | `7ch` | Fits "10000" |
| kph, pace | `6ch` | Fits "12.5" |

Width is a CSS class on the `<input>` element (`className="num"` / `className="num wide"`), set per-field in the mode definition — not per-row conditionally.

---

## Mode mapping

All five modes produce `pair[]` arrays; no JSX branching on layout structure:

```ts
const PAIRS: Record<SetMode, Array<{ field: 'w' | 'r', unit: string, wide?: boolean }>> = {
  'wt-reps':  [{ field: 'w', unit: 'kg' }, { field: 'r', unit: 'reps' }],
  'reps':     [{ field: 'r', unit: 'reps' }],
  'time':     [{ field: 'w', unit: 'sec' }],
  'dist':     [{ field: 'w', unit: 'm', wide: true }],
  'dist-time':[{ field: 'w', unit: 'm', wide: true }, { field: 'r', unit: 'sec' }],
}
```

The inner Grid renders `PAIRS[currentMode].map(...)` — identical JSX skeleton regardless of mode.

---

## Grid component usage

Both Grids use the existing `Grid` component from `ui/layout/Grid.tsx` via its raw-string `cols` prop — no changes to Grid.tsx required:

```tsx
// outer — Grid has no align prop; default align-items handles vertical centering
<Grid cols="28px 1fr 28px" gap={1}>

// inner  
<Grid cols="repeat(auto-fit, minmax(80px, 1fr))" placeItems="center" gap={1}>
```

If a `.pair` CSS class is needed for the `<Row>` children (e.g., to add `min-width: 0` to prevent flex overflow), add it to `styling/forms.css` or `styling/controls.css` under `@layer components`. No new CSS files.

---

## SetRow structure after change

```tsx
<Column gap={1}>
  {/* ── Main input row ── */}
  <Grid cols="28px 1fr 28px" gap={1}>

    <Text size="caption" color={labelColor} mono bold className="text-center">{label}</Text>

    <Grid cols="repeat(auto-fit, minmax(80px, 1fr))" placeItems="center" gap={1}>
      {PAIRS[currentMode].map(({ field, unit, wide }) => (
        <Row key={field + unit} gap={1} align="center">
          <input
            type="number"
            className={`num${wide ? ' wide' : ''}${warmup ? ' faint' : ''}`}
            value={field === 'w' ? wVal : rVal}
            ...
          />
          <Text size="caption" color={labelColor}>{unit}</Text>
        </Row>
      ))}
    </Grid>

    {!disabled && (
      <Button variant="ghost" size="icon" onClick={…}>
        <MoreVertical size={10} />
      </Button>
    )}

  </Grid>

  {/* comment display, comment editor, set-options panel — unchanged */}
</Column>
```

The `style={{ minWidth: 28 }}` inline style is removed. The label span sits in a `28px` grid track — no explicit width needed.

---

## What does NOT change

- Comment display row (`comment && !commentOpen`)
- Comment editor row (`commentOpen`)
- Set-options panel (`isOpen`)
- All props, callbacks, state — unchanged
- `disabled` behaviour — unchanged

---

## Verification

1. `npx tsc --noEmit` — zero errors
2. Visual check in browser for each mode: wt-reps, reps, time, dist, dist-time
3. Check warmup rows align with working-set rows — label and pairs should share columns
4. Resize browser below 320px — pairs should wrap without overflow
5. Enter a 5-digit distance (`10000`) — should fit in `wide` input, unit sits outside
6. No `style=` attributes in rendered HTML (browser devtools → inspect)
