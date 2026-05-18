import type { Id } from '@shared/types';

export const USER_ID = 'user-001' as Id<'User'>;
export const USER_NAME = 'You';
export const USER_INITIALS = 'ME';

export const SPORT_MAP: Record<string, { icon: string; pill: string; avatar: string }> = {
  lift:  { icon: '🏋️', pill: 'lift',   avatar: 'lift'   },
  run:   { icon: '🏃', pill: 'run',    avatar: 'run'    },
  cycle: { icon: '🚴', pill: 'cycle',  avatar: 'cycle'  },
  swim:  { icon: '🏊', pill: 'swim',   avatar: 'swim'   },
  row:   { icon: '🚣', pill: 'rowing', avatar: 'rowing' },
};
