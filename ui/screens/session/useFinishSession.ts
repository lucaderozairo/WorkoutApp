import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ActivityView, ActivitiesState } from '@features/training_log';
import {
  handleFinishSession, handleUpdateSessionNote,
  handleRenameSession, handleUpdateSessionStartTime, handleUpdateSessionDetails,
} from '@features/training_log';
import { useCommand, useQuery } from '@ui/bindings';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import { exportSessionEnvelope } from '@data/sources/local/persistence';
import { exportSessionCsv, triggerDownload } from '@shared/utils/exportSession';
import { handleSaveTemplate } from '@features/planning';

export const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const SUGGESTED_TAGS = ['push', 'pull', 'legs', 'upper', 'lower', 'full-body', 'heavy', 'light', 'deload'];

function toDateInput(ts: number | null | undefined): string {
  if (!ts) return new Date().toISOString().slice(0, 10);
  return new Date(ts).toISOString().slice(0, 10);
}

function toTimeInput(ts: number | null | undefined): string {
  if (!ts) return '';
  return new Date(ts).toTimeString().slice(0, 5);
}

function nowDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

function msToTimeInput(ms: number): string {
  return new Date(ms).toTimeString().slice(0, 5);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function useFinishSession() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const sessionsState = useQuery<ActivitiesState>('sessions');

  const session: ActivityView | null = sessionId
    ? sessionsState?.byId[sessionId] ?? null
    : null;

  const isActiveSession = session?.status === 'active';
  const isAlreadyFinished = session?.status === 'finished';

  const [name, setName] = useState(session?.name ?? '');
  const [date, setDate] = useState(session?.startedAt ? toDateInput(session.startedAt) : nowDate());
  const [startTime, setStartTime] = useState(session?.startedAt ? toTimeInput(session.startedAt) : nowTime());
  const [endTime, setEndTime] = useState(
    isAlreadyFinished && session?.finishedAt ? msToTimeInput(session.finishedAt) : nowTime(),
  );
  const [rpe, setRpe] = useState<number | null>(session?.rpe ?? null);
  const [tags, setTags] = useState<string[]>(session?.tags ?? []);
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [photos, setPhotos] = useState<string[]>(session?.media ?? []);
  const [finished, setFinished] = useState(false);
  const [now, setNow] = useState(Date.now());
  const finishedAtRef = useRef<number | null>(
    isAlreadyFinished && session?.finishedAt ? session.finishedAt : null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (finished || isAlreadyFinished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finished, isAlreadyFinished]);

  const { dispatch: finish } = useCommand(handleFinishSession);
  const { dispatch: updateNote } = useCommand(handleUpdateSessionNote);
  const { dispatch: renameSession } = useCommand(handleRenameSession);
  const { dispatch: updateStartTime } = useCommand(handleUpdateSessionStartTime);
  const { dispatch: updateDetails } = useCommand(handleUpdateSessionDetails);
  const { dispatch: saveTemplate } = useCommand(handleSaveTemplate);

  const startTimestamp = date && startTime ? new Date(`${date}T${startTime}`).getTime() : null;
  const endTimestampRaw = date && endTime ? new Date(`${date}T${endTime}`).getTime() : null;
  const endTimestamp = finished ? (finishedAtRef.current ?? Date.now()) : (endTimestampRaw ?? now);
  const durationMs = startTimestamp && endTimestamp > startTimestamp ? endTimestamp - startTimestamp : 0;

  const actionLabel = isAlreadyFinished ? 'Update' : 'Finish';

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
    if (!session) return;
    const sid = session.id;
    const oldNotes = session.notes;
    const oldName = session.name;
    const oldStartedAt = session.startedAt;

    const newStartedAt = date && startTime ? new Date(`${date}T${startTime}`).getTime() : undefined;
    const newFinishedAt = date && endTime ? new Date(`${date}T${endTime}`).getTime() : undefined;

    if (isActiveSession) {
      finishedAtRef.current = newFinishedAt ?? Date.now();

      if (notes !== oldNotes) {
        await updateNote({ type: 'UpdateSessionNote', sessionId: sid, notes });
      }

      await finish({
        type: 'FinishSession',
        sessionId: sid,
        finishedAt: newFinishedAt,
        ...(rpe !== null ? { sessionRpe: rpe } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      });

      if (name !== oldName)
        await renameSession({ type: 'RenameSession', sessionId: sid, name });
      if (newStartedAt !== undefined && newStartedAt !== oldStartedAt)
        await updateStartTime({ type: 'UpdateSessionStartTime', sessionId: sid, startedAt: newStartedAt });
      if (photos.length > 0)
        await updateDetails({ type: 'UpdateSessionDetails', sessionId: sid, media: photos });

      setFinished(true);
    } else {
      if (name !== oldName)
        await renameSession({ type: 'RenameSession', sessionId: sid, name });
      if (newStartedAt !== undefined)
        await updateStartTime({ type: 'UpdateSessionStartTime', sessionId: sid, startedAt: newStartedAt });
      if (notes !== oldNotes)
        await updateNote({ type: 'UpdateSessionNote', sessionId: sid, notes });
      await updateDetails({
        type: 'UpdateSessionDetails',
        sessionId: sid,
        ...(newFinishedAt !== undefined ? { finishedAt: newFinishedAt } : {}),
        ...(rpe !== undefined ? { rpe } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(photos.length > 0 ? { media: photos } : {}),
      });
      navigate(`/sessions/${session.id}`);
    }
  };

  const handleExportJson = () => {
    if (!session) return;
    const json = exportSessionEnvelope([session]);
    const blob = new Blob([json], { type: 'application/json' });
    const d = new Date().toISOString().split('T')[0];
    triggerDownload(blob, `session-${session.id}-${d}.json`);
  };

  const handleExportCsv = () => {
    if (session) exportSessionCsv(session);
  };

  const handleSaveAsTemplate = async () => {
    if (!session || session.segments.length === 0) return;
    await saveTemplate({
      type: 'SaveTemplate',
      name: name.trim() || session.name,
      primarySport: session.primarySport,
      exercises: session.segments.map(s => ({ name: s.exerciseName, setCount: s.sets.length })),
    });
  };

  return {
    navigate,
    displaySession: session,
    isActiveSession,
    isAlreadyFinished,
    finished,
    name, setName,
    date, setDate,
    startTime, setStartTime,
    endTime, setEndTime,
    rpe, setRpe,
    tags,
    notes, setNotes,
    photos,
    fileInputRef,
    startTimestamp,
    durationMs,
    actionLabel,
    toggleTag,
    handlePhotoUpload,
    removePhoto,
    submit,
    handleExportJson,
    handleExportCsv,
    handleSaveAsTemplate,
  };
}
