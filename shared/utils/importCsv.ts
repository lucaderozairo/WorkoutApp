import { parseCsv } from './csv';

const EXPORT_UNIQUE_HEADERS = [
  'Type', 'Session ID', 'Category/Sport',
  'Block Type', 'Set #', 'Weight (kg)',
  'Distance (m)', 'Duration (s)',
  'Is Warmup', 'Is PR', 'RPE',
];

const SIMPLE_HEADERS = ['Date', 'Exercise', 'Sets', 'Reps', 'Weight', 'Notes'];

function normalizeHeaders(headers: string[]): string[] {
  return headers.map(h => h.trim().replace(/\s+/g, ' '));
}

export type ParsedCsvData =
  | { format: 'export'; headers: string[]; rows: string[][] }
  | { format: 'simple'; headers: string[]; rows: string[][] }
  | { format: 'unknown'; error: string };

export function parseCsvForImport(text: string): ParsedCsvData {
  const parsed = parseCsv(text);
  if (parsed.length < 2) {
    return { format: 'unknown', error: 'CSV file has no data rows.' };
  }
  const headers = normalizeHeaders(parsed[0]);
  const rows = parsed.slice(1);

  if (headers.some(h => EXPORT_UNIQUE_HEADERS.includes(h))) {
    return { format: 'export', headers, rows };
  }
  if (headers.some(h => SIMPLE_HEADERS.includes(h))) {
    return { format: 'simple', headers, rows };
  }
  return {
    format: 'unknown',
    error: 'Unrecognized CSV format. Expected export format or: Date, Exercise, Sets, Reps, Weight, Notes',
  };
}


