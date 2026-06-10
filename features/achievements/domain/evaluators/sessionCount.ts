import type { AchievementEvaluator, EvalResult, EvalContext } from './types';
import type { AchievementDef } from '../types';

export const sessionCountEvaluator: AchievementEvaluator = {
  conditionType: 'session_count',
  check(def: AchievementDef, ctx: EvalContext): EvalResult {
    const cond = def.condition;
    let count: number;
    if (cond.sport === 'strength') {
      count = ctx.sessions.filter(s => s.category === 'strength').length;
    } else {
      count = ctx.sessions.length;
    }
    return {
      unlocked: count >= cond.threshold,
      progress: Math.min(count, cond.threshold),
    };
  },
};
