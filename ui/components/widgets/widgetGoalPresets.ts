import type { WidgetInstance } from './widgetTypes';

export type WidgetGoal = 'strength' | 'endurance' | 'weight-loss' | 'general' | 'recovery';

export const GOAL_PRESETS: Record<WidgetGoal, WidgetInstance[]> = {
  general: [
    { id: 'sleep',        instanceId: 'sleep',        size: 'md'   },
    { id: 'readiness',    instanceId: 'readiness',    size: 'sm'   },
    { id: 'hrv',          instanceId: 'hrv',          size: 'sm'   },
    { id: 'next-workout', instanceId: 'next-workout', size: 'wide' },
    { id: 'weather',      instanceId: 'weather',      size: 'md'   },
    { id: 'habits',       instanceId: 'habits',       size: 'wide' },
    { id: 'last-session', instanceId: 'last-session', size: 'wide' },
  ],
  strength: [
    { id: 'readiness',     instanceId: 'readiness',     size: 'sm'   },
    { id: 'next-workout',  instanceId: 'next-workout',  size: 'wide' },
    { id: 'last-session',  instanceId: 'last-session',  size: 'wide' },
    { id: 'weekly-volume', instanceId: 'weekly-volume', size: 'wide' },
    { id: 'sleep',         instanceId: 'sleep',         size: 'md'   },
    { id: 'insights',      instanceId: 'insights',      size: 'wide' },
  ],
  endurance: [
    { id: 'readiness',      instanceId: 'readiness',      size: 'sm'   },
    { id: 'sleep',          instanceId: 'sleep',          size: 'md'   },
    { id: 'next-workout',   instanceId: 'next-workout',   size: 'wide' },
    { id: 'monthly-dist',   instanceId: 'monthly-dist',   size: 'wide' },
    { id: 'weekly-volume',  instanceId: 'weekly-volume',  size: 'wide' },
    { id: 'insights',       instanceId: 'insights',       size: 'wide' },
  ],
  'weight-loss': [
    { id: 'readiness',     instanceId: 'readiness',     size: 'sm'   },
    { id: 'calories',      instanceId: 'calories',      size: 'sm'   },
    { id: 'macros',        instanceId: 'macros',        size: 'wide' },
    { id: 'sleep',         instanceId: 'sleep',         size: 'md'   },
    { id: 'weekly-volume', instanceId: 'weekly-volume', size: 'wide' },
    { id: 'insights',      instanceId: 'insights',      size: 'wide' },
  ],
  recovery: [
    { id: 'readiness',   instanceId: 'readiness',   size: 'sm'   },
    { id: 'sleep',       instanceId: 'sleep',        size: 'md'   },
    { id: 'hrv',         instanceId: 'hrv',          size: 'sm'   },
    { id: 'resting-hr',  instanceId: 'resting-hr',  size: 'sm'   },
    { id: 'insights',    instanceId: 'insights',     size: 'wide' },
  ],
};

export const GOAL_LABELS: Record<WidgetGoal, string> = {
  general:      'General',
  strength:     'Strength',
  endurance:    'Endurance',
  'weight-loss':'Weight loss',
  recovery:     'Recovery',
};

const GOAL_STORAGE_KEY = 'widget-goal-v1';

export function loadGoal(): WidgetGoal {
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    if (raw && raw in GOAL_PRESETS) return raw as WidgetGoal;
  } catch {}
  return 'general';
}

export function saveGoal(goal: WidgetGoal): void {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, goal);
  } catch {}
}
