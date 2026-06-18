import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ActivityView, ActivitiesState } from '@features/training_log';
import {
  handleFinishOrUpdateSession,
} from '@features/training_log';
import { useCommand, useQuery } from '@ui/bindings';
import { exportSessionBackup } from '@features/data_transfer';
import { downloadJson } from '@shared/utils/csv';
import { exportActivitySessionCsv } from '@ui/components/transfer';
import { handleCreateTemplate } from '@features/templates';

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


export function useFinishSession() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const sessionsState = useQuery('sessions');

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

  const { dispatch: finishOrUpdate } = useCommand(handleFinishOrUpdateSession);
  const { dispatch: saveTemplate } = useCommand(handleCreateTemplate);

  const rawTs = date && startTime ? new Date(`${date}T${startTime}`).getTime() : NaN;
  const startTimestamp = Number.isFinite(rawTs) ? rawTs : null;
  const rawEndTs = date && endTime ? new Date(`${date}T${endTime}`).getTime() : NaN;
  const endTimestampRaw = Number.isFinite(rawEndTs) ? rawEndTs : null;
  const endTimestamp = finished ? (finishedAtRef.current ?? Date.now()) : (endTimestampRaw ?? now);
  const durationMs = startTimestamp != null && endTimestamp > startTimestamp ? endTimestamp - startTimestamp : 0;

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

    const newStartedAt = date && startTime ? new Date(`${date}T${startTime}`).getTime() : undefined;
    const newFinishedAt = date && endTime ? new Date(`${date}T${endTime}`).getTime() : undefined;

    if (isActiveSession) {
      finishedAtRef.current = newFinishedAt ?? Date.now();
    }

    await finishOrUpdate({
      type: 'FinishOrUpdateSession',
      sessionId: sid,
      isActive: isActiveSession,
      name,
      notes,
      sessionRpe: rpe ?? undefined,
      tags,
      startedAt: newStartedAt,
      finishedAt: isActiveSession ? (newFinishedAt ?? Date.now()) : newFinishedAt,
    });

    if (isActiveSession) {
      setFinished(true);
    } else {
      navigate(`/sessions/${session.id}`);
    }
  };

  const handleExportJson = () => {
    if (!session) return;
    const d = new Date().toISOString().split('T')[0];
    downloadJson(exportSessionBackup([session]), `session-${session.id}-${d}.json`);
  };

  const handleExportCsv = () => {
    if (session) exportActivitySessionCsv(session);
  };

  const handleSaveAsTemplate = async () => {
    if (!session || session.segments.length === 0) return;
    await saveTemplate({
      type: 'CreateTemplate',
      name: name.trim() || session.name,
      primarySport: session.primarySport,
      exercises: session.segments.map(s => ({
        name: s.exerciseName,
        category: s.exerciseCategory,
        targetSets: s.sets.filter(set => !set.isWarmup).length,
        restSeconds: s.restSeconds,
        notes: s.notes || undefined,
      })),
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
