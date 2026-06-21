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

    fireEvent.click(screen.getAllByTitle('Profile')[0]);

    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });
});
