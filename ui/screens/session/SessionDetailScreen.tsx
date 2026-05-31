import { SessionDetail } from '@ui/components/session/SessionDetail';
import { Grid } from '@ui/layout';
import { useSessionDetail } from './useSessionDetail';

export function SessionDetailScreen() {
  const { session, handleEdit, handleExportJson, handleExportCsv } = useSessionDetail();

  if (!session) {
    return (
      <Grid>
        <p className="caption">Session not found.</p>
      </Grid>
    );
  }

  return (
    <SessionDetail session={session} asPage onEdit={handleEdit} onExportJson={handleExportJson} onExportCsv={handleExportCsv} />
  );
}
