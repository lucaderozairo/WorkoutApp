import { useEffect } from "react";
import { Grid, GridItem } from "@ui/layout";
import { WelcomeWidget } from "@ui/components/widgets/WelcomeWidget";
import { WidgetGrid } from "@ui/components/widgets/WidgetGrid";
import { ACHIEVEMENT_DEFINITIONS } from "@features/achievements";
import type { AchievementUnlockedPayload } from "@features/achievements/contract";
import { eventBus } from "@core/events/bus";
import { useHomeScreen } from "./useHomeScreen";
import { Text } from "@ui/atoms";
import { useToast } from "@ui/molecules";
import { Row } from "@ui/layout";

export function HomeScreen() {
  const { workoutsThisWeek, streak, scoreClass } = useHomeScreen();
  const toast = useToast();

  useEffect(() => {
    const token = eventBus.subscribe("AchievementUnlocked", (event) => {
      const payload = event.payload as AchievementUnlockedPayload;
      const def = ACHIEVEMENT_DEFINITIONS.find(
        (d) => d.id === payload.achievementId,
      );
      if (def) {
        toast.info(`Achievement unlocked: ${def.name}`);
      }
    });
    return () => token.unsubscribe();
  }, [toast]);

  return (
    <Grid areas="welcome-widget">
      <GridItem
        area="welcome-widget"
        children={
          <WelcomeWidget
            workoutsThisWeek={workoutsThisWeek}
            streak={streak}
            scoreClass={scoreClass}
          />
        }
      />

      <Row align="center" justify="between">
        <Text>Widgets</Text>
      </Row>

      <WidgetGrid />
    </Grid>
  );
}
