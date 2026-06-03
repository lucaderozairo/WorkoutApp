import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Column, Grid, GridItem, Row } from "@ui/layout";
import { ImportDataWidget } from "@ui/components/widgets/ImportDataWidget";
import { ExportDataWidget } from "@ui/components/widgets/ExportDataWidget";
import { SleepLarge } from "@ui/components/widgets/SleepWidgets";
import { CalendarLarge } from "@ui/components/widgets/CalendarWidgets";
import { WelcomeWidget } from "@ui/components/widgets/WelcomeWidget";
import { WeatherWidget } from "@ui/components/widgets/WeatherWidget";
import { GOAL_MINUTES } from "./dashboardUtils";
import { PlanRouteWidget } from "@ui/components/widgets/PlanRouteWidget";
import { EditDisplayNameWidget } from "@ui/components/widgets/EditDisplayNameWidget";
import { ACHIEVEMENT_DEFINITIONS } from "@features/achievements";
import type { AchievementUnlockedPayload } from "@features/achievements";
import { eventBus } from "@core/events/bus";
import { useHomeScreen } from "./useHomeScreen";
import { Surface, Text } from "@ui/atoms";
import { Button } from "@ui/molecules";

// Feature policies/projections are registered centrally in app/registry/bootstrap.ts.

interface UnlockedToast {
  name: string;
  rarity: string;
  description: string;
}

const RARITY_EMOJI: Record<string, string> = {
  common: "Bronze",
  rare: "Silver",
  epic: "Gold",
  legendary: "Trophy",
};

export function HomeScreen() {
  const {
    workoutsThisWeek,
    streak,
    scoreClass,
    lastNight,
    weeklyTrend,
    scoreHistory,
    isFirstRun,
  } = useHomeScreen();
  const [toast, setToast] = useState<UnlockedToast | null>(null);

  useEffect(() => {
    const token = eventBus.subscribe("AchievementUnlocked", (event) => {
      const payload = event.payload as AchievementUnlockedPayload;
      const def = ACHIEVEMENT_DEFINITIONS.find(
        (d) => d.id === payload.achievementId,
      );
      if (def) {
        setToast({
          name: def.name,
          rarity: def.rarity,
          description: def.description,
        });
      }
    });
    return () => token.unsubscribe();
  }, []);

  return (
    <Grid areas="welcome-widget">
      <GridItem
        area={"welcome-widget"}
        children={
          <WelcomeWidget
            workoutsThisWeek={workoutsThisWeek}
            streak={streak}
            scoreClass={scoreClass}
          />
        }
      />
      {toast && (
        <GridItem
          area="toast"
          children={
            <div role="status" aria-live="polite">
              <Surface>
                <Row align="center">
                  <span aria-hidden="true">
                    {RARITY_EMOJI[toast.rarity] ?? "Achievement"}
                  </span>
                  <Column gap={1} className="grow">
                    <strong className="caption">
                      Achievement unlocked - {toast.name}
                    </strong>
                    <span className="detail">{toast.description}</span>
                  </Column>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setToast(null)}
                    aria-label="Dismiss">
                    x
                  </Button>
                </Row>
              </Surface>
            </div>
          }
        />
      )}

      {isFirstRun && (
        <Surface>
          <Column>
          <strong>Get started - three things to try</strong>
          <Column>
            <Row align="center">
              <Column gap={1} className="grow">
                <span className="caption">Log your first workout</span>
                <span className="detail">
                  Track exercises, sets, reps, and weight
                </span>
              </Column>
              <Link to="/sessions/new" className="secondary sm">
                Start session
              </Link>
            </Row>
            <Row align="center">
              <Column gap={1} className="grow">
                <span className="caption">Plan a route</span>
                <span className="detail">
                  Map out a run or ride before you head out
                </span>
              </Column>
              <Link to="/plan-route" className="secondary sm">
                Open map
              </Link>
            </Row>
            <Row align="center">
              <Column gap={1} className="grow">
                <span className="caption">Track your health</span>
                <span className="detail">
                  Log sleep, nutrition, body metrics and more
                </span>
              </Column>
              <Link to="/profile" className="secondary sm">
                View profile
              </Link>
            </Row>
          </Column>
          </Column>
        </Surface>
      )}

      <Grid variant="widget">
        <EditDisplayNameWidget />
        <ImportDataWidget />
        <ExportDataWidget />
        <PlanRouteWidget />
      </Grid>
      <Row
        align="center"
        justify="between"
        children={
          <>
            <Text>Widgets</Text>
            <Button children={"edit"} variant="ghost" />
          </>
        }></Row>
      <Grid min={"sm"} hidden={true}>
        {lastNight && (
          <GridItem
            colSpan={2}
            children={
              <SleepLarge
                session={lastNight}
                goalMinutes={GOAL_MINUTES}
                weeklyTrend={weeklyTrend}
                scoreHistory={scoreHistory}
              />
            }
          />
        )}
        <GridItem colSpan={2} children={<WeatherWidget />} />
        <GridItem colSpan={2} children={<CalendarLarge />} />
      </Grid>
    </Grid>
  );
}
