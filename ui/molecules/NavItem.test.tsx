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
