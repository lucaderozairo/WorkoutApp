import { SessionDetail } from '@ui/components/session/SessionDetail';
import { Grid } from '@ui/layout';
import { Text } from '@ui/atoms';
import { useSessionDetail } from './useSessionDetail';

export function SessionDetailScreen() {
  const { session, handleEdit, handleExportJson, handleExportCsv } = useSessionDetail();

  if (!session) {
    return (
      <Grid>
        <Text as="p" size="caption">Session not found.</Text>
      </Grid>
    );
  }

  return (
    <SessionDetail session={session} asPage onEdit={handleEdit} onExportJson={handleExportJson} onExportCsv={handleExportCsv} />
  );
}
