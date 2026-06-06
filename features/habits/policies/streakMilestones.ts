import { eventBus } from '@core/events/bus';
import { eventRepository } from '@data/event-repository';
import { systemClock } from '@core/clock';
import type { DomainEvent } from '@shared/types';
import type { HabitCompletedPayload } from '../domain/types';

const STREAK_MILESTONES = [7, 30, 100] as const;

let registered = false;

export function registerStreakMilestonePolicy(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribe<DomainEvent<'HabitCompleted', HabitCompletedPayload>>('HabitCompleted', async (event) => {
    const { newStreak, userId } = event.payload;
    if (!(STREAK_MILESTONES as readonly number[]).includes(newStreak)) return;

    await eventRepository.commit([{
      type: 'AchievementUnlocked',
      aggregateId: userId,
      aggregateType: 'User',
      timestamp: systemClock.now(),
      version: 1,
      payload: {
        userId,
        achievementId: `habit_streak_${newStreak}`,
        unlockedAt: systemClock.now(),
      },
    }]);
  });
}
