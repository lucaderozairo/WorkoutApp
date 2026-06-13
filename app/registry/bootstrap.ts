/**
 * Feature bootstrap — the single, deterministic place where cross-feature
 * policies and projections are wired up.
 *
 * Previously each feature's command handler (training_log, cardio) and several
 * screens (Home, Profile) reached into peer features and called their
 * register* functions at import time. That coupled command handlers to 8 other
 * features and made initialization order depend on which screen loaded first
 * (deep-linking past Home left achievements/goals policies unregistered).
 *
 * Replay (applyAll) writes projections directly and never publishes to the
 * eventBus, so policies never fire during replay — meaning registration timing
 * relative to replay is irrelevant. The only ordering constraint is that the
 * register* calls (which seed viewStore with empty initial state) run BEFORE
 * persisted snapshots are loaded. bootstrapFeatures() is therefore called at
 * the very top of the entrypoint IIFE.
 *
 * All register* functions are individually idempotent; bootstrapFeatures() is
 * additionally guarded so repeat calls are no-ops.
 */

// ── Side-effect feature initialisation (each self-registers its own projections) ──
import '@features/training_log';
import '@features/cardio';
import '@features/planning';
import '@features/health';
import '@features/readiness';
import '@features/conditions';
import '@features/scheduling';
import '@features/news_feed';
import '@features/insights';
import '@features/templates';

// ── Cross-feature policies / projections ──
import { registerProgressionPolicy } from '@features/progression';
import { registerInsightsPolicy } from '@features/insights';
import { registerTrainingPlanProjections, registerAdherencePolicy } from '@features/training_plans';
import { registerGoalProjections, registerGoalUpdatePolicy } from '@features/goals';
import { registerHabitProjections, registerStreakMilestonePolicy } from '@features/habits';
import { registerTrainingLoadProjection } from '@features/progress_analysis';
import { registerBodyProjections, registerEquipmentMileagePolicy } from '@features/profile';
import { registerAchievementPolicies } from '@features/achievements';
import { registerTrainingDashboardProjection } from '@features/training_log/projections/dashboard';
import { registerSleepTrendProjection } from '@features/readiness/projections/sleepTrend';

let booted = false;

export function bootstrapFeatures(): void {
  if (booted) return;
  booted = true;

  registerProgressionPolicy();
  registerInsightsPolicy();
  registerTrainingPlanProjections();
  registerAdherencePolicy();
  registerGoalProjections();
  registerGoalUpdatePolicy();
  registerHabitProjections();
  registerStreakMilestonePolicy();
  registerTrainingLoadProjection();
  registerBodyProjections();
  registerEquipmentMileagePolicy();
  registerAchievementPolicies();
  registerTrainingDashboardProjection();
  registerSleepTrendProjection();
}
