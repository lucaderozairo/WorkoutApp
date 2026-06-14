export type DataSourceKind =
  | 'manual'     // user entered directly in the app
  | 'imported'   // loaded from a file (CSV, GPX, FIT…)
  | 'synced'     // pulled from a connected service (Garmin, Strava, HealthKit)
  | 'estimated'  // computed / interpolated — no real measurement
  | 'unavailable' // data field exists in the model but no value is known
  | 'mock';      // seeded test/demo data

export type DataProvider =
  | 'garmin' | 'strava' | 'healthkit' | 'wahoo'
  | 'file' | 'app';

export interface DataProvenance {
  source: DataSourceKind;
  provider?: DataProvider;
  confidence?: 'high' | 'medium' | 'low';
  importedAt?: number; // unix ms — set when source is 'imported' or 'synced'
}
