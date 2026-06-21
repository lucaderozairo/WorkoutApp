# Dropdown Action Menu Width + Settings Modal Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink the oversized session action menu so it fits a one-item destructive action, and wire the already-built `SettingsModal` so it actually opens (desktop modal / mobile full-page navigation), closing the mobile nav drawer on any nav tap.

**Architecture:** Two independent CSS/JS edits, no new components. Task 1 is a CSS-only fix to `styling/overlays.css` (shrink `.dropdown` min-width, delete dead `.dropdown.actions` rule). Tasks 2-3 add an optional `onClick` passthrough to `NavItem`, then wire `TabNavigation` to call `onMenuClose` on every nav tap and intercept the Settings tap at desktop width to open the modal instead of navigating.

**Tech Stack:** React, TypeScript, CSS (cascade layers, native Popover API), Vitest + Testing Library, `window.matchMedia` for the desktop/mobile breakpoint check.

## Global Constraints

- No changes to `Dropdown.tsx` — `align`/`popover-bottom`/`popover-align-end` already anchor correctly; only width changes.
- No new `variant`/`size` prop on `Dropdown` — single consumer, single need.
- No new responsive-detection hook/utility — `window.matchMedia('(min-width: 768px)')` inline, matching the existing CSS breakpoint in `styling/app-shell.css`. Mark the duplicated `768` literal with a `ponytail:` comment.
- No change to `allMobileTabs` / the bottom mobile tab bar — Settings was never in it and isn't being added.
- No changes to `App.tsx`, `Modal.tsx`, or `SettingsModal.tsx` — existing open/close plumbing (`showSettings`/`openSettings`/`onOpenSettings`) already works once triggered.

---

### Task 1: Shrink `.dropdown` width, delete dead `.actions` rule

**Files:**
- Modify: `styling/overlays.css:139-157`

**Interfaces:**
- Consumes: none (CSS-only).
- Produces: `.dropdown` renders at ~160px min-width instead of 280px; `.dropdown.actions` no longer exists (verified unused).

- [ ] **Step 1: Confirm `.dropdown.actions` has zero live consumers**

Run: `grep -rn "actions" ui/molecules/Dropdown.tsx ui/components/log/SessionListItem.tsx`
Expected: no match for a className containing `actions` being applied to a `.dropdown` element (the existing `ActionMenu` wrapper div's `onClick` handler is unrelated — confirm by reading, not just grepping for the string "actions").

- [ ] **Step 2: Edit the CSS**

In `styling/overlays.css`, replace:

```css
/* ── Dropdown — positioned panel ── */
.dropdown {
  min-width: 280px;

  &.actions {
    top: 100%;
    right: 0;
    min-width: 120px;

    & button { text-align: left; }
  }

  &.filter-panel {
    right: 0;
    left: auto;
    max-height: calc(100dvh - 160px);
    overflow-y: auto;
  }
}
```

with:

```css
/* ── Dropdown — positioned panel ── */
.dropdown {
  min-width: 160px;

  &.filter-panel {
    right: 0;
    left: auto;
    max-height: calc(100dvh - 160px);
    overflow-y: auto;
  }
}
```

- [ ] **Step 3: Visual check**

Run `npm run dev`, open `http://localhost:5183/WorkoutApp/#/sessions` in a browser, click the "⋮" on a session list item. Expected: "Delete session" menu is compact (~160px), not ~280px wide. Stop the dev server when done.

- [ ] **Step 4: Run the existing overlay test to confirm no regression**

Run: `npx vitest run styling/overlays.position-area.test.ts --exclude "**/*.stories.*"`
Expected: `PASS (1) FAIL (0)`

- [ ] **Step 5: Commit**

```bash
git add styling/overlays.css
git commit -m "fix: shrink dropdown action menu width, delete dead .actions rule"
```

---

### Task 2: Add optional `onClick` passthrough to `NavItem`

**Files:**
- Modify: `ui/molecules/NavItem.tsx`
- Test: `ui/molecules/NavItem.test.tsx` (new)

**Interfaces:**
- Produces: `NavItem` accepts an optional `onClick?: (e: React.MouseEvent) => void` prop, forwarded to the underlying `NavLink`'s `onClick`. Task 3 relies on this to intercept clicks.

- [ ] **Step 1: Write the failing test**

Create `ui/molecules/NavItem.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { House } from 'phosphor-react';
import { NavItem } from './NavItem';

describe('NavItem', () => {
  it('calls onClick when the link is clicked', () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <NavItem to="/home" label="Home" Icon={House} onClick={onClick} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('link'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('still navigates normally with no onClick prop', () => {
    render(
      <MemoryRouter>
        <NavItem to="/home" label="Home" Icon={House} />
      </MemoryRouter>
    );

    expect(() => fireEvent.click(screen.getByRole('link'))).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run ui/molecules/NavItem.test.tsx --exclude "**/*.stories.*"`
Expected: FAIL — `onClick` prop is not accepted by `NavItemProps` (TypeScript error) or the mock is never called.

- [ ] **Step 3: Add the `onClick` prop**

In `ui/molecules/NavItem.tsx`, replace the full file with:

```tsx
import { NavLink } from 'react-router-dom';
import type { Icon as PhosphorIcon } from 'phosphor-react';
import { Text } from '@ui/atoms';

interface NavItemProps {
  to: string;
  label: string;
  Icon: PhosphorIcon;
  iconSize?: number;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function NavItem({ to, label, Icon, iconSize = 18, title, onClick }: NavItemProps) {
  return (
    <NavLink to={to} title={title ?? label} onClick={onClick}>
      {({ isActive }) => (
        <>
          <span className="icon">
            <Icon size={iconSize} weight={isActive ? 'fill' : 'regular'} />
          </span>
          {label && <Text size="detail">{label}</Text>} 
        </>
      )}
    </NavLink>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run ui/molecules/NavItem.test.tsx --exclude "**/*.stories.*"`
Expected: `PASS (2) FAIL (0)`

- [ ] **Step 5: Commit**

```bash
git add ui/molecules/NavItem.tsx ui/molecules/NavItem.test.tsx
git commit -m "feat: add optional onClick passthrough to NavItem"
```

---

### Task 3: Wire `TabNavigation` to close the drawer and open Settings as a modal on desktop

**Files:**
- Modify: `ui/navigation/TabNavigation.tsx`
- Test: `ui/navigation/TabNavigation.test.tsx` (new)

**Interfaces:**
- Consumes: `NavItem`'s `onClick?: (e: React.MouseEvent) => void` prop from Task 2.
- Produces: `TabNavigation`'s Settings `NavItem` calls `onOpenSettings` and prevents navigation when `window.matchMedia('(min-width: 768px)').matches` is true; every nav-drawer `NavItem` (desktop tabs, Profile, Settings) calls `onMenuClose` on click.

- [ ] **Step 1: Write the failing tests**

Create `ui/navigation/TabNavigation.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TabNavigation } from './TabNavigation';

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('TabNavigation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the settings modal and does not navigate at desktop width', () => {
    mockMatchMedia(true);
    const onOpenSettings = vi.fn();
    const onMenuClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/home']}>
        <TabNavigation onOpenSettings={onOpenSettings} onMenuClose={onMenuClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Settings'));

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('navigates to /settings and closes the drawer at mobile width', () => {
    mockMatchMedia(false);
    const onOpenSettings = vi.fn();
    const onMenuClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/home']}>
        <TabNavigation onOpenSettings={onOpenSettings} onMenuClose={onMenuClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Settings'));

    expect(onOpenSettings).not.toHaveBeenCalled();
    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });

  it('closes the drawer when any other nav item is clicked', () => {
    mockMatchMedia(false);
    const onMenuClose = vi.fn();
    render(
      <MemoryRouter initialEntries={['/home']}>
        <TabNavigation onMenuClose={onMenuClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTitle('Profile'));

    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run ui/navigation/TabNavigation.test.tsx --exclude "**/*.stories.*"`
Expected: FAIL — clicking "Settings" navigates instead of calling `onOpenSettings`/`onMenuClose`.

- [ ] **Step 3: Wire the handlers**

In `ui/navigation/TabNavigation.tsx`, replace the body of `TabNavigation` (everything from `export function TabNavigation` to its closing brace) with:

```tsx
export function TabNavigation({
  onOpenSettings,
  menuOpen,
  onMenuToggle,
  onMenuClose,
}: TabNavigationProps) {
  const handleNavClick = () => onMenuClose?.();

  const handleSettingsClick = (e: React.MouseEvent) => {
    handleNavClick();
    // ponytail: 768 duplicates the breakpoint in styling/app-shell.css;
    // promote to a shared constant if a third JS consumer needs it.
    if (window.matchMedia('(min-width: 768px)').matches) {
      e.preventDefault();
      onOpenSettings?.();
    }
  };

  return (
    <>
      <header className="menu">
        <Button variant="ghost" title="Menu" size="md" onClick={onMenuToggle}>
          {<PanelLeft size={16} />}
          {menuOpen && <Text>Menu</Text>}
        </Button>
      </header>
      <Column as="nav" gap={1} className={`navbar ${menuOpen ? "open" : ""}`}>
        {desktopTabs.map(({ label, path, Icon }) => (
          <NavItem
            key={path}
            to={path}
            title={label}
            label={`${menuOpen ? label : ""}`}
            Icon={Icon}
            iconSize={16}
            onClick={handleNavClick}
          />
        ))}
        <Spacer />

        <NavItem
          to="/profile"
          title="Profile"
          label={`${menuOpen ? "Profile" : ""}`}
          Icon={UserCircle}
          iconSize={16}
          onClick={handleNavClick}
        />

        <NavItem
          to="/settings"
          label={`${menuOpen ? "Settings" : ""}`}
          title="Settings"
          Icon={Gear}
          iconSize={16}
          onClick={handleSettingsClick}
        />
      </Column>

      {/* Header — top bar */}
      <header className="header">
        {/* <Row align="center" justify="end">
          <Button variant="primary">Login</Button>
        </Row> */}
      </header>

      {/* App bar — mobile bottom tab bar */}
      <nav className="appbar center">
        {mobileTabs.map(({ label, path, Icon }) => (
          <NavItem
            key={path}
            to={path}
            label={label}
            Icon={Icon}
            iconSize={22}
          />
        ))}
      </nav>
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run ui/navigation/TabNavigation.test.tsx --exclude "**/*.stories.*"`
Expected: `PASS (3) FAIL (0)`

- [ ] **Step 5: Manual cross-check against the spec's test plan**

Run `npm run dev`, open `http://localhost:5183/WorkoutApp/#/home`:
- Desktop width (≥768px): click "Settings" in the sidebar → `SettingsModal` opens, URL stays at `#/home`, no navigation.
- Resize below 768px, open the drawer (hamburger button), tap "Settings" → navigates to `#/settings` (full-page `SettingsScreen`), and the drawer closes.
- Still mobile width: open the drawer, tap "Home" → drawer closes.
- Back to desktop width: clicking other nav items still navigates normally.

Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add ui/navigation/TabNavigation.tsx ui/navigation/TabNavigation.test.tsx
git commit -m "feat: open settings as a modal on desktop, close mobile drawer on nav"
```
