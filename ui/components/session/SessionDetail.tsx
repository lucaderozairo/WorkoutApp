import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ActiveSessionView, SessionHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio';
import { handleImportGpsTrack, handleUpdateCardioSession } from '@features/cardio';
import type { SetEntry, StrengthSet } from '@features/training_log/domain/types';
import type { GpsTrack } from '@data/sources/files/gps';
import { SessionGpsPreview } from './SessionGpsPreview';
import { ImportModal } from '../modals/ImportModal';
import { HROverTimeChart, PaceOverTimeChart, ElevationProfileChart, KmSplitsTable, CHART_H, TICK, TOOLTIP_STYLE } from '../shared/Charts';

interface SampleCardioSession {
  id: string;
  sport: string;
  title: string;
  distanceMeters: number;
  durationSeconds: number;
  avgPacePerKm: number;
  heartRate?: number;
  elevationGain?: number;
  power?: number;
  createdAt: number;
}

interface SessionDetailProps {
  session: ActiveSessionView | SessionHistoryItem | CardioSession | SampleCardioSession;
  onClose?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  asPage?: boolean;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatPace(secondsPerKm: number): string {
  if (secondsPerKm <= 0) return '--:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

function sportIcon(sport: string): string {
  const icons: Record<string, string> = {
    run: '🏃', cycle: '🚴', swim: '🏊', row: '🚣', hike: '🥾', ski: '⛷️',
  };
  return icons[sport] ?? '🏋️';
}

function categoryIcon(category: string): string {
  switch (category) {
    case 'strength': return '🏋️';
    case 'cardio': return '🏃';
    case 'mobility': return '🧘';
    default: return '💪';
  }
}

function sportColor(sport: string): string {
  switch (sport) {
    case 'run': return 'run';
    case 'cycle': return 'cycle';
    case 'swim': return 'swim';
    case 'row': return 'rowing';
    default: return 'lift';
  }
}

function isSessionHistoryItem(s: unknown): s is SessionHistoryItem {
  return typeof (s as SessionHistoryItem).totalSets === 'number';
}

function isCardioSession(s: unknown): s is CardioSession {
  const obj = s as Record<string, unknown>;
  return typeof obj.sport === 'string' && 'distanceMeters' in obj && 'userId' in obj;
}

function isSampleCardioSession(s: unknown): s is SampleCardioSession {
  const obj = s as Record<string, unknown>;
  return typeof obj.sport === 'string' && 'distanceMeters' in obj && 'createdAt' in obj;
}

function isActiveSessionView(s: unknown): s is ActiveSessionView {
  return Array.isArray((s as ActiveSessionView).blocks);
}

function isStrengthSet(s: SetEntry): s is StrengthSet {
  return s.type === 'strength';
}

/* ── Inline editable title ── */

function EditableTitle({
  value,
  onSave,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        autoFocus
      />
    );
  }

  return (
    <h2 className="interactive" onClick={startEdit} title="Click to edit">
      {value || <span className="faint">{placeholder}</span>}
    </h2>
  );
}

/* ── Social bar ── */

function SocialBar({ session }: { session: CardioSession }) {
  const [liked, setLiked] = useState(false);
  const [showRanWithInput, setShowRanWithInput] = useState(false);
  const [ranWithDraft, setRanWithDraft] = useState('');
  const ranWith = session.ranWith ?? [];

  function addRanWith() {
    const name = ranWithDraft.trim();
    if (!name) return;
    handleUpdateCardioSession({
      type: 'UpdateCardioSession',
      sessionId: session.id,
      ranWith: [...ranWith, name],
    });
    setRanWithDraft('');
    setShowRanWithInput(false);
  }

  function removeRanWith(name: string) {
    handleUpdateCardioSession({
      type: 'UpdateCardioSession',
      sessionId: session.id,
      ranWith: ranWith.filter(n => n !== name),
    });
  }

  return (
    <div className="row space-between align-center">
      <div className="cluster">
        <button type="button" className="ghost" onClick={() => setShowRanWithInput(true)}>
          + Ran with
        </button>
        {ranWith.map(name => (
          <span key={name} className="pill plain">
            {name}
            <button type="button" className="ghost icon" onClick={() => removeRanWith(name)}>×</button>
          </span>
        ))}
        {showRanWithInput && (
          <input
            className="input input--sm"
            placeholder="Name"
            value={ranWithDraft}
            onChange={e => setRanWithDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addRanWith(); if (e.key === 'Escape') setShowRanWithInput(false); }}
            onBlur={() => { if (!ranWithDraft.trim()) setShowRanWithInput(false); }}
            autoFocus
          />
        )}
      </div>
      <div className="row compact align-center">
        <button
          type="button"
          className={`ghost${liked ? ' active' : ''}`}
          onClick={() => setLiked(l => !l)}
        >
          ♥ {liked ? 1 : 0}
        </button>
        <button type="button" className="ghost">💬 0</button>
      </div>
    </div>
  );
}

/* ── Per-session set weight chart ── */

function niceStep(max: number): number {
  if (max <= 25) return 5;
  if (max <= 50) return 10;
  if (max <= 100) return 20;
  if (max <= 200) return 40;
  return 50;
}

function SessionSetChart({ sets }: { sets: StrengthSet[] }) {
  if (sets.length < 1) return null;
  const data = sets.map((s, i) => ({
    x: i + 1,
    y: s.weightKg,
    reps: s.reps,
    timed: s.setType === 'emom',
  }));
  const maxWeight = Math.max(...sets.map(s => s.weightKg));
  const step = niceStep(maxWeight);
  const yMax = Math.ceil(maxWeight / step) * step + step;
  const ticks = Array.from({ length: Math.floor(yMax / step) + 1 }, (_, i) => i * step);

  const renderLabel = (props: any) => {
    const entry = data[props.index];
    if (!entry) return null;
    const text = `${entry.y}kg × ${entry.reps}${entry.timed ? 's' : ''}`;
    return (
      <text x={props.x + props.width / 2} y={props.y - 5} textAnchor="middle" fontSize={9} fill="var(--ink-faint)">
        {text}
      </text>
    );
  };

  return (
    <div className="row align-center">
      <span className="chart-ylabel">kg</span>
      <ResponsiveContainer width="100%" height={CHART_H.sm}>
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="x"
            tick={TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, yMax]}
            ticks={ticks}
            tick={TICK}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: any) => [`${v} kg`, 'Weight']}
            labelFormatter={(x: any) => `Set ${x}`}
          />
          <Bar
            dataKey="y"
            fill="var(--color-primary)"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
            label={{ content: renderLabel }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Strength Session Detail ── */

function StrengthDetail({ session }: { session: ActiveSessionView }) {
  return (
    <div className="column">
      {session.blocks.map(block => {
        const strengthSets = block.sets.filter(isStrengthSet);
        return (
          <section key={block.id} className="surface">
            <header className="row space-between align-center">
              <div className="row align-center">
                <span>{categoryIcon(block.exerciseCategory)}</span>
                <Link to={`/exercise/${encodeURIComponent(block.exerciseName)}`} className="link">
                  {block.exerciseName}
                </Link>
              </div>
              {block.blockType && (
                <span className={`pill ${block.blockType}`}>{block.blockType}</span>
              )}
            </header>
            <SessionSetChart sets={strengthSets} />
            {block.sets.length > 0 && (
              <table className="center">
                <tbody>
                <tr className="">
                  <th className="caption">#</th>
                  <th className="caption">kg</th>
                  <th className="caption">reps</th>
                  <th className="caption">type</th>
                  <th className="caption">RPE</th>
                  <th className="caption">✕</th>
                </tr>
                {block.sets.map((set, i) => (
                  <tr key={i} className="">
                    <td className="caption">{i + 1}</td>
                    {isStrengthSet(set) ? (
                      <>
                        <td>{set.weightKg}</td>
                        <td>{set.reps}</td>
                        <td className="caption">{set.setType ?? 'normal'}</td>
                        <td>{set.rpe != null ? set.rpe : '—'}</td>
                        <td className="caption">{set.failed ? '✕' : ''}</td>
                      </>
                    ) : (
                      <>
                        <td>{(set as any).distanceMeters ?? '—'}</td>
                        <td>{(set as any).durationSeconds ?? '—'}</td>
                        <td className="caption">cardio</td>
                        <td>—</td>
                        <td></td>
                      </>
                    )}
                  </tr>
                ))}
                </tbody>
              </table>
            )}
            {block.notes && <p className="caption">{block.notes}</p>}
          </section>
        );
      })}
    </div>
  );
}

/* ── Cardio Session Detail ── */

function CardioDetail({ session }: { session: CardioSession }) {
  const [showImport, setShowImport] = useState(false);
  const distKm = session.distanceMeters / 1000;
  const pace =
    session.durationSeconds > 0 && session.distanceMeters > 0
      ? session.durationSeconds / (session.distanceMeters / 1000)
      : 0;
  const color = sportColor(session.sport);
  const track = session.gpsTrack;
  const hasSecondary = track && (
    track.avgHeartRate != null || track.maxHeartRate != null ||
    track.calories != null || track.avgPower != null
  );

  async function handleAttach(importedTrack: GpsTrack) {
    await handleImportGpsTrack({
      type: 'ImportGpsTrack',
      sessionId: session.id,
      track: importedTrack,
    });
    setShowImport(false);
  }

  return (
    <div className="column">
      {/* Primary stats */}
      <section className="surface row space-between">
        <div className="stat column align-center">
          <span className="caption">DISTANCE</span>
          <p className={`detail ${color}`}>{distKm.toFixed(2)} <span className="caption">km</span></p>
        </div>
        <div className="stat column align-center">
          <span className="caption">DURATION</span>
          <p className="detail">{formatDuration(session.durationSeconds)}</p>
        </div>
        <div className="stat column align-center">
          <span className="caption">PACE</span>
          <p className="detail">{formatPace(pace)}</p>
        </div>
        {track?.elevationGain != null && (
          <div className="stat column align-center">
            <span className="caption">ELEVATION</span>
            <p className="detail">+{Math.round(track.elevationGain)} <span className="caption">m</span></p>
          </div>
        )}
      </section>
      {/* Map */}
      {track && (track.points?.length ?? 0) >= 2 ? (
        <section className='surface compact' >
          <SessionGpsPreview track={track} sessionId={session.id} />
        </section>

      ) : (
        <section className="surface compact">
          <button type="button" className="ghost" onClick={() => setShowImport(true)}>
            + Attach GPS file
          </button>
        </section>
      )}



      {/* Secondary stats */}
      {hasSecondary && (
        <section className="surface compact">
          <div className="cluster">
            {track.avgHeartRate != null && (
              <span className="pill plain">AVG HR <strong>{track.avgHeartRate} bpm</strong></span>
            )}
            {track.maxHeartRate != null && (
              <span className="pill plain">MAX HR <strong>{track.maxHeartRate}</strong></span>
            )}
            {track.calories != null && (
              <span className="pill plain">CALORIES <strong>{track.calories} kcal</strong></span>
            )}
            {track.avgPower != null && (
              <span className="pill plain">POWER <strong>{track.avgPower} W</strong></span>
            )}
          </div>
        </section>
      )}

      {/* Private notes */}
      {session.notes && (
        <section className="surface compact">
          <span className="caption">Private notes</span>
          <p className="detail">{session.notes}</p>
        </section>
      )}

      {(session as any).media?.length > 0 && (
        <div className="cluster compact">
          {(session as any).media.map((src: string, i: number) => (
            <img key={i} src={src} alt="" className="avatar xl" />
          ))}
        </div>
      )}

      {(session as any).comments?.length > 0 && (
        <div className="column compact">
          {(session as any).comments.map((c: { text: string; createdAt: number }, i: number) => (
            <div key={i} className="surface flat compact column">
              <span className="caption muted">{new Date(c.createdAt).toLocaleString('en-GB')}</span>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {track && (track.points?.length ?? 0) > 0 && (
        <>
          <section className="surface compact column">
            <span className="caption">Pace</span>
            <PaceOverTimeChart points={track.points} />
          </section>
          <section className="surface compact column">
            <span className="caption">Heart rate</span>
            <HROverTimeChart points={track.points} />
          </section>
          <section className="surface compact column">
            <span className="caption">Elevation</span>
            <ElevationProfileChart points={track.points} />
          </section>
          <section className="surface compact column">
            <span className="caption">Splits</span>
            <KmSplitsTable points={track.points} />
          </section>
        </>
      )}

      {showImport && (
        <ImportModal
          context="enrich-session"
          existingSession={{
            id: session.id,
            durationSeconds: session.durationSeconds,
            distanceMeters: session.distanceMeters,
            sport: session.sport,
            notes: session.notes,
          }}
          onComplete={handleAttach}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}

/* ── Session History Detail (summary) ── */

function HistoryDetail({ session }: { session: SessionHistoryItem }) {
  return (
    <section className="surface compact">
      <div className="row space-between align-center">
        <div className="stat">
          <span className="caption">DURATION</span>
          <p className="detail">{formatDuration(session.durationSeconds)}</p>
        </div>
        <div className="stat">
          <span className="caption">SETS</span>
          <p className="detail">{session.totalSets}</p>
        </div>
        <div className="stat">
          <span className="caption">EXERCISES</span>
          <p className="detail">{session.exerciseCount}</p>
        </div>
      </div>
      {session.hasPR && (
        <div className="row">
          <span className="pill active">🏆 PR</span>
        </div>
      )}
    </section>
  );
}

/* ── Main Component ── */

export function SessionDetail({ session, onClose, onEdit, onShare, asPage = false }: SessionDetailProps) {
  const navigate = useNavigate();
  const isCardio = isCardioSession(session);
  const isSampleCardio = isSampleCardioSession(session);
  const isStrength = isActiveSessionView(session);
  const isHistory = isSessionHistoryItem(session);

  // Derive display fields
  let defaultTitle = '';
  let date = '';
  let time = '';
  let icon = '';
  let location: string | undefined;
  let description: string | undefined;

  if (isSampleCardio) {
    defaultTitle = session.sport.charAt(0).toUpperCase() + session.sport.slice(1);
    date = new Date(session.createdAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    icon = sportIcon(session.sport);
  } else if (isCardio) {
    defaultTitle = session.sport.charAt(0).toUpperCase() + session.sport.slice(1);
    const d = new Date(session.startedAt);
    date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    icon = sportIcon(session.sport);
    location = session.location;
    description = undefined; // public description not yet in domain
  } else if (isHistory) {
    defaultTitle = session.name;
    date = new Date(session.startedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    icon = categoryIcon(session.category);
  } else if (isStrength) {
    defaultTitle = session.name;
    date = new Date(session.startedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    icon = categoryIcon('strength');
  }

  const currentTitle = isCardio ? (session.title || defaultTitle) : defaultTitle;

  function saveTitle(v: string) {
    if (!isCardio) return;
    handleUpdateCardioSession({
      type: 'UpdateCardioSession',
      sessionId: session.id,
      title: v || undefined,
    });
  }

  const handleClose = onClose ?? (() => navigate(-1));

  const header = (
    <div className="row align-bottom space-between">
      <div className="row align-top">
        <p>{icon}</p>
        <div className="column compact grow">
          {isCardio ? (
            <EditableTitle
              value={currentTitle}
              onSave={saveTitle}
              placeholder={defaultTitle}
            />
          ) : (
            <h2>{currentTitle}</h2>
          )}
          {location && <p className="caption">📍 {location}</p>}
          <time className="caption">{date}{time ? ` · ${time}` : ''}</time>
          {description && <p className="detail muted">{description}</p>}
        </div>
      </div>
    </div>
  );

  const socialRow = isCardio ? <SocialBar session={session as CardioSession} /> : null;

  if (asPage) {
    return (
      <div className="column">
        <div className="row space-between align-center">
          <button type="button" className="ghost" onClick={handleClose}>← Back</button>
          <div className="row compact">
            {onEdit && <button type="button" className="ghost" onClick={onEdit}>✏️ Edit</button>}
            {onShare && <button type="button" className="ghost" onClick={onShare}>📤 Share</button>}
          </div>
        </div>
        {header}
        {/* {socialRow} */}
        {isStrength && <StrengthDetail session={session} />}
        {(isCardio || isSampleCardio) && <CardioDetail session={session as any} />}
        {isHistory && <HistoryDetail session={session} />}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <section className="surface" onClick={e => e.stopPropagation()}>
        <div className="row space-between align-center">
          {header}
          <button type="button" className="ghost icon" onClick={handleClose}>✕</button>
        </div>
        {socialRow}

        {isStrength && <StrengthDetail session={session} />}
        {(isCardio || isSampleCardio) && <CardioDetail session={session as any} />}
        {isHistory && <HistoryDetail session={session} />}

        <footer className="row space-between align-center">
          <button type="button" className="ghost icon">📤 Share</button>
        </footer>
      </section>
    </div>
  );
}
