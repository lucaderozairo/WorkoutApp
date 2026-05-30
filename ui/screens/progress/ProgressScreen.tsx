import React, { useState } from 'react';
import { Grid, Row, Column } from '@ui/layout';
import { useNavigate } from 'react-router-dom';
import { useExpandable } from '@ui/interactions/useExpandable';
import type { ActivityHistoryItem } from '@features/training_log';
import type { CardioSession, CardioSport } from '@features/cardio';
import { EmptyState, Tabs, StatTile, DetailRow } from '@ui/molecules';
import { Button, Badge } from '@ui/atoms';
import { SparklineArea } from '@ui/patterns/charts/domain-charts';
import { ShareModal } from '@ui/components/modals/ShareModal';
import { useProgressScreen } from './useProgressScreen';
import type { IconType } from 'react-icons';
import {
  MdDirectionsBike, MdDirectionsRun, MdDownhillSkiing, MdFitnessCenter, MdHiking,
  MdKayaking, MdPool, MdRowing, MdSelfImprovement, MdSnowboarding, MdSurfing, MdTerrain,
} from 'react-icons/md';
import { PiBoxingGlove, PiFlame, PiPersonSimpleTaiChi } from 'react-icons/pi';

import '@features/training_log';
import '@features/cardio';
import '@features/insights';
import '@features/progress_analysis';

const SPORT_META: Record<CardioSport, { label: string; Icon: IconType; color: string }> = {
  run:       { label: 'RUNS',       Icon: MdDirectionsRun,     color: 'run' },
  cycle:     { label: 'CYCLING',    Icon: MdDirectionsBike,    color: 'cycle' },
  swim:      { label: 'SWIMMING',   Icon: MdPool,              color: 'swim' },
  row:       { label: 'ROWING',     Icon: MdRowing,            color: 'rowing' },
  hike:      { label: 'HIKING',     Icon: MdHiking,            color: 'strength' },
  ski:       { label: 'SKIING',     Icon: MdDownhillSkiing,    color: 'strength' },
  snowboard: { label: 'SNOWBOARD',  Icon: MdSnowboarding,      color: 'strength' },
  climb:     { label: 'CLIMBING',   Icon: MdTerrain,           color: 'strength' },
  surf:      { label: 'SURFING',    Icon: MdSurfing,           color: 'strength' },
  kayak:     { label: 'KAYAKING',   Icon: MdKayaking,          color: 'strength' },
  yoga:      { label: 'YOGA',       Icon: MdSelfImprovement,   color: 'strength' },
  boxing:    { label: 'BOXING',     Icon: PiBoxingGlove,       color: 'strength' },
  stretch:   { label: 'STRETCHING', Icon: PiPersonSimpleTaiChi,color: 'strength' },
  hiit:      { label: 'HIIT',       Icon: PiFlame,             color: 'strength' },
};

const SPORT_SEGMENTS = 14;

function SegBar({ value, max, variant }: { value: number; max: number; variant?: string }) {
  const filled = Math.round((value / max) * SPORT_SEGMENTS);
  return (
    <div className={`seg-bar${variant ? ` ${variant}` : ''}`}>
      {Array.from({ length: SPORT_SEGMENTS }, (_, i) => (
        <div key={i} className={i < filled ? 'seg filled' : 'seg'} />
      ))}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function categoryIcon(category: string): string {
  switch (category) {
    case 'strength': return '🏋️';
    case 'cardio': return '🏃';
    case 'mobility': return '🧘';
    default: return '💪';
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Session Card (expandable) ── */

function SessionCard({ session }: { session: ActivityHistoryItem }) {
  const navigate = useNavigate();
  const { expanded, toggle } = useExpandable();
  const [shareData, setShareData] = useState<{
    title: string; date: string; summary: string;
    details: Array<{ label: string; value: string }>;
  } | null>(null);

  const icon = categoryIcon(session.category);
  const accent = session.category === 'strength' ? 'strength' : 'run';

  return (
    <section className={`surface tight${session.hasPR ? ' accent' : ''}${expanded ? ' expanded' : ''}`} onClick={!expanded ? toggle : undefined}>
      <header className="row space-between">
        <div>
          <time className="caption">{new Date(session.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</time>
          <p>{session.name}</p>
          <Row>
            <Badge variant={accent === 'run' ? 'run' : undefined}>{icon} {session.exerciseCount} exercises</Badge>
            {session.hasPR && <Badge active dot>🏆 PR</Badge>}
          </Row>
        </div>
        <div className="row">
          <SegBar value={session.totalSets} max={Math.max(session.totalSets, 10)} />
          <span>›</span>
        </div>
      </header>
      <Column className="expandable">
        <DetailRow label="Duration" value={formatDuration(session.durationSeconds)} />
        <DetailRow label="Total sets" value={session.totalSets} />
        <DetailRow label="Exercises" value={session.exerciseCount} />
        <Row>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            navigate(`/sessions/${session.id}`);
          }}>📋 Details</Button>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            setShareData({
              title: session.name,
              date: new Date(session.startedAt).toLocaleDateString(),
              summary: `${session.exerciseCount} exercises · ${session.totalSets} sets`,
              details: [
                { label: 'Duration', value: formatDuration(session.durationSeconds) },
                { label: 'Sets', value: String(session.totalSets) },
                { label: 'Exercises', value: String(session.exerciseCount) },
              ],
            });
          }}>📤 Share</Button>
        </Row>
      </Column>
      {shareData && <ShareModal type="session" data={shareData} onClose={() => setShareData(null)} />}
    </section>
  );
}

/* ── Cardio Session Card (expandable) ── */

function sportColor(sport: string): string {
  switch (sport) {
    case 'run': return 'run';
    case 'cycle': return 'cycle';
    case 'swim': return 'swim';
    case 'row': return 'rowing';
    default: return 'strength';
  }
}

function CardioSessionCard({ session }: { session: CardioSession }) {
  const navigate = useNavigate();
  const { expanded, toggle } = useExpandable();
  const color = sportColor(session.sport);
  const distKm = session.distanceMeters / 1000;
  const duration = formatDuration(session.durationSeconds);
  const pace = session.durationSeconds > 0 && session.distanceMeters > 0
    ? session.durationSeconds / (session.distanceMeters / 1000) : 0;
  const heartRate = session.gpsTrack?.avgHeartRate;
  const elevationGain = session.gpsTrack?.elevationGain;

  return (
    <section className={`surface tight${expanded ? ' expanded' : ''}`} onClick={!expanded ? toggle : undefined}>
      <header className="row space-between">
        <div>
          <time className="caption">{new Date(session.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
          <p>{session.sport.charAt(0).toUpperCase() + session.sport.slice(1)}{session.notes ? ` — ${session.notes}` : ''}</p>
        </div>
        <div>
          <p className={`value ${color}`}>{distKm.toFixed(1)}km</p>
          <time className="caption">{duration}</time>
        </div>
      </header>
      <Row>
        {pace > 0 && (
          <Badge variant={color === 'strength' ? undefined : (color as 'run' | 'cycle' | 'swim' | 'rowing')}>{Math.floor(pace / 60)}:{String(Math.floor(pace % 60)).padStart(2, '0')}/km</Badge>
        )}
        {heartRate != null && <Badge variant="lift" dot>♥ {Math.round(heartRate)}bpm</Badge>}
        {elevationGain != null && elevationGain > 0 && <Badge dot>↑ {Math.round(elevationGain)}m</Badge>}
      </Row>
      <Column className="expandable">
        <DetailRow label="Distance" value={`${distKm.toFixed(2)} km`} />
        <DetailRow label="Duration" value={duration} />
        {heartRate != null && (
          <DetailRow label="Avg heart rate" value={`${Math.round(heartRate)} bpm`} />
        )}
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation();
          navigate(`/sessions/${session.id}`);
        }}>📋 Details</Button>
      </Column>
    </section>
  );
}


/* ── Main Screen ── */

export function ProgressScreen({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const {
    navigate,
    sportFilter, setSportFilter,
    history,
    exerciseList,
    sessionsByType,
    insights,
    totalSets,
    prCount,
    visibleCardioSports,
    cardioBySport,
    sportsToShow,
  } = useProgressScreen();

  return (
    <Grid>
      {/* Sport filter */}
      <Tabs
        value={sportFilter}
        onChange={setSportFilter}
        items={[
          { id: 'all', label: 'All' },
          { id: 'strength', label: <MdFitnessCenter size={16} /> },
          ...visibleCardioSports.map(sport => {
            const { Icon } = SPORT_META[sport];
            return { id: sport, label: <Icon size={16} /> };
          }),
        ]}
      />

      {/* Lift sessions */}
      {(sportFilter === 'all' || sportFilter === 'strength') && (
        <>
          <section className="surface tight">
            <Grid variant="triple">
              <StatTile value={history.length} label="SESSIONS" />
              <StatTile value={totalSets} label="TOTAL SETS" />
              <StatTile value={prCount} label="PRS" />
            </Grid>
          </section>

          {Array.from(sessionsByType.entries()).map(([typeName, sessions]) => {
            const values = sessions.slice(-5).map((s) => s.totalSets);
            return (
              <section key={typeName} className="surface tight">
                <Row justify="between">
                  <strong>{typeName}</strong>
                  <Badge active>{sessions.length}×</Badge>
                </Row>
                <SparklineArea data={values.map((y, i) => ({ x: String(i), y }))} height={40} color="var(--accent)" />
                <p className="caption">Volume trend · last {values.length} session{values.length !== 1 ? "s" : ""}</p>
              </section>
            );
          })}

          {exerciseList.length > 0 && (
            <>
              <p className="h3">Exercises</p>
              {exerciseList.map(({ exerciseName, history: exHistory, plateauDetected }) => {
                const values = exHistory.slice(-5).map(e => e.oneRepMaxEstimate);
                const latest = exHistory[exHistory.length - 1];
                return (
                  <section
                    key={exerciseName}
                    className="surface compact interactive"
                    onClick={() => navigate(`/exercise/${encodeURIComponent(exerciseName)}`)}>
                    <Row justify="between">
                      <strong>{exerciseName}</strong>
                      <Row>
                        {plateauDetected && <Badge variant="warn" dot>⚠ Plateau</Badge>}
                        <Badge active>{exHistory.length}×</Badge>
                      </Row>
                    </Row>
                    <SparklineArea data={values.map((y, i) => ({ x: String(i), y }))} height={40} color="var(--accent)" />
                    <Row justify="between">
                      <p className="caption">Est. 1RM trend · last {values.length} session{values.length !== 1 ? 's' : ''}</p>
                      {latest && <span className="caption">{latest.maxWeightKg} kg</span>}
                    </Row>
                  </section>
                );
              })}
            </>
          )}

          {sessionsByType.size === 0 && (
            <EmptyState
              icon="📋"
              title="No sessions yet"
              message="Log your first workout in the Workout tab."
              action={
                onOpenSettings ? (
                  <Button variant="secondary" onClick={onOpenSettings}>
                    Import history
                  </Button>
                ) : undefined
              }
            />
          )}
        </>
      )}

      {/* Cardio sections — one per sport, dynamic */}
      {sportsToShow.map((sport) => {
        const sessions = cardioBySport(sport);
        const meta = SPORT_META[sport];
        const values = sessions
          .slice(-5)
          .map((s) => +(s.distanceMeters / 1000).toFixed(1));
        const totalKm = sessions.reduce((a, s) => a + s.distanceMeters / 1000, 0);
        return (
          <section key={sport} className="surface tight">
            <Row justify="between">
              <strong>{meta.label}</strong>
              <Badge>{sessions.length}×</Badge>
            </Row>
            <SparklineArea data={values.map((y, i) => ({ x: String(i), y }))} height={40} color="var(--accent)" />
            <p className="caption">
              Distance trend · last {values.length} session{values.length !== 1 ? "s" : ""}
            </p>
            <DetailRow label="Total distance" value={`${totalKm.toFixed(1)} km`} />
          </section>
        );
      })}

      {/* Insights */}
      {insights.length > 0 && (
        <>
          <p className="h3">Insights</p>
          {insights.slice(0, 3).map(i => (
            <div key={i.id} className={`insight ${i.severity}`}>
              <span className="badge">{i.severity}</span>
              <span className="message">{i.message}</span>
            </div>
          ))}
        </>
      )}
    </Grid>
  );
}
