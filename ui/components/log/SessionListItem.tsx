import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ActivityHistoryItem } from "@features/training_log";
import type { CardioSession } from "@features/cardio";
import { EllipsisVertical } from "lucide-react";
import { ACTIVITY_ICONS, getActivityLabel } from "@ui/icons/activityIcons";
import { Carousel } from "../shared";
import { Surface, Text } from "@ui/atoms";
import { Badge, Button } from "@ui/molecules";
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
        <Layer pin="below-right" z="fixed" className="dropdown surface actions">
          <Column gap={1}>
            <Button
              type="button"
              variant="ghost"
              block
              className="negative"
              onClick={e => { e.stopPropagation(); onDelete(); setOpen(false); }}
            >
              Delete session
            </Button>
          </Column>
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
            <Row align="center" className="min-w-0">
              <StrengthIcon size={20} />
              <Column gap={1}>
                <Text size="detail">{ACTIVITY_ICONS['strength'].label}</Text>
                <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
                  {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
                </time>
              </Column>
            </Row>
            {onDelete && <ActionMenu onDelete={onDelete} />}
          </Row>
        </Surface>
        <Text as="h3">{session.name}</Text>
        <Row align="center">
          <Column gap={1}>
            <Text as="h3">{session.exerciseCount}</Text>
            <Text size="caption" color="muted">Exercises</Text>
          </Column>
          <Column gap={1}>
            <Text as="h3">{formatDuration(session.durationSeconds)}</Text>
            <Text size="caption" color="muted">Duration</Text>
          </Column>
          <Column gap={1}>
            <Text as="h3">{session.totalSets}</Text>
            <Text size="caption" color="muted">Sets</Text>
          </Column>
        </Row>
        <Carousel slides={session.media ?? []} />
        {session.notes && (
          <Text size="detail" color="muted">{session.notes}</Text>
        )}
        {(session.category || session.tags?.length) && (
          <Cluster>
            <Badge>{session.category}</Badge>
            {session.tags?.map(tag => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </Cluster>
        )}
        {matchedExercise && (
          <Badge active>{matchedExercise}</Badge>
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
            <Row align="center" className="min-w-0">
              <SportIcon size={20} />
              <Column gap={1}>
                <Text size="detail">
                  {sportLabel}{session.location && ` · ${session.location}`}
                </Text>
                <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
                  {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
                </time>
              </Column>
            </Row>
            {onDelete && <ActionMenu onDelete={onDelete} />}
          </Row>
        </Surface>
        <Text as="h3">{title}</Text>
        <Row align="center">
          {session.distanceMeters > 0 && (
            <Column gap={1}>
              <Row as="h3" align="end" gap={1}>
                {distKm}<Text as="span" size="caption" color="muted">km</Text>
              </Row>
              <Text size="caption" color="muted">Distance</Text>
            </Column>
          )}
          <Column gap={1}>
            <Text as="h3">{formatDuration(session.durationSeconds)}</Text>
            <Text size="caption" color="muted">Time</Text>
          </Column>
          {pace && (
            <Column gap={1}>
              <Text as="h3">{pace}</Text>
              <Text size="caption" color="muted">Avg Pace</Text>
            </Column>
          )}
        </Row>
        <Carousel slides={session.media ?? []} />
        {session.notes && (
          <Text size="detail" color="muted">{session.notes}</Text>
        )}
        <Cluster>
          <Badge>{session.sport}</Badge>
        </Cluster>
      </Column>
    </Surface>
  );
}
