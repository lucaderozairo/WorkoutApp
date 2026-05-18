// Sleep session shape used by sleep widgets. View-only type; the
// event-sourced sleep aggregate uses SleepEntry / SleepEntryView in types.ts
// and projections.ts.

export type SleepSession = {
  start: Date;
  end: Date;
  score: number;
  stages: {
    deep: number;
    light: number;
    rem: number;
    awake: number;
  };
};
