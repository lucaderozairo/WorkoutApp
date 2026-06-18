import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useCommand } from '@ui/bindings';
import type { ActivityHistoryItem, ActivitiesState } from '@features/training_log';
import { getActivityHistory } from '@features/training_log';
import type { CardioSport, RecentCardioView } from '@features/cardio';
import type { Insight } from '@features/insights';
import type { Id } from '@shared/types';
import type { ExerciseProgression, ProgressionState } from '@features/progression';
import {
  handleAddAnnotation,
  handleDeleteAnnotation,
  getAnnotations,
} from '@features/progress_analysis';

export type SportFilter = 'all' | 'strength' | CardioSport;

export function useProgressScreen() {
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [annExercise, setAnnExercise] = useState('');
  const [annDate, setAnnDate] = useState(new Date().toISOString().split('T')[0]);
  const [annLabel, setAnnLabel] = useState('');
  const [annColor, setAnnColor] = useState<'success' | 'warning' | 'info'>('info');
  const [showAnnForm, setShowAnnForm] = useState(false);

  const navigate = useNavigate();

  const sessionsState = useQuery('sessions');
  const history = useMemo(() => getActivityHistory(), [sessionsState]);
  const progressionsRaw = useQuery('exercise_progressions');
  const exerciseList = useMemo<ExerciseProgression[]>(
    () => {
      const progressions = Object.values(progressionsRaw ?? {}) as ExerciseProgression[];
      return [...progressions].sort((a, b) =>
        a.exerciseName.localeCompare(b.exerciseName)
      );
    },
    [progressionsRaw],
  );

  const sessionsByType = useMemo(() => {
    const map = new Map<string, ActivityHistoryItem[]>();
    for (const s of history) {
      map.set(s.name, [...(map.get(s.name) ?? []), s]);
    }
    return map;
  }, [history]);

  const insights = (useQuery('insights') ?? []) as Insight[];
  const recentCardioRaw = useQuery('recent_cardio_sessions');
  const allCardio = useMemo(
    () => (recentCardioRaw as RecentCardioView | null)?.sessions ?? [],
    [recentCardioRaw],
  );

  const { totalSets, prCount } = useMemo(() => ({
    totalSets: history.reduce((acc, s) => acc + s.totalSets, 0),
    prCount: history.filter(s => s.hasPR).length,
  }), [history]);

  const visibleCardioSports = useMemo(
    () => Array.from(new Set(allCardio.map(s => s.sport))) as CardioSport[],
    [allCardio],
  );
  const cardioBySport = useCallback(
    (sport: CardioSport) => allCardio.filter(s => s.sport === sport),
    [allCardio],
  );

  const { dispatch: dispatchAddAnnotation } = useCommand(handleAddAnnotation);
  const { dispatch: dispatchDeleteAnnotation } = useCommand(handleDeleteAnnotation);

  async function handleAddAnn() {
    if (!annExercise.trim() || !annLabel.trim()) return;
    await dispatchAddAnnotation({
      type: 'AddAnnotation',
      userId: 'user-001' as Id<'User'>,
      exerciseName: annExercise.trim(),
      dateIso: annDate,
      label: annLabel.trim(),
      color: annColor,
    });
    setAnnLabel('');
    setShowAnnForm(false);
  }

  async function handleDeleteAnn(annotationId: Id<'Annotation'>) {
    await dispatchDeleteAnnotation({ type: 'DeleteAnnotation', annotationId });
  }

  const allAnnotations = useMemo(
    () => (annExercise ? getAnnotations(annExercise) : []),
    [annExercise],
  );

  const sportsToShow = useMemo<CardioSport[]>(
    () =>
      sportFilter === 'all' || sportFilter === 'strength'
        ? visibleCardioSports
        : visibleCardioSports.includes(sportFilter as CardioSport)
          ? [sportFilter as CardioSport]
          : [],
    [sportFilter, visibleCardioSports],
  );

  return {
    navigate,
    sportFilter,
    setSportFilter,
    annExercise,
    setAnnExercise,
    annDate,
    setAnnDate,
    annLabel,
    setAnnLabel,
    annColor,
    setAnnColor,
    showAnnForm,
    setShowAnnForm,
    history,
    exerciseList,
    sessionsByType,
    insights,
    allCardio,
    totalSets,
    prCount,
    visibleCardioSports,
    cardioBySport,
    sportsToShow,
    allAnnotations,
    handleAddAnn,
    handleDeleteAnn,
  };
}
