/**
 * ViewRegistry — the single source of truth mapping every ViewStore key to its
 * exact TypeScript type. This is the compile-time contract for all state reads
 * and writes in the app (`viewStore.get<T>(key)` / `viewStore.set(key, value)`
 * and the `useQuery<T>(key)` React binding).
 *
 * ARCHITECTURE (Task A1):
 *   - This file is INFRASTRUCTURE (`data/`). It must NOT import from feature
 *     barrels (`@features/<feature>`), only from feature *domain/projection type
 *     files directly*, to avoid circular dependencies through barrels.
 *   - Types defined in a feature's `domain/types`, `domain/reducers`,
 *     `domain/body` or `projections/*` (the canonical definition sites) are
 *     imported directly from those modules.
 *   - A small number of keys are UI-local or prototype/mock-only and have no
 *     domain type (their shape lives in a UI component or a feature barrel).
 *     Those are typed inline here so infrastructure stays free of UI/barrel deps.
 *
 * Keys were enumerated by grepping every `viewStore.get<>`, `viewStore.set()`,
 * and `useQuery<>` call site across the live source tree.
 */

import type { Id } from '@shared/types';

// ── training_log ──────────────────────────────────────────────────────────
import type {
  ActivitiesState,
  ActivityView,
  RecentExercise,
} from '@features/training_log/projections';
import type { UICondition } from '@features/training_log/projections/viewTypes';

// ── cardio ────────────────────────────────────────────────────────────────
import type {
  RecentCardioView,
  MonthlyCardioEntry,
} from '@features/cardio/projections';

// ── progression ─────────────────────────────────────────────────────────-─
import type { ProgressionState } from '@features/progression/domain/types';

// ── health ──────────────────────────────────────────────────────────────-─
import type { HealthChartMap } from '@features/health/domain/types';

// ── readiness ─────────────────────────────────────────────────────────-───
import type {
  TodayReadinessView,
  SleepEntryView,
  HealthMetricsView,
  RestingHRView,
  SubjectiveRPEView,
} from '@features/readiness/domain/reducers';

// ── coaching ──────────────────────────────────────────────────────────-───
import type { CoachingInsight } from '@features/coaching/domain/types';

// ── insights ──────────────────────────────────────────────────────────-───
import type { Insight } from '@features/insights/domain/types';

// ── conditions ────────────────────────────────────────────────────────-───
import type {
  WeatherCondition,
  SuitabilityEntry,
} from '@features/conditions/domain/types';

// ── scheduling ────────────────────────────────────────────────────────-───
import type {
  Appointment,
  ScheduledEvent,
} from '@features/scheduling/domain/types';

// ── news_feed ─────────────────────────────────────────────────────────-───
import type { Headline, Deal } from '@features/news_feed/domain/types';

// ── goals ─────────────────────────────────────────────────────────────-───
import type { Goal } from '@features/goals/domain/types';

// ── habits ────────────────────────────────────────────────────────────-───
import type { Habit } from '@features/habits/domain/types';

// ── achievements ──────────────────────────────────────────────────────-───
import type { UserAchievement } from '@features/achievements/domain/types';

// ── training_plans ────────────────────────────────────────────────────-───
import type {
  TrainingPlan,
  PlanAdherence,
} from '@features/training_plans/domain/types';

// ── planning ──────────────────────────────────────────────────────────-───
import type {
  PlannedSession,
  SavedRoute,
  SavedTemplate,
} from '@features/planning/domain/types';

// ── social ────────────────────────────────────────────────────────────-───
import type { Post } from '@features/social/domain/types';

// ── nutrition ─────────────────────────────────────────────────────────-───
import type { NutritionEntryView } from '@features/nutrition/domain/reducers';

// ── stretching ────────────────────────────────────────────────────────-───
import type { StretchingSessionView } from '@features/stretching/domain/reducers';

// ── progress_analysis ─────────────────────────────────────────────────-───
import type {
  PersonalRecord,
  ChartAnnotation,
} from '@features/progress_analysis/domain/types';
import type { DailyLoad } from '@features/progress_analysis/domain/trainingLoad';

// ── profile (body tracking) ───────────────────────────────────────────-───
import type {
  MeasurementEntry,
  Equipment,
} from '@features/profile/domain/body';

/**
 * Inline shapes for keys whose type does NOT live in a feature domain/projection
 * module. Defining them here keeps infrastructure free of UI-component and
 * feature-barrel imports. These mirror the live definitions at the read sites.
 */

/** `rest_timer_state` — persisted rest-timer snapshot (UI-local: ui/components/log/RestTimerAlert). */
export interface SavedRestTimerView {
  remaining: number;
  savedAt: number;
}

/** `active_injuries` — UI-local view (ui/components/health/InjuriesView). */
export interface InjuryView {
  id: Id<'Injury'>;
  description: string;
  bodyPart: string;
  recordedAt: number;
}

/** `bodyweight_log` — raw bodyweight entries (features/profile/projections). */
export interface BodyweightLogEntry {
  id: Id<'BodyweightEntry'>;
  weightKg: number;
  loggedAt: number;
}

/** `cardio_hr_sessions` — heart-rate cardio samples for training-load (progress_analysis). */
export interface CardioHrSession {
  avgHrBpm: number;
  durationMinutes: number;
}

/**
 * The full key → type contract for the ViewStore.
 *
 * Read/written by live feature projections, command handlers, queries, and the
 * `useQuery` binding. Keys are grouped by owning feature.
 */
export type ViewRegistry = {
  // ── training_log ──────────────────────────────────────────────────────
  /** Unified strength/activity sessions, keyed by id. */
  sessions:                    ActivitiesState;
  /** Recently-used exercises, newest first. */
  recent_exercises:            RecentExercise[];

  // ── cardio ──────────────────────────────────────────────────────────--
  recent_cardio_sessions:      RecentCardioView;
  monthly_cardio_progression:  MonthlyCardioEntry[];

  // ── progression ──────────────────────────────────────────────────────-
  /** Per-exercise progression state, keyed by exercise name. */
  exercise_progressions:       ProgressionState;

  // ── health ───────────────────────────────────────────────────────────-
  health_charts:               HealthChartMap;

  // ── readiness ────────────────────────────────────────────────────────-
  today_readiness:             TodayReadinessView;
  sleep_history:               SleepEntryView[];
  health_metrics:              HealthMetricsView[];
  resting_hr_history:          RestingHRView[];
  subjective_rpe_history:      SubjectiveRPEView[];
  /** Rolling RPE values used by coaching insight generation. */
  session_rpe_history:         number[];

  // ── coaching ─────────────────────────────────────────────────────────-
  active_insights:             CoachingInsight[];
  insight_history:             CoachingInsight[];

  // ── insights ─────────────────────────────────────────────────────────-
  insights:                    Insight[];
  insights_by_sport:           Insight[];
  insights_by_exercise:        Insight[];

  // ── conditions ───────────────────────────────────────────────────────-
  current_conditions:          WeatherCondition | null;
  suitability_by_sport:        SuitabilityEntry[];

  // ── scheduling ───────────────────────────────────────────────────────-
  appointments_by_date:        Appointment[];
  joined_events:               ScheduledEvent[];

  // ── news_feed ────────────────────────────────────────────────────────-
  headlines:                   Headline[];
  deals:                       Deal[];
  unread_count:                number;

  // ── goals ────────────────────────────────────────────────────────────-
  active_goals:                Goal[];
  completed_goals:             Goal[];

  // ── habits ───────────────────────────────────────────────────────────-
  habits_today:                Habit[];

  // ── achievements ─────────────────────────────────────────────────────-
  user_achievements:           UserAchievement[];

  // ── training_plans ───────────────────────────────────────────────────-
  active_plan:                 TrainingPlan | null;
  plan_list:                   TrainingPlan[];
  plan_adherence:              PlanAdherence | null;

  // ── planning ─────────────────────────────────────────────────────────-
  planned_sessions:            PlannedSession[];
  saved_routes:                SavedRoute[];
  saved_templates:             SavedTemplate[];

  // ── social ───────────────────────────────────────────────────────────-
  social_feed:                 Post[];

  // ── nutrition ────────────────────────────────────────────────────────-
  nutrition_log:               NutritionEntryView[];

  // ── stretching ───────────────────────────────────────────────────────-
  stretching_log:              StretchingSessionView[];

  // ── progress_analysis ────────────────────────────────────────────────-
  personal_records:            PersonalRecord[];
  /** Chart annotations grouped by exercise. */
  chart_annotations:           Record<string, ChartAnnotation[]>;
  training_load_series:        DailyLoad[];
  cardio_hr_sessions:          CardioHrSession[];

  // ── profile (body tracking) ──────────────────────────────────────────-
  bodyweight_log:              BodyweightLogEntry[];
  bodyweight_history:          Array<{ id: string; weightKg: number; date: string; loggedAt: number }>;
  measurement_history:         MeasurementEntry[];
  equipment_list:              Equipment[];

  // ── injuries (UI-local view) ─────────────────────────────────────────-
  active_injuries:             InjuryView[];

  // ── UI-local / cross-cutting state ───────────────────────────────────-
  /** Live in-session conditions overlay (training_log view type). */
  active_conditions:           UICondition[];
  /** Persisted display name. */
  display_name:                string;
  /** Transient storage-health banner message; null when dismissed/healthy. */
  storage_warning:             string | null;
  /** Recently-selected sports for the new-session picker (persisted). */
  wapp_recent_sports:          string[];
  /** Persisted rest-timer snapshot. */
  rest_timer_state:            SavedRestTimerView | null;
  /** Live rest-timer remaining seconds; null when no timer running. */
  rest_timer:                  number | null;
};

/** Every valid ViewStore key, derived from the registry. */
export type ViewKey = keyof ViewRegistry;
