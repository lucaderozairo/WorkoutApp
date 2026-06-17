import { viewStore } from '@data/projections/views';
import type { TrainingDashboardView } from './dashboardTypes';
import type { ActivityHistoryItem } from './index';
import { getActivityHistory } from '../queries';

// ─── Pure computation ──────────────────────────────────────────

export function computeDashboard(history: ActivityHistoryItem[]): TrainingDashboardView {
  if (history.length === 0) return { streak: 0, workoutsThisWeek: 0, totalSessions: 0 };

  // workoutsThisWeek — Mon–Sun calendar week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sun
  const daysFromMon = (dayOfWeek + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysFromMon);
  startOfWeek.setHours(0, 0, 0, 0);
  const workoutsThisWeek = history.filter(s => new Date(s.startedAt) >= startOfWeek).length;

  // streak — consecutive training days ending today or yesterday
  const trained = new Set(history.map(s => new Date(s.startedAt).toLocaleDateString()));
  const cursor = new Date();
  if (!trained.has(cursor.toLocaleDateString())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (trained.has(cursor.toLocaleDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { streak, workoutsThisWeek, totalSessions: history.length };
}

// ─── Registration ─────────────────────────────────────────────

let registered = false;

export function registerTrainingDashboardProjection(): void {
  if (registered) return;
  registered = true;

  const history = getActivityHistory();
  viewStore.set('training_log_dashboard', computeDashboard(history));
  viewStore.set('activity_history', history);

  viewStore.subscribe('sessions', () => {
    const h = getActivityHistory();
    viewStore.set('training_log_dashboard', computeDashboard(h));
    viewStore.set('activity_history', h);
  });
}
