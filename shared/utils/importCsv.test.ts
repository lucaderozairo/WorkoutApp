import { describe, it, expect } from 'vitest';
import { parseCsvForImport } from './importCsv';

const EXPORT_CSV = [
  'Type,Session ID,Name,Date,Category/Sport,Exercise,Block Type,Set #,Weight (kg),Reps,Distance (m),Duration (s),Is Warmup,Is PR,RPE,Notes',
  'strength,sess-1,My Workout,2024-01-15,strength,Squat,,1,100,5,0,0,false,false,7,',
].join('\n');

const SIMPLE_CSV = 'Date,Exercise,Sets,Reps,Weight,Notes\n2024-01-15,Squat,3,5,100,';

describe('parseCsvForImport', () => {
  it('detects export format', () => {
    expect(parseCsvForImport(EXPORT_CSV).format).toBe('export');
  });

  it('detects simple format', () => {
    expect(parseCsvForImport(SIMPLE_CSV).format).toBe('simple');
  });

  it('returns unknown for unrecognised headers', () => {
    expect(parseCsvForImport('foo,bar\n1,2').format).toBe('unknown');
  });

  it('returns unknown for empty file', () => {
    expect(parseCsvForImport('').format).toBe('unknown');
  });

  it('exposes raw headers and rows for known formats', () => {
    const result = parseCsvForImport(SIMPLE_CSV);
    if (result.format === 'unknown') throw new Error('unexpected');
    expect(result.headers).toContain('Date');
    expect(result.rows).toHaveLength(1);
  });
});
