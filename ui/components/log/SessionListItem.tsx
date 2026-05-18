import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { SessionHistoryItem } from "@features/training_log";
import type { CardioSession } from "@features/cardio";
import { Dumbbell, EllipsisVertical } from "lucide-react";
import { PiQuestion } from "react-icons/pi";
import { ACTIVITY_ICONS } from "@ui/icons/activityIcons";
import { Carousel } from "../shared";

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


function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatRelativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface ActionMenuProps {
  onDelete: () => void;
}

function ActionMenu({ onDelete }: ActionMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        className="ghost icon sm"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        aria-label="Session actions"
      >
        <EllipsisVertical size={16} />
      </button>
      {open && (
        <div className="dropdown surface column compact absolute actions">
          <button
            type="button"
            className="ghost w-full negative"
            onClick={e => { e.stopPropagation(); onDelete(); setOpen(false); }}
          >
            Delete session
          </button>
        </div>
      )}
    </div>
  );
}

interface StrengthItemProps {
  session: SessionHistoryItem;
  matchedExercise?: string;
  onDelete?: () => void;
}

export function StrengthSessionItem({ session, matchedExercise, onDelete }: StrengthItemProps) {
  const navigate = useNavigate();
  return (
    <section
      className="surface compact">
      <header className="row space-between align-center surface bare interactive ghost"
        onClick={() => navigate(`/sessions/${session.id}`)}>
        <div className="align-center row grow">
          <Dumbbell size={20} />
          <div className="column compact">
            <span className="detail">Gym</span>
          <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
            {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
          </time>
          </div>
          
        </div>

        {onDelete && <ActionMenu onDelete={onDelete} />}
      </header>
      <h3>{session.name}</h3>
      <div className="align-center row">
        <div className="column compact">
          <h3>{session.exerciseCount}</h3>
          <p className="caption muted">Exercises</p>
        </div>
        <div className="column compact">
          <h3>{formatDuration(session.durationSeconds)}</h3>
          <p className="caption muted">Duration</p>
        </div>
        <div className="column compact">
          <h3>{session.totalSets}</h3>
          <p className="caption muted">Sets</p>
        </div>
      </div>
      <Carousel slides={session.media ?? []} />
      {session.notes && (
        <p className="detail muted">{session.notes}</p>
      )}
      {(session.category || session.tags?.length) && (
        <div className="cluster">
          <span className="pill">{session.category}</span>
          {session.tags?.map(tag => (
            <span key={tag} className="pill">{tag}</span>
          ))}
        </div>
      )}
      {matchedExercise && (
        <span className="pill active">{matchedExercise}</span>
      )}
    </section>
  );
}

interface CardioItemProps {
  session: CardioSession;
  onDelete?: () => void;
}

export function CardioSessionItem({ session, onDelete }: CardioItemProps) {
  const navigate = useNavigate();
  const distKm = (session.distanceMeters / 1000).toFixed(1);
  const pace = formatPace(session.durationSeconds, session.distanceMeters);
  const title =
    session.title ||
    session.sport.charAt(0).toUpperCase() + session.sport.slice(1);
  const { Icon: SportIcon } = ACTIVITY_ICONS[session.sport] ?? { Icon: PiQuestion };
  const sportLabel = session.sport.charAt(0).toUpperCase() + session.sport.slice(1);

  return (
    <section className="surface compact">
      <header className="row space-between align-center surface bare interactive ghost"
        onClick={() => navigate(`/sessions/${session.id}`)}>
        <div className="align-center row grow">
          <SportIcon size={20} />
          <div className="column compact">
            <span className="detail">
            {sportLabel}{session.location && ` · ${session.location}`}
          </span>
          <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
            {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
          </time>
          </div>
          
        </div>
        {onDelete && <ActionMenu onDelete={onDelete} />}
      </header>
      <h3>{title}</h3>
      <div className="align-center row">
        {session.distanceMeters > 0 && (
          <div className="column compact">
            <h3 className="align-bottom compact row">
              {distKm}<span className="caption muted">km</span>
            </h3>
            <p className="caption muted">Distance</p>
          </div>
        )}
        <div className="column compact">
          <h3>{formatDuration(session.durationSeconds)}</h3>
          <p className="caption muted">Time</p>
        </div>
        {pace && (
          <div className="column compact">
            <h3>{pace}</h3>
            <p className="caption muted">Avg Pace</p>
          </div>
        )}
      </div>
      <Carousel slides={session.media ?? []} />
      {session.notes && (
        <p className="detail muted">{session.notes}</p>
      )}
      <div className="cluster">
        <span className="pill">{session.sport}</span>
      </div>
    </section>
  );
}
