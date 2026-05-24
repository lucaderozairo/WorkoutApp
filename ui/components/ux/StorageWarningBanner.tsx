import { viewStore } from '@data/projections/views';
import { useQuery } from '@ui/bindings';

export function StorageWarningBanner() {
  const warning = useQuery<string>('storage_warning');
  if (!warning) return null;

  return (
    <div className="surface warning row align-center" role="alert">
      <span className="grow caption">⚠ {warning}</span>
      <button
        type="button"
        className="ghost sm"
        onClick={() => viewStore.set('storage_warning', null)}
        aria-label="Dismiss storage warning"
      >
        ✕
      </button>
    </div>
  );
}
