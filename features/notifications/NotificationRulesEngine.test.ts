import { describe, it, expect } from 'vitest';
import { NotificationRulesEngine } from './NotificationRulesEngine';

describe('NotificationRulesEngine', () => {
  it('returns no notifications for empty rules', () => {
    const engine = new NotificationRulesEngine([]);
    expect(engine.evaluate({ type: 'workout_logged' })).toEqual([]);
  });

  it('triggers notification when rule condition matches', () => {
    const engine = new NotificationRulesEngine([
      { id: 'streak', trigger: 'workout_logged', message: 'Streak updated!' }
    ]);
    const result = engine.evaluate({ type: 'workout_logged' });
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('Streak updated!');
  });

  it('does not trigger notification when event does not match rule', () => {
    const engine = new NotificationRulesEngine([
      { id: 'streak', trigger: 'workout_logged', message: 'Streak updated!' }
    ]);
    const result = engine.evaluate({ type: 'goal_achieved' });
    expect(result).toHaveLength(0);
  });
});
