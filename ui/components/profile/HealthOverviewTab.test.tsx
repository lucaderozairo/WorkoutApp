import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { HEALTH_CATEGORIES, HealthOverviewTab } from './HealthOverviewTab';

describe('HEALTH_CATEGORIES', () => {
  it('gives every category a Phosphor icon component, not an emoji string', () => {
    // phosphor-react icons are React.forwardRef objects (typeof 'object'),
    // not plain functions — assert "not a string" rather than "is a function".
    for (const cat of HEALTH_CATEGORIES) {
      expect(typeof cat.icon).not.toBe('string');
    }
  });
});

describe('HealthOverviewTab', () => {
  it('renders category tiles with svg icons instead of emoji text', () => {
    render(
      <MemoryRouter>
        <HealthOverviewTab />
      </MemoryRouter>
    );
    expect(screen.getByText('Activity & Mobility')).toBeInTheDocument();
    expect(document.querySelector('svg')).not.toBeNull();
    expect(screen.queryByText('👣')).toBeNull();
  });
});
