import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { LogNutrition, DeleteNutritionEntry, NutritionEvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { nutritionLogProjection } from '../projections';

projectionRegistry.register('nutrition_log', nutritionLogProjection);

// ─── Command Handlers ────────────────────────────────────────

export async function handleLogNutrition(cmd: LogNutrition): Promise<Result<void, string>> {
  if (!cmd.entry.name.trim()) return err('Name is required');
  if (!cmd.entry.time || !/^\d{2}:\d{2}$/.test(cmd.entry.time)) return err('Time must be HH:MM');
  if (cmd.entry.macros) {
    const m = cmd.entry.macros;
    if (m.kcal < 0) return err('Calories must be non-negative');
    if (m.proteinG < 0 || m.carbsG < 0 || m.fatG < 0) return err('Macros must be non-negative');
  }

  const entryId = cryptoIdGenerator.next<'NutritionEntry'>();

  const events: NutritionEvent[] = [{
    type: 'NutritionLogged',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      entryId,
      userId: cmd.userId,
      category: cmd.entry.category,
      name: cmd.entry.name.trim(),
      notes: cmd.entry.notes,
      time: cmd.entry.time,
      macros: cmd.entry.macros,
    },
  }];

  events.forEach(e => nutritionLogProjection.apply(e));
  viewStore.set('nutrition_log', nutritionLogProjection.getState());
  return ok(undefined);
}

export async function handleDeleteNutritionEntry(cmd: DeleteNutritionEntry): Promise<Result<void, string>> {
  const events: NutritionEvent[] = [{
    type: 'NutritionEntryDeleted',
    aggregateId: '' as import('@shared/types').Id<'User'>,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: { entryId: cmd.entryId },
  }];

  events.forEach(e => nutritionLogProjection.apply(e));
  viewStore.set('nutrition_log', nutritionLogProjection.getState());
  return ok(undefined);
}
