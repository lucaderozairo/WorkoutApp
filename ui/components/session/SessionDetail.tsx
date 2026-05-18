import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { ActivityView, ActivityHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio';
import { handleImportGpsTrack, handleUpdateCardioSession } from '@features/cardio';
import type { SetEntry, StrengthSet } from '@features/training_log/domain/types';
import type { GpsTrack } from '@data/sources/files/gps';
import { SessionGpsPreview } from './SessionGpsPreview';
import { ImportModal } from '../modals/ImportModal';
import { HROverTimeChart, PaceOverTimeChart, ElevationProfileChart, KmSplitsTable, CHART_H, TICK, TOOLTIP_STYLE } from '../shared/Charts';
import ChartContainer from '@ui/patterns/charts/charts';
import { ChevronLeft, Pencil, Share2, Image, MapPin, HeartPulse, TrendingUp, Mountain, Timer, Trophy, Heart, MessageCircle } from 'lucide-react';
import { ACTIVITY_ICONS, getActivityLabel } from '@ui/icons/activityIcons';
import type { SportType } from '@features/training_log/domain/types';
import { Carousel } from '@ui/components/shared/Carousel';


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
  session: ActivityView | ActivityHistoryItem | CardioSession | SampleCardioSession;
  onClose?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onExportJson?: () => void;
  onExportCsv?: () => void;
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

function SportIcon({ sport, size }: { sport: string; size?: number }) {
  const def = ACTIVITY_ICONS[sport as SportType] ?? ACTIVITY_ICONS['other'];
  return <def.Icon size={size} />;
}

function CategoryIcon({ category, size }: { category: string; size?: number }) {
  const sport: SportType = category === 'cardio' ? 'run' : category === 'mobility' ? 'mobility' : 'strength';
  const { Icon } = ACTIVITY_ICONS[sport];
  return <Icon size={size} />;
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

function isActivityHistoryItem(s: unknown): s is ActivityHistoryItem {
  return typeof (s as ActivityHistoryItem).totalSets === 'number';
}

function isCardioSession(s: unknown): s is CardioSession {
  const obj = s as Record<string, unknown>;
  return typeof obj.sport === 'string' && 'distanceMeters' in obj && 'userId' in obj;
}

function isSampleCardioSession(s: unknown): s is SampleCardioSession {
  const obj = s as Record<string, unknown>;
  return typeof obj.sport === 'string' && 'distanceMeters' in obj && 'createdAt' in obj;
}

function isActivityView(s: unknown): s is ActivityView {
  return Array.isArray((s as ActivityView).segments);
}

function isStrengthSet(s: SetEntry): s is StrengthSet {
  return s.weightKg !== undefined || s.reps !== undefined;
}

/* ── Inline editable title ── */

function EditableTitle({
  value,
  onSave,
  placeholder,
  level = 'h2',
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder: string;
  level?: 'h1' | 'h2';
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

  const Tag = level;
  return (
    <Tag className="interactive" onClick={startEdit} title="Click to edit">
      {value || <span className="faint">{placeholder}</span>}
    </Tag>
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
          <span key={name} className="pill">
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
          <Heart size={14} /> {liked ? 1 : 0}
        </button>
        <button type="button" className="ghost"><MessageCircle size={14} /> 0</button>
      </div>
    </div>
  );
}

/* ── Per-session set weight chart ── */

function SessionSetChart({ sets }: { sets: SetEntry[] }) {
  if (sets.length < 1) return null;
  const data = sets.map((s, i) => ({
    x: i + 1,
    y: s.weightKg ?? 0,
    reps: s.reps ?? 0,
  }));
  return (
    <div className="row align-center">
      <span className="chart-ylabel">kg</span>
      <ChartContainer data={data} chartType={"sets-bar"} />
    </div>
  );
}

/* ── Strength Session Detail ── */

function StrengthDetail({ session }: { session: ActivityView }) {
  return (
    <div className="column">
      {session.segments.map(block => {
        const strengthSets = block.sets.filter(isStrengthSet);
        return (
          <section key={block.id} className="surface">
            <header className="row space-between align-center">
              <div className="row align-center">
                <CategoryIcon category={block.exerciseCategory} size={14} />
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
                        </>
                      ) : (
                        <>
                          <td>{(set as any).distanceMeters ?? '—'}</td>
                          <td>{(set as any).durationSeconds ?? '—'}</td>
                          <td className="caption">cardio</td>
                          <td>—</td>
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
      {(session.rpe != null || (session.tags?.length ?? 0) > 0) && (
        <section className="surface tight row compact wrap align-center">
          {session.rpe != null && (
            <span className="pill primary">RPE {session.rpe}</span>
          )}
          {session.tags?.map(t => (
            <span key={t} className="pill"><span className="dot" />{t}</span>
          ))}
        </section>
      )}
      {session.notes && (
        <section className="surface tight">
          <span className="caption">Notes</span>
          <p className="detail">{session.notes}</p>
        </section>
      )}
      {session.media && session.media.length > 0 && (
        <Carousel slides={session.media} />
      )}
      {session.comments && session.comments.length > 0 && (
        <div className="column compact">
          {session.comments.map((c, i) => (
            <div key={i} className="surface flat compact column">
              <span className="caption muted">{new Date(c.createdAt).toLocaleString('en-GB')}</span>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Cardio Session Detail ── */

function CardioDetail({ session, fullPage }: { session: CardioSession; fullPage?: boolean }) {
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
  const defaultTitle = getActivityLabel(session.sport as SportType);
  const displayTitle = session.title || defaultTitle;

  function saveTitle(v: string) {
    handleUpdateCardioSession({
      type: 'UpdateCardioSession',
      sessionId: session.id,
      title: v || undefined,
    });
  }

  async function handleAttach(importedTrack: GpsTrack) {
    await handleImportGpsTrack({
      type: 'ImportGpsTrack',
      sessionId: session.id,
      track: importedTrack,
    });
    setShowImport(false);
  }

  const statsGrid = (
    <div className="surface tight grid ghost">
      {session.distanceMeters > 0 && (
        <div className="column compact">
          <p className="eyebrow">Distance</p>
          <h3 className={` ${color}`}>
            {distKm.toFixed(1)}<span className="caption muted">km</span>
          </h3>
        </div>
      )}
      <div className="column compact">
        <p className="eyebrow">Duration</p>
        <h3>{formatDuration(session.durationSeconds)}</h3>
      </div>
      {pace > 0 && (
        <div className="column compact">
          <p className="eyebrow">Avg Pace</p>
          <h3>{formatPace(pace)}</h3>
        </div>
      )}
      {track?.elevationGain != null && (
        <div className="column compact">
          <p className="eyebrow">Elevation</p>
          <h3>
            +{Math.round(track.elevationGain)}<span className="caption muted">m</span>
          </h3>
        </div>
      )}
    </div>
  );

  const charts = track && (track.points?.length ?? 0) > 0 && (
    <>
      <section className="surface">
        <div className="row compact align-center">
          <TrendingUp size={14} className="faint" />
          <p className="eyebrow">Pace Over Distance</p>
        </div>
        <PaceOverTimeChart points={track.points} />
      </section>
      {track.points.some(p => p.heartRate != null) && (
        <section className="surface">
          <div className="row compact align-center">
            <HeartPulse size={14} className="faint" />
            <p className="eyebrow">Heart Rate</p>
          </div>
          <HROverTimeChart points={track.points} />
        </section>
      )}
      {track.points.some(p => p.elevation != null) && (
        <section className="surface">
          <div className="row compact align-center">
            <Mountain size={14} className="faint" />
            <p className="eyebrow">Elevation</p>
          </div>
          <ElevationProfileChart points={track.points} />
        </section>
      )}
      <section className="surface">
        <div className="row compact align-center">
          <Timer size={14} className="faint" />
          <p className="eyebrow">Km Splits</p>
        </div>
        <KmSplitsTable points={track.points} />
      </section>
    </>
  );

  const importModal = showImport && (
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
  );

  if (fullPage) {
    const d = new Date(session.startedAt);
    const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    return (
      <div className="column">
        {/* Hero */}
        <section className="surface">
          <div className="row compact align-center">
            <SportIcon sport={session.sport} size={16} />
            <h3 >{defaultTitle}</h3>
            <span className="caption muted">·</span>
            <span className="caption muted">{date} · {time}</span>
          </div>
          <EditableTitle value={displayTitle} onSave={saveTitle} placeholder={defaultTitle} level="h1" />
          
          
        </section>
        <section className="ghost surface">
          <SocialBar session={session} />
        </section>
        <section className='surface'>
          {statsGrid}
        </section>
        {/* Photos */}
        {session.media && session.media.length > 0 && (
          <section className="surface bare">
            <div className="row compact align-center surface tight ghost">
              <Image size={14} className="faint" />
              <p className="eyebrow">Photos · {session.media.length}</p>
            </div>
            <Carousel slides={session.media} />
          </section>
        )}

        {/* Route */}
        <section className="surface">
          <div className="row compact align-center">
            <MapPin size={14} className="faint" />
            <p className="eyebrow">Route</p>
          </div>
          {track && (track.points?.length ?? 0) >= 2 ? (
            <SessionGpsPreview track={track} sessionId={session.id} />
          ) : (
            <button type="button" className="ghost" onClick={() => setShowImport(true)}>
              + Attach GPS file
            </button>
          )}
        </section>

        {/* Performance */}
        {(hasSecondary || session.rpe != null) && (
          <section className="surface">
            <div className="row compact align-center">
              <HeartPulse size={14} className="faint" />
              <p className="eyebrow">Performance</p>
            </div>
            <div className="cluster">
              {track?.avgHeartRate != null && (
                <span className="pill">AVG HR <strong>{track.avgHeartRate} bpm</strong></span>
              )}
              {track?.maxHeartRate != null && (
                <span className="pill">MAX HR <strong>{track.maxHeartRate} bpm</strong></span>
              )}
              {track?.calories != null && (
                <span className="pill">{track.calories} kcal</span>
              )}
              {track?.avgPower != null && (
                <span className="pill">{track.avgPower} W</span>
              )}
              {session.rpe != null && (
                <span className={`pill ${color}`}><span className="dot" />RPE {session.rpe} / 10</span>
              )}
            </div>
          </section>
        )}

        {/* Notes */}
        {session.notes && (
          <section className="surface">
            <p className="eyebrow">Notes</p>
            <p>{session.notes}</p>
          </section>
        )}

        {charts}
        {importModal}
      </div>
    );
  }

  /* Modal / compact path */
  return (
    <div className="column">
      <section className="surface row space-between">
        {session.distanceMeters > 0 && (
          <div className="column compact align-center">
            <span className="caption">DISTANCE</span>
            <p className={`detail ${color}`}>{distKm.toFixed(2)} <span className="caption">km</span></p>
          </div>
        )}
        <div className="column compact align-center">
          <span className="caption">DURATION</span>
          <p className="detail">{formatDuration(session.durationSeconds)}</p>
        </div>
        {pace > 0 && (
          <div className="column compact align-center">
            <span className="caption">PACE</span>
            <p className="detail">{formatPace(pace)}</p>
          </div>
        )}
        {track?.elevationGain != null && (
          <div className="column compact align-center">
            <span className="caption">ELEVATION</span>
            <p className="detail">+{Math.round(track.elevationGain)} <span className="caption">m</span></p>
          </div>
        )}
      </section>
      {track && (track.points?.length ?? 0) >= 2 ? (
        <section className="surface tight">
          <SessionGpsPreview track={track} sessionId={session.id} />
        </section>
      ) : (
        <section className="surface tight">
          <button type="button" className="ghost" onClick={() => setShowImport(true)}>+ Attach GPS file</button>
        </section>
      )}
      {hasSecondary && (
        <section className="surface tight">
          <div className="cluster">
            {track.avgHeartRate != null && <span className="pill">AVG HR <strong>{track.avgHeartRate} bpm</strong></span>}
            {track.maxHeartRate != null && <span className="pill">MAX HR <strong>{track.maxHeartRate}</strong></span>}
            {track.calories != null && <span className="pill">CALORIES <strong>{track.calories} kcal</strong></span>}
            {track.avgPower != null && <span className="pill">POWER <strong>{track.avgPower} W</strong></span>}
          </div>
        </section>
      )}
      {session.notes && (
        <section className="surface tight">
          <span className="caption">Private notes</span>
          <p className="detail">{session.notes}</p>
        </section>
      )}
      {(session as any).media?.length > 0 && <Carousel slides={(session as any).media} />}
      {charts}
      {importModal}
    </div>
  );
}

/* ── Session History Detail (summary) ── */

function HistoryDetail({ session }: { session: ActivityHistoryItem }) {
  return (
    <section className="surface tight">
      <div className="row space-between align-center">
        <div className="column compact">
          <span className="caption">DURATION</span>
          <p className="detail">{formatDuration(session.durationSeconds)}</p>
        </div>
        <div className="column compact">
          <span className="caption">SETS</span>
          <p className="detail">{session.totalSets}</p>
        </div>
        <div className="column compact">
          <span className="caption">EXERCISES</span>
          <p className="detail">{session.exerciseCount}</p>
        </div>
      </div>
      {session.hasPR && (
        <div className="row">
          <span className="pill active"><Trophy size={11} /> PR</span>
        </div>
      )}
      {(session.rpe != null || (session.tags?.length ?? 0) > 0) && (
        <div className="row compact wrap align-center">
          {session.rpe != null && (
            <span className="pill primary">RPE {session.rpe}</span>
          )}
          {session.tags?.map(t => (
            <span key={t} className="pill"><span className="dot" />{t}</span>
          ))}
        </div>
      )}
      {session.notes && (
        <div className="column compact">
          <span className="caption">Notes</span>
          <p className="detail">{session.notes}</p>
        </div>
      )}
      {session.media && session.media.length > 0 && (
        <Carousel slides={session.media} />
      )}
      {session.comments && session.comments.length > 0 && (
        <div className="column compact">
          {session.comments.map((c, i) => (
            <div key={i} className="surface flat compact column">
              <span className="caption muted">{new Date(c.createdAt).toLocaleString('en-GB')}</span>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Main Component ── */

export function SessionDetail({ session, onClose, onEdit, onShare, onExportJson, onExportCsv, asPage = false }: SessionDetailProps) {
  const navigate = useNavigate();
  const isCardio = isCardioSession(session);
  const isSampleCardio = isSampleCardioSession(session);
  const isStrength = isActivityView(session);
  const isHistory = isActivityHistoryItem(session);

  // Derive display fields
  let defaultTitle = '';
  let date = '';
  let time = '';
  let icon: React.ReactNode = null;
  let location: string | undefined;
  let description: string | undefined;

  if (isSampleCardio) {
    defaultTitle = getActivityLabel(session.sport as SportType);
    date = new Date(session.createdAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    icon = <SportIcon sport={session.sport} size={20} />;
  } else if (isCardio) {
    defaultTitle = getActivityLabel(session.sport as SportType);
    const d = new Date(session.startedAt);
    date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    icon = <SportIcon sport={session.sport} size={20} />;
    location = session.location;
    description = undefined;
  } else if (isHistory) {
    defaultTitle = session.name;
    date = new Date(session.startedAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    icon = <CategoryIcon category={session.category} size={20} />;
  } else if (isStrength) {
    defaultTitle = session.name;
    date = new Date(session.startedAt ?? 0).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    icon = <CategoryIcon category="strength" size={20} />;
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
          {location && <p className="caption"><MapPin size={11} /> {location}</p>}
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
        <div className="row center align-center">
          <button type="button" className="ghost icon sm" onClick={handleClose}>
            <ChevronLeft size={14} />
          </button>
          <h3 className="grow truncate">{currentTitle}</h3>
          <div className="row compact">
            {onEdit && <button type="button" className="ghost icon sm" onClick={onEdit}><Pencil size={13} /></button>}
            {onShare && <button type="button" className="ghost icon sm" onClick={onShare}><Share2 size={13} /></button>}
          </div>
        </div>
        {!isCardio && !isSampleCardio && header}
        {(isCardio || isSampleCardio) && <CardioDetail session={session as CardioSession} fullPage />}
        {isStrength && <StrengthDetail session={session} />}
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
          <button type="button" className="ghost"><Share2 size={14} /> Share</button>
        </footer>
      </section>
    </div>
  );
}
