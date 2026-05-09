// Garmin Health API canonical type shapes (subset used by this app)

export interface GarminDailySummary {
  calendarDate: string;           // YYYY-MM-DD
  steps: number;
  activeKcal: number;
  totalKcal: number;
  floorsClimbed?: number;
  intensityMinutes?: number;
  restingHeartRate?: number;
  averageStressLevel?: number;
  bodyBatteryChargedValue?: number;
  bodyBatteryDrainedValue?: number;
}

export interface GarminHeartRateSummary {
  calendarDate: string;
  restingHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  /** offsetSeconds → bpm; covers full 24 h, one entry per minute */
  timeOffsetHeartRateSamples: Record<string, number>;
}

export interface GarminStressSummary {
  calendarDate: string;
  averageStressLevel: number;
  maxStressLevel: number;
  /** offsetSeconds → 0–100 stress level, one entry per 3 min */
  timeOffsetStressLevelValues: Record<string, number>;
}

export interface GarminBodyBatterySummary {
  calendarDate: string;
  charged: number;
  drained: number;
  /** offsetSeconds → 0–100 body battery, one entry per hour */
  timeOffsetBodyBatteryValues: Record<string, number>;
}

export interface GarminHRVSummary {
  calendarDate: string;
  /** ms — average overnight HRV */
  weeklyAvg: number;
  lastNight: number;
  lastFive?: number;
  baseline?: { lowUpper: number; balancedLow: number; balancedUpper: number };
  status?: 'BALANCED' | 'LOW' | 'UNBALANCED';
  /** Array of 5-minute interval HRV readings for the night */
  hrvValues?: number[];
}
