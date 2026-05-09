import type { StretchingSessionView } from '../projections';
import { viewStore } from '@data/projections/views';

// ─── Queries ─────────────────────────────────────────────────

export function getStretchingLog(): StretchingSessionView[] {
  return viewStore.get('stretching_log') ?? [];
}
