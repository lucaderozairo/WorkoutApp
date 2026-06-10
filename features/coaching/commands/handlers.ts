import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import { dismissInsight } from '../projections';

export interface DismissInsight {
  type: 'DismissInsight';
  insightId: string;
}

export function handleDismissInsight(cmd: DismissInsight): Result<void, string> {
  if (!cmd.insightId) return err('Insight ID is required');
  dismissInsight(cmd.insightId);
  return ok(undefined);
}
