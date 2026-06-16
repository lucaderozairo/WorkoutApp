import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardScroller } from './CardScroller';

describe('CardScroller', () => {
  it('renders children inside the track', () => {
    render(
      <CardScroller>
        <div>Card 1</div>
        <div>Card 2</div>
      </CardScroller>,
    );
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('forwards ref to the scroll track element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardScroller ref={ref}><div>Card</div></CardScroller>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.classList.contains('card-scroller-track')).toBe(true);
  });

  it('sets data-gap when gap differs from default 3', () => {
    const { container } = render(
      <CardScroller gap={1}><div>Card</div></CardScroller>,
    );
    expect(container.querySelector('.card-scroller-track')?.getAttribute('data-gap')).toBe('1');
  });

  it('omits data-gap when gap is the default (3)', () => {
    const { container } = render(
      <CardScroller><div>Card</div></CardScroller>,
    );
    expect(container.querySelector('.card-scroller-track')?.getAttribute('data-gap')).toBeNull();
  });
});
