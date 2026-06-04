import React from 'react';
import { ACTIVITY_ICONS } from '@ui/icons/activityIcons';
import type { SportType } from '@shared/types';

interface CategoryIconProps {
  category: string;
  size?: number;
}

export function CategoryIcon({ category, size }: CategoryIconProps) {
  const sport: SportType =
    category === 'cardio' ? 'run'
    : category === 'mobility' ? 'mobility'
    : 'strength';
  const { Icon } = ACTIVITY_ICONS[sport];
  return <Icon size={size} />;
}
