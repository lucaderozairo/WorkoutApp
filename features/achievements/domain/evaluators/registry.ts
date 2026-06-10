import type { AchievementEvaluator, EvalContext, EvalResult } from './types';
import type { AchievementDef } from '../types';
import { sessionCountEvaluator } from './sessionCount';
import { prWeightEvaluator } from './prWeight';
import { cardioDistanceEvaluator } from './cardioDistance';
import { consecutiveDaysEvaluator } from './consecutiveDays';

const evaluators: Map<string, AchievementEvaluator> = new Map([
  [sessionCountEvaluator.conditionType, sessionCountEvaluator],
  [prWeightEvaluator.conditionType, prWeightEvaluator],
  [cardioDistanceEvaluator.conditionType, cardioDistanceEvaluator],
  [consecutiveDaysEvaluator.conditionType, consecutiveDaysEvaluator],
]);

export function checkAchievementCondition(
  def: AchievementDef,
  ctx: EvalContext,
): EvalResult {
  const evaluator = evaluators.get(def.condition.type);
  if (!evaluator) return { unlocked: false, progress: 0 };
  return evaluator.check(def, ctx);
}
