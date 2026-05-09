import type { CardioState, CardioEvent, CardioSession } from "./types";

export const initialCardioState: CardioState = { sessions: [] };

export const cardioReducers: Record<
  string,
  (state: CardioState, event: CardioEvent) => CardioState
> = {
  CardioSessionRecorded: (state, event) => {
    if (event.type !== "CardioSessionRecorded") return state;
    const session: CardioSession = {
      id: event.payload.sessionId,
      userId: event.payload.userId,
      sport: event.payload.sport,
      startedAt: event.timestamp,
      durationSeconds: event.payload.durationSeconds,
      distanceMeters: event.payload.distanceMeters,
      notes: event.payload.notes,
      routeId: null,
    };
    return { sessions: [...state.sessions, session] };
  },

  CardioSessionUpdated: (state, event) => {
    if (event.type !== "CardioSessionUpdated") return state;
    const { sessionId, durationSeconds, distanceMeters, notes, title, location, ranWith } = event.payload;
    return {
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              ...(durationSeconds !== undefined && { durationSeconds }),
              ...(distanceMeters !== undefined && { distanceMeters }),
              ...(notes       !== undefined && { notes }),
              ...(title       !== undefined && { title }),
              ...(location    !== undefined && { location }),
              ...(ranWith     !== undefined && { ranWith }),
            }
          : s,
      ),
    };
  },

  CardioSessionDeleted: (state, event) => {
    if (event.type !== "CardioSessionDeleted") return state;
    return {
      sessions: state.sessions.filter((s) => s.id !== event.payload.sessionId),
    };
  },

  GpsTrackImported: (state, event) => {
    if (event.type !== "GpsTrackImported") return state;
    const { sessionId, track } = event.payload;
    return {
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              gpsTrack: track,
              durationSeconds: track.duration,
              distanceMeters: track.totalDistance,
            }
          : s,
      ),
    };
  },
};
