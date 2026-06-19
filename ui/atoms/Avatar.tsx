import { useState } from 'react';
import { Text } from './Text';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const classes = ['avatar', size !== 'md' ? size : '', className].filter(Boolean).join(' ');

  if (src && !imgError) {
    return (
      <img
        className={classes}
        src={src}
        alt={name ?? 'Avatar'}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <Text as="span" className={classes} aria-label={name}>
      {name ? initials(name) : '?'}
    </Text>
  );
}
