import { useEffect } from "react";
import { Grid } from "@ui/layout";
import { WelcomeWidget } from "@ui/components/widgets/WelcomeWidget";
import { WidgetGrid } from "@ui/components/widgets/WidgetGrid";
import { useWidgetGrid } from "@ui/components/widgets/useWidgetGrid";
import { WIDGET_REGISTRY } from "@ui/components/widgets/widgetRegistry";
import { ACHIEVEMENT_DEFINITIONS } from "@features/achievements";
import type { AchievementUnlockedPayload } from "@features/achievements/contract";
import { eventBus } from "@core/events/bus";
import { useHomeScreen } from "./useHomeScreen";
import { useToast } from "@ui/molecules";
import { SplitTabs, Section } from "@ui/patterns";
import { UpcomingContent, ThisWeekContent } from "@ui/components/home/HomeSections";

export function HomeScreen() {
  const {
    workoutsThisWeek,
    streak,
    scoreClass,
    hasReadinessEntry,
    score,
    weekDays,
    upcomingAppointments,
  } = useHomeScreen();
  const toast = useToast();

  const {
    widgets,
    contextMenu,
    setContextMenu,
    addPanelOpen,
    setAddPanelOpen,
    activeIds,
    applyGoal,
    setSize,
    removeWidget,
    addWidget,
    handleDragStart,
    handleDrop,
    openContextMenu,
    startLongPress,
    cancelLongPress,
  } = useWidgetGrid(WIDGET_REGISTRY);

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

      <Section
        label="Widgets"
        action={{ label: "Edit", onClick: () => setAddPanelOpen(true) }}>
        <></>
      </Section>

      <Section label="Last Sessions">
        <></>
      </Section>
    </Grid>
  );
}
