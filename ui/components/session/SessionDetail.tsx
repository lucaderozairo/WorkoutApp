import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { ActivityView, ActivityHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio';
import { handleImportGpsTrack, handleUpdateCardioSession } from '@features/cardio';
import type { SetEntry, StrengthSet } from '@features/training_log/domain/types';
import type { GpsTrack } from '@data/sources/files/gps';
import { SessionGpsPreview } from './SessionGpsPreview';
import { ImportModal } from '../modals/ImportModal';
import { HROverTimeChart, PaceOverTimeChart, ElevationProfileChart, KmSplitsTable, CHART_H, TICK, TOOLTIP_STYLE } from '@ui/patterns/charts/domain-charts';
import ChartContainer from '@ui/patterns/charts/charts';
import { ChevronLeft, Pencil, Share2, Image, MapPin, HeartPulse, TrendingUp, Mountain, Timer, Trophy, Heart, MessageCircle } from 'lucide-react';
import { ACTIVITY_ICONS, getActivityLabel } from '@ui/icons/activityIcons';
import type { SportType } from '@features/training_log/domain/types';
import { Carousel } from '@ui/components/shared/Carousel';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface } from '@ui/atoms';


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
    <Row justify="between" align="center">
      <Cluster>
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
      </Cluster>
      <Row gap={1} align="center">
        <button
          type="button"
          className={`ghost${liked ? ' active' : ''}`}
          onClick={() => setLiked(l => !l)}
        >
          <Heart size={14} /> {liked ? 1 : 0}
        </button>
        <button type="button" className="ghost"><MessageCircle size={14} /> 0</button>
      </Row>
    </Row>
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
    <Row align="center">
      <span className="chart-ylabel">kg</span>
      <ChartContainer data={data} chartType={"sets-bar"} />
    </Row>
  );
}

/* ── Strength Session Detail ── */

function StrengthDetail({ session }: { session: ActivityView }) {
  return (
    <Column>
      {session.segments.map(block => {
        const strengthSets = block.sets.filter(isStrengthSet);
        return (
          <Surface key={block.id} as="section">
            <Column>
              <Row as="header" justify="between" align="center">
                <Row align="center">
                  <CategoryIcon category={block.exerciseCategory} size={14} />
                  <Link to={`/exercise/${encodeURIComponent(block.exerciseName)}`} className="link">
                    {block.exerciseName}
                  </Link>
                </Row>
                {block.blockType && (
                  <span className={`pill ${block.blockType}`}>{block.blockType}</span>
                )}
              </Row>
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
            </Column>
          </Surface>
        );
      })}
      {(session.rpe != null || (session.tags?.length ?? 0) > 0) && (
        <Surface pad="sm" as="section">
          <Row gap={1} wrap align="center">
            {session.rpe != null && (
              <span className="pill primary">RPE {session.rpe}</span>
            )}
            {session.tags?.map(t => (
              <span key={t} className="pill"><span className="dot" />{t}</span>
            ))}
          </Row>
        </Surface>
      )}
      {session.notes && (
        <Surface pad="sm" as="section">
          <Column gap={1}>
            <span className="caption">Notes</span>
            <p className="detail">{session.notes}</p>
          </Column>
        </Surface>
      )}
      {session.media && session.media.length > 0 && (
        <Carousel slides={session.media} />
      )}
      {session.comments && session.comments.length > 0 && (
        <Column gap={1}>
          {session.comments.map((c, i) => (
            <Surface key={i} variant="flat" pad="sm">
              <Column gap={1}>
                <span className="caption muted">{new Date(c.createdAt).toLocaleString('en-GB')}</span>
                <p>{c.text}</p>
              </Column>
            </Surface>
          ))}
        </Column>
      )}
    </Column>
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
        <Column gap={1} align="center">
          <p className="eyebrow">Distance</p>
          <h3 className={` ${color}`}>
            {distKm.toFixed(1)}<span className="caption muted">km</span>
          </h3>
        </Column>
      )}
      <Column gap={1} align="center">
        <p className="eyebrow">Duration</p>
        <h3>{formatDuration(session.durationSeconds)}</h3>
      </Column>
      {pace > 0 && (
        <Column gap={1} align="center">
          <p className="eyebrow">Avg Pace</p>
          <h3>{formatPace(pace)}</h3>
        </Column>
      )}
      {track?.elevationGain != null && (
        <Column gap={1} align="center">
          <p className="eyebrow">Elevation</p>
          <h3>
            +{Math.round(track.elevationGain)}<span className="caption muted">m</span>
          </h3>
        </Column>
      )}
    </div>
  );

  const charts = track && (track.points?.length ?? 0) > 0 && (
    <>
      <Surface as="section">
        <Column>
          <Row gap={1} align="center">
            <TrendingUp size={14} className="faint" />
            <p className="eyebrow">Pace Over Distance</p>
          </Row>
          <PaceOverTimeChart points={track.points} />
        </Column>
      </Surface>
      {track.points.some(p => p.heartRate != null) && (
        <Surface as="section">
          <Column>
            <Row gap={1} align="center">
              <HeartPulse size={14} className="faint" />
              <p className="eyebrow">Heart Rate</p>
            </Row>
            <HROverTimeChart points={track.points} />
          </Column>
        </Surface>
      )}
      {track.points.some(p => p.elevation != null) && (
        <Surface as="section">
          <Column>
            <Row gap={1} align="center">
              <Mountain size={14} className="faint" />
              <p className="eyebrow">Elevation</p>
            </Row>
            <ElevationProfileChart points={track.points} />
          </Column>
        </Surface>
      )}
      <Surface as="section">
        <Column>
          <Row gap={1} align="center">
            <Timer size={14} className="faint" />
            <p className="eyebrow">Km Splits</p>
          </Row>
          <KmSplitsTable points={track.points} />
        </Column>
      </Surface>
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
      <Column>
        {/* Hero */}
        <Surface as="section">
          <Column>
            <Row gap={1} align="center">
              <SportIcon sport={session.sport} size={16} />
              <h3>{defaultTitle}</h3>
              <span className="caption muted">·</span>
              <span className="caption muted">{date} · {time}</span>
            </Row>
            <EditableTitle value={displayTitle} onSave={saveTitle} placeholder={defaultTitle} level="h1" />
          </Column>
        </Surface>
        <Surface variant="ghost" as="section">
          <SocialBar session={session} />
        </Surface>
        <Surface as="section">
          {statsGrid}
        </Surface>
        {/* Photos */}
        {session.media && session.media.length > 0 && (
          <Surface pad="none" as="section">
            <Column>
              <Surface pad="sm" variant="ghost">
                <Row gap={1} align="center">
                  <Image size={14} className="faint" />
                  <p className="eyebrow">Photos · {session.media.length}</p>
                </Row>
              </Surface>
              <Carousel slides={session.media} />
            </Column>
          </Surface>
        )}

        {/* Route */}
        <Surface as="section">
          <Column>
            <Row gap={1} align="center">
              <MapPin size={14} className="faint" />
              <p className="eyebrow">Route</p>
            </Row>
            {track && (track.points?.length ?? 0) >= 2 ? (
              <SessionGpsPreview track={track} sessionId={session.id} />
            ) : (
              <button type="button" className="ghost" onClick={() => setShowImport(true)}>
                + Attach GPS file
              </button>
            )}
          </Column>
        </Surface>

        {/* Performance */}
        {(hasSecondary || session.rpe != null) && (
          <Surface as="section">
            <Column>
              <Row gap={1} align="center">
                <HeartPulse size={14} className="faint" />
                <p className="eyebrow">Performance</p>
              </Row>
              <Cluster>
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
              </Cluster>
            </Column>
          </Surface>
        )}

        {/* Notes */}
        {session.notes && (
          <Surface as="section">
            <Column gap={1}>
              <p className="eyebrow">Notes</p>
              <p>{session.notes}</p>
            </Column>
          </Surface>
        )}

        {charts}
        {importModal}
      </Column>
    );
  }

  /* Modal / compact path */
  return (
    <Column>
      <Surface as="section">
        <Row justify="between">
          {session.distanceMeters > 0 && (
            <Column gap={1} align="center">
              <span className="caption">DISTANCE</span>
              <p className={`detail ${color}`}>{distKm.toFixed(2)} <span className="caption">km</span></p>
            </Column>
          )}
          <Column gap={1} align="center">
            <span className="caption">DURATION</span>
            <p className="detail">{formatDuration(session.durationSeconds)}</p>
          </Column>
          {pace > 0 && (
            <Column gap={1} align="center">
              <span className="caption">PACE</span>
              <p className="detail">{formatPace(pace)}</p>
            </Column>
          )}
          {track?.elevationGain != null && (
            <Column gap={1} align="center">
              <span className="caption">ELEVATION</span>
              <p className="detail">+{Math.round(track.elevationGain)} <span className="caption">m</span></p>
            </Column>
          )}
        </Row>
      </Surface>
      {track && (track.points?.length ?? 0) >= 2 ? (
        <Surface pad="sm" as="section">
          <SessionGpsPreview track={track} sessionId={session.id} />
        </Surface>
      ) : (
        <Surface pad="sm" as="section">
          <button type="button" className="ghost" onClick={() => setShowImport(true)}>+ Attach GPS file</button>
        </Surface>
      )}
      {hasSecondary && (
        <Surface pad="sm" as="section">
          <Cluster>
            {track.avgHeartRate != null && <span className="pill">AVG HR <strong>{track.avgHeartRate} bpm</strong></span>}
            {track.maxHeartRate != null && <span className="pill">MAX HR <strong>{track.maxHeartRate}</strong></span>}
            {track.calories != null && <span className="pill">CALORIES <strong>{track.calories} kcal</strong></span>}
            {track.avgPower != null && <span className="pill">POWER <strong>{track.avgPower} W</strong></span>}
          </Cluster>
        </Surface>
      )}
      {session.notes && (
        <Surface pad="sm" as="section">
          <Column gap={1}>
            <span className="caption">Private notes</span>
            <p className="detail">{session.notes}</p>
          </Column>
        </Surface>
      )}
      {(session as any).media?.length > 0 && <Carousel slides={(session as any).media} />}
      {charts}
      {importModal}
    </Column>
  );
}

/* ── Session History Detail (summary) ── */

function HistoryDetail({ session }: { session: ActivityHistoryItem }) {
  return (
    <Surface pad="sm" as="section">
      <Column>
        <Row justify="between" align="center">
          <Column gap={1}>
            <span className="caption">DURATION</span>
            <p className="detail">{formatDuration(session.durationSeconds)}</p>
          </Column>
          <Column gap={1}>
            <span className="caption">SETS</span>
            <p className="detail">{session.totalSets}</p>
          </Column>
          <Column gap={1}>
            <span className="caption">EXERCISES</span>
            <p className="detail">{session.exerciseCount}</p>
          </Column>
        </Row>
        {session.hasPR && (
          <Row>
            <span className="pill active"><Trophy size={11} /> PR</span>
          </Row>
        )}
        {(session.rpe != null || (session.tags?.length ?? 0) > 0) && (
          <Row gap={1} wrap align="center">
            {session.rpe != null && (
              <span className="pill primary">RPE {session.rpe}</span>
            )}
            {session.tags?.map(t => (
              <span key={t} className="pill"><span className="dot" />{t}</span>
            ))}
          </Row>
        )}
        {session.notes && (
          <Column gap={1}>
            <span className="caption">Notes</span>
            <p className="detail">{session.notes}</p>
          </Column>
        )}
        {session.media && session.media.length > 0 && (
          <Carousel slides={session.media} />
        )}
        {session.comments && session.comments.length > 0 && (
          <Column gap={1}>
            {session.comments.map((c, i) => (
              <Surface key={i} variant="flat" pad="sm">
                <Column gap={1}>
                  <span className="caption muted">{new Date(c.createdAt).toLocaleString('en-GB')}</span>
                  <p>{c.text}</p>
                </Column>
              </Surface>
            ))}
          </Column>
        )}
      </Column>
    </Surface>
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
    <Row align="end" justify="between">
      <Row align="start">
        <p>{icon}</p>
        <Column gap={1} className="grow">
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
        </Column>
      </Row>
    </Row>
  );

  const socialRow = isCardio ? <SocialBar session={session as CardioSession} /> : null;

  if (asPage) {
    return (
      <Column>
        <Row justify="center" align="center">
          <button type="button" className="ghost icon sm" onClick={handleClose}>
            <ChevronLeft size={14} />
          </button>
          <h3 className="grow truncate">{currentTitle}</h3>
          <Row gap={1}>
            {onEdit && <button type="button" className="ghost icon sm" onClick={onEdit}><Pencil size={13} /></button>}
            {onShare && <button type="button" className="ghost icon sm" onClick={onShare}><Share2 size={13} /></button>}
          </Row>
        </Row>
        {!isCardio && !isSampleCardio && header}
        {(isCardio || isSampleCardio) && <CardioDetail session={session as CardioSession} fullPage />}
        {isStrength && <StrengthDetail session={session} />}
        {isHistory && <HistoryDetail session={session} />}
      </Column>
    );
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div onClick={e => e.stopPropagation()}>
      <Surface as="section">
        <Column>
          <Row justify="between" align="center">
            {header}
            <button type="button" className="ghost icon" onClick={handleClose}>✕</button>
          </Row>
          {socialRow}

          {isStrength && <StrengthDetail session={session} />}
          {(isCardio || isSampleCardio) && <CardioDetail session={session as any} />}
          {isHistory && <HistoryDetail session={session} />}

          <Row as="footer" justify="between" align="center">
            <button type="button" className="ghost"><Share2 size={14} /> Share</button>
          </Row>
        </Column>
      </Surface>
      </div>
    </div>
  );
}
