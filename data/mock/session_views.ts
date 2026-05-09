import type { ActiveSessionView } from '@features/training_log';
import type { StrengthSet } from '@features/training_log/domain/types';
import type { Id } from '@shared/types';
import { MOCK_SESSION_HISTORY, MOCK_EXERCISE_SETS, type ExerciseSetEntry } from './sessions';

function toStrengthSets(entry: ExerciseSetEntry): StrengthSet[] {
  const working = entry.sets.filter(s => !s.isWarmup);
  const bestScore = Math.max(...working.map(s => s.weightKg * s.reps));
  return entry.sets.map((s, i) => ({
    type: 'strength' as const,
    setNumber: i + 1,
    weightKg: s.weightKg,
    reps: s.reps,
    isWarmup: s.isWarmup,
    isPR: !s.isWarmup && s.weightKg * s.reps === bestScore,
    failed: s.failed ?? false,
    completedAt: entry.date + i * 180_000,
  }));
}

function block(
  idx: number, sessionId: string,
  exerciseName: string, category: 'strength' | 'cardio' | 'mobility',
  entry: ExerciseSetEntry,
): ActiveSessionView['blocks'][number] {
  return {
    id: `blk-${sessionId}-${idx}` as Id<'Block'>,
    exerciseName,
    exerciseCategory: category,
    sets: toStrengthSets(entry),
    notes: '',
    order: idx,
  };
}

const UPPER_A_EXERCISES = ['Bench Press', 'Overhead Press'];
const UPPER_B_EXERCISES = ['Bench Press', 'Overhead Press'];
const LOWER_A_EXERCISES = ['Squat', 'Deadlift'];
const LOWER_B_EXERCISES = ['Squat', 'Deadlift'];

const PLAN: Record<string, string[]> = {
  'Upper A': UPPER_A_EXERCISES,
  'Upper B': UPPER_B_EXERCISES,
  'Lower A': LOWER_A_EXERCISES,
  'Lower B': LOWER_B_EXERCISES,
};

const EXERCISE_KEY: Record<string, string> = {
  'Overhead Press': 'Overhead Press',
  'Bench Press': 'Bench Press',
  'Squat': 'Squat',
  'Deadlift': 'Deadlift',
};

export const MOCK_SESSION_VIEWS: ActiveSessionView[] = MOCK_SESSION_HISTORY.map((sess, sessionIndex) => {
  const exercises = PLAN[sess.name] ?? LOWER_A_EXERCISES;
  const blocks = exercises.map((ex, i) => {
    const key = EXERCISE_KEY[ex] ?? ex;
    const allEntries = MOCK_EXERCISE_SETS[key] ?? [];
    const entry = allEntries[sessionIndex] ?? allEntries[0];
    return block(i, sess.id, ex, 'strength', entry);
  });
  return {
    id: sess.id,
    name: sess.name,
    startedAt: sess.startedAt,
    blocks,
    notes: '',
  };
});

export const MOCK_SESSION_VIEWS_MAP: Record<string, ActiveSessionView> = Object.fromEntries(
  MOCK_SESSION_VIEWS.map(v => [v.id, v])
);
