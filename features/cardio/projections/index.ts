import type { CardioEvent, CardioSession, CardioSport } from "../domain/types";
import { ProjectionBuilder } from "@data/projections/builders";
import { cardioReducers, initialCardioState } from "../domain/reducers";

export interface RecentCardioView {
  sessions: CardioSession[];
}

export interface MonthlyCardioEntry {
  sport: CardioSport;
  month: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  sessionCount: number;
}

/** `recent_cardio_sessions` — last 20 sessions, newest first */
export const recentCardioProjection = new ProjectionBuilder<
  RecentCardioView,
  CardioEvent
>(
  "recent_cardio_sessions",
  { sessions: [] },
  {
    CardioSessionRecorded: (view, event) => {
      const state = cardioReducers.CardioSessionRecorded(
        { sessions: view.sessions },
        event as CardioEvent,
      );
      const sorted = [...state.sessions]
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 20);
      return { sessions: sorted };
    },
    CardioSessionUpdated: (view, event) => {
      const state = cardioReducers.CardioSessionUpdated(
        { sessions: view.sessions },
        event as CardioEvent,
      );
      return { sessions: state.sessions };
    },
    CardioSessionDeleted: (view, event) => {
      const state = cardioReducers.CardioSessionDeleted(
        { sessions: view.sessions },
        event as CardioEvent,
      );
      return { sessions: state.sessions };
    },
    GpsTrackImported: (view, event) => {
      const state = cardioReducers.GpsTrackImported(
        { sessions: view.sessions },
        event as CardioEvent,
      );
      return { sessions: state.sessions };
    },
  },
);

/** `monthly_cardio_progression` — aggregated monthly stats per sport */
export const monthlyCardioProjection = new ProjectionBuilder<
  MonthlyCardioEntry[],
  CardioEvent
>("monthly_cardio_progression", [], {
  CardioSessionRecorded: (entries, event) => {
    if (event.type !== "CardioSessionRecorded") return entries;
    const { sport, durationSeconds, distanceMeters } = event.payload;
    const month = new Date(event.timestamp).toISOString().slice(0, 7);
    const existing = entries.find(
      (e) => e.sport === sport && e.month === month,
    );
    if (existing) {
      return entries.map((e) =>
        e.sport === sport && e.month === month
          ? {
              ...e,
              totalDistanceMeters: e.totalDistanceMeters + distanceMeters,
              totalDurationSeconds: e.totalDurationSeconds + durationSeconds,
              sessionCount: e.sessionCount + 1,
            }
          : e,
      );
    }
    return [
      ...entries,
      {
        sport,
        month,
        totalDistanceMeters: distanceMeters,
        totalDurationSeconds: durationSeconds,
        sessionCount: 1,
      },
    ];
  },
  CardioSessionDeleted: (entries) => entries,
  CardioSessionUpdated: (entries) => entries,
});

export { initialCardioState };
