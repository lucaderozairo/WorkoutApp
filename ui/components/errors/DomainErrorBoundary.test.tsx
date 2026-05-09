import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DomainErrorBoundary } from './DomainErrorBoundary';

function Bomb() {
  throw new Error('test explosion');
}

describe('DomainErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <DomainErrorBoundary domain="workout">
        <Bomb />
      </DomainErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    spy.mockRestore();
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
