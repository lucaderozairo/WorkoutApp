import { useState } from 'react';
import { Grid, Row, Column } from '@ui/layout';
import { useParams, useNavigate } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import { Surface, Text } from '@ui/atoms';
import { Dialog, ChipGroup, PhotoGallery, Button, Input, Textarea } from '@ui/molecules';
import { useQuery, useCommand } from '@ui/bindings';
import type { ActivitiesState, ExerciseCategory } from '@features/training_log';
import {
  handleDeleteSession,
  handleAddBlock, handleAddToSuperset, handleSetBlockType, handleSetBlockRounds,
  handleRenameSession,
  handleUpdateSessionStartTime,
  handleUpdateSessionNote,
  handleUpdateSessionDetails,
} from '@features/training_log';
import type { CardioSession } from '@features/cardio';
import { handleUpdateCardioSession, handleDeleteCardioSession } from '@features/cardio';
import { WorkoutView } from '@ui/components/session/WorkoutView';
import { ExercisePicker } from '@ui/components/log/ExercisePicker';
import { RPE_VALUES, SUGGESTED_TAGS } from './useFinishSession';
import { UndoToastProvider } from '@ui/components/log';
import type { UICondition } from '@features/training_log/projections/viewTypes';
import { BT_OPTIONS } from '@features/training_log/projections/viewTypes';
import { cryptoIdGenerator } from '@core/id-generator';

function toDateInput(ts: number | null | undefined): string {
  if (!ts) return new Date().toISOString().slice(0, 10);
  return new Date(ts).toISOString().slice(0, 10);
}

function toTimeInput(ts: number | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toTimeString().slice(0, 5);
}

function msToTimeInput(ms: number): string {
  return new Date(ms).toTimeString().slice(0, 5);
}

export function EditSessionScreen() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const sessionsState = useQuery('sessions');
  const cardioView = useQuery('recent_cardio_sessions') ?? { sessions: [] };
  const conditions = (useQuery('active_conditions') ?? []) as UICondition[];

  const strengthSession = sessionId ? sessionsState?.byId[sessionId] ?? null : null;
  const cardioSession = sessionId ? cardioView.sessions.find(s => s.id === sessionId) ?? null : null;
  const isCardio = !!cardioSession && !strengthSession;
  const session = strengthSession ?? cardioSession;

  const [showPicker, setShowPicker] = useState(false);
  const [name, setName] = useState(strengthSession?.name ?? cardioSession?.title ?? '');
  const [date, setDate] = useState(session?.startedAt ? toDateInput(session.startedAt) : new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(session?.startedAt ? toTimeInput(session.startedAt) : '');
  const [endTime, setEndTime] = useState(
    strengthSession?.finishedAt ? msToTimeInput(strengthSession.finishedAt) : '',
  );
  const [rpe, setRpe] = useState<number | null>(strengthSession?.rpe ?? null);
  const [tags, setTags] = useState<string[]>(strengthSession?.tags ?? []);
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [photos, setPhotos] = useState<string[]>(strengthSession?.media ?? cardioSession?.media ?? []);
  const [durationSec, setDurationSec] = useState(cardioSession?.durationSeconds ?? 0);
  const [distanceM, setDistanceM] = useState(cardioSession?.distanceMeters ?? 0);

  const [deleteAlert, setDeleteAlert] = useState(false);

  const { dispatch: renameSession } = useCommand(handleRenameSession);
  const { dispatch: updateStartTime } = useCommand(handleUpdateSessionStartTime);
  const { dispatch: updateNote } = useCommand(handleUpdateSessionNote);
  const { dispatch: updateDetails } = useCommand(handleUpdateSessionDetails);
  const { dispatch: deleteSession } = useCommand(handleDeleteSession);
  const { dispatch: deleteCardio } = useCommand(handleDeleteCardioSession);
  const { dispatch: updateCardio } = useCommand(handleUpdateCardioSession);
  const { dispatch: addBlock } = useCommand(handleAddBlock);
  const { dispatch: addToSuperset } = useCommand(handleAddToSuperset);
  const { dispatch: setBlockType } = useCommand(handleSetBlockType);
  const { dispatch: setBlockRounds } = useCommand(handleSetBlockRounds);

  if (!session) {
    return (
      <Column>
        <Row gap={1}>
          <Button variant="ghost" onClick={() => navigate('/sessions')}>Back</Button>
        </Row>
        <Text as="p" size="caption">Session not found.</Text>
      </Column>
    );
  }

  const toggleTag = (t: string) => {
    setTags(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };

  const addPhotos = (files: FileList) => {
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...urls]);
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!session) return;

    if (isCardio) {
      const newStartedAt = date && startTime ? new Date(`${date}T${startTime}`).getTime() : undefined;
      await updateCardio({
        type: 'UpdateCardioSession',
        sessionId: session.id,
        ...(durationSec !== cardioSession!.durationSeconds ? { durationSeconds: durationSec } : {}),
        ...(distanceM !== cardioSession!.distanceMeters ? { distanceMeters: distanceM } : {}),
        ...(notes !== session.notes ? { notes } : {}),
        ...(name !== (cardioSession!.title ?? '') ? { title: name } : {}),
        ...(newStartedAt !== undefined ? { startedAt: newStartedAt } : {}),
      });
    } else {
      const newStartedAt = date && startTime ? new Date(`${date}T${startTime}`).getTime() : undefined;
      const newFinishedAt = date && endTime ? new Date(`${date}T${endTime}`).getTime() : undefined;

      if (name !== strengthSession!.name)
        await renameSession({ type: 'RenameSession', sessionId: session.id, name });
      if (newStartedAt !== undefined)
        await updateStartTime({ type: 'UpdateSessionStartTime', sessionId: session.id, startedAt: newStartedAt });
      if (notes !== strengthSession!.notes)
        await updateNote({ type: 'UpdateSessionNote', sessionId: session.id, notes });
      await updateDetails({
        type: 'UpdateSessionDetails',
        sessionId: session.id,
        ...(newFinishedAt !== undefined ? { finishedAt: newFinishedAt } : {}),
        ...(rpe !== strengthSession!.rpe ? { rpe } : {}),
        ...(tags !== strengthSession!.tags ? { tags } : {}),
        ...(photos !== strengthSession!.media ? { media: photos } : {}),
      });
    }

    navigate(`/sessions/${session.id}`);
  };

  const handlePickerCommit = async (
    selections: Array<{ name: string; category: ExerciseCategory }>,
    blockType: typeof BT_OPTIONS[number],
    rounds?: number,
  ) => {
    if (!strengthSession?.id) return;

    if (blockType === 'Standard') {
      for (const s of selections) {
        await addBlock({ type: 'AddBlock', sessionId: strengthSession.id, exerciseName: s.name, exerciseCategory: s.category });
      }
      setShowPicker(false);
      return;
    }

    const domainBlockType =
      blockType === 'Circuit' ? 'circuit' as const :
        blockType === 'EMOM' ? 'emom' as const :
          blockType === 'AMRAP' ? 'amrap' as const : null;
    const isGrouped = selections.length >= 2;
    const blockIds = selections.map(() => cryptoIdGenerator.next<'Block'>());

    for (let i = 0; i < selections.length; i++) {
      await addBlock({
        type: 'AddBlock',
        sessionId: strengthSession.id,
        exerciseName: selections[i].name,
        exerciseCategory: selections[i].category,
        blockId: blockIds[i],
      });
      if (domainBlockType) {
        await setBlockType({ type: 'SetBlockType', sessionId: strengthSession.id, blockId: blockIds[i], blockType: domainBlockType });
        if (rounds != null) {
          await setBlockRounds({ type: 'SetBlockRounds', sessionId: strengthSession.id, blockId: blockIds[i], rounds });
        }
      }
    }

    if (isGrouped) {
      const groupId = cryptoIdGenerator.next<'SupersetGroup'>();
      for (const blockId of blockIds) {
        await addToSuperset({ type: 'AddToSuperset', sessionId: strengthSession.id, blockId, groupId });
      }
    }

    setShowPicker(false);
  };

  const handleConfirmDelete = async () => {
    if (!session?.id) return;
    if (isCardio) {
      await deleteCardio({ type: 'DeleteCardioSession', sessionId: session.id });
    } else {
      await deleteSession({ type: 'DeleteSession', sessionId: session.id });
    }
    setDeleteAlert(false);
    navigate('/sessions');
  };

  if (showPicker) {
    return (
      <UndoToastProvider>
        <ExercisePicker
          onClose={() => setShowPicker(false)}
          onCommit={handlePickerCommit}
        />
      </UndoToastProvider>
    );
  }

  return (
    <UndoToastProvider>
      <Grid>

        <Surface className="secondary column gap-1">
          <Row align="center" justify="between">
            <Row gap={1}>
              <Input id="edit-name" variant="ghost" type="text" value={name} onChange={e => setName(e.target.value)} />
            </Row>
            <Row gap={1} align="center">
              <Button variant="primary" size="sm" onClick={save}>Done</Button>
              <Button variant="secondary" size="sm" onClick={() => setDeleteAlert(true)}>
                <MoreVertical size={13} />
              </Button>
            </Row>
          </Row>
          <Grid cols={3} gap={1}>
            <Input label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <Input label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Grid>
        </Surface>

        {isCardio ? (
          <Row gap={1}>
            <Input label="Duration (sec)" type="number" min={0} value={durationSec} onChange={e => setDurationSec(Math.max(0, parseInt(e.target.value) || 0))} className="min-w-0" />
            <Input label="Distance (m)" type="number" min={0} value={distanceM} onChange={e => setDistanceM(Math.max(0, parseInt(e.target.value) || 0))} className="min-w-0" />
          </Row>
        ) : (
          <>
            <WorkoutView
              session={strengthSession}
              conditions={conditions}
              isActive={false}
              hideHeader
              onAddExercise={() => setShowPicker(true)}
              onFinish={() => navigate(`/sessions/${strengthSession!.id}`)}
            />

            <Column gap={1}>
              <Text size="caption">Session RPE</Text>
              <ChipGroup options={RPE_VALUES} isActive={n => rpe === n} onToggle={n => setRpe(rpe === n ? null : n)} />
            </Column>

            <Column gap={1}>
              <Text size="caption">Tags</Text>
              <ChipGroup options={SUGGESTED_TAGS} isActive={t => tags.includes(t)} onToggle={toggleTag} />
            </Column>
          </>
        )}

        <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes->" rows={3} />

        <PhotoGallery photos={photos} onAdd={addPhotos} onRemove={removePhoto} />

      </Grid>

      <Dialog
        open={deleteAlert}
        onClose={() => setDeleteAlert(false)}
        title="Delete session?"
        message="This removes the entire session and cannot be undone."
        confirm="Delete"
        onConfirm={handleConfirmDelete}
        destructive
      />
    </UndoToastProvider>
  );
}
