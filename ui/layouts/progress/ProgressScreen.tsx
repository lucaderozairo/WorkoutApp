import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpandable } from '@ui/interactions/useExpandable';
import type { ActivityHistoryItem } from '@features/training_log';
import type { CardioSession, CardioSport } from '@features/cardio';
import { EmptyState } from '@ui/components/shared/EmptyState';
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
          <div className="row">
            <span className={`pill ${accent}`}>{icon} {session.exerciseCount} exercises</span>
            {session.hasPR && <span className="pill active"><span className="dot" />🏆 PR</span>}
          </div>
        </div>
        <div className="row">
          <SegBar value={session.totalSets} max={Math.max(session.totalSets, 10)} />
          <span>›</span>
        </div>
      </header>
      <div className="expandable column">
        <div className="row space-between">
          <span className="caption">Duration</span>
          <span className="value">{formatDuration(session.durationSeconds)}</span>
        </div>
        <div className="row space-between">
          <span className="caption">Total sets</span>
          <span className="value">{session.totalSets}</span>
        </div>
        <div className="row space-between">
          <span className="caption">Exercises</span>
          <span className="value">{session.exerciseCount}</span>
        </div>
        <div className="row">
          <button className="ghost sm" onClick={(e) => {
            e.stopPropagation();
            navigate(`/sessions/${session.id}`);
          }}>📋 Details</button>
          <button className="ghost sm" onClick={(e) => {
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
          }}>📤 Share</button>
        </div>
      </div>
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
      <div className="row">
        {pace > 0 && (
          <span className={`pill ${color}`}>{Math.floor(pace / 60)}:{String(Math.floor(pace % 60)).padStart(2, '0')}/km</span>
        )}
        {heartRate != null && <span className="pill lift"><span className="dot" />♥ {Math.round(heartRate)}bpm</span>}
        {elevationGain != null && elevationGain > 0 && <span className="pill"><span className="dot" />↑ {Math.round(elevationGain)}m</span>}
      </div>
      <div className="expandable column">
        <div className="row space-between">
          <span className="caption">Distance</span>
          <span className="value">{distKm.toFixed(2)} km</span>
        </div>
        <div className="row space-between">
          <span className="caption">Duration</span>
          <span className="value">{duration}</span>
        </div>
        {heartRate != null && (
          <div className="row space-between">
            <span className="caption">Avg heart rate</span>
            <span className="value">{Math.round(heartRate)} bpm</span>
          </div>
        )}
        <button className="ghost sm" onClick={(e) => {
          e.stopPropagation();
          navigate(`/sessions/${session.id}`);
        }}>📋 Details</button>
      </div>
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
    <div className="column">
      {/* Sport filter */}
      <div className="tabs">
        <button className={sportFilter === 'all' ? 'active tab' : 'tab'} onClick={() => setSportFilter('all')}>All</button>
        <button className={sportFilter === 'strength' ? 'active tab' : 'tab'} onClick={() => setSportFilter('strength')}><MdFitnessCenter size={16} /></button>
        {visibleCardioSports.map(sport => {
          const { Icon } = SPORT_META[sport];
          return (
            <button
              key={sport}
              className={sportFilter === sport ? 'active tab' : 'tab'}
              onClick={() => setSportFilter(sport)}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      {/* Lift sessions */}
      {(sportFilter === 'all' || sportFilter === 'strength') && (
        <>
          <section className="surface tight">
            <div className="row space-between">
              <div className="column compact align-center">
                <span className="detail">SESSIONS</span>
                <p className="value lift">{history.length}</p>
              </div>
              <div className="column compact align-center">
                <span className="detail">TOTAL SETS</span>
                <p className="value">{totalSets}</p>
              </div>
              <div className="column compact align-center">
                <span className="detail">PRS</span>
                <p className="value">{prCount}</p>
              </div>
            </div>
          </section>

          {Array.from(sessionsByType.entries()).map(([typeName, sessions]) => {
            const values = sessions.slice(-5).map((s) => s.totalSets);
            return (
              <section key={typeName} className="surface tight">
                <div className="row space-between">
                  <strong>{typeName}</strong>
                  <span className="pill active">{sessions.length}×</span>
                </div>
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
                    <div className="row space-between">
                      <strong>{exerciseName}</strong>
                      <div className="row">
                        {plateauDetected && <span className="pill warn"><span className="dot" />⚠ Plateau</span>}
                        <span className="pill active">{exHistory.length}×</span>
                      </div>
                    </div>
                    <SparklineArea data={values.map((y, i) => ({ x: String(i), y }))} height={40} color="var(--accent)" />
                    <div className="row space-between">
                      <p className="caption">Est. 1RM trend · last {values.length} session{values.length !== 1 ? 's' : ''}</p>
                      {latest && <span className="caption">{latest.maxWeightKg} kg</span>}
                    </div>
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
                  <button type="button" className="secondary" onClick={onOpenSettings}>
                    Import history
                  </button>
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
            <div className="row space-between">
              <strong>{meta.label}</strong>
              <span className="pill">{sessions.length}×</span>
            </div>
            <SparklineArea data={values.map((y, i) => ({ x: String(i), y }))} height={40} color="var(--accent)" />
            <p className="caption">
              Distance trend · last {values.length} session{values.length !== 1 ? "s" : ""}
            </p>
            <div className="row space-between">
              <span className="caption">Total distance</span>
              <span>{totalKm.toFixed(1)} km</span>
            </div>
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
    </div>
  );
}
