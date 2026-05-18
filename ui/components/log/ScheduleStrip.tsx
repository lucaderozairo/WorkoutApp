// ui/components/log/ScheduleStrip.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ActivityHistoryItem } from "@features/training_log";
import type { CardioSession } from "@features/cardio";

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function buildWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ScheduleStripProps {
  strengthSessions: ActivityHistoryItem[];
  cardioSessions: CardioSession[];
}

export function ScheduleStrip({
  strengthSessions,
  cardioSessions,
}: ScheduleStripProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();

  const days = buildWeekDays(weekOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = isoDate(today);

  const sessionByDay = new Map<
    string,
    { sessionId: string; kind: "strength" | "cardio" }
  >();
  // Strength takes priority when both kinds exist on the same day
  for (const s of strengthSessions) {
    const key = isoDate(new Date(s.startedAt));
    if (!sessionByDay.has(key))
      sessionByDay.set(key, { sessionId: s.id, kind: "strength" });
  }
  for (const s of cardioSessions) {
    const key = isoDate(new Date(s.startedAt));
    if (!sessionByDay.has(key))
      sessionByDay.set(key, { sessionId: s.id, kind: "cardio" });
  }

  const monthLabel = days[0].toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="column compact">
      <div className="row space-between">
        <span>{monthLabel}</span>
        <div className="row compact">
          <button
            className="ghost sm"
            onClick={() => setWeekOffset((w) => w - 1)}>
            ‹ prev
          </button>
          <button
            className="ghost sm"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={weekOffset >= 0}>
            next ›
          </button>
        </div>
      </div>

      <div className="cal">
        {days.map((day, i) => {
          const key = isoDate(day);
          const isToday = key === todayIso;
          const meta = sessionByDay.get(key);
          const isFuture = !isToday && day > today;

          return (
            <button
              key={key}
              className={["day", isFuture ? "locked" : ""].filter(Boolean).join(" ")}
              data-today={isToday ? "" : undefined}
              data-kind={meta?.kind}
              onClick={() => meta && navigate(`/sessions/${meta.sessionId}`)}
              disabled={isFuture || (!meta && !isToday)}>
              <span>{DAY_LABELS[i]}</span>
              <span>{day.getDate()}</span>
              {meta && !isToday && (
                <span
                  className={`dot ${meta.kind === "strength" ? "lift" : "run"}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
