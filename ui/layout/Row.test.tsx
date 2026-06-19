import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Row } from './Row';

describe('Row', () => {
  it('does not include the grow class by default', () => {
    render(<Row>Content</Row>);
    expect(screen.getByText('Content')).not.toHaveClass('grow');
  });

  it('includes the grow class when grow is true', () => {
    render(<Row grow>Content</Row>);
    expect(screen.getByText('Content')).toHaveClass('row', 'grow');
  });
});
