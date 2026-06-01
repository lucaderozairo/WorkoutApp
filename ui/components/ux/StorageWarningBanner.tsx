import { viewStore } from '@data/projections/views';
import { useQuery } from '@ui/bindings';
import { Alert } from '@ui/molecules/Alert';

export function StorageWarningBanner() {
  const warning = useQuery<string>('storage_warning');
  if (!warning) return null;

  return (
    <Alert
      variant="warn"
      message={warning}
      dismissible
      onDismiss={() => viewStore.set('storage_warning', null)}
    />
  );
}
