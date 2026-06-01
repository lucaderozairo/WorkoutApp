import { useState } from 'react';
import { Grid, Row, Column, Cluster, Spacer } from '@ui/layout';
import { Surface } from '@ui/atoms';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Gauge, Image, MoreVertical, Share2, Tag, Trash2, X } from 'lucide-react';
import type { ActivityView, SetEntry, StrengthSet } from '@features/training_log';
import type { UISet } from '@features/training_log/projections/viewTypes';
import { handleDeleteSession } from '@features/training_log';
import { useCommand } from '@ui/bindings';
import { CARDIO_FIELDS } from './CardioEditor';
import ChartContainer from '@ui/patterns/charts/charts';
import { LetterBadge } from './LetterBadge';
import { SetRow } from './SetRow';
import { domainBlocksToUIBlocks } from '@features/training_log/projections/mappers';
import { triggerDownload } from '@shared/utils/csv';
import { Carousel } from '@ui/components/shared/Carousel';

function chartDataOrNull(sets?: UISet[]) {
  if (!sets?.length) return null;
  const logged = sets.filter(s => s.w !== '—');
  if (!logged.length) return null;
  let workingSet = 0;
  return logged.map(s => {
    if (!s.warmup) workingSet += 1;
    return {
      x: s.warmup ? 'WU' : String(workingSet),
      y: parseFloat(s.w) || 0,
      reps: String(parseFloat(s.r) || 0),
    };
  });
}

export function FinishedView({ session, onEdit }: { session: ActivityView; onEdit?: () => void }) {
  const navigate = useNavigate();
  const blocks = domainBlocksToUIBlocks(session.segments);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { dispatch: deleteSession } = useCommand(handleDeleteSession);

  const startTime = session.startedAt
    ? new Date(session.startedAt).toTimeString().slice(0, 5)
    : '';
  const endTime = session.finishedAt
    ? new Date(session.finishedAt).toTimeString().slice(0, 5)
    : '';
  const date = session.startedAt
    ? new Date(session.startedAt).toISOString().slice(0, 10)
    : '';
  const durationMs = session.finishedAt && session.startedAt ? session.finishedAt - session.startedAt : 0;

  function formatDuration(ms: number): string {
    if (ms <= 0) return '—';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `${session.name ?? 'session'}-${date}.json`);
  }

  function handleShare() {
    const shareData = { title: session.name, text: `Check out my workout: ${session.name} on ${date}` };
    if (navigator.share) {
      navigator.share(shareData);
    }
  }

  async function handleDelete() {
    setDeleteConfirm(false);
    setMenuOpen(false);
    await deleteSession({ type: 'DeleteSession', sessionId: session.id });
    navigate('/sessions');
  }

  return (
    <Column>
      {/* detail-bar */}
      <Surface pad="sm" variant="ghost">
        <Row justify="between" align="center">
          <Row gap={1}>
            <span className="detail">{session.name}</span>
          </Row>
          <Row gap={1} align="center">
            <button type="button" className="primary sm" onClick={() => navigate(-1)}>Done</button>
            <button type="button" className="secondary sm" onClick={handleExport}>
              <Download size={13} />
            </button>
            <button type="button" className="secondary sm" onClick={handleShare}>
              <Share2 size={13} />
            </button>
            <button type="button" className="secondary sm" onClick={() => setMenuOpen(v => !v)}>
              <MoreVertical size={13} />
            </button>
          </Row>
        </Row>
      </Surface>

      {/* stats grid */}
      <Surface><Grid variant="double">
        <Column gap={1} align="center">
          <span className="eyebrow">Date</span>
          <span className="mono num detail">{date}</span>
        </Column>
        <Column gap={1} align="center">
          <span className="eyebrow">Duration</span>
          <span className="mono num detail">{formatDuration(durationMs)}</span>
        </Column>
        <Column gap={1} align="center">
          <span className="eyebrow">Start</span>
          <span className="mono num detail">{startTime || '—'}</span>
        </Column>
        <Column gap={1} align="center">
          <span className="eyebrow">End</span>
          <span className="mono num detail">{endTime || '—'}</span>
        </Column>
      </Grid></Surface>

      {/* RPE */}
      {session.rpe != null && (
        <Surface variant="flat" pad="sm">
          <Column gap={1}>
            <Row gap={1} align="center">
              <Gauge size={14} className="faint" />
              <span className="eyebrow">Session RPE</span>
            </Row>
            <span className="badge accent">{session.rpe}</span>
          </Column>
        </Surface>
      )}

      {/* Tags */}
      {session.tags != null && session.tags.length > 0 && (
        <Surface variant="flat" pad="sm">
          <Column gap={1}>
            <Row gap={1} align="center">
              <Tag size={14} className="faint" />
              <span className="eyebrow">Tags</span>
            </Row>
            <Cluster>
              {session.tags.map((t, i) => (
                <span key={i} className="badge"><span className="dot" />{t}</span>
              ))}
            </Cluster>
          </Column>
        </Surface>
      )}

      {/* Notes */}
      {session.notes && (
        <Surface variant="flat" pad="sm">
          <Column gap={1}>
            <Row gap={1} align="center">
              <FileText size={14} className="faint" />
              <span className="eyebrow">Notes</span>
            </Row>
            <p className="muted">{session.notes}</p>
          </Column>
        </Surface>
      )}

      {/* Photos */}
      {session.media && session.media.length > 0 && (
        <Surface variant="flat" pad="sm">
          <Column gap={1}>
            <Row gap={1} align="center">
              <Image size={14} className="faint" />
              <span className="eyebrow">Photos · {session.media.length}</span>
            </Row>
            <Carousel slides={session.media} />
          </Column>
        </Surface>
      )}

      {/* Blocks */}
      <Column>
        {blocks.map((b, idx) => (
          <Surface key={b.id}>
            <Column>
              {b.type === 'stretch' && (
                <>
                  <Row align="center" justify="between">
                    {b.tag && <span className="badge"><span className="dot" />{b.tag}</span>}
                  </Row>
                  {b.exercises.map((ex, i) => (
                    <Row key={i} align="center" justify="between">
                      <span className="detail">{ex.name}</span>
                      <span className="mono caption">{ex.hold}</span>
                    </Row>
                  ))}
                </>
              )}

              {b.type === 'cardio' && (() => {
                const ex = b.exercises[0];
                return (
                  <>
                    <Row align="center" justify="between">
                      <span className="detail">{ex.name}</span>
                    </Row>
                    <Grid cols={4}>
                      {CARDIO_FIELDS.map((f, i) => {
                        const raw = ex.cardioSet?.[f.key] as number | undefined;
                        const display = raw != null && raw > 0 ? f.toDisplay(raw) : '—';
                        return (
                          <Column key={i} gap={1} align="center">
                            <span className="eyebrow">{f.label}</span>
                            <span className="mono num detail">{display}
                              {display !== '—' && <span className="muted caption"> {f.unit}</span>}
                            </span>
                          </Column>
                        );
                      })}
                    </Grid>
                  </>
                );
              })()}

              {(b.type === 'single' || b.type === 'superset' || b.type === 'circuit') && (
                <>
                  {b.type === 'single' ? (
                    <Row align="center" justify="between">
                      <Row gap={1} align="center" className="grow">
                        <span className="mono num caption muted" style={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }}>{idx + 1}</span>
                        <span className="detail">{b.exercises[0].name}</span>
                      </Row>
                    </Row>
                  ) : (
                    <Row align="center" justify="between">
                      <span className="badge"><span className="dot" />{b.label}</span>
                    </Row>
                  )}
                  {b.exercises.map((ex, i) => (
                    <div key={i}>
                      {b.type !== 'single' && (
                        <Row gap={1} align="center" justify="between">
                          <Row gap={1} align="center">
                            <LetterBadge letter={ex.label ?? String(i + 1)} />
                            <span className="detail">{ex.name}</span>
                          </Row>
                        </Row>
                      )}
                      {(cd => cd && (
                        <Surface pad="sm" variant="ghost">
                          <ChartContainer data={cd} chartType="sets-bar" color="var(--accent)" axisShow={{ x: true, y: true }} />
                        </Surface>
                      ))(chartDataOrNull(ex.sets))}
                      <Column gap={1}>
                        {ex.sets?.map((s, j) => {
                          const workingNum = (ex.sets ?? []).filter((x, idx2) => !x.warmup && idx2 <= j).length;
                          return (
                            <SetRow
                              key={s.id}
                              num={workingNum}
                              set={s}
                              menuKey=""
                              openMenu={null}
                              onOpenMenu={() => {}}
                              onToggleWarmup={() => {}}
                              onToggleDone={() => {}}
                              onDeleteRequest={() => {}}
                              onUpdate={() => {}}
                              onComment={() => {}}
                              currentMode="wt-reps"
                              availableModes={[]}
                              onSetModeChange={() => {}}
                              disabled
                            />
                          );
                        })}
                      </Column>
                    </div>
                  ))}
                </>
              )}
            </Column>
          </Surface>
        ))}
      </Column>

      {/* menu modal */}
      {menuOpen && (
        <div className="modal-overlay">
          <Surface>
            <Column>
              <Row justify="between" align="center">
                <span className="detail">Session Options</span>
                <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(false)}>
                  <X size={10} className="faint" />
                </button>
              </Row>
              {onEdit && <button type="button" className="sm" onClick={() => { setMenuOpen(false); onEdit(); }}>Edit</button>}
              <button type="button" className="sm warning" onClick={() => { setMenuOpen(false); setDeleteConfirm(true); }}>
                <Trash2 size={9} /> Delete session
              </button>
            </Column>
          </Surface>
        </div>
      )}

      {/* delete confirm modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <Surface>
            <Column>
              <Column gap={1}>
                <h3>Delete session?</h3>
                <span className="caption faint">This removes the entire session and cannot be undone.</span>
              </Column>
              <Row justify="between">
                <button type="button" className="secondary" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                <button type="button" className="warning" onClick={handleDelete}>
                  <Trash2 size={12} /> Delete
                </button>
              </Row>
            </Column>
          </Surface>
        </div>
      )}
    </Column>
  );
}
