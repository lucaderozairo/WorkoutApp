import { useNavigate } from "react-router-dom";
import type { ActivityHistoryItem } from "@features/training_log";
import type { CardioSession } from "@features/cardio";
import { EllipsisVertical } from "lucide-react";
import { ACTIVITY_ICONS, getActivityLabel } from "@ui/icons/activityIcons";
import { Carousel } from "../shared";
import { Surface, Text } from "@ui/atoms";
import { Badge, Dropdown } from "@ui/molecules";
import { Row, Column, Cluster } from "@ui/layout";
import { formatDuration, formatPace, paceSecPerKm } from "@shared/utils";

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
  return (
    <div onClick={e => e.stopPropagation()}>
      <Dropdown
        align="right"
        trigger={<EllipsisVertical size={16} aria-label="Session actions" />}
        items={[
          { label: "Delete session", onClick: onDelete, destructive: true },
        ]}
      />
    </div>
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
                <Text as="time" size="caption" color="muted" dateTime={new Date(session.startedAt).toISOString()}>
                  {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
                </Text>
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
  const pace = formatPace(paceSecPerKm(session.durationSeconds, session.distanceMeters), { suffix: true, empty: '' });
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
                <Text as="time" size="caption" color="muted" dateTime={new Date(session.startedAt).toISOString()}>
                  {formatRelativeTime(session.startedAt)} · {formatTime(session.startedAt)}
                </Text>
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
