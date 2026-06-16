import type { Id } from '@shared/types';

export interface Headline {
  id: Id<'Headline'>;
  title: string;
  source: string;
  url: string;
  publishedAt: number;
  isRead: boolean;
}

export interface Deal {
  id: Id<'Deal'>;
  title: string;
  brand: string;
  discountPercent: number;
  url: string;
  expiresAt: number | null;
}

export interface WeatherCondition {
  tempCelsius: number;
  humidity: number;
  windKph: number;
  description: string;
  icon: string;
  fetchedAt: number;
}

export type SportSuitability = 'excellent' | 'good' | 'fair' | 'poor';

export interface SuitabilityEntry {
  sport: string;
  suitability: SportSuitability;
  reason: string;
}
