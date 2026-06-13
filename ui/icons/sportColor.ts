import type { SportType } from '@features/training_log/domain/types';

/**
 * Sport → colour, the single source of truth.
 *
 * Three encodings flow from one mapping:
 *   - `sportColorClass`  → a semantic CSS class (`.run`/`.lift`/… in @layer project)
 *   - `sportColorToken`  → the design token name (`"c-cardio"`) for props that take one
 *   - `sportColorVar`    → the full `var(--c-cardio)` for inline custom-property values
 *
 * Sports without an explicit colour fall back to the strength class ("lift").
 */
export type SportColorClass = 'run' | 'cycle' | 'swim' | 'rowing' | 'lift';

const SPORT_COLOR_CLASS: Partial<Record<SportType, SportColorClass>> = {
  run: 'run',
  cycle: 'cycle',
  swim: 'swim',
  row: 'rowing',
};

const CLASS_TOKEN: Record<SportColorClass, string> = {
  run: 'c-cardio',
  cycle: 'c-nutrition',
  swim: 'c-water',
  rowing: 'c-recovery',
  lift: 'c-strength',
};

/** Semantic colour class for a sport (defaults to the strength class, "lift"). */
export function sportColorClass(sport: string): SportColorClass {
  return SPORT_COLOR_CLASS[sport as SportType] ?? 'lift';
}

/** Design colour token (e.g. "c-cardio") for a sport — for props that take a token name. */
export function sportColorToken(sport: string): string {
  return CLASS_TOKEN[sportColorClass(sport)];
}

/** Full CSS custom-property reference (e.g. "var(--c-cardio)") for inline style values. */
export function sportColorVar(sport: string): string {
  return `var(--${sportColorToken(sport)})`;
}
