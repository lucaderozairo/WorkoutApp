import type { Clock } from '@shared/contracts';

export const systemClock: Clock = {
  now: () => Date.now(),
};
