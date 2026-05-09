import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundaryRoot } from './ErrorBoundaryRoot';

function Bomb() {
  throw new Error('test explosion');
}

describe('ErrorBoundaryRoot', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { spy = vi.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => spy.mockRestore());

  it('renders crash fallback when child throws', () => {
    render(
      <ErrorBoundaryRoot>
        <Bomb />
      </ErrorBoundaryRoot>
    );
    expect(screen.getByText(/app crashed/i)).toBeInTheDocument();
    expect(screen.getByText(/refresh/i)).toBeInTheDocument();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundaryRoot>
        <span>ok</span>
      </ErrorBoundaryRoot>
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
