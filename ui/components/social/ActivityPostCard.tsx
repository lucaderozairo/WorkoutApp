import { useNavigate } from 'react-router-dom';
import type { ActivityHistoryItem } from '@features/training_log';
import type { CardioSession, CardioSport } from '@features/cardio';
import type { SportType } from '@features/training_log/domain/types';
import { ACTIVITY_ICONS, getActivityLabel } from '@ui/icons/activityIcons';
import { Carousel } from '../shared';
import { timeAgo } from '@shared/utils/timeAgo';
import { USER_NAME, USER_INITIALS } from '@features/social/domain/constants';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface, Avatar, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';

const SPORT_AVATAR: Partial<Record<CardioSport, string>> = {
  run: 'run', cycle: 'cycle', swim: 'swim', row: 'rowing',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

function formatPace(durationSeconds: number, distanceMeters: number): string {
  if (!distanceMeters || !durationSeconds) return '';
  const secsPerKm = durationSeconds / (distanceMeters / 1000);
  return `${Math.floor(secsPerKm / 60)}:${String(Math.floor(secsPerKm % 60)).padStart(2, '0')}/km`;
}

export function StrengthActivityCard({ session }: { session: ActivityHistoryItem }) {
  const navigate = useNavigate();
  const { Icon: SportIcon, label } = ACTIVITY_ICONS[session.primarySport];
  return (
    <Surface>
      <Row as="header" justify="between">
        <Row>
          <Avatar name={USER_INITIALS} className="lift" />
          <Column gap={1}>
            <Text>{USER_NAME}</Text>
            <Row align="center">
              <SportIcon size={13} />
              <Text size="caption" color="muted">{label}</Text>
            </Row>
          </Column>
        </Row>
        <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
          {timeAgo(session.startedAt)}
        </time>
      </Row>
      <h3 className="interactive" onClick={() => navigate(`/sessions/${session.id}`)}>{session.name}</h3>
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
      {session.notes && <Text size="detail" color="muted">{session.notes}</Text>}
      {(session.category || session.tags?.length) && (
        <Cluster>
          <Badge>{session.category}</Badge>
          {session.tags?.map(tag => <Badge key={tag}>{tag}</Badge>)}
        </Cluster>
      )}
    </Surface>
  );
}

export function CardioActivityCard({ session }: { session: CardioSession }) {
  const navigate = useNavigate();
  const { Icon: SportIcon } = ACTIVITY_ICONS[session.sport as SportType];
  const sportLabel = getActivityLabel(session.sport as SportType);
  const avatarClass = SPORT_AVATAR[session.sport] ?? 'lift';
  const distKm = (session.distanceMeters / 1000).toFixed(1);
  const pace = formatPace(session.durationSeconds, session.distanceMeters);
  const title = session.title || sportLabel;

  return (
    <Surface>
      <Row as="header" justify="between">
        <Row>
          <Avatar name={USER_INITIALS} className={avatarClass} />
          <Column gap={1}>
            <Text>{USER_NAME}</Text>
            <Row align="center">
              <SportIcon size={13} />
              <Text size="caption" color="muted">
                {sportLabel}{session.location && ` · ${session.location}`}
              </Text>
            </Row>
          </Column>
        </Row>
        <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
          {timeAgo(session.startedAt)}
        </time>
      </Row>
      <h3 className="interactive" onClick={() => navigate(`/sessions/${session.id}`)}>{title}</h3>
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
      {session.notes && <Text size="detail" color="muted">{session.notes}</Text>}
      <Cluster>
        <Badge>{sportLabel}</Badge>
      </Cluster>
    </Surface>
  );
}
