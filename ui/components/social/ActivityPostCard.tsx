import { useNavigate } from 'react-router-dom';
import type { ActivityHistoryItem } from '@features/training_log';
import type { CardioSession, CardioSport } from '@features/cardio';
import type { SportType } from '@features/training_log/domain/types';
import { ACTIVITY_ICONS, getActivityLabel } from '@ui/icons/activityIcons';
import { Carousel } from '../shared';
import { timeAgo } from '@shared/utils/timeAgo';
import { USER_NAME, USER_INITIALS } from '@features/social/domain/constants';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface } from '@ui/atoms';

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
          <div className="avatar lift">{USER_INITIALS}</div>
          <Column gap={1}>
            <p>{USER_NAME}</p>
            <Row align="center">
              <SportIcon size={13} />
              <span className="caption muted">{label}</span>
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
      {session.notes && <p className="detail muted">{session.notes}</p>}
      {(session.category || session.tags?.length) && (
        <Cluster>
          <span className="pill">{session.category}</span>
          {session.tags?.map(tag => <span key={tag} className="pill">{tag}</span>)}
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
          <div className={`avatar ${avatarClass}`}>{USER_INITIALS}</div>
          <Column gap={1}>
            <p>{USER_NAME}</p>
            <Row align="center">
              <SportIcon size={13} />
              <span className="caption muted">
                {sportLabel}{session.location && ` · ${session.location}`}
              </span>
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
      {session.notes && <p className="detail muted">{session.notes}</p>}
      <Cluster>
        <span className="pill">{sportLabel}</span>
      </Cluster>
    </Surface>
  );
}
