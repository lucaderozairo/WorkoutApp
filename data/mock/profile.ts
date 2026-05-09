export interface MockAchievement {
  name: string;
  emoji: string;
  desc: string;
  unlocked: boolean;
}

export const MOCK_ACHIEVEMENTS: MockAchievement[] = [
  { name: 'Century Club', emoji: '🏋️', desc: '100+ workouts', unlocked: true },
  { name: 'First 5',      emoji: '✅', desc: 'First 5 sessions', unlocked: true },
  { name: '100kg Bench',  emoji: '💪', desc: 'Bench 1RM est.', unlocked: true },
  { name: '140kg Squat',  emoji: '🏆', desc: '1RM goal', unlocked: false },
  { name: 'Sub-20 5K',    emoji: '🏃', desc: 'Best: not yet', unlocked: false },
  { name: 'Century Ride', emoji: '🚴', desc: '100km cycle', unlocked: false },
  { name: 'Marathon',     emoji: '🏅', desc: 'Finish 42.2km', unlocked: false },
  { name: '30-day streak',emoji: '📅', desc: 'Best: 14 days', unlocked: false },
];

export interface MockGoal {
  name: string;
  current: number;
  target: number;
  lowerIsBetter?: boolean;
}

export const MOCK_GOALS: MockGoal[] = [
  { name: 'Squat 140 kg',          current: 120, target: 140 },
  { name: 'Run 5K under 25 min',   current: 28,  target: 25, lowerIsBetter: true },
  { name: 'Log 20 sessions',        current: 0,   target: 20 },
];

export interface MockSharedSession {
  id: string;
  partnerName: string;
  partnerInitials: string;
  sessionName: string;
  date: string;
  sport: string;
}

export const MOCK_SHARED_SESSIONS: MockSharedSession[] = [
  { id: 'ss-1', partnerName: 'Marcus T', partnerInitials: 'MT', sessionName: 'Push Day', date: '2026-05-05', sport: 'lift' },
  { id: 'ss-2', partnerName: 'Emma W', partnerInitials: 'EW', sessionName: 'Morning Run 5K', date: '2026-04-29', sport: 'run' },
];

export interface MockLoggedHealth {
  weightKg: number;
  weightDate: string;
  restingHrBpm: number;
  hrDate: string;
  hrvMs: number;
  hrvDate: string;
}

export const MOCK_LOGGED_HEALTH: MockLoggedHealth = {
  weightKg: 82.5,
  weightDate: '2026-05-07',
  restingHrBpm: 54,
  hrDate: '2026-05-09',
  hrvMs: 68,
  hrvDate: '2026-05-09',
};

export interface MockProfileNutrition {
  avgDailyKcal: number;
  avgProteinG: number;
  avgCarbsG: number;
  avgFatG: number;
  targetKcal: number;
  targetProteinG: number;
}

export const MOCK_PROFILE_NUTRITION: MockProfileNutrition = {
  avgDailyKcal: 2150,
  avgProteinG: 168,
  avgCarbsG: 235,
  avgFatG: 72,
  targetKcal: 2200,
  targetProteinG: 180,
};
