import type { ReactNode } from 'react';
import { useId } from 'react';

interface ExpandableCardProps {
  /** Always-visible content that toggles the card open/closed when clicked. */
  header: ReactNode;
  /** Collapsible content, hidden until expanded. */
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * CSS-only expandable card. A visually-hidden checkbox toggled by the header
 * <label> reveals the body via `:has()` — no JS state. See the `.expandable`
 * / `.exp-toggle` rules in components.css.
 */
export function ExpandableCard({ header, children, footer, className }: ExpandableCardProps) {
  const id = useId();
  const classes = ['surface', className].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      <input type="checkbox" id={id} className="exp-toggle" />
      <label htmlFor={id} className="exp-trigger row space-between align-center interactive">
        {header}
        <span className="chevron" aria-hidden>⌄</span>
      </label>
      <div className="expandable column">{children}</div>
      {footer}
    </section>
  );
}
