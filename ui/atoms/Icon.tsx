import { uiIcons, type IconName } from './icons';

const SIZE_MAP = { sm: 16, md: 20, lg: 24 } as const;

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

export function Icon({ name, size = 'md', className, 'aria-label': label, 'aria-hidden': hidden }: IconProps) {
  const Component = uiIcons[name];
  return (
    <Component
      size={SIZE_MAP[size]}
      className={className}
      aria-label={label}
      aria-hidden={hidden ?? !label}
    />
  );
}
