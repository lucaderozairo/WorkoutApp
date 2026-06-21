import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FullScreen } from './FullScreen';
import { ResponsiveFrame } from './ResponsiveFrame';
import { Shell } from './Shell';
import { SplitPane } from './SplitPane';
import { Stack } from './Stack';
import { StickyRegion } from './StickyRegion';

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

  it('constrains content width via a ResponsiveFrame wrapper', () => {
    render(
      <Shell mode="web" menu={<nav className="menu">Menu</nav>}>
        <span>Content</span>
      </Shell>,
    );

    const frame = screen.getByText('Content').closest('.responsive-frame');
    expect(frame).toHaveClass(
      'responsive-frame-auto',
      'responsive-frame-max-wide',
      'responsive-frame-pad-none',
    );
    expect(screen.getByRole('main')).toHaveClass('content');
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

describe('adaptive layout primitives', () => {
  it('maps Stack rhythm and semantic element props', () => {
    render(
      <Stack as="section" gap={2}>
        <span>Block</span>
      </Stack>,
    );

    expect(screen.getByText('Block').parentElement).toHaveClass('stack', 'gap-2');
    expect(screen.getByText('Block').parentElement?.tagName).toBe('SECTION');
  });

  it('maps ResponsiveFrame mode, max width, and padding classes', () => {
    render(
      <ResponsiveFrame mode="tablet" maxWidth="wide" padding="lg">
        <span>Frame</span>
      </ResponsiveFrame>,
    );

    expect(screen.getByText('Frame').parentElement).toHaveClass(
      'responsive-frame',
      'responsive-frame-tablet',
      'responsive-frame-max-wide',
      'responsive-frame-pad-lg',
    );
  });

  it('maps StickyRegion position, offset, and elevation classes', () => {
    render(
      <StickyRegion position="bottom" offset="app" elevated>
        <span>Save bar</span>
      </StickyRegion>,
    );

    expect(screen.getByText('Save bar').parentElement).toHaveClass(
      'sticky-region',
      'sticky-region-bottom',
      'sticky-offset-app',
      'elevated',
    );
  });

  it('renders SplitPane panes with adaptive classes', () => {
    render(
      <SplitPane
        primary={<span>List</span>}
        secondary={<span>Detail</span>}
        variant="main-detail"
        collapseAt="tablet"
        defaultPane="secondary"
      />,
    );

    const pane = screen.getByText('List').closest('.split-pane');
    expect(pane).toHaveClass(
      'split-pane-main-detail',
      'split-pane-collapse-tablet',
      'split-pane-default-secondary',
    );
    expect(screen.getByText('Detail')).toBeInTheDocument();
  });
});
