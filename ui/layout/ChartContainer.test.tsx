import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartContainer } from './ChartContainer';

describe('ChartContainer', () => {
  it('uses classes for sizing instead of inline style', () => {
    render(
      <ChartContainer height="lg">
        <span>Chart</span>
      </ChartContainer>,
    );

    const container = screen.getByText('Chart').parentElement;
    expect(container).toHaveClass('chart-container', 'chart-container-lg');
    expect(container).not.toHaveAttribute('style');
  });

  it('renders loading and empty states through state classes', () => {
    const { rerender } = render(
      <ChartContainer loading>
        <span />
      </ChartContainer>,
    );

    expect(document.querySelector('.chart-container-loading')).toHaveClass('sk');

    rerender(
      <ChartContainer empty emptyMessage="No pace data">
        <span />
      </ChartContainer>,
    );

    expect(screen.getByText('No pace data').parentElement).toHaveClass('chart-container-empty');
  });
});
