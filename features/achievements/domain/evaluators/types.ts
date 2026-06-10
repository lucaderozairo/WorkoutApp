import type { SessionSnapshot, CardioSnapshot, AchievementDef } from '../types';

export interface EvalContext {
  sessions: SessionSnapshot[];
  cardioSessions: CardioSnapshot[];
}

export interface EvalResult {
  unlocked: boolean;
  progress: number;
}

export interface AchievementEvaluator {
  conditionType: string;
  check(def: AchievementDef, ctx: EvalContext): EvalResult;
}
