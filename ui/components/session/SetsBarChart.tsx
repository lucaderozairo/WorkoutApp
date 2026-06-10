import ChartContainer from '@ui/patterns/charts/charts';
import type { UISet } from '@features/training_log/projections/viewTypes';

export function SetsBarChart({ sets }: { sets?: UISet[] }) {
  if (!sets?.length) return null;
  const loggedSets = sets.filter(s => s.w !== '—');
  if (!loggedSets.length) return null;

  let workingSet = 0;
  const chartData = loggedSets.map(s => {
    if (!s.warmup) workingSet += 1;
    const weight = parseFloat(s.w) || 0;
    const reps = parseFloat(s.r) || 0;
    return {
      x: s.warmup ? 'WU' : String(workingSet),
      y: weight,
      reps: Number.isInteger(reps) ? String(reps) : reps.toFixed(1),
    };
  });

  return (
    <ChartContainer data={chartData} chartType="sets-bar" color="var(--accent)" axisShow={{ x: true, y: true }} />
  );
}
