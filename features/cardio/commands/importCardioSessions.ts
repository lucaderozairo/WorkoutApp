import type { ParsedCsvData } from '@shared/utils/importCsv';
import type { CardioEvent, CardioSessionImportedPayload } from '../domain/types';
import { eventRepository } from '@data/event-repository';
import { systemClock } from '@core/clock';
import { viewStore } from '@data/projections/views';
import { recentCardioProjection, monthlyCardioProjection, type RecentCardioView } from '../projections';
import { loadFromStorage } from '@data/sources/local/persistence';
import type { Id } from '@shared/types';

export interface ImportCardioResult {
  cardioCount: number;
  errors: string[];
}

function applyAndStoreCardio(events: CardioEvent[]): void {
  const live = viewStore.get('recent_cardio_sessions') ?? loadFromStorage<RecentCardioView>('recent_cardio_sessions');
  if (live) recentCardioProjection.setState(live);
  events.forEach(e => {
    recentCardioProjection.apply(e);
    monthlyCardioProjection.apply(e);
  });
  viewStore.set('recent_cardio_sessions', recentCardioProjection.getState());
  viewStore.set('monthly_cardio_progression', monthlyCardioProjection.getState());
}

export async function handleImportCardioSessions(data: ParsedCsvData): Promise<ImportCardioResult> {
  if (data.format === 'unknown') return { cardioCount: 0, errors: [data.error] };

  const { headers, rows } = data;
  const events: CardioEvent[] = [];
  const errors: string[] = [];

  const col = (name: string) => headers.indexOf(name);
  const typeIdx = col('Type');
  const idIdx = col('Session ID');
  const nameIdx = col('Name');
  const dateIdx = col('Date');
  const catIdx = col('Category/Sport');
  const distIdx = col('Distance (m)');
  const durIdx = col('Duration (s)');
  const notesIdx = col('Notes');

  if (typeIdx < 0 || idIdx < 0) return { cardioCount: 0, errors: ['Missing Type or Session ID columns'] };

  const cardioRows = rows.filter(row => (row[typeIdx] ?? '').trim().toLowerCase() === 'cardio');

  const groups = new Map<string, string[]>();
  for (const row of cardioRows) {
    const id = (row[idIdx] ?? '').trim() || `imported-cardio-${Date.now()}`;
    if (!groups.has(id)) groups.set(id, row);
  }

  for (const [sessionId, firstRow] of groups) {
    try {
      const payload: CardioSessionImportedPayload = {
        sessionId: sessionId as Id<'CardioSession'>,
        sport: catIdx >= 0 ? (firstRow[catIdx] ?? '').trim().toLowerCase() || 'other' : 'other',
        title: nameIdx >= 0 ? (firstRow[nameIdx] ?? '').trim() || 'Imported Cardio' : 'Imported Cardio',
        startedAt: dateIdx >= 0 && (firstRow[dateIdx] ?? '').trim() ? new Date((firstRow[dateIdx] ?? '').trim()).getTime() : Date.now(),
        durationSeconds: durIdx >= 0 ? parseFloat(firstRow[durIdx] ?? '0') || 0 : 0,
        distanceMeters: distIdx >= 0 ? parseFloat(firstRow[distIdx] ?? '0') || 0 : 0,
        notes: notesIdx >= 0 ? (firstRow[notesIdx] ?? '').trim() : '',
      };

      events.push({
        type: 'CardioSessionImported',
        aggregateId: sessionId as Id<'CardioSession'>,
        aggregateType: 'CardioSession',
        timestamp: systemClock.now(),
        version: 1,
        payload,
      });
    } catch (e) {
      errors.push(`Cardio ${sessionId}: ${e instanceof Error ? e.message : 'Parse error'}`);
    }
  }

  if (events.length > 0) {
    applyAndStoreCardio(events);
    await eventRepository.commit(events);
  }

  return { cardioCount: events.length, errors };
}
