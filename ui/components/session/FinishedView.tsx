import { useState } from 'react';
import { Grid, Row, Column, Cluster, Spacer } from '@ui/layout';
import { Surface, Text, Divider } from '@ui/atoms';
import { Badge, Button, Modal } from '@ui/molecules';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Gauge, Image, MoreVertical, Share2, Tag, Trash2, X } from 'lucide-react';
import type { ActivityView } from '@features/training_log';
import type { UISet } from '@features/training_log/projections/viewTypes';
import { handleDeleteSession } from '@features/training_log';
import { useCommand } from '@ui/bindings';
import { formatDurationMs } from '@shared/utils';
import { CARDIO_FIELDS } from './CardioEditor';
import ChartContainer from '@ui/patterns/charts/charts';
import { LetterBadge } from './LetterBadge';
import { SetRow } from './SetRow';
import { SegmentSplitsCard } from './SegmentSplitsCard';
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

  const formatDuration = (ms: number): string => (ms <= 0 ? '—' : formatDurationMs(ms));

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
            <Text size="detail">{session.name}</Text>
          </Row>
          <Row gap={1} align="center">
            <Button type="button" variant="primary" size="sm" onClick={() => navigate(-1)}>Done</Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
              <Download size={13} />
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleShare}>
              <Share2 size={13} />
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setMenuOpen(v => !v)}>
              <MoreVertical size={13} />
            </Button>
          </Row>
        </Row>
      </Surface>

      {/* stats grid */}
      <Surface><Grid variant="double">
        <Column gap={1} align="center">
          <Text size="eyebrow">Date</Text>
          <Text size="detail" mono className="num">{date}</Text>
        </Column>
        <Column gap={1} align="center">
          <Text size="eyebrow">Duration</Text>
          <Text size="detail" mono className="num">{formatDuration(durationMs)}</Text>
        </Column>
        <Column gap={1} align="center">
          <Text size="eyebrow">Start</Text>
          <Text size="detail" mono className="num">{startTime || '—'}</Text>
        </Column>
        <Column gap={1} align="center">
          <Text size="eyebrow">End</Text>
          <Text size="detail" mono className="num">{endTime || '—'}</Text>
        </Column>
      </Grid></Surface>

      {/* RPE */}
      {session.rpe != null && (
        <Surface variant="flat" pad="sm">
          <Column gap={1}>
            <Row gap={1} align="center">
              <Gauge size={14} className="faint" />
              <Text size="eyebrow">Session RPE</Text>
            </Row>
            <Badge tone="accent">{session.rpe}</Badge>
          </Column>
        </Surface>
      )}

      {/* Tags */}
      {session.tags != null && session.tags.length > 0 && (
        <Surface variant="flat" pad="sm">
          <Column gap={1}>
            <Row gap={1} align="center">
              <Tag size={14} className="faint" />
              <Text size="eyebrow">Tags</Text>
            </Row>
            <Cluster>
              {session.tags.map((t) => (
                <Badge key={t} dot>{t}</Badge>
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
              <Text size="eyebrow">Notes</Text>
            </Row>
            <Text color="muted">{session.notes}</Text>
          </Column>
        </Surface>
      )}

      {/* Segment Splits */}
      {session.paceTarget?.kind === 'segments' && (
        <SegmentSplitsCard
          segments={session.paceTarget.segments}
          cardioSets={session.segments
            .flatMap(s => s.sets)
            .filter(s => (s.distanceMeters !== undefined || s.durationSeconds !== undefined) &&
                         s.weightKg === undefined && s.reps === undefined)
          }
        />
      )}

      {/* Photos */}
      {session.media && session.media.length > 0 && (
        <Surface variant="flat" pad="sm">
          <Column gap={1}>
            <Row gap={1} align="center">
              <Image size={14} className="faint" />
              <Text size="eyebrow">Photos · {session.media.length}</Text>
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
                    {b.tag && <Badge dot>{b.tag}</Badge>}
                  </Row>
                  {b.exercises.map((ex) => (
                    <Row key={ex.blockId ?? `${b.id}-${ex.name}-${ex.hold ?? ''}`} align="center" justify="between">
                      <Text size="detail">{ex.name}</Text>
                      <Text size="caption" mono>{ex.hold}</Text>
                    </Row>
                  ))}
                </>
              )}

              {b.type === 'cardio' && (() => {
                const ex = b.exercises[0];
                return (
                  <>
                    <Row align="center" justify="between">
                      <Text size="detail">{ex.name}</Text>
                    </Row>
                    <Grid cols={4}>
                      {CARDIO_FIELDS.map((f) => {
                        const raw = ex.cardioSet?.[f.key] as number | undefined;
                        const display = raw != null && raw > 0 ? f.toDisplay(raw) : '—';
                        return (
                          <Column key={f.key} gap={1} align="center">
                            <Text size="eyebrow">{f.label}</Text>
                            <Text size="detail" mono className="num">
                              {display}
                              {display !== '—' && <Text as="span" size="caption" color="muted"> {f.unit}</Text>}
                            </Text>
                          </Column>
                        );
                      })}
                    </Grid>
                  </>
                );
              })()}

              {b.type === 'transition' && (
                <Row align="center" justify="between">
                  <Row gap={1} align="center">
                    <Badge dot>Transition</Badge>
                    <Text size="detail">{b.exercises[0]?.name}</Text>
                  </Row>
                  {(b.exercises[0]?.cardioSet?.durationSeconds ?? 0) > 0 && (
                    <Text size="caption" mono color="muted">{b.exercises[0]!.cardioSet!.durationSeconds}s</Text>
                  )}
                </Row>
              )}

              {(b.type === 'single' || b.type === 'superset' || b.type === 'circuit' || b.type === 'emom' || b.type === 'amrap') && (
                <>
                  {b.type === 'single' ? (
                    <Row align="center" justify="between">
                      <Row gap={1} align="center" className="min-w-0">
                        <Text as="span" size="caption" mono bold color="muted" className="num set-number">{idx + 1}</Text>
                        <Text size="detail">{b.exercises[0].name}</Text>
                      </Row>
                    </Row>
                  ) : (
                    <Row align="center" justify="between">
                      <Row gap={1} align="center">
                        <Badge dot>{b.label}</Badge>
                        {b.rounds != null && <Text size="caption" color="muted">{b.rounds} rounds</Text>}
                      </Row>
                    </Row>
                  )}
                  {b.exercises.map((ex, i) => (
                    <Column key={ex.blockId ?? `${b.id}-${ex.label ?? ex.name}`}>
                      {b.type !== 'single' && (
                        <Row gap={1} align="center" justify="between">
                          <Row gap={1} align="center">
                            <LetterBadge letter={ex.label ?? String(i + 1)} />
                            <Text size="detail">{ex.name}</Text>
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
                    </Column>
                  ))}
                </>
              )}
            </Column>
          </Surface>
        ))}
      </Column>

      {/* menu modal */}
      {menuOpen && (
        <Modal open onClose={() => setMenuOpen(false)} size="sm">
          <Column>
            <Row justify="between" align="center">
              <Text size="detail">Session Options</Text>
              <Button type="button" variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                <X size={10} className="faint" />
              </Button>
            </Row>
            {onEdit && <Button type="button" size="sm" onClick={() => { setMenuOpen(false); onEdit(); }}>Edit</Button>}
            <Button type="button" size="sm" className="error-tint" onClick={() => { setMenuOpen(false); setDeleteConfirm(true); }}>
              <Trash2 size={9} /> Delete session
            </Button>
          </Column>
        </Modal>
      )}

      {/* delete confirm modal */}
      {deleteConfirm && (
        <Modal open onClose={() => setDeleteConfirm(false)} size="sm">
          <Column>
            <Column gap={1}>
              <Text as="h3">Delete session?</Text>
              <Text size="caption" color="faint">This removes the entire session and cannot be undone.</Text>
            </Column>
            <Row justify="between">
              <Button type="button" variant="secondary" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
              <Button type="button" className="error-tint" onClick={handleDelete}>
                <Trash2 size={12} /> Delete
              </Button>
            </Row>
          </Column>
        </Modal>
      )}
    </Column>
  );
}
