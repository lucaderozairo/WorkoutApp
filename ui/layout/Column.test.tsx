import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Column } from './Column';

describe('Column', () => {
  it('does not include the grow class by default', () => {
    render(<Column>Content</Column>);
    expect(screen.getByText('Content')).not.toHaveClass('grow');
  });

  it('includes the grow class when grow is true', () => {
    render(<Column grow>Content</Column>);
    expect(screen.getByText('Content')).toHaveClass('column', 'grow');
  });
});
