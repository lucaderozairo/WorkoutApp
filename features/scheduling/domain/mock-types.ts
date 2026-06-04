// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { SportType } from '@features/training_log/domain/types';

export interface MockCalendarEvent {
  month: string;
  day: number;
  title: string;
  sport: SportType;
  time: string;
}
