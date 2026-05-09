import type { Id } from '@shared/types';

export type InsightType = 'warning' | 'suggestion' | 'positive';

export interface CoachingInsight {
  id: Id<'Insight'>;
  type: InsightType;
  title: string;
  message: string;
  createdAt: number;
  dismissed: boolean;
  relatedEntityId?: string;
}

export interface CoachingState {
  insights: CoachingInsight[];
}
