import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCommand, useQuery } from '@ui/bindings';
import { handleStartSession, handleAddBlock, handleStartSessionFromTemplate } from '@features/training_log';
import type { RecentRoutine, WorkoutTemplate } from '@features/templates';
import {
  getRecentRoutines,
  handleDeleteTemplate,
  handleDuplicateTemplate,
  handleRemoveTemplateExercise,
  handleRenameTemplate,
  handleReorderTemplateExercises,
  handleSetTemplateFavorite,
} from '@features/templates';

import { defaultSessionName } from '@features/planning/domain/utils';
import type { SportType } from '@features/training_log/domain/types';
import type { Id } from '@shared/types';
import { viewStore } from '@data/projections/views';

const USER_ID = 'user-001' as Id<'User'>;

export const PINNED_ACTIVITIES: SportType[] = ['strength', 'run', 'cycle', 'hike'];

export const ROUTE_ACTIVITIES = new Set<SportType>([
  'run', 'cycle', 'hike', 'ski', 'snowboard', 'kayak', 'surf', 'climb', 'row',
]);

// Multi-discipline events start empty so the user sequences disciplines (and
// transitions) themselves inside the session, rather than getting one auto block.
export const MULTISPORT_ACTIVITIES = new Set<SportType>([
  'multi', 'triathlon', 'duathlon', 'hyrox', 'obstacle_course',
]);

export const MORE_CATEGORIES: { label: string; sports: SportType[] }[] = [
  { label: 'Outdoor',      sports: ['swim', 'row', 'ski', 'snowboard', 'kayak', 'surf', 'climb'] },
  { label: 'Machines',     sports: ['treadmill', 'stair_climber', 'elliptical', 'ski_erg', 'assault_bike', 'air_bike', 'concept2_rower'] },
  { label: 'Fitness',      sports: ['hiit', 'yoga', 'stretch', 'mobility', 'boxing'] },
  { label: 'Events',       sports: ['triathlon', 'duathlon', 'hyrox', 'obstacle_course', 'multi'] },
];

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

interface ReturnedRouteState {
  waypoints?: [number, number][];
  distanceKm?: number;
  profile?: 'foot' | 'bike';
  callerState?: { selected: SportType; name: string; date: string };
}

export function useNewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const returned = (location.state ?? {}) as ReturnedRouteState;

  const [selected, setSelected] = useState<SportType>(
    returned.callerState?.selected ?? 'strength'
  );
  const [name, setName] = useState(
    returned.callerState?.name ?? defaultSessionName('strength')
  );
  const [date, setDate] = useState(
    returned.callerState?.date ?? todayDateString()
  );
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [waypoints] = useState<[number, number][]>(returned.waypoints ?? []);
  const [routeKm] = useState(returned.distanceKm ?? 0);
  const [nameTouched, setNameTouched] = useState(!!returned.callerState?.name);
  const [pendingTemplate, setPendingTemplate] = useState<WorkoutTemplate | RecentRoutine | null>(null);

  const savedTemplates = (useQuery<WorkoutTemplate[]>('template_list') ?? []) as WorkoutTemplate[];
  useQuery('sessions');
  const recentRoutines = getRecentRoutines();

  useEffect(() => {
    if (!nameTouched) setName(defaultSessionName(selected));
  }, [selected, nameTouched]);

  const { dispatch: startSession } = useCommand(handleStartSession);
  const { dispatch: startSessionFromTemplate } = useCommand(handleStartSessionFromTemplate);
  const { dispatch: addBlock } = useCommand(handleAddBlock);
  const { dispatch: renameTemplate } = useCommand(handleRenameTemplate);
  const { dispatch: duplicateTemplate } = useCommand(handleDuplicateTemplate);
  const { dispatch: deleteTemplate } = useCommand(handleDeleteTemplate);
  const { dispatch: removeTemplateExercise } = useCommand(handleRemoveTemplateExercise);
  const { dispatch: reorderTemplateExercises } = useCommand(handleReorderTemplateExercises);
  const { dispatch: setTemplateFavorite } = useCommand(handleSetTemplateFavorite);


  function recordRecentSport(sport: SportType) {
    const current = (viewStore.get<SportType[]>('wapp_recent_sports') ?? [])
      .filter(s => s !== sport);
    viewStore.set('wapp_recent_sports', [sport, ...current].slice(0, 10));
  }

  function handleLoadTemplate(template: WorkoutTemplate | RecentRoutine) {
    setSelected(template.primarySport);
    setName(template.name);
    setNameTouched(true);
    setPendingTemplate(template);
  }

  async function handleRenameSavedTemplate(templateId: string, currentName: string) {
    const next = window.prompt('Template name', currentName);
    if (!next || next.trim() === currentName) return;
    await renameTemplate({ type: 'RenameTemplate', templateId, name: next });
  }

  async function handleDuplicateSavedTemplate(templateId: string) {
    await duplicateTemplate({ type: 'DuplicateTemplate', templateId });
  }

  async function handleDeleteSavedTemplate(templateId: string) {
    if (!window.confirm('Delete this template?')) return;
    await deleteTemplate({ type: 'DeleteTemplate', templateId });
    if (pendingTemplate?.id === templateId) setPendingTemplate(null);
  }

  async function handleToggleFavorite(template: WorkoutTemplate) {
    await setTemplateFavorite({
      type: 'SetTemplateFavorite',
      templateId: template.id,
      favorite: !template.favorite,
    });
  }

  async function handleMoveTemplateExercise(template: WorkoutTemplate, exerciseId: string, direction: -1 | 1) {
    const index = template.exercises.findIndex(exercise => exercise.id === exerciseId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= template.exercises.length) return;
    const exerciseIds = template.exercises.map(exercise => exercise.id);
    const [moved] = exerciseIds.splice(index, 1);
    exerciseIds.splice(nextIndex, 0, moved);
    await reorderTemplateExercises({
      type: 'ReorderTemplateExercises',
      templateId: template.id,
      exerciseIds,
    });
  }

  async function handleRemoveSavedTemplateExercise(templateId: string, exerciseId: string) {
    await removeTemplateExercise({
      type: 'RemoveTemplateExercise',
      templateId,
      exerciseId,
    });
  }

  async function handleNewSession() {
    recordRecentSport(selected);

    if (pendingTemplate) {
      const result = await startSessionFromTemplate({
        type: 'StartSessionFromTemplate',
        userId: USER_ID,
        name,
        primarySport: pendingTemplate.primarySport,
        exercises: pendingTemplate.exercises,
      });
      if (!result.ok) return;
      navigate(`/sessions/${result.value!.sessionId}`);
      return;
    }

    const result = await startSession({ type: 'StartSession', userId: USER_ID, name, primarySport: selected });
    if (!result.ok) return;

    const sessionId = result.value!.sessionId as Id<'Session'>;

    if (selected !== 'strength' && !MULTISPORT_ACTIVITIES.has(selected)) {
      const category = selected === 'mobility' || selected === 'yoga' || selected === 'stretch'
        ? 'mobility' as const
        : 'cardio' as const;
      await addBlock({
        type: 'AddBlock',
        sessionId,
        exerciseName: name,
        exerciseCategory: category,
      });
    }

    navigate(`/sessions/${sessionId}`);
  }

  function handleAddRoute() {
    navigate('/routes/new', {
      state: {
        waypoints,
        profile: selected === 'cycle' ? 'bike' : 'foot',
        returnTo: '/sessions/new',
        callerState: { selected, name, date },
      },
    });
  }

  function handleSavedRoutes() {
    navigate('/routes', {
      state: { returnTo: '/sessions/new', callerState: { selected, name, date } },
    });
  }

  const routeLabel = routeKm > 0
    ? `Route saved · ${routeKm.toFixed(1)} km — Edit →`
    : 'Add route →';

  return {
    navigate,
    selected, setSelected,
    name, setName, setNameTouched,
    date, setDate,
    startTime, setStartTime,
    routeKm,
    routeLabel,
    savedTemplates,
    recentRoutines,
    pendingTemplate,
    handleLoadTemplate,
    handleRenameSavedTemplate,
    handleDuplicateSavedTemplate,
    handleDeleteSavedTemplate,
    handleToggleFavorite,
    handleMoveTemplateExercise,
    handleRemoveSavedTemplateExercise,
    handleNewSession,
    handleAddRoute,
    handleSavedRoutes,
  };
}
