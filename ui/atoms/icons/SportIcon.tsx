import React from 'react';
import { ACTIVITY_ICONS } from '@ui/icons/activityIcons';
import type { SportType } from '@shared/types';

interface SportIconProps {
  sport: string;
  size?: number;
}

export function SportIcon({ sport, size }: SportIconProps) {
  const def = ACTIVITY_ICONS[sport as SportType] ?? ACTIVITY_ICONS['other'];
  return <def.Icon size={size} />;
}
