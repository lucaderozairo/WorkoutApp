import { useNavigate } from "react-router-dom";
import type { SessionHistoryItem } from "@features/training_log";
import type { CardioSession } from "@features/cardio";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

function formatPace(durationSeconds: number, distanceMeters: number): string {
  if (!distanceMeters || !durationSeconds) return "";
  const secsPerKm = durationSeconds / (distanceMeters / 1000);
  return `${Math.floor(secsPerKm / 60)}:${String(Math.floor(secsPerKm % 60)).padStart(2, "0")}/km`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

interface StrengthItemProps {
  session: SessionHistoryItem;
  matchedExercise?: string;
}

export function StrengthSessionItem({ session, matchedExercise }: StrengthItemProps) {
  const navigate = useNavigate();
  return (
    <section
      className="surface compact interactive"
      onClick={() => navigate(`/sessions/${session.id}`)}>
      <header className="row space-between align-center">
        <strong>{session.name}</strong>
        <time className="caption" dateTime={new Date(session.startedAt).toISOString()}>
          {formatDate(session.startedAt)}
        </time>
      </header>
      <div className="row align-center">
        <p className="caption">
          {session.exerciseCount} exercises · {formatDuration(session.durationSeconds)}
        </p>
      {session.hasPR && <span className="badge green">PR</span>}
      </div>
      {matchedExercise && (
        <span className="pill plain active">{matchedExercise}</span>
      )}
    </section>
  );
}

interface CardioItemProps {
  session: CardioSession;
}

export function CardioSessionItem({ session }: CardioItemProps) {
  const navigate = useNavigate();
  const distKm = (session.distanceMeters / 1000).toFixed(1);
  const pace = formatPace(session.durationSeconds, session.distanceMeters);
  const title =
    session.title ||
    session.sport.charAt(0).toUpperCase() + session.sport.slice(1);

  return (
    <section
      className="surface compact interactive"
      onClick={() => navigate(`/sessions/${session.id}`)}>
      <header className="row space-between align-center">
        <strong>{title}</strong>
        <time className="caption" dateTime={new Date(session.startedAt).toISOString()}>
          {formatDate(session.startedAt)}
        </time>
      </header>
      <p className="caption">
        {session.distanceMeters > 0
          ? `${distKm} km · `
          : ""}
        {formatDuration(session.durationSeconds)}
        {pace ? ` · ${pace}` : ""}
      </p>
    </section>
  );
}
