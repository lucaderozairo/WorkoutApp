import { viewStore } from '@data/projections/views';
import { MOCK_SESSIONS_STATE, MOCK_EXERCISE_SETS } from './sessions';
import { MOCK_CARDIO_SESSIONS } from './cardio';
import { MOCK_SLEEP_WEEK } from './sleep';
import { MOCK_POSTS, MOCK_SUGGESTED_GROUPS, MOCK_UPCOMING_EVENTS } from './social';
import { MOCK_NUTRITION_ENTRIES } from './nutrition';
import { MOCK_ACHIEVEMENTS, MOCK_GOALS, MOCK_SHARED_SESSIONS, MOCK_LOGGED_HEALTH, MOCK_PROFILE_NUTRITION } from './profile';
import { MOCK_CALENDAR_UPCOMING } from './calendar';
import { MOCK_WORKOUTS } from './workouts';
import { MOCK_UPCOMING_CALLS, MOCK_RECENT_MESSAGES } from './messages';
import { MOCK_INJURIES } from './injuries';
import { CATEGORY_MOCK_CHARTS } from './health-categories';
import { handleSeedHealthCharts } from '@features/health';
import type { HealthChartMap } from '@features/health';
import type { ProgressionState, VolumeEntry } from '@features/progression';
import type { RecentCardioView } from '@features/cardio';
import type { ActivitiesState } from '@features/training_log';
import type { SleepEntryView } from '@features/readiness';
import type { Id } from '@shared/types';

function buildProgressions(): ProgressionState {
  const state: ProgressionState = {};

  for (const [exerciseName, entries] of Object.entries(MOCK_EXERCISE_SETS)) {
    const history: VolumeEntry[] = entries.map((entry, i) => {
      const working = entry.sets.filter(s => !s.isWarmup);
      const sets = working.length;
      const totalReps = working.reduce((a, s) => a + s.reps, 0);
      const maxWeightKg = Math.max(...working.map(s => s.weightKg));
      const volume = working.reduce((a, s) => a + s.weightKg * s.reps, 0);
      const oneRepMaxEstimate = Math.max(...working.map(s => s.weightKg * (1 + s.reps / 30)));
      const date = new Date(entry.date).toISOString().slice(0, 10);
      return {
        date,
        sessionId: `sess-${String(i + 1).padStart(2, '0')}` as Id<'Session'>,
        sets, totalReps, maxWeightKg, volume, oneRepMaxEstimate,
        setWeights: working.map(s => s.weightKg),
        setReps: working.map(s => s.reps),
        warmupWeights: entry.sets.filter(s => s.isWarmup).map(s => s.weightKg),
      };
    });

    const last3 = history.slice(-3);
    const plateauDetected =
      last3.length === 3 &&
      last3[2].volume < last3[0].volume * 1.02 &&
      last3[1].volume < last3[0].volume * 1.02;

    state[exerciseName] = { exerciseName, history, plateauDetected };
  }

  return state;
}

function buildSleepHistory(): SleepEntryView[] {
  return MOCK_SLEEP_WEEK.map((session, i) => {
    const durationMin = Math.floor((session.end.getTime() - session.start.getTime()) / 60_000);
    return {
      id: `seed-sleep-${i}` as Id<'Sleep'>,
      date: session.end.toISOString().slice(0, 10),
      source: 'manual' as const,
      sleepQuality: null,
      energy: null,
      soreness: null,
      mood: null,
      score: session.score,
      sleepScore: session.score,
      quality: session.score >= 80 ? 'Good' : session.score >= 65 ? 'Fair' : 'Poor',
      durationMin,
      deepMin: session.stages.deep,
      lightMin: session.stages.light,
      remMin: session.stages.rem,
      awakeMin: session.stages.awake,
      hrv: null,
      restingHr: null,
      overnightHr: null,
      respiration: null,
      bodyBatteryChange: null,
      stressAvg: null,
      restlessMoments: null,
      loggedAt: session.end.getTime(),
    } satisfies SleepEntryView;
  });
}

export function seedMockDataIfEmpty(): void {
  // ── Workouts ────────────────────────────────────────────────────────────────
  const existingSessions = viewStore.get<ActivitiesState>('sessions');
  if (!existingSessions || Object.keys(existingSessions.byId).length === 0) {
    viewStore.set('sessions', MOCK_SESSIONS_STATE);
  }

  const cardio = viewStore.get<RecentCardioView>('recent_cardio_sessions');
  if (!cardio || cardio.sessions.length === 0) {
    viewStore.set('recent_cardio_sessions', { sessions: MOCK_CARDIO_SESSIONS });
  }

  const existingProgressions = viewStore.get<ProgressionState>('exercise_progressions');
  const progressionsStale =
    !existingProgressions ||
    Object.values(existingProgressions).some(
      p => p.history.length > 0 && (p.history[0].setWeights == null || p.history[0].setReps == null || p.history[0].warmupWeights == null),
    );
  if (progressionsStale) {
    viewStore.set('exercise_progressions', buildProgressions());
  }

  // ── Sleep ───────────────────────────────────────────────────────────────────
  const sleepHistory = viewStore.get<SleepEntryView[]>('sleep_history') ?? [];
  if (sleepHistory.length === 0) {
    viewStore.set('sleep_history', buildSleepHistory());
  }

  // ── Social ──────────────────────────────────────────────────────────────────
  if (!viewStore.get('social_posts_mock')) {
    viewStore.set('social_posts_mock', MOCK_POSTS);
  }
  if (!viewStore.get('social_groups_mock')) {
    viewStore.set('social_groups_mock', MOCK_SUGGESTED_GROUPS);
  }
  if (!viewStore.get('social_events_mock')) {
    viewStore.set('social_events_mock', MOCK_UPCOMING_EVENTS);
  }

  // ── Nutrition ───────────────────────────────────────────────────────────────
  if (!viewStore.get('nutrition_entries_mock')) {
    viewStore.set('nutrition_entries_mock', MOCK_NUTRITION_ENTRIES);
  }

  // ── Profile ─────────────────────────────────────────────────────────────────
  if (!viewStore.get('profile_achievements')) {
    viewStore.set('profile_achievements', MOCK_ACHIEVEMENTS);
  }
  if (!viewStore.get('profile_goals')) {
    viewStore.set('profile_goals', MOCK_GOALS);
  }
  if (!viewStore.get('profile_shared_sessions')) {
    viewStore.set('profile_shared_sessions', MOCK_SHARED_SESSIONS);
  }
  if (!viewStore.get('profile_health')) {
    viewStore.set('profile_health', MOCK_LOGGED_HEALTH);
  }
  if (!viewStore.get('profile_nutrition')) {
    viewStore.set('profile_nutrition', MOCK_PROFILE_NUTRITION);
  }

  // ── Calendar / Schedule ─────────────────────────────────────────────────────
  if (!viewStore.get('calendar_upcoming')) {
    viewStore.set('calendar_upcoming', MOCK_CALENDAR_UPCOMING);
  }
  if (!viewStore.get('workout_calendar')) {
    viewStore.set('workout_calendar', MOCK_WORKOUTS);
  }

  // ── Messages ─────────────────────────────────────────────────────────────────
  if (!viewStore.get('messages_calls')) {
    viewStore.set('messages_calls', MOCK_UPCOMING_CALLS);
  }
  if (!viewStore.get('messages_chats')) {
    viewStore.set('messages_chats', MOCK_RECENT_MESSAGES);
  }

  // ── Injuries ─────────────────────────────────────────────────────────────────
  if (!viewStore.get('workout_injuries')) {
    viewStore.set('workout_injuries', MOCK_INJURIES);
  }

  // ── Health charts ───────────────────────────────────────────────────────────
  const existingHealthCharts = viewStore.get<HealthChartMap>('health_charts');
  if (!existingHealthCharts || Object.keys(existingHealthCharts).length === 0) {
    void handleSeedHealthCharts({ type: 'SeedHealthCharts', charts: CATEGORY_MOCK_CHARTS });
  }
}
