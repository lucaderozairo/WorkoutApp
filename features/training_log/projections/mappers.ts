import type { ActivityView, SegmentView } from '@features/training_log';
import type { UIBlock, UIBlockType, UICondition } from './viewTypes';

export function domainBlocksToUIBlocks(segments: ActivityView['segments']): UIBlock[] {
  const result: UIBlock[] = [];
  const groupMap = new Map<string, SegmentView[]>();

  for (const s of segments) {
    if (s.supersetGroupId) {
      const key = String(s.supersetGroupId);
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(s);
    }
  }

  const seenGroups = new Set<string>();

  for (const s of segments) {
    if (s.supersetGroupId) {
      const key = String(s.supersetGroupId);
      if (seenGroups.has(key)) continue;
      seenGroups.add(key);

      const groupSegs = groupMap.get(key) ?? [s];
      result.push({
        id: key,
        type: s.blockType === 'circuit' ? 'circuit' : 'superset',
        label: s.blockType === 'circuit' ? 'Circuit' : 'Superset',
        memberBlockIds: groupSegs.map(gs => gs.id),
        restSeconds: groupSegs[0].restSeconds,
        exerciseName: groupSegs.map(gs => gs.exerciseName).join(' / '),
        exercises: groupSegs.map((gs, idx) => ({
          blockId: gs.id,
          label: String.fromCharCode(65 + idx),
          name: gs.exerciseName,
          sets: gs.sets
            .filter(set => set.weightKg !== undefined || set.reps !== undefined)
            .map(set => ({
              id: `${gs.id}-${set.setNumber}`,
              setNumber: set.setNumber,
              w: (set.weightKg ?? 0) > 0 ? String(set.weightKg) : '—',
              r: String(set.reps ?? 0),
              done: set.done ?? false,
              warmup: set.isWarmup ?? false,
              comment: set.comment ?? null,
            })),
        })),
      });
    } else {
      const type: UIBlockType =
        s.blockType === 'circuit' ? 'circuit' :
          s.blockType === 'superset' ? 'superset' :
            s.exerciseCategory === 'cardio' ? 'cardio' :
              s.exerciseCategory === 'mobility' ? 'stretch' :
                'single';

      const label = type === 'circuit' ? 'Circuit' : type === 'superset' ? 'Superset' : undefined;

      const domainCardioSet = s.sets.find(
        set => (set.distanceMeters !== undefined || set.durationSeconds !== undefined) &&
               set.weightKg === undefined && set.reps === undefined
      ) ?? null;

      result.push({
        id: s.id,
        type,
        ...(label ? { label } : {}),
        restSeconds: s.restSeconds,
        exerciseName: s.exerciseName,
        exercises: [{
          blockId: s.id,
          name: s.exerciseName,
          comment: s.notes || null,
          sets: s.sets
            .filter(set => set.weightKg !== undefined || set.reps !== undefined)
            .map(set => ({
              id: `${s.id}-${set.setNumber}`,
              setNumber: set.setNumber,
              w: (set.weightKg ?? 0) > 0 ? String(set.weightKg) : '—',
              r: String(set.reps ?? 0),
              done: set.done ?? false,
              warmup: set.isWarmup ?? false,
              comment: set.comment ?? null,
            })),
          cardioSet: domainCardioSet ? {
            setNumber: domainCardioSet.setNumber,
            durationSeconds: domainCardioSet.durationSeconds ?? 0,
            distanceMeters: domainCardioSet.distanceMeters ?? 0,
            avgPowerWatts: domainCardioSet.avgPowerWatts ?? 0,
            resistance: domainCardioSet.resistance ?? 0,
          } : null,
        }],
      });
    }
  }

  return result;
}

export function sessionDateLabel(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export function getWarnings(exName: string, conditions: UICondition[]): UICondition[] {
  return conditions.filter(c => c.active && c.affectedExercises.includes(exName));
}

export function worstSev(warnings: UICondition[]): UICondition | null {
  if (!warnings.length) return null;
  const rank: Record<string, number> = { mild: 1, moderate: 2, severe: 3 };
  return warnings.reduce((top, w) => rank[w.severity] > rank[top.severity] ? w : top);
}

export function worstActiveCondition(conditions: UICondition[]): UICondition | null {
  return worstSev(conditions.filter(c => c.active));
}
