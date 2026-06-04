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
 *
 * HOW TO ADD A KEY:
 * 1. Find the canonical type in the owning feature's domain/ or projections/.
 * 2. Import directly — never through a feature barrel (@features/<name> with no sub-path).
 * 3. If no importable type exists, define a named inline interface here.
 * 4. Add one entry in the matching feature section below.
 * 5. Mock/dev-only keys go in the mock section at the bottom.
 */

import type { Id } from '@shared/types';

// ── training_log ──────────────────────────────────────────────────────────
import type {
  ActivitiesState,
  ActivityView,
  RecentExercise,
  UICondition,
} from '@features/training_log/contract';
import type { TrainingDashboardView } from '@features/training_log/projections/dashboard';

// ── cardio ────────────────────────────────────────────────────────────────
import type {
  RecentCardioView,
  MonthlyCardioEntry,
} from '@features/cardio/contract';

// ── progression ─────────────────────────────────────────────────────────-─
import type { ProgressionState } from '@features/progression/contract';

// ── health ──────────────────────────────────────────────────────────────-─
import type { HealthChartMap } from '@features/health/contract';

// ── readiness ─────────────────────────────────────────────────────────-───
import type {
  TodayReadinessView,
  SleepEntryView,
  HealthMetricsView,
  RestingHRView,
  SubjectiveRPEView,
} from '@features/readiness/contract';
import type { SleepTrendView } from '@features/readiness/projections/sleepTrend';

// ── coaching ──────────────────────────────────────────────────────────-───
import type { CoachingInsight } from '@features/coaching/contract';

// ── insights ──────────────────────────────────────────────────────────-───
import type { Insight } from '@features/insights/contract';

// ── conditions ────────────────────────────────────────────────────────-───
import type {
  WeatherCondition,
  SuitabilityEntry,
} from '@features/conditions/contract';

// ── scheduling ────────────────────────────────────────────────────────-───
import type {
  Appointment,
  ScheduledEvent,
} from '@features/scheduling/contract';

// ── news_feed ─────────────────────────────────────────────────────────-───
import type { Headline, Deal } from '@features/news_feed/contract';

// ── goals ─────────────────────────────────────────────────────────────-───
import type { Goal } from '@features/goals/contract';

// ── habits ────────────────────────────────────────────────────────────-───
import type { Habit } from '@features/habits/contract';

// ── achievements ──────────────────────────────────────────────────────-───
import type { UserAchievement } from '@features/achievements/contract';

// ── training_plans ────────────────────────────────────────────────────-───
import type {
  TrainingPlan,
  PlanAdherence,
} from '@features/training_plans/contract';

// ── planning ──────────────────────────────────────────────────────────-───
import type {
  PlannedSession,
  SavedRoute,
  SavedTemplate,
} from '@features/planning/contract';

// ── social ────────────────────────────────────────────────────────────-───
import type { Post } from '@features/social/contract';

// ── nutrition ─────────────────────────────────────────────────────────-───
import type { NutritionEntryView } from '@features/nutrition/contract';

// ── stretching ────────────────────────────────────────────────────────-───
import type { StretchingSessionView } from '@features/stretching/contract';

// ── progress_analysis ─────────────────────────────────────────────────-───
import type {
  PersonalRecord,
  ChartAnnotation,
} from '@features/progress_analysis/contract';
import type { DailyLoad } from '@features/progress_analysis/contract';

// ── profile ────────────────────────────────────────────────────────────-───
import type { UnitSystem } from '@features/profile/contract';

// ── profile (body tracking) ───────────────────────────────────────────-───
import type {
  MeasurementEntry,
  Equipment,
} from '@features/profile/contract';

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

/**
 * `bodyweight_history` — date-indexed bodyweight entries for charting
 * (features/profile/projections/body.ts · bodyweightHistoryProjection).
 */
export interface BodyweightHistoryEntry {
  id: Id<'BodyweightEntry'>;
  weightKg: number;
  date: string;
  loggedAt: number;
}

/** `profile` — current user profile snapshot (features/profile/projections/index.ts). */
export interface ProfileView {
  displayName: string;
  email: string;
  unitPreference: UnitSystem;
}

/** `preferences` — user unit preferences snapshot (features/profile/projections/index.ts). */
export interface PreferencesView {
  unitPreference: UnitSystem;
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
  /** Currently-active session snapshot (features/training_log/commands/handlers). */
  active_session:              ActivityView | null;
  /** Dashboard summary: streak + workoutsThisWeek (features/training_log/projections/dashboard). */
  training_log_dashboard:      TrainingDashboardView;

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
  /** Derived sleep trend for the last 7 days (features/readiness/projections/sleepTrend). */
  sleep_trend:                 SleepTrendView;

  // ── coaching ─────────────────────────────────────────────────────────-
  active_insights:             CoachingInsight[];
  insight_history:             CoachingInsight[];

  // ── insights ─────────────────────────────────────────────────────────-
  insights:                    Insight[];
  // TODO: wired in features/insights — not yet live
  insights_by_sport:           Insight[];
  // TODO: wired in features/insights — not yet live
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

  // ── profile ──────────────────────────────────────────────────────────-
  /** User profile snapshot (features/profile/projections/index.ts). */
  profile:                     ProfileView;
  /** User preferences snapshot (features/profile/projections/index.ts). */
  preferences:                 PreferencesView;

  // ── profile (body tracking) ──────────────────────────────────────────-
  bodyweight_log:              BodyweightLogEntry[];
  bodyweight_history:          BodyweightHistoryEntry[];
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
  /** Live rest-timer state (seconds remaining + exercise name); null when no timer running. */
  rest_timer:                  { seconds: number; exerciseName: string } | null;

  // ── mock / dev-only ──────────────────────────────────────────────────-
  // These keys are written by data/mock/seed.ts and read only by mock/sample screens.
  social_posts_mock:           unknown;
  social_events_mock:          unknown;
  social_groups_mock:          unknown;
  nutrition_entries_mock:      unknown;
  profile_achievements:        unknown;
  profile_goals:               unknown;
  profile_shared_sessions:     unknown;
  profile_health:              unknown;
  profile_nutrition:           unknown;
  calendar_upcoming:           unknown;
  workout_calendar:            unknown;
  messages_calls:              unknown;
  messages_chats:              unknown;
  workout_injuries:            unknown;
};

/** Every valid ViewStore key, derived from the registry. */
export type ViewKey = keyof ViewRegistry;
