import type { SportType } from '@features/training_log/domain/types';

export const MOCK_WORKOUTS: Record<number, SportType[]> = {
    6:  ['strength'],
    8:  ['run'],
    10: ['cycle'],
    13: ['strength'],
    15: ['swim', 'run'],
    17: ['run'],
    18: ['strength', 'cycle', 'run', 'swim'],
    20: ['strength'],
    24: ['cycle', 'strength'],
};
