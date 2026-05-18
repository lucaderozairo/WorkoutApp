import type { SleepSession } from '@features/readiness';

function makeSleepSession(
    daysAgo: number,
    durationMin: number,
    score: number,
    stages: { deep: number; light: number; rem: number; awake: number },
): SleepSession {
    const end = new Date();
    end.setDate(end.getDate() - daysAgo);
    end.setHours(6, 30, 0, 0);
    return { start: new Date(end.getTime() - durationMin * 60_000), end, score, stages };
}

// 7 nights ending with last night (daysAgo = 0)
export const MOCK_SLEEP_WEEK: SleepSession[] = [
    makeSleepSession(6, 425, 72, { deep:  90, light: 195, rem:  95, awake: 45 }),
    makeSleepSession(5, 500, 85, { deep: 115, light: 220, rem: 110, awake: 55 }),
    makeSleepSession(4, 405, 65, { deep:  75, light: 200, rem:  85, awake: 45 }),
    makeSleepSession(3, 450, 78, { deep: 100, light: 205, rem:  95, awake: 50 }),
    makeSleepSession(2, 360, 58, { deep:  65, light: 175, rem:  75, awake: 45 }),
    makeSleepSession(1, 550, 90, { deep: 130, light: 240, rem: 120, awake: 60 }),
    makeSleepSession(0, 442, 84, { deep: 110, light: 185, rem:  88, awake: 59 }),
];

export function generateMockSleepHistory(
  days: number,
  endDate: Date = new Date(),
): SleepSession[] {
  const sessions: SleepSession[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const end = new Date(endDate);
    end.setDate(end.getDate() - i);
    end.setHours(6, 30, 0, 0);
    const durationMin = Math.round(420 + Math.sin(i * 1.9) * 70 + Math.sin(i * 0.5) * 30);
    const score = Math.round(Math.max(55, Math.min(95, 75 + Math.sin(i * 1.3) * 15 + Math.sin(i * 0.4) * 8)));
    const deep  = Math.round(durationMin * 0.18);
    const rem   = Math.round(durationMin * 0.20);
    const awake = Math.round(durationMin * 0.08);
    const light = durationMin - deep - rem - awake;
    sessions.push({
      start: new Date(end.getTime() - durationMin * 60_000),
      end,
      score,
      stages: { deep, light, rem, awake },
    });
  }
  return sessions;
}

export function generateMockWeekSessions(currentSession: SleepSession): SleepSession[] {
    const weekSessions: SleepSession[] = [];
    for (let i = 6; i >= 0; i--) {
        const day = new Date(currentSession.start);
        day.setDate(day.getDate() - i);
        const start = new Date(day);
        start.setHours(22, 30, 0, 0);
        const end = new Date(day);
        end.setDate(end.getDate() + 1);
        end.setHours(6, 45, 0, 0);

        const score = Math.floor(Math.random() * 40) + 60;
        const totalMin = Math.floor((end.getTime() - start.getTime()) / 60000);
        const deep = Math.floor(totalMin * 0.2);
        const rem = Math.floor(totalMin * 0.15);
        const awake = Math.floor(totalMin * 0.1);
        const light = totalMin - deep - rem - awake;

        weekSessions.push({ start, end, score, stages: { deep, light, rem, awake } });
    }
    return weekSessions;
}
