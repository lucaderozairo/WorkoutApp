import type { CSSProperties } from 'react';
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

export function hueFromName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
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
    <Text
      as="span"
      className={classes}
      aria-label={name}
      // eslint-disable-next-line no-restricted-syntax -- per-user hue must be set at runtime via CSS custom property
      style={name ? ({ '--avatar-hue': `${hueFromName(name)}deg` } as CSSProperties) : undefined}
    >
      {name ? initials(name) : '?'}
    </Text>
  );
}
