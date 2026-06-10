import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { Popover } from './Popover';
import { Tabs } from './Tabs';

const TAB_ITEMS = [
  { id: 'feed', label: 'Feed' },
  { id: 'events', label: 'Events' },
  { id: 'groups', label: 'Groups' },
] as const;

describe('Button', () => {
  it('emits an explicit base class and disables while loading', () => {
    render(<Button variant="primary" size="sm" loading>Save</Button>);

    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toHaveClass('button', 'primary', 'sm');
    expect(button).toBeDisabled();
  });
});

describe('Tabs', () => {
  it('wires tab roles, selected state, panels ids, and keyboard navigation', () => {
    const onChange = vi.fn();
    render(<Tabs items={[...TAB_ITEMS]} value="feed" onChange={onChange} label="Social sections" />);

    const tablist = screen.getByRole('tablist', { name: 'Social sections' });
    const feed = screen.getByRole('tab', { name: 'Feed' });

    expect(feed).toHaveAttribute('aria-selected', 'true');
    expect(feed).toHaveAttribute('aria-controls');

    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('events');

    fireEvent.keyDown(tablist, { key: 'End' });
    expect(onChange).toHaveBeenCalledWith('groups');
  });
});

describe('Popover and Dropdown', () => {
  it('maps popover alignment to panel classes', () => {
    render(<Popover trigger="More" position="top" align="end">Panel</Popover>);

    expect(document.querySelector('[popover]')).toHaveClass('popover-top', 'popover-align-end');
  });

  it('keeps dropdown as an opinionated menu wrapper', () => {
    render(<Dropdown trigger="Actions" align="left" items={[{ label: 'Archive', onClick: vi.fn() }]} />);

    expect(document.querySelector('.dropdown')).toHaveClass('menu-popover', 'popover-align-start');
    expect(document.querySelector('.dropdown .button')).toHaveClass('button', 'ghost', 'block');
  });
});
