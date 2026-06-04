import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@ui/bindings';
import type { ProgressionState, VolumeEntry } from '@features/progression/contract';

const SESSION_GAP = 2;

export interface SetPoint {
  x: number;
  workingY: number | null;
  warmupY: number | null;
  reps: number;
  date: string;
  setNum: number;
}

export interface SessionBand {
  x: number;
  label: string;
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function formatDateFull(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function buildFlatData(history: VolumeEntry[]): { points: SetPoint[]; bands: SessionBand[]; dividers: number[] } {
  const points: SetPoint[] = [];
  const bands: SessionBand[] = [];
  const dividers: number[] = [];
  let cursor = 0;

  for (let idx = 0; idx < history.length; idx++) {
    const entry = history[idx];
    const warmups = entry.warmupWeights ?? [];
    const working = entry.setWeights ?? [];
    if (warmups.length + working.length === 0) { cursor += SESSION_GAP; continue; }

    const start = cursor;
    warmups.forEach((w, i) => {
      points.push({ x: cursor, workingY: null, warmupY: w, reps: 0, date: entry.date, setNum: i + 1 });
      cursor++;
    });
    working.forEach((w, i) => {
      points.push({ x: cursor, workingY: w, warmupY: null, reps: entry.setReps?.[i] ?? 0, date: entry.date, setNum: warmups.length + i + 1 });
      cursor++;
    });

    bands.push({ x: (start + cursor - 1) / 2, label: formatDate(entry.date) });
    if (idx < history.length - 1) dividers.push(cursor + SESSION_GAP / 2);
    cursor += SESSION_GAP;
  }

  return { points, bands, dividers };
}

export function useExerciseHistory() {
  const { exerciseName: rawParam } = useParams<{ exerciseName: string }>();
  const navigate = useNavigate();
  const exerciseName = rawParam ? decodeURIComponent(rawParam) : '';

  const progressions = useQuery<ProgressionState>('exercise_progressions');
  const progression = progressions?.[exerciseName];

  if (!progression || progression.history.length === 0) {
    return { exerciseName, navigate, notFound: true as const, progression: null, history: [], points: [], bands: [], dividers: [], allWeights: [], maxWeight: 0, step: 10, yMax: 10, xMax: 0, maxSets: 0, reversed: [] };
  }

  const history = progression.history;
  const { points, bands, dividers } = buildFlatData(history);

  const allWeights = points.map(p => p.workingY ?? p.warmupY ?? 0).filter(v => v > 0);
  const maxWeight = Math.max(...allWeights);
  const step = maxWeight <= 50 ? 10 : maxWeight <= 100 ? 20 : maxWeight <= 200 ? 40 : 50;
  const yMax = Math.ceil(maxWeight / step) * step + step;
  const xMax = points.length > 0 ? points[points.length - 1].x : 0;

  const maxSets = Math.max(...history.map(e => e.setWeights?.length ?? 0));
  const reversed = [...history].reverse();

  return {
    exerciseName,
    navigate,
    notFound: false as const,
    progression,
    history,
    points,
    bands,
    dividers,
    allWeights,
    maxWeight,
    step,
    yMax,
    xMax,
    maxSets,
    reversed,
  };
}
