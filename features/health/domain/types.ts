import type { DomainEvent } from '@shared/types';
import type { ChartType } from '@shared/contracts';

export type HealthCategorySlug =
  | 'activity-mobility'
  | 'body-measurements'
  | 'injuries'
  | 'routes'
  | 'cycle-tracking'
  | 'heart'
  | 'vitals'
  | 'sleep'
  | 'nutrition'
  | 'mental-wellbeing'
  | 'symptoms'
  | 'hearing'
  | 'medications'
  | 'health-records'
  | 'readiness'
  | 'body-battery'
  | 'stress'
  | 'skin-temperature'
  | 'goals-records';

export interface HealthChartDef {
  label: string;
  chartType: ChartType;
  data: { x: string; y: number }[];
  color?: string;
  currentValue?: string;
}

export type HealthChartMap = Record<string, HealthChartDef[]>;

export interface RestingHREntry {
  date: string;
  bpm: number;
}

export interface HRVEntry {
  date: string;
  hrv: number;
}

export type HealthEvent =
  | DomainEvent<'HealthChartsSeeded', { charts: HealthChartMap }>;

export interface SeedHealthCharts {
  type: 'SeedHealthCharts';
  charts: HealthChartMap;
}

export type HealthCommand = SeedHealthCharts;
