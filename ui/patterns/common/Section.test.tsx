import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Section } from './Section';

describe('Section', () => {
  it('renders the eyebrow label', () => {
    render(<Section label="Last Sessions">content</Section>);
    expect(screen.getByText('Last Sessions')).toBeInTheDocument();
  });

  it('renders the label inside a surface when labelSurface is provided', () => {
    const { container } = render(
      <Section label="Last Sessions" labelSurface="ghost">
        content
      </Section>,
    );

    expect(screen.getByText('Last Sessions').closest('.surface.ghost')).not.toBeNull();
    expect(container.querySelector('section[aria-labelledby]')).not.toBeNull();
  });

  it('renders a skeleton companion', () => {
    const { container } = render(<Section.Skeleton labelSurface="ghost" action />);

    expect(container.querySelector('.surface.ghost')).not.toBeNull();
    expect(container.querySelectorAll('.sk').length).toBeGreaterThan(0);
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
