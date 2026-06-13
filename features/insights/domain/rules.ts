import type { InsightType } from './types';

/** The content an insight heuristic produces, ready to be emitted as an event. */
export interface InsightContent {
  type: InsightType;
  title: string;
  message: string;
}

/** Returns a warning if acute:chronic load ratio > 1.5. Null if safe or no data. */
export function trainingLoadInsight(ratio: number): InsightContent | null {
  if (ratio === 0 || ratio < 1.5) return null;
  return {
    type: 'OvertrainingRisk',
    title: 'High training load',
    message: `Your acute:chronic load ratio is ${ratio.toFixed(1)} — consider a recovery session or rest day to avoid overtraining.`,
  };
}

/** Returns a plateau insight for the named exercise, or null when none detected. */
export function plateauInsight(exerciseName: string, plateauDetected: boolean): InsightContent | null {
  if (!plateauDetected) return null;
  return {
    type: 'PlateauDetected',
    title: 'Progression plateau detected',
    message: `${exerciseName} volume hasn't increased meaningfully over the last 3 sessions. Try varying reps, adding a technique session, or introducing a deload before pushing harder.`,
  };
}

export interface DeloadSignals {
  highLoadDays: number;   // days in last 7 with acute:chronic > 1.3
  highRpeStreak: number;  // consecutive sessions with sessionRpe >= 8
  adherenceRate: number;  // 0-1, from plan adherence projection
}

/** Returns a deload warning when all three fatigue signals align. */
export function deloadInsight(signals: DeloadSignals): InsightContent | null {
  const { highLoadDays, highRpeStreak, adherenceRate } = signals;
  if (highLoadDays >= 5 && highRpeStreak >= 3 && adherenceRate < 0.6) {
    return {
      type: 'OvertrainingRisk',
      title: 'Deload week recommended',
      message: "You've had a sustained high-load week with elevated RPE and some missed sessions. A deload week will help you recover and come back stronger.",
    };
  }
  return null;
}
