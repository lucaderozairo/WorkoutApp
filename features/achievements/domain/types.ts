import type { Id, DomainEvent } from '@shared/types';

// ─── Cross-Feature Snapshot Types ───────────────────────────
// These mirror the minimum data achievements needs from other features.
// Data arrives via event payloads, never direct feature imports.

export interface SessionSnapshot {
  category: string;
  name: string;
  hasPR: boolean;
  startedAt: number;
}

export interface CardioSnapshot {
  sport: string;
  distanceMeters: number;
}

// ─── Rarity Enum ─────────────────────────────────────────────

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

// ─── Achievement Definitions ─────────────────────────────────

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  condition: AchievementCondition;
}

export interface AchievementCondition {
  type: 'session_count' | 'pr_weight' | 'cardio_distance' | 'consecutive_days';
  sport?: string;
  exerciseName?: string;
  threshold: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  {
    id: 'first_session',
    name: 'First Session',
    description: 'Log your first workout session',
    rarity: 'common',
    condition: { type: 'session_count', threshold: 1 },
  },
  {
    id: 'five_workouts',
    name: '5 Workouts',
    description: 'Complete 5 strength training sessions',
    rarity: 'common',
    condition: { type: 'session_count', sport: 'strength', threshold: 5 },
  },
  {
    id: 'bench_100',
    name: '100kg Bench',
    description: 'Bench press 100kg or more',
    rarity: 'rare',
    condition: { type: 'pr_weight', exerciseName: 'Bench Press', threshold: 100 },
  },
  {
    id: 'squat_140',
    name: '140kg Squat',
    description: 'Squat 140kg or more',
    rarity: 'rare',
    condition: { type: 'pr_weight', exerciseName: 'Squat', threshold: 140 },
  },
  {
    id: 'run_10k',
    name: '10K Runner',
    description: 'Complete a single run of 10km or more',
    rarity: 'epic',
    condition: { type: 'cardio_distance', sport: 'run', threshold: 10_000 },
  },
  {
    id: 'century_ride',
    name: 'Century Ride',
    description: 'Complete a single ride of 160km or more',
    rarity: 'epic',
    condition: { type: 'cardio_distance', sport: 'cycle', threshold: 160_000 },
  },
  {
    id: 'marathon',
    name: 'Marathon Finisher',
    description: 'Complete a single run of 42.2km or more',
    rarity: 'legendary',
    condition: { type: 'cardio_distance', sport: 'run', threshold: 42_200 },
  },
  {
    id: 'streak_30',
    name: '30 Day Streak',
    description: 'Log activity every day for 30 consecutive days',
    rarity: 'legendary',
    condition: { type: 'consecutive_days', threshold: 30 },
  },
];

// ─── Achievement State ───────────────────────────────────────

export interface UserAchievement {
  achievementId: string;
  unlockedAt: number | null;
  progress: number; // 0-100 or raw progress
}

export interface AchievementsState {
  achievements: UserAchievement[];
}

// ─── Events ──────────────────────────────────────────────────

export type AchievementEvent =
  | DomainEvent<'AchievementUnlocked', AchievementUnlockedPayload>
  | DomainEvent<'AchievementProgressUpdated', AchievementProgressUpdatedPayload>
  | DomainEvent<'AchievementCheckRequested', AchievementCheckRequestedPayload>;

export interface AchievementUnlockedPayload {
  userId: Id<'User'>;
  achievementId: string;
  unlockedAt: number;
}

export interface AchievementProgressUpdatedPayload {
  userId: Id<'User'>;
  achievementId: string;
  progress: number;
}

export interface AchievementCheckRequestedPayload {
  userId: Id<'User'>;
}

// ─── Commands ────────────────────────────────────────────────

export interface CheckAchievements {
  type: 'CheckAchievements';
  userId: Id<'User'>;
  sessionHistory: SessionSnapshot[];
  cardioSessions: CardioSnapshot[];
}

export type AchievementCommand = CheckAchievements;
