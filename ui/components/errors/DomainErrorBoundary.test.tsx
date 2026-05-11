import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DomainErrorBoundary } from './DomainErrorBoundary';

function Bomb(): never {
  throw new Error('test explosion');
}

describe('DomainErrorBoundary', () => {
  let spy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => { spy = vi.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => spy.mockRestore());

  it('renders fallback when child throws', () => {
    render(
      <DomainErrorBoundary domain="workout">
        <Bomb />
      </DomainErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders children when no error', () => {
    render(
      <DomainErrorBoundary domain="workout">
        <span>ok</span>
      </DomainErrorBoundary>
    );
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
