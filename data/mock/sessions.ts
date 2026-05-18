import type { ActivityView, ActivitiesState, ActivityHistoryItem } from '@features/training_log';
import type { Id } from '@shared/types';
import {
  SCENE_SUNRISE_RACK,
  SCENE_NIGHT_SPOTLIGHT,
  SCENE_DEADLIFT_PLATFORM,
  SCENE_BENCH_PRESS,
  SCENE_CHALK,
  SCENE_DUMBBELL_RACK,
  SCENE_POST_SESSION,
  SCENE_PREDAWN,
} from './workout-scenes';

export interface ExerciseSetEntry {
  date: number;
  sets: { weightKg: number; reps: number; isWarmup: boolean; failed?: boolean }[];
}

const d = (iso: string) => new Date(iso).getTime();

function s(
  dateIso: string,
  warmupKg: number,
  working: [number, number, true?][],
): ExerciseSetEntry {
  return {
    date: d(dateIso),
    sets: [
      { weightKg: warmupKg, reps: 5, isWarmup: true },
      ...working.map(([kg, reps, failed]) => ({
        weightKg: kg, reps, isWarmup: false, ...(failed ? { failed: true } : {}),
      })),
    ],
  };
}

export const MOCK_EXERCISE_SETS: Record<string, ExerciseSetEntry[]> = {
  'Squat': [
    s('2026-01-06', 60, [[80,5], [82.5,5], [85,3]]),
    s('2026-01-13', 60, [[82.5,5], [85,5], [87.5,3]]),
    s('2026-01-20', 65, [[85,5], [87.5,5], [90,3]]),
    s('2026-01-27', 65, [[87.5,5], [90,5], [92.5,3]]),
    s('2026-02-03', 70, [[90,5], [92.5,5], [95,3]]),
    s('2026-02-10', 70, [[92.5,5], [95,5], [97.5,3]]),
    s('2026-02-17', 70, [[95,5], [97.5,5], [100,3]]),
    s('2026-02-24', 75, [[97.5,5], [100,3], [102.5,1,true]]),
    s('2026-03-03', 75, [[97.5,5], [100,5], [102.5,3]]),
    s('2026-03-10', 75, [[100,5], [102.5,5], [105,3]]),
    s('2026-03-17', 80, [[102.5,5], [105,5], [107.5,3]]),
    s('2026-03-24', 80, [[105,5], [107.5,5], [110,2]]),
  ],
  'Bench Press': [
    s('2026-01-06', 50, [[70,5], [72.5,5], [75,3]]),
    s('2026-01-13', 50, [[72.5,5], [75,5], [77.5,3]]),
    s('2026-01-20', 55, [[75,5], [77.5,5], [80,3]]),
    s('2026-01-27', 55, [[77.5,5], [80,5], [82.5,3]]),
    s('2026-02-03', 55, [[80,5], [82.5,5], [85,3]]),
    s('2026-02-10', 60, [[82.5,5], [85,5], [87.5,3]]),
    s('2026-02-17', 60, [[85,5], [87.5,5], [90,3]]),
    s('2026-02-24', 60, [[87.5,5], [90,3], [92.5,1,true]]),
    s('2026-03-03', 60, [[87.5,5], [90,5], [92.5,3]]),
    s('2026-03-10', 65, [[90,5], [92.5,5], [95,3]]),
    s('2026-03-17', 65, [[92.5,5], [95,5], [97.5,3]]),
    s('2026-03-24', 65, [[95,5], [97.5,5], [100,2]]),
  ],
  'Deadlift': [
    s('2026-01-06', 80,  [[97.5,5], [100,5],  [105,3]]),
    s('2026-01-13', 80,  [[100,5],  [105,5],  [107.5,3]]),
    s('2026-01-20', 85,  [[105,5],  [107.5,5],[110,3]]),
    s('2026-01-27', 85,  [[107.5,5],[110,5],  [112.5,3]]),
    s('2026-02-03', 90,  [[110,5],  [112.5,5],[115,3]]),
    s('2026-02-10', 90,  [[112.5,5],[115,5],  [117.5,3]]),
    s('2026-02-17', 90,  [[115,5],  [117.5,5],[120,3]]),
    s('2026-02-24', 90,  [[117.5,5],[120,3],  [125,1,true]]),
    s('2026-03-03', 90,  [[117.5,5],[120,5],  [122.5,3]]),
    s('2026-03-10', 95,  [[120,5],  [122.5,5],[125,3]]),
    s('2026-03-17', 95,  [[122.5,5],[125,5],  [127.5,3]]),
    s('2026-03-24', 100, [[125,5],  [127.5,5],[130,2]]),
  ],
  'Overhead Press': [
    s('2026-01-06', 30, [[50,5], [52.5,5], [55,3]]),
    s('2026-01-13', 30, [[52.5,5],[55,5],  [57.5,3]]),
    s('2026-01-20', 32.5,[[55,5], [57.5,5],[60,3]]),
    s('2026-01-27', 32.5,[[57.5,5],[60,5], [62.5,3]]),
    s('2026-02-03', 35, [[60,5], [62.5,5], [65,3]]),
    s('2026-02-10', 35, [[62.5,5],[65,5],  [67.5,3]]),
    s('2026-02-17', 35, [[65,5],  [67.5,5],[70,3]]),
    s('2026-02-24', 37.5,[[67.5,5],[70,3], [72.5,1,true]]),
    s('2026-03-03', 37.5,[[67.5,5],[70,5], [72.5,3]]),
    s('2026-03-10', 37.5,[[70,5],  [72.5,5],[75,3]]),
    s('2026-03-17', 40, [[72.5,5],[75,5],  [77.5,3]]),
    s('2026-03-24', 40, [[75,5],  [77.5,5],[80,2]]),
  ],
};

function toStrengthSets(entry: ExerciseSetEntry): import('@features/training_log/domain/types').SetEntry[] {
  const working = entry.sets.filter(s => !s.isWarmup);
  const bestScore = Math.max(...working.map(s => s.weightKg * s.reps));
  return entry.sets.map((s, i) => ({
    setNumber: i + 1,
    measure: 'weight_reps' as const,
    weightKg: s.weightKg,
    reps: s.reps,
    isWarmup: s.isWarmup,
    isPR: !s.isWarmup && s.weightKg * s.reps === bestScore,
    failed: s.failed ?? false,
    completedAt: entry.date + i * 180_000,
    done: true,
  }));
}

const PLAN: Record<string, string[]> = {
  'Upper A': ['Bench Press', 'Overhead Press'],
  'Upper B': ['Bench Press', 'Overhead Press'],
  'Lower A': ['Squat', 'Deadlift'],
  'Lower B': ['Squat', 'Deadlift'],
};

const SESSIONS_META: Array<{ id: string; name: string; dateIso: string; durationMin: number }> = [
  { id: 'sess-01', name: 'Upper A', dateIso: '2026-01-06', durationMin: 75 },
  { id: 'sess-02', name: 'Lower A', dateIso: '2026-01-13', durationMin: 70 },
  { id: 'sess-03', name: 'Upper B', dateIso: '2026-01-20', durationMin: 80 },
  { id: 'sess-04', name: 'Lower B', dateIso: '2026-01-27', durationMin: 65 },
  { id: 'sess-05', name: 'Upper A', dateIso: '2026-02-03', durationMin: 75 },
  { id: 'sess-06', name: 'Lower A', dateIso: '2026-02-10', durationMin: 68 },
  { id: 'sess-07', name: 'Upper B', dateIso: '2026-02-17', durationMin: 82 },
  { id: 'sess-08', name: 'Lower B', dateIso: '2026-02-24', durationMin: 67 },
  { id: 'sess-09', name: 'Upper A', dateIso: '2026-03-03', durationMin: 78 },
  { id: 'sess-10', name: 'Lower A', dateIso: '2026-03-10', durationMin: 72 },
  { id: 'sess-11', name: 'Upper B', dateIso: '2026-03-17', durationMin: 85 },
  { id: 'sess-12', name: 'Lower B', dateIso: '2026-03-24', durationMin: 70 },
];

function buildActivityView(meta: typeof SESSIONS_META[number], sessionIndex: number): ActivityView {
  const startedAt = d(meta.dateIso + 'T09:00:00');
  const finishedAt = startedAt + meta.durationMin * 60_000;
  const exercises = PLAN[meta.name] ?? PLAN['Lower A'];
  const segments: ActivityView['segments'] = exercises.map((ex, i) => {
    const allEntries = MOCK_EXERCISE_SETS[ex] ?? [];
    const entry = allEntries[sessionIndex] ?? allEntries[0];
    return {
      id: `blk-${meta.id}-${i}` as Id<'Segment'>,
      exerciseName: ex,
      exerciseCategory: 'strength',
      sets: toStrengthSets(entry),
      notes: '',
      order: i,
    };
  });

  const MEDIA_GROUPS: Record<string, string[]> = {
    'sess-09': [SCENE_SUNRISE_RACK, SCENE_BENCH_PRESS, SCENE_POST_SESSION],
    'sess-10': [SCENE_DEADLIFT_PLATFORM, SCENE_NIGHT_SPOTLIGHT],
    'sess-11': [SCENE_CHALK],
    'sess-12': [SCENE_NIGHT_SPOTLIGHT, SCENE_DUMBBELL_RACK, SCENE_PREDAWN, SCENE_POST_SESSION],
  };

  return {
    id: meta.id as Id<'Activity'>,
    name: meta.name,
    primarySport: 'strength',
    status: 'finished',
    startedAt,
    finishedAt,
    segments,
    notes: '',
    sources: [],
    media: MEDIA_GROUPS[meta.id],
  };
}

const MOCK_SESSIONS: ActivityView[] = SESSIONS_META.map((meta, i) => buildActivityView(meta, i));

export const MOCK_SESSIONS_STATE: ActivitiesState = {
  activeId: null,
  byId: Object.fromEntries(MOCK_SESSIONS.map(s => [s.id, s])),
};

export const MOCK_SESSION_HISTORY: ActivityHistoryItem[] = MOCK_SESSIONS.map(s => {
  const allSets = s.segments.flatMap(seg => seg.sets ?? []);
  const workingSets = allSets.filter(set => !set.isWarmup && (set.weightKg !== undefined || set.reps !== undefined));
  return {
    id: s.id,
    name: s.name,
    primarySport: s.primarySport,
    startedAt: s.startedAt!,
    finishedAt: s.finishedAt ?? s.startedAt!,
    durationSeconds: s.finishedAt && s.startedAt
      ? Math.round((s.finishedAt - s.startedAt) / 1000)
      : 0,
    totalSets: workingSets.length,
    exerciseCount: new Set(s.segments.map(seg => seg.exerciseName)).size,
    hasPR: allSets.some(set => set.isPR),
    category: 'strength' as const,
    media: s.media,
  };
}).sort((a, b) => a.startedAt - b.startedAt);
