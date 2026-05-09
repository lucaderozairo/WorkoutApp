import { useExpandable } from '@ui/interactions/useExpandable';

interface ExpandableCardProps {
  children: (toggle: () => void) => React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function ExpandableCard({ children, className, footer }: ExpandableCardProps) {
  const { expanded, toggle } = useExpandable();
  const normalizedClassName = className?.split(' ').filter(n => n !== 'surface').join(' ');
  return (
    <section className={`surface interactive${normalizedClassName ? ` ${normalizedClassName}` : ''}${expanded ? ' expanded' : ''}`}>
      {children(toggle)}
      {footer}
    </section>
  );
}
