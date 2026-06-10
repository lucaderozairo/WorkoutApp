import type { AchievementEvaluator, EvalResult, EvalContext } from './types';
import type { AchievementDef } from '../types';

export const prWeightEvaluator: AchievementEvaluator = {
  conditionType: 'pr_weight',
  check(def: AchievementDef, ctx: EvalContext): EvalResult {
    const exerciseName = def.condition.exerciseName ?? '';
    let maxWeight = 0;
    for (const session of ctx.sessions) {
      if (session.hasPR && session.name.toLowerCase().includes(exerciseName.toLowerCase())) {
        maxWeight = def.condition.threshold;
      }
    }
    return {
      unlocked: maxWeight >= def.condition.threshold,
      progress: maxWeight,
    };
  },
};
