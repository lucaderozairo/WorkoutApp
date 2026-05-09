import type { WeeklySleepTrend } from './types';

function parseDuration(s: string): number | null {
  const h = s.match(/(\d+)h/);
  const m = s.match(/(\d+)min?/);
  if (!h && !m) return null;
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
}

export function parseGarminSleepYearCSV(text: string): WeeklySleepTrend[] {
  const lines = text.trim().replace(/\r\n/g, '\n').split('\n').slice(1); // skip header
  const results: WeeklySleepTrend[] = [];

  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 7) continue;

    // Last 6 columns are always: score, quality, duration, need, bedtime, wakeTime
    // Everything before is the week label (may contain a comma e.g. "Nov 27 - Dec 3, 2025")
    const [avgScoreStr, avgQuality, avgDurationStr, avgSleepNeedStr, avgBedtime, avgWakeTime] =
      parts.slice(-6);
    const weekLabel = parts.slice(0, parts.length - 6).join(', ').trim();

    const avgScore = parseInt(avgScoreStr, 10);
    const avgDurationMin = parseDuration(avgDurationStr);
    const avgSleepNeedMin = parseDuration(avgSleepNeedStr);

    if (!weekLabel || isNaN(avgScore) || avgDurationMin === null || avgSleepNeedMin === null) continue;
    if (!(['Good', 'Fair', 'Poor'] as const).includes(avgQuality as 'Good' | 'Fair' | 'Poor')) continue;

    results.push({
      weekLabel,
      avgScore,
      avgQuality: avgQuality as 'Good' | 'Fair' | 'Poor',
      avgDurationMin,
      avgSleepNeedMin,
      avgBedtime,
      avgWakeTime,
    });
  }

  return results.reverse(); // oldest-first
}
