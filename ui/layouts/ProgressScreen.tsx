import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useCommand } from '@ui/bindings';
import { useExpandable } from '@ui/interactions/useExpandable';
import type { SessionHistoryItem, ActiveSessionView } from '@features/training_log';
import type { CardioSession, CardioSport, RecentCardioView } from '@features/cardio';
import type { Insight } from '@features/insights';
import type { Id } from '@shared/types';
import { EmptyState } from '@ui/components/shared/EmptyState';
import {
  handleAddAnnotation,
  handleDeleteAnnotation,
  getAnnotations,
} from '@features/progress_analysis';
import { ShareModal } from '@ui/components/modals/ShareModal';

import '@features/training_log';
import '@features/cardio';
import '@features/insights';
import '@features/progress_analysis';

type SportFilter = 'all' | 'lift' | CardioSport;

const SPORT_META: Record<CardioSport, { label: string; icon: string; color: string }> = {
  run:       { label: 'RUNS',       icon: '🏃', color: 'run' },
  cycle:     { label: 'CYCLING',    icon: '🚴', color: 'cycle' },
  swim:      { label: 'SWIMMING',   icon: '🏊', color: 'swim' },
  row:       { label: 'ROWING',     icon: '🚣', color: 'rowing' },
  hike:      { label: 'HIKING',     icon: '🥾', color: 'lift' },
  ski:       { label: 'SKIING',     icon: '⛷️', color: 'lift' },
  snowboard: { label: 'SNOWBOARD',  icon: '🏂', color: 'lift' },
  climb:     { label: 'CLIMBING',   icon: '🧗', color: 'lift' },
  surf:      { label: 'SURFING',    icon: '🏄', color: 'lift' },
  kayak:     { label: 'KAYAKING',   icon: '🛶', color: 'lift' },
  yoga:      { label: 'YOGA',       icon: '🧘', color: 'lift' },
  boxing:    { label: 'BOXING',     icon: '🥊', color: 'lift' },
  stretch:   { label: 'STRETCHING', icon: '🤸', color: 'lift' },
  hiit:      { label: 'HIIT',       icon: '⚡', color: 'lift' },
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

function SessionCard({ session }: { session: SessionHistoryItem }) {
  const navigate = useNavigate();
  const { expanded, toggle } = useExpandable();
  const [shareData, setShareData] = useState<{
    title: string; date: string; summary: string;
    details: Array<{ label: string; value: string }>;
  } | null>(null);

  const icon = categoryIcon(session.category);
  const accent = session.category === 'strength' ? 'lift' : 'run';

  return (
    <section className={`surface compact${session.hasPR ? ' accent' : ''}${expanded ? ' expanded' : ''}`} onClick={!expanded ? toggle : undefined}>
      <header className="row space-between">
        <div>
          <time className="caption">{new Date(session.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</time>
          <p>{session.name}</p>
          <div className="row">
            <span className={`pill ${accent}`}>{icon} {session.exerciseCount} exercises</span>
            {session.hasPR && <span className="pill active">🏆 PR</span>}
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
    default: return 'lift';
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
    <section className={`surface compact${expanded ? ' expanded' : ''}`} onClick={!expanded ? toggle : undefined}>
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
        {heartRate != null && <span className="pill lift">♥ {Math.round(heartRate)}bpm</span>}
        {elevationGain != null && elevationGain > 0 && <span className="pill">↑ {Math.round(elevationGain)}m</span>}
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

function SparkBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="spark-bars">
      {values.map((v, i) => (
        <div
          key={i}
          className="spark-bars__bar"
          style={
            { "--bar-h": `${Math.round((v / max) * 100)}%` } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ── Main Screen ── */

export function ProgressScreen({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [annExercise, setAnnExercise] = useState('');
  const [annDate, setAnnDate] = useState(new Date().toISOString().split('T')[0]);
  const [annLabel, setAnnLabel] = useState('');
  const [annColor, setAnnColor] = useState<'success' | 'warning' | 'info'>('info');
  const [showAnnForm, setShowAnnForm] = useState(false);

  const navigate = useNavigate();

  const history = (useQuery<SessionHistoryItem[]>('session_history') ?? []) as SessionHistoryItem[];

  const sessionsByType = useMemo(() => {
    const map = new Map<string, SessionHistoryItem[]>();
    for (const s of history) {
      map.set(s.name, [...(map.get(s.name) ?? []), s]);
    }
    return map;
  }, [history]);

  const insights = (useQuery<Insight[]>('insights') ?? []) as Insight[];

  const allCardio = ((useQuery<RecentCardioView>('recent_cardio_sessions') ?? { sessions: [] }) as RecentCardioView).sessions;

  const totalSets = history.reduce((acc, s) => acc + s.totalSets, 0);
  const prCount = history.filter(s => s.hasPR).length;

  const visibleCardioSports = Array.from(new Set(allCardio.map(s => s.sport))) as CardioSport[];

  const cardioBySport = (sport: CardioSport) => allCardio.filter(s => s.sport === sport);

  const { dispatch: dispatchAddAnnotation } = useCommand(handleAddAnnotation);
  const { dispatch: dispatchDeleteAnnotation } = useCommand(handleDeleteAnnotation);

  const handleAddAnn = async () => {
    if (!annExercise.trim() || !annLabel.trim()) return;
    await dispatchAddAnnotation({
      type: 'AddAnnotation',
      userId: 'user-001' as Id<'User'>,
      exerciseName: annExercise.trim(),
      dateIso: annDate,
      label: annLabel.trim(),
      color: annColor,
    });
    setAnnLabel('');
    setShowAnnForm(false);
  };

  const handleDeleteAnn = async (annotationId: Id<'Annotation'>) => {
    await dispatchDeleteAnnotation({ type: 'DeleteAnnotation', annotationId });
  };

  const allAnnotations = annExercise ? getAnnotations(annExercise) : [];

  const sportsToShow: CardioSport[] = sportFilter === 'all' || sportFilter === 'lift'
    ? visibleCardioSports
    : (visibleCardioSports.includes(sportFilter as CardioSport) ? [sportFilter as CardioSport] : []);

  return (
    <div className="column">
      {/* Sport filter */}
      <div className="tabs">
        <button className={sportFilter === 'all' ? 'active tab' : 'tab'} onClick={() => setSportFilter('all')}>All</button>
        <button className={sportFilter === 'lift' ? 'active tab' : 'tab'} onClick={() => setSportFilter('lift')}>🏋️</button>
        {visibleCardioSports.map(sport => (
          <button
            key={sport}
            className={sportFilter === sport ? 'active tab' : 'tab'}
            onClick={() => setSportFilter(sport)}
          >
            {SPORT_META[sport].icon}
          </button>
        ))}
      </div>

      {/* Lift sessions */}
      {(sportFilter === 'all' || sportFilter === 'lift') && (
        <>
          <section className="surface compact">
            <div className="row space-between">
              <div className="stat column align-center">
                <span className="detail">SESSIONS</span>
                <p className="value lift">{history.length}</p>
              </div>
              <div className="stat column align-center">
                <span className="detail">TOTAL SETS</span>
                <p className="value">{totalSets}</p>
              </div>
              <div className="stat column align-center">
                <span className="detail">PRS</span>
                <p className="value">{prCount}</p>
              </div>
            </div>
          </section>

          {Array.from(sessionsByType.entries()).map(([typeName, sessions]) => {
            const values = sessions.slice(-5).map((s) => s.totalSets);
            return (
              <section
                key={typeName}
                className="surface compact interactive"
                onClick={() => navigate(`/exercise/${encodeURIComponent(typeName)}`)}>
                <div className="row space-between">
                  <strong>{typeName}</strong>
                  <span className="pill plain active">{sessions.length}×</span>
                </div>
                <SparkBars values={values} />
                <p className="caption">Volume trend · last {values.length} session{values.length !== 1 ? "s" : ""}</p>
              </section>
            );
          })}
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
          <section key={sport} className="surface compact">
            <div className="row space-between">
              <strong>{meta.label}</strong>
              <span className="pill plain">{sessions.length}×</span>
            </div>
            <SparkBars values={values} />
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
