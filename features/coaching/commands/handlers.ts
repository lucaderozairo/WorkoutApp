import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { DismissInsight } from '../domain/types';
import { dismissInsight } from '../projections';

export function handleDismissInsight(cmd: DismissInsight): Result<void, string> {
  if (!cmd.insightId) return err('Insight ID is required');
  dismissInsight(cmd.insightId);
  return ok(undefined);
}
