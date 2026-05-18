import { useNavigate } from 'react-router-dom';
import type { ActivityHistoryItem } from '@features/training_log';
import type { CardioSession, CardioSport } from '@features/cardio';
import type { SportType } from '@features/training_log/domain/types';
import { ACTIVITY_ICONS, getActivityLabel } from '@ui/icons/activityIcons';
import { Carousel } from '../shared';
import { timeAgo } from '@shared/utils/timeAgo';
import { USER_NAME, USER_INITIALS } from '@features/social/domain/constants';

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
    <section className="surface">
      <header className="row space-between">
        <div className="row">
          <div className="avatar lift">{USER_INITIALS}</div>
          <div className="column compact">
            <p>{USER_NAME}</p>
            <div className="align-center row">
              <SportIcon size={13} />
              <span className="caption muted">{label}</span>
            </div>
          </div>
        </div>
        <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
          {timeAgo(session.startedAt)}
        </time>
      </header>
      <h3 className="interactive" onClick={() => navigate(`/sessions/${session.id}`)}>{session.name}</h3>
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
      {session.notes && <p className="detail muted">{session.notes}</p>}
      {(session.category || session.tags?.length) && (
        <div className="cluster">
          <span className="pill">{session.category}</span>
          {session.tags?.map(tag => <span key={tag} className="pill">{tag}</span>)}
        </div>
      )}
    </section>
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
    <section className="surface">
      <header className="row space-between">
        <div className="row">
          <div className={`avatar ${avatarClass}`}>{USER_INITIALS}</div>
          <div className="column compact">
            <p>{USER_NAME}</p>
            <div className="align-center row">
              <SportIcon size={13} />
              <span className="caption muted">
                {sportLabel}{session.location && ` · ${session.location}`}
              </span>
            </div>
          </div>
        </div>
        <time className="caption muted" dateTime={new Date(session.startedAt).toISOString()}>
          {timeAgo(session.startedAt)}
        </time>
      </header>
      <h3 className="interactive" onClick={() => navigate(`/sessions/${session.id}`)}>{title}</h3>
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
      {session.notes && <p className="detail muted">{session.notes}</p>}
      <div className="cluster">
        <span className="pill">{sportLabel}</span>
      </div>
    </section>
  );
}
