import { useEffect } from "react";
import { Grid } from "@ui/layout";
import { WelcomeWidget } from "@ui/components/widgets/WelcomeWidget";
import { ACHIEVEMENT_DEFINITIONS } from "@features/achievements";
import type { AchievementUnlockedPayload } from "@features/achievements/contract";
import { eventBus } from "@core/events/bus";
import { useHomeScreen } from "./useHomeScreen";
import { useToast } from "@ui/molecules";
import { SplitTabs, Section } from "@ui/patterns";
import { UpcomingContent, ThisWeekContent } from "@ui/components/home/HomeSections";
import {
  HomeSleepWidget,
  HomeReadinessWidget,
  HomeStreakWidget,
  HomeChecklistWidget,
  HomeWeatherWidget,
  HomeCalendarWidget,
  HomeSessionCard,
} from "@ui/components/home/HomeWidgetPanel";

export function HomeScreen() {
  const {
    workoutsThisWeek,
    streak,
    scoreClass,
    hasReadinessEntry,
    score,
    weekDays,
    upcomingAppointments,
    todayAppointments,
    lastNight,
    lastSessions,
  } = useHomeScreen();
  const toast = useToast();

  useEffect(() => {
    const token = eventBus.subscribe("AchievementUnlocked", (event) => {
      const payload = event.payload as AchievementUnlockedPayload;
      const def = ACHIEVEMENT_DEFINITIONS.find(
        (d) => d.id === payload.achievementId,
      );
      if (def) toast.info(`Achievement unlocked: ${def.name}`);
    });
    return () => token.unsubscribe();
  }, [toast]);

  const statPanels = [
    {
      id: "upcoming",
      label: "Upcoming",
      content: <UpcomingContent appointments={upcomingAppointments} />,
    },
    {
      id: "this-week",
      label: "This Week",
      content: (
        <ThisWeekContent
          weekDays={weekDays}
          workoutsThisWeek={workoutsThisWeek}
          streak={streak}
        />
      ),
    },
  ];

  return (
    <Grid gap={4}>
      <WelcomeWidget
        workoutsThisWeek={workoutsThisWeek}
        streak={streak}
        scoreClass={scoreClass}
        hasReadinessEntry={hasReadinessEntry}
        score={score}
      />

      <SplitTabs panels={statPanels} />

      <Section label="Widgets">
        <div className="widget-grid">
          {lastNight && <HomeSleepWidget session={lastNight} />}
          <HomeWeatherWidget />
          <HomeCalendarWidget appointments={todayAppointments} />
          <HomeReadinessWidget score={score} hasEntry={hasReadinessEntry} />
          <HomeStreakWidget streak={streak} />
          <HomeChecklistWidget />
        </div>
      </Section>

      {lastSessions.length > 0 && (
        <Section label="Last Sessions">
          <Grid gap={2}>
            {lastSessions.map(s => (
              <HomeSessionCard key={s.id} session={s} />
            ))}
          </Grid>
        </Section>
      )}
    </Grid>
  );
}
