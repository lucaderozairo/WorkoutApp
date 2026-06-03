import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@ui/bindings';
import type { ActivitiesState, ActivityView } from '@features/training_log';
import type { CardioSession, RecentCardioView } from '@features/cardio';
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import { exportSessionEnvelope } from '@data/sources/local/persistence';
import { triggerDownload } from '@shared/utils/csv';
import { getActivityHistory } from '@features/training_log';
import { exportSessionCsv, exportCardioSessionCsv } from '@shared/utils/exportCsv';


export function isCardioSession(s: unknown): s is CardioSession {
  const obj = s as Record<string, unknown>;
  return typeof obj.sport === 'string' && 'distanceMeters' in obj && 'userId' in obj;
}

export function isSessionHistoryItem(s: unknown): s is ActivityView {
  return typeof (s as ActivityView).status === 'string' && typeof (s as ActivityView).segments !== 'undefined';
}

export function useSessionDetail() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  const sessionsState = useQuery<ActivitiesState>('sessions');
  const cardioView = (useQuery<RecentCardioView>('recent_cardio_sessions') ?? { sessions: [] }) as RecentCardioView;

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
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
      triggerDownload(blob, `cardio-${session.id}.json`);
    } else if (strengthSession) {
      const json = exportSessionEnvelope([strengthSession]);
      const blob = new Blob([json], { type: 'application/json' });
      triggerDownload(blob, `session-${session!.id}.json`);
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
