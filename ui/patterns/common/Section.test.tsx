import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Section } from './Section';

describe('Section', () => {
  it('renders the eyebrow label', () => {
    render(<Section label="Last Sessions">content</Section>);
    expect(screen.getByText('Last Sessions')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<Section label="Last Sessions"><p>child content</p></Section>);
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders action button when action prop is provided', () => {
    const onClick = vi.fn();
    render(
      <Section label="Last Sessions" action={{ label: 'See all', onClick }}>
        content
      </Section>,
    );
    expect(screen.getByRole('button', { name: 'See all' })).toBeInTheDocument();
  });

  it('does not render action button when action prop is omitted', () => {
    render(<Section label="Last Sessions">content</Section>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls action.onClick when action button is clicked', async () => {
    const onClick = vi.fn();
    render(
      <Section label="Last Sessions" action={{ label: 'See all', onClick }}>
        content
      </Section>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'See all' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
