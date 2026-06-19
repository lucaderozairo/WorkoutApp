import { useMemo } from 'react';
import { Grid, Column , Row } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Navigate } from 'react-router-dom';

import { SessionFilterBar } from '@ui/components/log/SessionFilterBar';
import { WorkoutFilterBar } from '@ui/components/workout/WorkoutFilterBar';
import { StrengthSessionItem, CardioSessionItem } from '@ui/components/log/SessionListItem';
import { MonthCalendar } from '@ui/components/log/MonthCalendar';
import { WeekCalendar } from '@ui/components/log/WeekCalendar';
import { UndoToastProvider } from '@ui/components/log';
import { WorkoutView } from '@ui/components/session/WorkoutView';
import { FinishedView } from '@ui/components/session/FinishedView';
import { SessionDetail } from '@ui/components/session/SessionDetail';
import { ExercisePicker } from '@ui/components/log/ExercisePicker';
import { ScreenHeader, Dialog, Button } from '@ui/molecules';
import { useLogScreen } from './useLogScreen';

export function LogScreen() {
  const {
    navigate,
    routeSessionId,
    activeSession,
    session,
    cardioSession,
    conditions,
    showPicker,
    setShowPicker,
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
  } = useLogScreen();

  const sessionsByYear = useMemo(() => {
    if (sessionFilters.view !== 'list' || filteredSessions.length === 0) return [];
    const groups = new Map<number, typeof filteredSessions>();
    for (const entry of filteredSessions) {
      const yr = new Date(entry.session.startedAt).getFullYear();
      groups.set(yr, [...(groups.get(yr) ?? []), entry]);
    }
    const years = Array.from(groups.keys()).sort((a, b) =>
      sessionFilters.sort === 'oldest' ? a - b : b - a
    );
    return years.map(yr => ({ year: yr, entries: groups.get(yr)! }));
  }, [filteredSessions, sessionFilters.view, sessionFilters.sort]);

  if (!routeSessionId) {
    return (
      <UndoToastProvider>
        <Grid>
          <ScreenHeader
            title="My Sessions"
            primary={
              <Button variant="primary" size="sm" onClick={() => navigate('/sessions/new')}>
                ï¼‹ Add
              </Button>
            }
          />

          {activeSession && (
            <Surface as="button" interactive onClick={() => navigate(`/sessions/${activeSession.id}`)}>
              <Row justify="between" align="center">
                <Column gap={1} align="start">
                  <Text size="detail">{activeSession.name}</Text>
                  <Text size="caption">{activeSession.startedAt ? `${new Date(activeSession.startedAt).toLocaleDateString()} â€” tap to continue` : 'Not started â€” tap to continue'}</Text>
                </Column>
              </Row>
            </Surface>
          )}

          <SessionFilterBar filters={sessionFilters} onChange={setSessionFilters} />

          {sessionFilters.view === 'month' && (
            <MonthCalendar
              sessions={baseSessions}
              typeFilter={sessionFilters.type}
              renderFilter={() => (
                <WorkoutFilterBar
                  filters={sessionFilters}
                  onChange={setSessionFilters}
                  exerciseOptions={allExerciseNames}
                  view="month"
                />
              )}
            />
          )}
          {sessionFilters.view === 'week' && (
            <WeekCalendar
              sessions={baseSessions}
              typeFilter={sessionFilters.type}
              renderFilter={() => (
                <WorkoutFilterBar
                  filters={sessionFilters}
                  onChange={setSessionFilters}
                  exerciseOptions={allExerciseNames}
                  view="week"
                />
              )}
            />
          )}

          {sessionFilters.view === 'list' && (
            <WorkoutFilterBar
              filters={sessionFilters}
              onChange={setSessionFilters}
              exerciseOptions={allExerciseNames}
              view="list"
            />
          )}

          {sessionFilters.view === 'list' && (
            filteredSessions.length === 0
              ? <Text as="p" size="caption">No sessions found</Text>
              : sessionsByYear.map(({ year, entries }) => (
                  <Column key={year}>
                    <Text as="p" size="eyebrow">{year}</Text>
                    {entries.map(entry =>
                      entry.kind === 'strength'
                        ? <StrengthSessionItem
                            key={entry.session.id}
                            session={entry.session}
                            matchedExercise={entry.matchedExercise}
                            onDelete={() => setDeleteConfirm({ kind: 'strength', id: entry.session.id })}
                          />
                        : <CardioSessionItem
                            key={entry.session.id}
                            session={entry.session}
                            onDelete={() => setDeleteConfirm({ kind: 'cardio', id: entry.session.id })}
                          />
                    )}
                  </Column>
                ))
          )}
        </Grid>

        <Dialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete this session?"
          message="This cannot be undone."
          confirm="Delete"
          onConfirm={handleConfirmDelete}
          destructive
        />
      </UndoToastProvider>
    );
  }

  if (routeSessionId && !session && !cardioSession) {
    return <Navigate to="/sessions" replace />;
  }

  if (routeSessionId && cardioSession) {
    return (
      <UndoToastProvider>
        <SessionDetail session={cardioSession} asPage onEdit={() => navigate(`/sessions/${cardioSession.id}/edit`)} />
      </UndoToastProvider>
    );
  }

  if (routeSessionId && session?.status === 'finished') {
    return (
      <UndoToastProvider>
        <FinishedView session={session} onEdit={() => navigate(`/sessions/${session.id}/edit`)} />
      </UndoToastProvider>
    );
  }

  if (showPicker) {
    return (
      <UndoToastProvider>
        <ExercisePicker
          onClose={() => setShowPicker(false)}
          onCommit={async (selections, bt) => {
            await handlePickerCommit(selections, bt);
            setShowPicker(false);
          }}
        />
      </UndoToastProvider>
    );
  }

  if (routeSessionId && session?.status === 'active') {
    return (
      <UndoToastProvider>
        <WorkoutView
          session={session}
          conditions={conditions}
          isActive
          isPaused={timer.isPaused}
          timerDisplay={timer.display}
          onPause={timer.pause}
          onResume={timer.resume}
          onAddExercise={() => setShowPicker(true)}
          onFinish={() => navigate(`/sessions/${session.id}/summary`)}
          timerNotStarted={timerNotStarted}
          onStartTimer={() => {
            void updateStartTime({
              type: 'UpdateSessionStartTime',
              sessionId: session.id,
              startedAt: Date.now(),
            });
          }}
        />
      </UndoToastProvider>
    );
  }

  return null;
}
