import type { AchievementEvaluator, EvalResult, EvalContext } from './types';
import type { AchievementDef } from '../types';

export const cardioDistanceEvaluator: AchievementEvaluator = {
  conditionType: 'cardio_distance',
  check(def: AchievementDef, ctx: EvalContext): EvalResult {
    const sport = def.condition.sport;
    let maxDistance = 0;
    for (const s of ctx.cardioSessions) {
      if (s.sport === sport) {
        maxDistance = Math.max(maxDistance, s.distanceMeters);
      }
    }
    return {
      unlocked: maxDistance >= def.condition.threshold,
      progress: maxDistance,
    };
  },
};
