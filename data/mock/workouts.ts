export type Sport = 'lift' | 'run' | 'cycle' | 'swim' | 'rowing';

export const MOCK_WORKOUTS: Record<number, Sport[]> = {
    6:  ['lift'],
    8:  ['run'],
    10: ['cycle'],
    13: ['lift'],
    15: ['swim', 'run'],
    17: ['run'],
    18: ['lift', 'cycle', 'run', 'swim'],
    20: ['lift'],
    24: ['cycle', 'lift'],
};
