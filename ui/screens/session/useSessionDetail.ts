import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@ui/bindings';
import type { ActivitiesState, ActivityView } from '@features/training_log';
import type { CardioSession, RecentCardioView } from '@features/cardio';
import { isCardioSession } from '@features/cardio';
import { exportSessionBackup } from '@features/data_transfer';
import { downloadJson } from '@shared/utils/csv';
import { getActivityHistory } from '@features/training_log';
import { exportSessionCsv, exportCardioSessionCsv } from '@ui/components/transfer';

export function useSessionDetail() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const sessionsState = useQuery('sessions');
  const cardioView = (useQuery('recent_cardio_sessions') ?? { sessions: [] }) as RecentCardioView;

  const strengthSession: ActivityView | undefined = sessionId
    ? sessionsState?.byId[sessionId]
    : undefined;

  const session: ActivityView | CardioSession | undefined =
    strengthSession ??
    (cardioView.sessions.find(s => s.id === sessionId) as CardioSession | undefined);

  function handleEdit() {
    navigate(`/sessions/${sessionId}/edit`);
  }

  function handleExportJson() {
    if (isCardioSession(session)) {
      downloadJson(session, `cardio-${session.id}.json`);
    } else if (strengthSession) {
      downloadJson(exportSessionBackup([strengthSession]), `session-${session!.id}.json`);
    }
  }

  function handleExportCsv() {
    if (isCardioSession(session)) {
      exportCardioSessionCsv(session);
    } else if (strengthSession) {
      const historyItem = getActivityHistory().find(h => h.id === sessionId);
      if (historyItem) {
        exportSessionCsv(historyItem, strengthSession.segments);
      }
    }
  }

  return { session, handleEdit, handleExportJson, handleExportCsv };
}
