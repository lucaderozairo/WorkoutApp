import type { AchievementEvaluator, EvalResult, EvalContext } from './types';
import type { AchievementDef } from '../types';

export const consecutiveDaysEvaluator: AchievementEvaluator = {
  conditionType: 'consecutive_days',
  check(def: AchievementDef, ctx: EvalContext): EvalResult {
    if (ctx.sessions.length === 0) return { unlocked: false, progress: 0 };

    const dayKey = (date: Date) =>
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    const daySet = new Set(ctx.sessions.map(s => dayKey(new Date(s.startedAt))));

    const now = new Date();
    let streak = 0;
    for (let i = 0; i < def.condition.threshold + 10; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (daySet.has(dayKey(d))) {
        streak++;
      } else {
        break;
      }
    }

    return {
      unlocked: streak >= def.condition.threshold,
      progress: streak,
    };
  },
};
