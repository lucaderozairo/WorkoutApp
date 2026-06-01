import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ActivityHistoryItem } from "@features/training_log";
import type { CardioSession } from "@features/cardio";
import { EllipsisVertical } from "lucide-react";
import { ACTIVITY_ICONS, getActivityLabel } from "@ui/icons/activityIcons";
import { Carousel } from "../shared";
import { Button, Surface } from "@ui/atoms";
import { Layer, Layered, Row, Column, Cluster } from "@ui/layout";

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
    <Layered>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="sm"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        aria-label="Session actions"
      >
        <EllipsisVertical size={16} />
      </Button>
      {open && (
        <Layer pin="below-right" z="fixed" className="dropdown surface column compact actions">
          <Button
            type="button"
            variant="ghost"
            block
            className="negative"
            onClick={e => { e.stopPropagation(); onDelete(); setOpen(false); }}
          >
            Delete session
          </Button>
        </Layer>
      )}
    </Layered>
  );
}

interface StrengthItemProps {
  session: ActivityHistoryItem;
  matchedExercise?: string;
  onDelete?: () => void;
}

export function StrengthSessionItem({ session, matchedExercise, onDelete }: StrengthItemProps) {
  const navigate = useNavigate();
  const { Icon: StrengthIcon } = ACTIVITY_ICONS['strength'];
  return (
    <Surface pad="sm" as="section">
      <Column>
      <Surface as="header" variant="ghost" pad="none" interactive onClick={() => navigate(`/sessions/${session.id}`)}>
        <Row justify="between" align="center">
          <Row align="center" className="grow">
            <StrengthIcon size={20} />
            <Column gap={1}>
              <span className="detail">{ACTIVITY_ICONS['strength'].label}</span>
              <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
                {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
              </time>
            </Column>
          </Row>
          {onDelete && <ActionMenu onDelete={onDelete} />}
        </Row>
      </Surface>
      <h3>{session.name}</h3>
      <Row align="center">
        <Column gap={1}>
          <h3>{session.exerciseCount}</h3>
          <p className="caption muted">Exercises</p>
        </Column>
        <Column gap={1}>
          <h3>{formatDuration(session.durationSeconds)}</h3>
          <p className="caption muted">Duration</p>
        </Column>
        <Column gap={1}>
          <h3>{session.totalSets}</h3>
          <p className="caption muted">Sets</p>
        </Column>
      </Row>
      <Carousel slides={session.media ?? []} />
      {session.notes && (
        <p className="detail muted">{session.notes}</p>
      )}
      {(session.category || session.tags?.length) && (
        <Cluster>
          <span className="pill">{session.category}</span>
          {session.tags?.map(tag => (
            <span key={tag} className="pill">{tag}</span>
          ))}
        </Cluster>
      )}
      {matchedExercise && (
        <span className="pill active">{matchedExercise}</span>
      )}
      </Column>
    </Surface>
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
  const title = session.title || getActivityLabel(session.sport);
  const { Icon: SportIcon } = ACTIVITY_ICONS[session.sport];
  const sportLabel = getActivityLabel(session.sport);

  return (
    <Surface pad="sm" as="section">
      <Column>
      <Surface as="header" variant="ghost" pad="none" interactive onClick={() => navigate(`/sessions/${session.id}`)}>
        <Row justify="between" align="center">
          <Row align="center" className="grow">
            <SportIcon size={20} />
            <Column gap={1}>
              <span className="detail">
                {sportLabel}{session.location && ` · ${session.location}`}
              </span>
              <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
                {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
              </time>
            </Column>
          </Row>
          {onDelete && <ActionMenu onDelete={onDelete} />}
        </Row>
      </Surface>
      <h3>{title}</h3>
      <Row align="center">
        {session.distanceMeters > 0 && (
          <Column gap={1}>
            <Row as="h3" align="end" gap={1}>
              {distKm}<span className="caption muted">km</span>
            </Row>
            <p className="caption muted">Distance</p>
          </Column>
        )}
        <Column gap={1}>
          <h3>{formatDuration(session.durationSeconds)}</h3>
          <p className="caption muted">Time</p>
        </Column>
        {pace && (
          <Column gap={1}>
            <h3>{pace}</h3>
            <p className="caption muted">Avg Pace</p>
          </Column>
        )}
      </Row>
      <Carousel slides={session.media ?? []} />
      {session.notes && (
        <p className="detail muted">{session.notes}</p>
      )}
      <Cluster>
        <span className="pill">{session.sport}</span>
      </Cluster>
      </Column>
    </Surface>
  );
}
