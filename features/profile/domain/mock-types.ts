// View/mock types for legacy profile widgets. These are display-only
// shapes consumed by the UI via viewStore reads; they do not participate in
// the event-sourced profile aggregate.

export interface MockAchievement {
  name: string;
  emoji: string;
  desc: string;
  unlocked: boolean;
}

export interface MockGoal {
  name: string;
  current: number;
  target: number;
  lowerIsBetter?: boolean;
}

export interface MockSharedSession {
  id: string;
  partnerName: string;
  partnerInitials: string;
  sessionName: string;
  date: string;
  sport: string;
}

export interface MockLoggedHealth {
  weightKg: number;
  weightDate: string;
  restingHrBpm: number;
  hrDate: string;
  hrvMs: number;
  hrvDate: string;
}

export interface MockProfileNutrition {
  avgDailyKcal: number;
  avgProteinG: number;
  avgCarbsG: number;
  avgFatG: number;
  targetKcal: number;
  targetProteinG: number;
}
