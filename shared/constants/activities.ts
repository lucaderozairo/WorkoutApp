// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { CardioSport } from '@features/cardio/contract';

export type ActivityKey = 'gym' | CardioSport;

export const OUTDOOR_SPORTS: ReadonlySet<ActivityKey> = new Set([
  'run', 'cycle', 'hike', 'ski', 'row', 'surf', 'kayak', 'snowboard', 'climb',
]);

export const ACTIVITY_META: Record<ActivityKey, { emoji: string; label: string }> = {
  gym:       { emoji: '🏋️', label: 'Gym' },
  run:       { emoji: '🏃', label: 'Run' },
  cycle:     { emoji: '🚴', label: 'Cycle' },
  hike:      { emoji: '🥾', label: 'Hike' },
  swim:      { emoji: '🏊', label: 'Swim' },
  row:       { emoji: '🚣', label: 'Row' },
  ski:       { emoji: '⛷️', label: 'Ski' },
  snowboard: { emoji: '🏂', label: 'Snowboard' },
  climb:     { emoji: '🧗', label: 'Climb' },
  surf:      { emoji: '🏄', label: 'Surf' },
  kayak:     { emoji: '🛶', label: 'Kayak' },
  yoga:      { emoji: '🧘', label: 'Yoga' },
  boxing:    { emoji: '🥊', label: 'Boxing' },
  stretch:   { emoji: '🤸', label: 'Stretch' },
  hiit:      { emoji: '⚡', label: 'HIIT' },
};

export const DEFAULT_RECENT_SPORTS: ActivityKey[] = ['gym', 'run', 'cycle'];

export const ACTIVITY_CATEGORIES: { label: string; keys: ActivityKey[] }[] = [
  { label: 'Outdoor',       keys: ['hike', 'ski', 'snowboard', 'climb'] },
  { label: 'Water',         keys: ['swim', 'row', 'surf', 'kayak'] },
  { label: 'Gym & Fitness', keys: ['yoga', 'boxing', 'stretch', 'hiit'] },
];
