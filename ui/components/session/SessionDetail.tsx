import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { ActivityView, ActivityHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio';
import { handleImportGpsTrack, handleUpdateCardioSession } from '@features/cardio';
import type { SetEntry, StrengthSet } from '@features/training_log/domain/types';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { GpsTrack } from '@data/sources/files/gps';
import { SessionGpsPreview } from './SessionGpsPreview';
import { ImportModal } from '../modals/ImportModal';
import { HROverTimeChart, PaceOverTimeChart, ElevationProfileChart, KmSplitsTable } from '@ui/components/charts/domain-charts';
import ChartContainer from '@ui/patterns/charts/charts';
import { ChevronLeft, Pencil, Share2, Image, MapPin, HeartPulse, TrendingUp, Mountain, Timer, Trophy, Heart, MessageCircle } from 'lucide-react';
import { getActivityLabel } from '@ui/icons/activityIcons';
import type { SportType } from '@features/training_log/domain/types';
import { Carousel } from '@ui/components/shared/Carousel';
import { Row, Column, Cluster, Grid } from '@ui/layout';
import { Surface, Text, Chip, Table, TableRow, TableCell } from '@ui/atoms';
import { Badge, Button, EditableTitle, Input, Modal } from '@ui/molecules';
import { SportIcon } from '@ui/atoms/icons/SportIcon';
import { CategoryIcon } from '@ui/atoms/icons/CategoryIcon';
import { formatDuration, formatPace, paceSecPerKm } from '@shared/utils';
import { isCardioSession } from '@features/cardio';
import { isActivityView, isActivityHistoryItem, isStrengthSet } from '@features/training_log';
import { sportColorClass } from '@ui/icons/sportColor';
import {
  type SampleCardioSession,
  isSampleCardioSession,
} from './sessionDetailUtils';

interface SessionDetailProps {
  session: ActivityView | ActivityHistoryItem | CardioSession | SampleCardioSession;
  onClose?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  onExportJson?: () => void;
  onExportCsv?: () => void;
  asPage?: boolean;
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
        <Button type="button" variant="ghost" onClick={() => setShowRanWithInput(true)}>
          + Ran with
        </Button>
        {ranWith.map(name => (
          <Chip key={name} trailing={<Button variant="ghost" size="icon" onClick={() => removeRanWith(name)}>×</Button>}>
            {name}
          </Chip>
        ))}
        {showRanWithInput && (
          <Input
            className="min-w-0"
            controlClassName="input--sm"
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
        <Button
          type="button"
          variant="ghost"
          className={liked ? 'active' : undefined}
          onClick={() => setLiked(l => !l)}
        >
          <Heart size={14} /> {liked ? 1 : 0}
        </Button>
        <Button type="button" variant="ghost"><MessageCircle size={14} /> 0</Button>
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
      <Text size="caption" color="faint" className="chart-ylabel">kg</Text>
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
                  <Badge className={block.blockType}>{block.blockType}</Badge>
                )}
              </Row>
              <SessionSetChart sets={strengthSets} />
              {block.sets.length > 0 && (
                <Table className="center">
                  <thead>
                    <TableRow>
                      <TableCell header><Text size="eyebrow">#</Text></TableCell>
                      <TableCell header><Text size="eyebrow">kg</Text></TableCell>
                      <TableCell header><Text size="eyebrow">reps</Text></TableCell>
                      <TableCell header><Text size="eyebrow">type</Text></TableCell>
                      <TableCell header><Text size="eyebrow">RPE</Text></TableCell>
                    </TableRow>
                  </thead>
                  <tbody>
                    {block.sets.map((set, i) => (
                      <TableRow key={i}>
                        <TableCell muted>{i + 1}</TableCell>
                        {isStrengthSet(set) ? (
                          <>
                            <TableCell>{set.weightKg}</TableCell>
                            <TableCell>{set.reps}</TableCell>
                            <TableCell muted>{set.setType ?? 'normal'}</TableCell>
                            <TableCell>{set.rpe != null ? set.rpe : '—'}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{(set as any).distanceMeters ?? '—'}</TableCell>
                            <TableCell>{(set as any).durationSeconds ?? '—'}</TableCell>
                            <TableCell muted>cardio</TableCell>
                            <TableCell>—</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              )}
              {block.notes && <Text size="caption">{block.notes}</Text>}
            </Column>
          </Surface>
        );
      })}
      {(session.rpe != null || (session.tags?.length ?? 0) > 0) && (
        <Surface pad="sm" as="section">
          <Row gap={1} wrap align="center">
            {session.rpe != null && (
              <Badge tone="accent">RPE {session.rpe}</Badge>
            )}
            {session.tags?.map(t => (
              <Badge key={t} dot>{t}</Badge>
            ))}
          </Row>
        </Surface>
      )}
      {session.notes && (
        <Surface pad="sm" as="section">
          <Column gap={1}>
            <Text size="caption">Notes</Text>
            <Text size="detail">{session.notes}</Text>
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
                <Text size="caption" color="muted">{new Date(c.createdAt).toLocaleString('en-GB')}</Text>
                <Text>{c.text}</Text>
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
  const pace = paceSecPerKm(session.durationSeconds, session.distanceMeters);
  const color = sportColorClass(session.sport);
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
    <Surface variant="ghost" pad="sm"><Grid variant="double">
      {session.distanceMeters > 0 && (
        <Column gap={1} align="center">
          <Text size="eyebrow">Distance</Text>
          <Text as="h3" className={color}>
            {distKm.toFixed(1)}<Text as="span" size="caption" color="muted">km</Text>
          </Text>
        </Column>
      )}
      <Column gap={1} align="center">
        <Text size="eyebrow">Duration</Text>
        <Text as="h3">{formatDuration(session.durationSeconds)}</Text>
      </Column>
      {pace > 0 && (
        <Column gap={1} align="center">
          <Text size="eyebrow">Avg Pace</Text>
          <Text as="h3">{formatPace(pace, { suffix: true })}</Text>
        </Column>
      )}
      {track?.elevationGain != null && (
        <Column gap={1} align="center">
          <Text size="eyebrow">Elevation</Text>
          <Text as="h3">
            +{Math.round(track.elevationGain)}<Text as="span" size="caption" color="muted">m</Text>
          </Text>
        </Column>
      )}
    </Grid></Surface>
  );

  const charts = track && (track.points?.length ?? 0) > 0 && (
    <>
      <Surface as="section">
        <Column>
          <Row gap={1} align="center">
            <TrendingUp size={14} className="faint" />
            <Text size="eyebrow">Pace Over Distance</Text>
          </Row>
          <PaceOverTimeChart points={track.points} />
        </Column>
      </Surface>
      {track.points.some(p => p.heartRate != null) && (
        <Surface as="section">
          <Column>
            <Row gap={1} align="center">
              <HeartPulse size={14} className="faint" />
              <Text size="eyebrow">Heart Rate</Text>
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
              <Text size="eyebrow">Elevation</Text>
            </Row>
            <ElevationProfileChart points={track.points} />
          </Column>
        </Surface>
      )}
      <Surface as="section">
        <Column>
          <Row gap={1} align="center">
            <Timer size={14} className="faint" />
            <Text size="eyebrow">Km Splits</Text>
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
              <Text as="h3">{defaultTitle}</Text>
              <Text as="span" size="caption" color="muted">·</Text>
              <Text as="span" size="caption" color="muted">{date} · {time}</Text>
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
                  <Text size="eyebrow">Photos · {session.media.length}</Text>
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
              <Text size="eyebrow">Route</Text>
            </Row>
            {track && (track.points?.length ?? 0) >= 2 ? (
              <SessionGpsPreview track={track} sessionId={session.id} />
            ) : (
              <Button type="button" variant="ghost" onClick={() => setShowImport(true)}>
                + Attach GPS file
              </Button>
            )}
          </Column>
        </Surface>

        {/* Performance */}
        {(hasSecondary || session.rpe != null) && (
          <Surface as="section">
            <Column>
              <Row gap={1} align="center">
                <HeartPulse size={14} className="faint" />
                <Text size="eyebrow">Performance</Text>
              </Row>
              <Cluster>
                {track?.avgHeartRate != null && (
                  <Badge>AVG HR <strong>{track.avgHeartRate} bpm</strong></Badge>
                )}
                {track?.maxHeartRate != null && (
                  <Badge>MAX HR <strong>{track.maxHeartRate} bpm</strong></Badge>
                )}
                {track?.calories != null && (
                  <Badge>{track.calories} kcal</Badge>
                )}
                {track?.avgPower != null && (
                  <Badge>{track.avgPower} W</Badge>
                )}
                {session.rpe != null && (
                  <Badge dot className={color}>RPE {session.rpe} / 10</Badge>
                )}
              </Cluster>
            </Column>
          </Surface>
        )}

        {/* Notes */}
        {session.notes && (
          <Surface as="section">
            <Column gap={1}>
              <Text size="eyebrow">Notes</Text>
              <Text>{session.notes}</Text>
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
              <Text size="caption">DISTANCE</Text>
              <Text size="detail" className={color}>{distKm.toFixed(2)} <Text as="span" size="caption">km</Text></Text>
            </Column>
          )}
          <Column gap={1} align="center">
            <Text size="caption">DURATION</Text>
            <Text size="detail">{formatDuration(session.durationSeconds)}</Text>
          </Column>
          {pace > 0 && (
            <Column gap={1} align="center">
              <Text size="caption">PACE</Text>
              <Text size="detail">{formatPace(pace, { suffix: true })}</Text>
            </Column>
          )}
          {track?.elevationGain != null && (
            <Column gap={1} align="center">
              <Text size="caption">ELEVATION</Text>
              <Text size="detail">+{Math.round(track.elevationGain)} <Text as="span" size="caption">m</Text></Text>
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
          <Button type="button" variant="ghost" onClick={() => setShowImport(true)}>+ Attach GPS file</Button>
        </Surface>
      )}
      {hasSecondary && (
        <Surface pad="sm" as="section">
          <Cluster>
            {track.avgHeartRate != null && <Badge>AVG HR <strong>{track.avgHeartRate} bpm</strong></Badge>}
            {track.maxHeartRate != null && <Badge>MAX HR <strong>{track.maxHeartRate}</strong></Badge>}
            {track.calories != null && <Badge>CALORIES <strong>{track.calories} kcal</strong></Badge>}
            {track.avgPower != null && <Badge>POWER <strong>{track.avgPower} W</strong></Badge>}
          </Cluster>
        </Surface>
      )}
      {session.notes && (
        <Surface pad="sm" as="section">
          <Column gap={1}>
            <Text size="caption">Private notes</Text>
            <Text size="detail">{session.notes}</Text>
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
            <Text size="caption">DURATION</Text>
            <Text size="detail">{formatDuration(session.durationSeconds)}</Text>
          </Column>
          <Column gap={1}>
            <Text size="caption">SETS</Text>
            <Text size="detail">{session.totalSets}</Text>
          </Column>
          <Column gap={1}>
            <Text size="caption">EXERCISES</Text>
            <Text size="detail">{session.exerciseCount}</Text>
          </Column>
        </Row>
        {session.hasPR && (
          <Row>
            <Badge active><Trophy size={11} /> PR</Badge>
          </Row>
        )}
        {(session.rpe != null || (session.tags?.length ?? 0) > 0) && (
          <Row gap={1} wrap align="center">
            {session.rpe != null && (
              <Badge tone="accent">RPE {session.rpe}</Badge>
            )}
            {session.tags?.map(t => (
              <Badge key={t} dot>{t}</Badge>
            ))}
          </Row>
        )}
        {session.notes && (
          <Column gap={1}>
            <Text size="caption">Notes</Text>
            <Text size="detail">{session.notes}</Text>
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
                  <Text size="caption" color="muted">{new Date(c.createdAt).toLocaleString('en-GB')}</Text>
                  <Text>{c.text}</Text>
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
        {icon}
        <Column gap={1} className="min-w-0">
          {isCardio ? (
            <EditableTitle
              value={currentTitle}
              onSave={saveTitle}
              placeholder={defaultTitle}
            />
          ) : (
            <Text as="h2">{currentTitle}</Text>
          )}
          {location && <Text size="caption"><MapPin size={11} /> {location}</Text>}
          <time className="caption">{date}{time ? ` · ${time}` : ''}</time>
          {description && <Text size="detail" color="muted">{description}</Text>}
        </Column>
      </Row>
    </Row>
  );

  const socialRow = isCardio ? <SocialBar session={session as CardioSession} /> : null;

  if (asPage) {
    return (
      <Column>
        <Row justify="center" align="center">
          <Button type="button" variant="ghost" size="icon" onClick={handleClose}>
            <ChevronLeft size={14} />
          </Button>
          <Text as="h3" className="min-w-0 truncate">{currentTitle}</Text>
          <Row gap={1}>
            {onEdit && <Button type="button" variant="ghost" size="icon" onClick={onEdit}><Pencil size={13} /></Button>}
            {onShare && <Button type="button" variant="ghost" size="icon" onClick={onShare}><Share2 size={13} /></Button>}
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
    <Modal open onClose={handleClose} size="lg">
      <Column>
          <Row justify="between" align="center">
            {header}
            <Button type="button" variant="ghost" size="icon" onClick={handleClose}>✕</Button>
          </Row>
          {socialRow}

          {isStrength && <StrengthDetail session={session} />}
          {(isCardio || isSampleCardio) && <CardioDetail session={session as any} />}
          {isHistory && <HistoryDetail session={session} />}

          <Row as="footer" justify="between" align="center">
            <Button type="button" variant="ghost"><Share2 size={14} /> Share</Button>
          </Row>
      </Column>
    </Modal>
  );
}
