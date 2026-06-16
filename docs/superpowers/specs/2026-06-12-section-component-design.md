# Section component

**Date:** 2026-06-12

## Context

The app has a repeated UI pattern across HomeScreen, SessionScreen, and ProfileScreen: an eyebrow label on the left, a ghost action button on the right, and arbitrary content below. Currently this is inlined ad-hoc in each screen using raw `span.eyebrow` + `btn ghost` markup. A shared `Section` component eliminates the duplication, enforces consistent header styling, and lives at the correct patterns layer.

## Component

**File:** `ui/patterns/common/Section.tsx`
**Layer:** patterns — composes layout + primitives only, zero feature/domain imports

### API

```ts
interface SectionAction {
  label: string;
  onClick: () => void;
}

interface SectionProps {
  label: string;
  action?: SectionAction;
  gap?: number;      // gap between header row and children, default 3
  children: ReactNode;
}
```

### Behaviour

- Header row: `Row justify="between" align="center"` — eyebrow label left, ghost button right
- Label rendered with `Text size="eyebrow"`
- Action rendered with `Button variant="ghost" size="sm"` — Section owns the button, guaranteeing uniform styling
- Action is optional; omitting it leaves the header label-only
- No Surface wrapping — caller decides whether children need a card
- `gap` prop lets callers tighten/loosen the header-to-content spacing without overriding CSS

### Implementation sketch

```tsx
export function Section({ label, action, gap = 3, children }: SectionProps) {
  return (
    <Column gap={gap}>
      <Row justify="between" align="center">
        <Text size="eyebrow">{label}</Text>
        {action && (
          <Button variant="ghost" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </Row>
      {children}
    </Column>
  );
}
```

### Exports

Add `Section` to `ui/patterns/index.ts`.

## Usage examples

```tsx
// HomeScreen — last sessions
<Section label="Last Sessions" action={{ label: "See all", onClick: () => navigate("/sessions") }}>
  <Surface><SessionList /></Surface>
</Section>

// HomeScreen — widgets (full-bleed grid, no Surface)
<Section label="Widgets" action={{ label: "Edit", onClick: () => setEditing(true) }}>
  <WidgetGrid />
</Section>

// ProfileScreen — health data
<Section label="Health Data" action={{ label: "Manage sources", onClick: () => navigate("/health") }}>
  <HealthCategoryGrid />
</Section>

// SessionScreen — upcoming (no action)
<Section label="Upcoming">
  <Surface><UpcomingList /></Surface>
</Section>

// SessionScreen — recent
<Section label="Recent" action={{ label: "See all", onClick: () => navigate("/sessions") }}>
  <Surface><RecentList /></Surface>
</Section>
```

## Migration scope

Replace inline eyebrow+action header rows in:
- `ui/screens/home/HomeScreen.tsx` — "Widgets" row
- `ui/screens/home/HomeSections.tsx` — "Upcoming", "This Week" headers
- `ui/screens/session/*` — "Upcoming", "Recent" sections
- `ui/screens/profile/*` (or wherever health data renders) — "Health Data" section

Each replacement: delete the raw `Row + span.eyebrow + button` markup, import `Section`, wrap content.

## Verification

1. Run dev server — confirm all migrated sections render with correct eyebrow + ghost button layout
2. Check screens: Home (Last Sessions, Widgets), Session (Upcoming, Recent), Profile (Health Data)
3. Verify label-only variant (no action prop) renders without empty space on the right
4. Confirm `gap` default looks correct; adjust per screen if needed
5. No inline `style=` attributes, no hardcoded spacing values — all via tokens through Column/Row gap
