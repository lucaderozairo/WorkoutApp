import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MoreVertical, Trash2 } from 'lucide-react';
import { useQuery, useCommand } from '@ui/bindings';
import type { ActivitiesState, ExerciseCategory } from '@features/training_log';
import {
  handleDeleteSession,
  handleAddBlock, handleAddToSuperset, handleSetBlockType,
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
  const sessionsState = useQuery<ActivitiesState>('sessions');
  const cardioView = useQuery<{ sessions: CardioSession[] }>('recent_cardio_sessions') ?? { sessions: [] };
  const conditions = (useQuery<UICondition[]>('active_conditions') ?? []) as UICondition[];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (!session) {
    return (
      <div className="column">
        <div className="row compact">
          <button className="ghost" onClick={() => navigate('/sessions')}>Back</button>
        </div>
        <p className="caption">Session not found.</p>
      </div>
    );
  }

  const toggleTag = (t: string) => {
    setTags(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
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
  ) => {
    if (!strengthSession?.id) return;
    const isGrouped = (blockType === 'Superset' || blockType === 'Circuit') && selections.length >= 2;

    if (isGrouped) {
      const groupId = cryptoIdGenerator.next<'SupersetGroup'>();
      const blockIds = selections.map(() => cryptoIdGenerator.next<'Block'>());
      const isCircuit = blockType === 'Circuit';
      for (let i = 0; i < selections.length; i++) {
        await addBlock({
          type: 'AddBlock',
          sessionId: strengthSession.id,
          exerciseName: selections[i].name,
          exerciseCategory: selections[i].category,
          blockId: blockIds[i],
        });
        if (isCircuit) {
          await setBlockType({ type: 'SetBlockType', sessionId: strengthSession.id, blockId: blockIds[i], blockType: 'circuit' });
        }
      }
      for (const blockId of blockIds) {
        await addToSuperset({ type: 'AddToSuperset', sessionId: strengthSession.id, blockId, groupId });
      }
    } else {
      for (const s of selections) {
        await addBlock({ type: 'AddBlock', sessionId: strengthSession.id, exerciseName: s.name, exerciseCategory: s.category });
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
      <div className="column">

        <div className="surface secondary column compact">
          <div className="row align-center space-between">
            <div className="row compact">
              <input id="edit-name" className="ghost" type="text" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="row compact align-center">
              <button type="button" className="primary sm" onClick={save}>Done</button>
              <button type="button" className="secondary sm" onClick={() => setDeleteAlert(true)}>
                <MoreVertical size={13} />
              </button>
            </div>
          </div>
          <div className="row compact align-center">
            <div className="column compact">
              <span className='surface ghost tight caption'>Start Time</span>
              <input id="edit-start" className="ghost sm" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="column compact">
              <span className='surface ghost tight caption'>End Time</span>
              <input id="edit-end" className="ghost sm" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
            <div className="column compact">
              <span className='surface ghost tight caption'>Date</span>
            <input id="edit-date" className="ghost sm" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>

        {isCardio ? (
          <div className="column compact">
            <div className="row compact">
              <div className="column compact grow">
                <span className="caption">Duration (sec)</span>
                <input className="form-input" type="number" min="0" value={durationSec} onChange={e => setDurationSec(Math.max(0, parseInt(e.target.value) || 0))} />
              </div>
              <div className="column compact grow">
                <span className="caption">Distance (m)</span>
                <input className="form-input" type="number" min="0" value={distanceM} onChange={e => setDistanceM(Math.max(0, parseInt(e.target.value) || 0))} />
              </div>
            </div>
          </div>
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

            <div className="column compact">
              <span className="caption">Session RPE</span>
              <div className="cluster compact">
                {RPE_VALUES.map(n => (
                  <button key={n} type="button" className={`pill${rpe === n ? ' primary' : ''}`} onClick={() => setRpe(rpe === n ? null : n)}>{n}</button>
                ))}
              </div>
            </div>

            <div className="column compact">
              <span className="caption">Tags</span>
              <div className="cluster compact">
                {SUGGESTED_TAGS.map(t => (
                  <button key={t} type="button" className={`pill${tags.includes(t) ? ' primary' : ''}`} onClick={() => toggleTag(t)}>{t}</button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="column compact">
          <label className="label" htmlFor="edit-notes">Notes</label>
          <textarea id="edit-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes…" rows={3} />
        </div>

        <div className="column compact">
          <span className="label">Photos</span>
          <div className="row compact wrap">
            {photos.map((url, i) => (
              <div key={i} className="photo-thumb">
                <img src={url} alt="" />
                <button type="button" className="ghost icon sm photo-del" onClick={() => removePhoto(i)}>✕</button>
              </div>
            ))}
            <button type="button" className="photo-thumb surface tight column align-center center" onClick={() => fileInputRef.current?.click()}>
              <span className="caption">+</span>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
        </div>

      </div>

      {deleteAlert && (
        <div className="modal-overlay">
          <div className="surface">
            <div className="column compact">
              <h3>Delete session?</h3>
              <span className="caption faint">This removes the entire session and cannot be undone.</span>
            </div>
            <div className="row space-between">
              <button type="button" className="secondary" onClick={() => setDeleteAlert(false)}>Cancel</button>
              <button type="button" className="warning" onClick={handleConfirmDelete}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </UndoToastProvider>
  );
}