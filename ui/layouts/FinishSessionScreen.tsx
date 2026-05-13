import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ActiveSessionView } from '@features/training_log/projections';
import type { SessionHistoryItem } from '@features/training_log';
import {
  handleFinishSession, handleUpdateSessionNote,
  handleUpdateTrainingSession,
} from '@features/training_log';
import { useCommand, useQuery } from '@ui/bindings';
import { viewStore } from '@data/projections/views';
import { exportSessionEnvelope } from '@data/sources/local/persistence';
import { exportSessionCsv, triggerDownload } from '@shared/utils/exportSession';

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SUGGESTED_TAGS = ['push', 'pull', 'legs', 'upper', 'lower', 'full-body', 'heavy', 'light', 'deload'];

export function FinishSessionScreen() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const activeSession = useQuery<ActiveSessionView | null>('active_session');

  const [savedSession, setSavedSession] = useState<ActiveSessionView | null>(null);
  const isActiveSession = activeSession?.id === sessionId;
  const session = isActiveSession ? activeSession : savedSession;

  const [name, setName] = useState(session?.name ?? '');
  const [date, setDate] = useState(session?.startedAt ? new Date(session.startedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(session?.startedAt ? new Date(session.startedAt).toTimeString().slice(0, 5) : '');
  const [rpe, setRpe] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [photos, setPhotos] = useState<string[]>(session?.media ?? []);
  const [finished, setFinished] = useState(false);
  const [now, setNow] = useState(Date.now());
  const finishedAtRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finished]);

  const { dispatch: finish } = useCommand(handleFinishSession);
  const { dispatch: updateNote } = useCommand(handleUpdateSessionNote);
  const { dispatch: updateTrainingSession } = useCommand(handleUpdateTrainingSession);

  const totalSets = session ? session.blocks.reduce((acc, b) => acc + b.sets.length, 0) : 0;

  const startTimestamp = date && startTime ? new Date(`${date}T${startTime}`).getTime() : null;
  const endTime = finished ? (finishedAtRef.current ?? Date.now()) : now;
  const durationMs = startTimestamp && endTime > startTimestamp ? endTime - startTimestamp : 0;

  function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
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

  const submit = async () => {
    if (!session || !isActiveSession) return;
    const sid = session.id;
    const oldNotes = session.notes;
    const oldName = session.name;
    const oldStartedAt = session.startedAt;

    setSavedSession(session);
    finishedAtRef.current = Date.now();

    if (notes !== oldNotes) {
      await updateNote({ type: 'UpdateSessionNote', sessionId: sid, notes });
    }

    await finish({
      type: 'FinishSession',
      sessionId: sid,
      ...(rpe !== null ? { sessionRpe: rpe } : {}),
      ...(tags.length > 0 ? { tags } : {}),
    });

    const newStartedAt = date && startTime
      ? new Date(`${date}T${startTime}`).getTime()
      : undefined;
    await updateTrainingSession({
      sessionId: sid,
      ...(name !== oldName ? { name } : {}),
      ...(newStartedAt !== undefined && newStartedAt !== oldStartedAt ? { startedAt: newStartedAt } : {}),
      ...(notes !== oldNotes ? { notes } : {}),
      ...(photos.length > 0 ? { media: photos } : {}),
    });

    setFinished(true);
  };

  const handleExportJson = () => {
    if (!session) return;
    const history = viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
    const item = history.find(s => s.id === session.id);
    const sessions = item ? [item] : [];
    const json = exportSessionEnvelope(sessions);
    const blob = new Blob([json], { type: 'application/json' });
    const date = new Date().toISOString().split('T')[0];
    triggerDownload(blob, `session-${session.id}-${date}.json`);
  };

  const handleExportCsv = () => {
    if (session) exportSessionCsv(session);
  };

  if (!session) {
    return (
      <div className="column">
        <div className="row compact">
          <button className="ghost" onClick={() => navigate('/log')}>Back</button>
        </div>
        <p className="caption">Session not found.</p>
      </div>
    );
  }

  return (
    <div className="column">
      <div className="row space-between align-center compact">
        <button className="ghost" onClick={() => navigate(`/log/${session.id}`)}>Back</button>
        <h2>Finish session</h2>
        {!finished && <button className="primary" onClick={submit}>Finish</button>}
      </div>

      <div className="column compact">
        <label className="label" htmlFor="finish-name">Title</label>
        <input id="finish-name" className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="row compact">
        <div className="column compact grow">
          <label className="label" htmlFor="finish-date">Date</label>
          <input id="finish-date" className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="column compact grow">
          <label className="label" htmlFor="finish-start">Start time</label>
          <input id="finish-start" className="form-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
      </div>

      {startTimestamp && (
        <div className="row align-center compact">
          <span className="caption">Duration</span>
          <span className="mono num caption">{formatDuration(durationMs)}</span>
        </div>
      )}

      <div className="column compact">
        <span className="caption">Review</span>
        {session.blocks.map(b => (
          <div key={b.id} className="row align-center space-between">
            <span>{b.exerciseName}</span>
            <span className="caption">{b.sets.length} sets</span>
          </div>
        ))}
      </div>

      {!finished && (
        <>
          <div className="column compact">
            <span className="caption">Session RPE</span>
            <div className="cluster compact">
              {RPE_VALUES.map(n => (
                <button key={n} type="button" className={`pill${rpe === n ? ' primary' : ''}`} onClick={() => setRpe(n)}>{n}</button>
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
        <label className="label" htmlFor="finish-notes">Notes</label>
        <textarea id="finish-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Session notes…" rows={3} />
      </div>

      <div className="column compact">
        <span className="label">Photos</span>
        <div className="row compact wrap">
          {photos.map((url, i) => (
            <div key={i} className="surface compact" style={{ position: 'relative', width: 80, height: 80 }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--r-sm)' }} />
              <button type="button" className="ghost icon sm" style={{ position: 'absolute', top: 2, right: 2, background: 'var(--surface-1)' }} onClick={() => removePhoto(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="surface compact column align-center" style={{ width: 80, height: 80, justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
            <span className="caption">+</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoUpload} />
      </div>

      {finished && (
        <div className="row compact align-center">
          <button type="button" className="secondary" onClick={handleExportJson}>Export JSON</button>
          <button type="button" className="secondary" onClick={handleExportCsv}>Export CSV</button>
          <div className="grow" />
          <button type="button" className="primary" onClick={() => navigate('/log')}>Done</button>
        </div>
      )}
    </div>
  );
}
