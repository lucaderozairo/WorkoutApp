import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useCommand } from '@ui/bindings';
import type { ActivityHistoryItem, ActivitiesState } from '@features/training_log/contract';
import { getActivityHistory } from '@features/training_log';
import type { CardioSport, RecentCardioView } from '@features/cardio/contract';
import type { Insight } from '@features/insights/contract';
import type { Id } from '@shared/types';
import type { ProgressionState } from '@features/progression/contract';
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

  const sessionsState = useQuery<ActivitiesState>('sessions');
  const history = useMemo(() => getActivityHistory(), [sessionsState]);
  const progressions = (useQuery<ProgressionState>('exercise_progressions') ?? {}) as ProgressionState;
  const exerciseList = Object.values(progressions).sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName)
  );

  const sessionsByType = useMemo(() => {
    const map = new Map<string, ActivityHistoryItem[]>();
    for (const s of history) {
      map.set(s.name, [...(map.get(s.name) ?? []), s]);
    }
    return map;
  }, [history]);

  const insights = (useQuery<Insight[]>('insights') ?? []) as Insight[];
  const allCardio = ((useQuery<RecentCardioView>('recent_cardio_sessions') ?? { sessions: [] }) as RecentCardioView).sessions;

  const totalSets = history.reduce((acc, s) => acc + s.totalSets, 0);
  const prCount = history.filter(s => s.hasPR).length;

  const visibleCardioSports = Array.from(new Set(allCardio.map(s => s.sport))) as CardioSport[];
  const cardioBySport = (sport: CardioSport) => allCardio.filter(s => s.sport === sport);

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

  const allAnnotations = annExercise ? getAnnotations(annExercise) : [];

  const sportsToShow: CardioSport[] = sportFilter === 'all' || sportFilter === 'strength'
    ? visibleCardioSports
    : (visibleCardioSports.includes(sportFilter as CardioSport) ? [sportFilter as CardioSport] : []);

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
