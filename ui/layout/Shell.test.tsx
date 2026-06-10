import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FullScreen } from './FullScreen';
import { Shell } from './Shell';

describe('Shell', () => {
  it('maps app and web modes to layout classes', () => {
    const { rerender } = render(
      <Shell mode="web" menu={<nav className="menu">Menu</nav>}>
        <span>Content</span>
      </Shell>,
    );

    expect(screen.getByText('Content').closest('.layout')).toHaveClass('web');
    expect(screen.getByRole('main')).toHaveClass('content');

    rerender(
      <Shell mode="app" appbar={<nav className="appbar">Tabs</nav>}>
        <span>Content</span>
      </Shell>,
    );

    expect(screen.getByText('Content').closest('.layout')).toHaveClass('app');
  });
});

describe('FullScreen', () => {
  it('provides the fullscreen layout class through a layout primitive', () => {
    render(
      <FullScreen>
        <span>Tool surface</span>
      </FullScreen>,
    );

    expect(screen.getByText('Tool surface').parentElement).toHaveClass('full-screen');
  });
});
