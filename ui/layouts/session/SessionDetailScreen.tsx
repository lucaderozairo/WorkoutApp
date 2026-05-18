import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useCommand } from '@ui/bindings';
import type { SessionHistoryItem, ActiveSessionView } from '@features/training_log';
import { handleUpdateTrainingSession } from '@features/training_log';
import type { CardioSession, RecentCardioView } from '@features/cardio';
import { handleUpdateCardioSessionFull } from '@features/cardio';
import { SessionDetail } from '@ui/components/session/SessionDetail';
import { SessionEditModal } from '@ui/components/log/SessionEditModal';
import type { CombinedSession } from '@ui/components/log/calendarUtils';
import { exportSessionEnvelope } from '@data/sources/local/persistence';
import { triggerDownload } from '@shared/utils/csv';
import { exportSessionCsv, exportCardioSessionCsv } from '@shared/utils/exportCsv';

function isCardioSession(s: unknown): s is CardioSession {
  const obj = s as Record<string, unknown>;
  return typeof obj.sport === 'string' && 'distanceMeters' in obj && 'userId' in obj;
}

function isSessionHistoryItem(s: unknown): s is SessionHistoryItem {
  return typeof (s as SessionHistoryItem).totalSets === 'number';
}

export function SessionDetailScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const history = (useQuery<SessionHistoryItem[]>('session_history') ?? []) as SessionHistoryItem[];
  const cardioView = (useQuery<RecentCardioView>('recent_cardio_sessions') ?? { sessions: [] }) as RecentCardioView;
  const sessionViews = (useQuery<Record<string, ActiveSessionView>>('session_views') ?? {}) as Record<string, ActiveSessionView>;

  const richView = sessionId ? sessionViews[sessionId] : undefined;
  const session =
    richView ??
    (history.find(s => s.id === sessionId) as SessionHistoryItem | undefined) ??
    (cardioView.sessions.find(s => s.id === sessionId) as CardioSession | undefined);

  const [editingEntry, setEditingEntry] = useState<CombinedSession | null>(null);

  const { dispatch: dispatchUpdateTraining } = useCommand(handleUpdateTrainingSession);
  const { dispatch: dispatchUpdateCardio } = useCommand(handleUpdateCardioSessionFull);

  if (!session) {
    return (
      <div className="column">
        <p className="caption">Session not found.</p>
      </div>
    );
  }

  function buildCombinedSession(): CombinedSession | null {
    if (!session) return null;
    if (isCardioSession(session)) return { kind: 'cardio', session };
    if (isSessionHistoryItem(session)) return { kind: 'strength', session };
    // ActiveSessionView — treat as strength
    return { kind: 'strength', session: session as unknown as SessionHistoryItem };
  }

  function handleEdit() {
    const entry = buildCombinedSession();
    if (entry) setEditingEntry(entry);
  }

  function handleExportJson() {
    if (isCardioSession(session)) {
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
      triggerDownload(blob, `cardio-${session.id}.json`);
    } else if (isSessionHistoryItem(session)) {
      const json = exportSessionEnvelope([session]);
      const blob = new Blob([json], { type: 'application/json' });
      triggerDownload(blob, `session-${session.id}.json`);
    }
  }

  function handleExportCsv() {
    if (isCardioSession(session)) {
      exportCardioSessionCsv(session);
    } else if (isSessionHistoryItem(session)) {
      exportSessionCsv(session);
    }
  }

  return (
    <>
      <SessionDetail session={session} asPage onEdit={handleEdit} onExportJson={handleExportJson} onExportCsv={handleExportCsv} />
      {editingEntry && (
        <SessionEditModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={updated => {
            if (updated.kind === 'strength') {
              const s = updated.session;
              dispatchUpdateTraining({
                sessionId: s.id,
                name: s.name,
                notes: (s as unknown as { notes?: string }).notes,
                startedAt: s.startedAt,
                comments: (s as unknown as { comments?: import('@features/cardio').SessionComment[] }).comments,
                media: (s as unknown as { media?: string[] }).media,
              });
            } else {
              const s = updated.session;
              dispatchUpdateCardio({
                sessionId: s.id,
                title: s.title,
                notes: s.notes,
                distanceMeters: s.distanceMeters,
                durationSeconds: s.durationSeconds,
                startedAt: s.startedAt,
                comments: (s as unknown as { comments?: import('@features/cardio').SessionComment[] }).comments,
                media: (s as unknown as { media?: string[] }).media,
              });
            }
            setEditingEntry(null);
          }}
        />
      )}
    </>
  );
}
