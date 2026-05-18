import { SessionDetail } from '@ui/components/session/SessionDetail';
import { useSessionDetail } from './useSessionDetail';

export function SessionDetailScreen() {
  const { session, handleEdit, handleExportJson, handleExportCsv } = useSessionDetail();

  if (!session) {
    return (
      <div className="column">
        <p className="caption">Session not found.</p>
      </div>
    );
  }

  return (
    <SessionDetail session={session} asPage onEdit={handleEdit} onExportJson={handleExportJson} onExportCsv={handleExportCsv} />
  );
}
