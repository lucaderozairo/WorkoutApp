import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useCommand } from '@ui/bindings';
import {
  handleAddBlock,
  handleAddToSuperset,
  handleDeleteSession,
  handleSetBlockType,
  handleSetBlockRounds,
  handleUpdateSessionStartTime,
  getActivityHistory,
} from '@features/training_log';
import type { ActivityView, ActivitiesState, ActivityHistoryItem, ExerciseCategory } from '@features/training_log';
import type { RecentCardioView, CardioSession } from '@features/cardio';
import { handleDeleteCardioSession } from '@features/cardio';
import { toDateKey } from '@features/training_log/queries/calendarUtils';
import { DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';
import type { SessionFilters } from '@ui/components/log/SessionFilterBar';
import type { Id } from '@shared/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { useSessionTimer } from '@ui/components/log';
import type { UICondition } from '@features/training_log/projections/viewTypes';
import { BT_OPTIONS } from '@features/training_log/projections/viewTypes';

export type CombinedEntry =
  | { kind: 'strength'; session: ActivityHistoryItem; matchedExercise?: string }
  | { kind: 'cardio'; session: CardioSession };

export const USER_ID = 'user-001' as Id<'User'>;

export function useLogScreen() {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams<{ sessionId: string }>();

  const sessionsState = useQuery('sessions');
  const conditions = (useQuery('active_conditions') ?? []) as UICondition[];
  const cardioView = (useQuery('recent_cardio_sessions') ?? { sessions: [] }) as RecentCardioView;
  const exerciseProgressions = useQuery('exercise_progressions') ?? {};

  const activeSession: ActivityView | null = sessionsState?.activeId
    ? sessionsState.byId[sessionsState.activeId] ?? null
    : null;

  const session: ActivityView | null = routeSessionId
    ? sessionsState?.byId[routeSessionId] ?? null
    : null;

  const cardioSession: CardioSession | null = routeSessionId && !session
    ? cardioView.sessions.find(s => s.id === routeSessionId) ?? null
    : null;

  const strengthHistory = useMemo(
    () => getActivityHistory(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionsState],
  );

  const [showPicker, setShowPicker] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [sessionFilters, setSessionFilters] = useState<SessionFilters>(DEFAULT_FILTERS);
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: 'strength' | 'cardio'; id: string } | null>(null);

  useEffect(() => {
    if (routeSessionId) setDeleteConfirm(null);
  }, [routeSessionId]);

  const exercisesBySession = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (sessionsState) {
      for (const [id, view] of Object.entries(sessionsState.byId)) {
        map.set(id, new Set(view.segments.map(b => b.exerciseName)));
      }
    }
    return map;
  }, [sessionsState]);

  const allExerciseNames = useMemo(() => {
    const names = new Set<string>();
    Object.keys(exerciseProgressions).forEach(n => names.add(n));
    exercisesBySession.forEach(set => set.forEach(n => names.add(n)));
    return Array.from(names).sort();
  }, [exerciseProgressions, exercisesBySession]);

  const baseSessions = useMemo((): CombinedEntry[] => {
    const { type, exercise, sessionName } = sessionFilters;
    const result: CombinedEntry[] = [];

    if (type === 'all' || type === 'strength') {
      for (const s of strengthHistory) {
        if (exercise) {
          const names = exercisesBySession.get(s.id);
          if (!names?.has(exercise)) continue;
        }
        if (sessionName && !s.name.toLowerCase().includes(sessionName.toLowerCase())) continue;
        result.push({ kind: 'strength', session: s, matchedExercise: exercise || undefined });
      }
    }

    if (type !== 'strength' && !exercise) {
      for (const s of cardioView.sessions) {
        if (type !== 'all' && s.sport !== type) continue;
        if (sessionName && !(s.title ?? '').toLowerCase().includes(sessionName.toLowerCase())) continue;
        result.push({ kind: 'cardio', session: s });
      }
    }

    return result.sort((a, b) => b.session.startedAt - a.session.startedAt);
  }, [strengthHistory, cardioView, sessionFilters, exercisesBySession]);

  const filteredSessions = useMemo((): CombinedEntry[] => {
    let result = baseSessions;

    if (sessionFilters.dateFrom) {
      const from = sessionFilters.dateFrom;
      const to = sessionFilters.dateTo || from;
      result = result.filter(e => {
        const key = toDateKey(e.session.startedAt);
        return key >= from && key <= to;
      });
    } else if (sessionFilters.dateRange !== 'all') {
      const days = sessionFilters.dateRange === '7d' ? 7 : 30;
      const cutoff = Date.now() - days * 86_400_000;
      result = result.filter(e => e.session.startedAt >= cutoff);
    }

    if (sessionFilters.sort === 'oldest') result = [...result].reverse();
    return result;
  }, [baseSessions, sessionFilters]);

  const { dispatch: addBlock } = useCommand(handleAddBlock);
  const { dispatch: addToSuperset } = useCommand(handleAddToSuperset);
  const { dispatch: setBlockType } = useCommand(handleSetBlockType);
  const { dispatch: setBlockRounds } = useCommand(handleSetBlockRounds);
  const { dispatch: updateStartTime } = useCommand(handleUpdateSessionStartTime);
  const { dispatch: deleteStrengthSession } = useCommand(handleDeleteSession);
  const { dispatch: deleteCardioSession } = useCommand(handleDeleteCardioSession);

  const timer = useSessionTimer(session?.startedAt ?? null);
  const timerNotStarted = session?.startedAt == null;

  useEffect(() => {
    if (!showAddMenu) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowAddMenu(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showAddMenu]);

  async function handlePickerCommit(
    selections: Array<{ name: string; category: ExerciseCategory }>,
    blockType: typeof BT_OPTIONS[number],
    rounds?: number,
  ) {
    if (!session?.id) return;

    if (blockType === 'Standard') {
      for (const s of selections) {
        await addBlock({ type: 'AddBlock', sessionId: session.id, exerciseName: s.name, exerciseCategory: s.category });
      }
      return;
    }

    // Structured block: Superset relies on grouping (blockType stays default);
    // Circuit/EMOM/AMRAP carry an explicit blockType and optional round count.
    const domainBlockType =
      blockType === 'Circuit' ? 'circuit' as const :
        blockType === 'EMOM' ? 'emom' as const :
          blockType === 'AMRAP' ? 'amrap' as const : null;
    const isGrouped = selections.length >= 2;
    const blockIds = selections.map(() => cryptoIdGenerator.next<'Block'>());

    for (let i = 0; i < selections.length; i++) {
      await addBlock({
        type: 'AddBlock',
        sessionId: session.id,
        exerciseName: selections[i].name,
        exerciseCategory: selections[i].category,
        blockId: blockIds[i],
      });
      if (domainBlockType) {
        await setBlockType({ type: 'SetBlockType', sessionId: session.id, blockId: blockIds[i], blockType: domainBlockType });
        if (rounds != null) {
          await setBlockRounds({ type: 'SetBlockRounds', sessionId: session.id, blockId: blockIds[i], rounds });
        }
      }
    }

    if (isGrouped) {
      const groupId = cryptoIdGenerator.next<'SupersetGroup'>();
      for (const blockId of blockIds) {
        await addToSuperset({ type: 'AddToSuperset', sessionId: session.id, blockId, groupId });
      }
    }
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.kind === 'strength') {
      await deleteStrengthSession({ type: 'DeleteSession', sessionId: deleteConfirm.id as Id<'Session'> });
    } else {
      await deleteCardioSession({ type: 'DeleteCardioSession', sessionId: deleteConfirm.id as Id<'CardioSession'> });
    }
    setDeleteConfirm(null);
  }

  return {
    navigate,
    routeSessionId,
    activeSession,
    session,
    cardioSession,
    conditions,
    showPicker,
    setShowPicker,
    showAddMenu,
    setShowAddMenu,
    sessionFilters,
    setSessionFilters,
    deleteConfirm,
    setDeleteConfirm,
    allExerciseNames,
    baseSessions,
    filteredSessions,
    timer,
    timerNotStarted,
    updateStartTime,
    handlePickerCommit,
    handleConfirmDelete,
  };
}
