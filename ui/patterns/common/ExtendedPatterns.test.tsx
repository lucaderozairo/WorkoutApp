import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AdaptivePresentation,
  DataTable,
  DashboardGrid,
  ErrorStatePanel,
  FeedLayout,
  FilterBar,
  FormLayout,
  ListDetailLayout,
  MapWorkspace,
  SettingsSection,
  StackedList,
  TableOfContents,
  ToolbarCluster,
  Tree,
} from '@ui/patterns';
import { SearchInput } from '@ui/molecules';
import { Button } from '@ui/molecules';

describe('extended pattern primitives', () => {
  it('renders data tables and empty state panels', () => {
    render(
      <>
        <DataTable
          columns={[{ key: 'name', header: 'Name', render: (row: { name: string }) => row.name }]}
          rows={[{ name: 'Squat' }]}
          getRowKey={(row) => row.name}
        />
        <ErrorStatePanel title="Could not load" message="Try again." />
      </>,
    );

    expect(screen.getByRole('table')).toHaveTextContent('Squat');
    expect(screen.getByText('Could not load')).toBeInTheDocument();
  });

  it('composes filter bars, settings, list/detail, and toolbar groups', () => {
    render(
      <>
        <FilterBar search={<SearchInput aria-label="Search sessions" />} actions={<Button>Apply</Button>} />
        <SettingsSection title="Units" description="Metric or imperial."><p>Metric</p></SettingsSection>
        <ListDetailLayout list={<p>List</p>} detail={<p>Detail</p>} />
        <ToolbarCluster label="Tools"><Button>Save</Button></ToolbarCluster>
      </>,
    );

    expect(screen.getByLabelText('Search sessions')).toHaveAttribute('type', 'search');
    expect(screen.getByText('Units')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
    expect(screen.getByLabelText('Tools')).toHaveClass('toolbar-cluster');
  });

  it('renders stacked lists, table of contents, and tree disclosure', () => {
    const onClick = vi.fn();
    render(
      <>
        <StackedList items={[{ id: '1', label: 'Session', sublabel: 'Today', onClick }]} />
        <TableOfContents activeId="intro" items={[{ id: 'intro', label: 'Intro' }]} />
        <Tree nodes={[{ id: 'root', label: 'Root', children: [{ id: 'child', label: 'Child' }] }]} defaultExpanded={['root']} />
      </>,
    );

    fireEvent.click(screen.getByText('Session'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Intro' })).toHaveAttribute('aria-current', 'location');
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('renders adaptive presentation and calls close action', () => {
    const onClose = vi.fn();
    render(
      <AdaptivePresentation open title="Edit filters" mobile="screen" tablet="drawer" desktop="dialog" onClose={onClose}>
        <p>Filter controls</p>
      </AdaptivePresentation>,
    );

    expect(screen.getByRole('dialog', { name: 'Edit filters' })).toHaveClass(
      'adaptive-mobile-screen',
      'adaptive-tablet-drawer',
      'adaptive-desktop-dialog',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders adaptive layout families', () => {
    render(
      <>
        <DashboardGrid><p>Readiness</p></DashboardGrid>
        <MapWorkspace panel={<p>Panel</p>} map={<p>Map</p>} tools={<Button>Tool</Button>} />
        <FormLayout header={<p>Header</p>} actions={<Button>Save</Button>}><p>Fields</p></FormLayout>
        <FeedLayout feed={<p>Feed</p>} aside={<p>Aside</p>} />
      </>,
    );

    expect(screen.getByText('Readiness').closest('.dashboard-grid')).toBeInTheDocument();
    expect(screen.getByText('Map').closest('.map-workspace-map')).toBeInTheDocument();
    expect(screen.getByText('Fields').closest('.form-layout')).toBeInTheDocument();
    expect(screen.getByText('Feed').closest('.feed-layout')).toBeInTheDocument();
  });
});
