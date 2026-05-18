import { Navigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
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

  if (!routeSessionId) {
    return (
      <UndoToastProvider>
        <div className="column">
          <div className="row space-between align-center compact">
            <h2>My Sessions</h2>
            <button className="primary sm" onClick={() => navigate('/sessions/new')}>
              ＋ Add
            </button>
          </div>

          {activeSession && (
            <button className="surface row space-between align-center" onClick={() => navigate(`/sessions/${activeSession.id}`)}>
              <div className="column compact align-left">
                <span className="detail">{activeSession.name}</span>
                <span className="caption">{activeSession.startedAt ? `${new Date(activeSession.startedAt).toLocaleDateString()} — tap to continue` : 'Not started — tap to continue'}</span>
              </div>
            </button>
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

          <button className="surface tight" onClick={() => navigate('/sessions/new')}>
            ＋ Add
          </button>

          {sessionFilters.view === 'list' && (() => {
            if (filteredSessions.length === 0) {
              return <p className="caption">No sessions found</p>;
            }
            const groups = new Map<number, typeof filteredSessions>();
            for (const entry of filteredSessions) {
              const yr = new Date(entry.session.startedAt).getFullYear();
              groups.set(yr, [...(groups.get(yr) ?? []), entry]);
            }
            const years = Array.from(groups.keys()).sort((a, b) =>
              sessionFilters.sort === 'oldest' ? a - b : b - a
            );
            return (
              <div className="column">
                {years.map(yr => (
                  <div key={yr} className="column">
                    <p className="eyebrow compact">{yr}</p>
                    {groups.get(yr)!.map((entry, i) =>
                      entry.kind === 'strength'
                        ? <StrengthSessionItem
                          key={i}
                          session={entry.session}
                          matchedExercise={entry.matchedExercise}
                          onDelete={() => setDeleteConfirm({ kind: 'strength', id: entry.session.id })}
                        />
                        : <CardioSessionItem
                          key={i}
                          session={entry.session}
                          onDelete={() => setDeleteConfirm({ kind: 'cardio', id: entry.session.id })}
                        />
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="surface column compact">
              <span className="detail">Delete this session?</span>
              <span className="caption faint">This cannot be undone.</span>
              <div className="row space-between">
                <button type="button" className="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
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
