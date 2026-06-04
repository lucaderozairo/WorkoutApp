import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Column, Grid, GridItem, Row } from "@ui/layout";
import { SleepLarge } from "@ui/components/widgets/SleepWidgets";
import { CalendarLarge } from "@ui/components/widgets/CalendarWidgets";
import { WelcomeWidget } from "@ui/components/widgets/WelcomeWidget";
import { WeatherWidget } from "@ui/components/widgets/WeatherWidget";
import { ReadinessWidget }       from "@ui/components/widgets/ReadinessWidget";
import { ActivityFeedWidget }    from "@ui/components/widgets/ActivityFeedWidget";
import { ActiveGoalsWidget }     from "@ui/components/widgets/ActiveGoalsWidget";
import { InsightsWidget }        from "@ui/components/widgets/InsightsWidget";
import { WeeklyVolumeWidget }    from "@ui/components/widgets/WeeklyVolumeWidget";
import { SleepBreakdownWidget }  from "@ui/components/widgets/SleepBreakdownWidget";
import { HRVWidget }             from "@ui/components/widgets/HRVWidget";
import { RestingHRWidget }       from "@ui/components/widgets/RestingHRWidget";
import { BodyBatteryWidget }     from "@ui/components/widgets/BodyBatteryWidget";
import { PlanAdherenceWidget }   from "@ui/components/widgets/PlanAdherenceWidget";
import { MacrosWidget }          from "@ui/components/widgets/MacrosWidget";
import { CaloriesWidget }        from "@ui/components/widgets/CaloriesWidget";
import { HabitsWidget }          from "@ui/components/widgets/HabitsWidget";
import { MonthlyDistanceWidget } from "@ui/components/widgets/MonthlyDistanceWidget";
import { GOAL_MINUTES } from "./dashboardUtils";
import { ACHIEVEMENT_DEFINITIONS } from "@features/achievements";
import type { AchievementUnlockedPayload } from "@features/achievements/contract";
import { eventBus } from "@core/events/bus";
import { useHomeScreen } from "./useHomeScreen";
import { Surface, Text } from "@ui/atoms";
import { Button, Modal, useToast } from "@ui/molecules";

// Feature policies/projections are registered centrally in app/registry/bootstrap.ts.

type WidgetId =
  | "readiness" | "activity_feed" | "active_goals" | "insights"
  | "weekly_volume" | "sleep_breakdown" | "hrv" | "resting_hr"
  | "body_battery" | "plan_adherence" | "macros" | "calories"
  | "habits" | "monthly_distance" | "sleep" | "weather" | "calendar";

interface WidgetDef {
  id: WidgetId;
  label: string;
  colSpan: 1 | 2;
}

const WIDGET_DEFS: WidgetDef[] = [
  { id: "readiness",        label: "Readiness",         colSpan: 2 },
  { id: "activity_feed",    label: "Recent Sessions",   colSpan: 2 },
  { id: "active_goals",     label: "Active Goals",      colSpan: 2 },
  { id: "insights",         label: "Insights",          colSpan: 2 },
  { id: "weekly_volume",    label: "Weekly Volume",     colSpan: 2 },
  { id: "sleep_breakdown",  label: "Sleep Stages",      colSpan: 2 },
  { id: "hrv",              label: "HRV Trend",         colSpan: 2 },
  { id: "resting_hr",       label: "Resting HR",        colSpan: 2 },
  { id: "body_battery",     label: "Body Battery",      colSpan: 1 },
  { id: "plan_adherence",   label: "Plan Adherence",    colSpan: 2 },
  { id: "macros",           label: "Macros",            colSpan: 2 },
  { id: "calories",         label: "Calories",          colSpan: 1 },
  { id: "habits",           label: "Today's Habits",    colSpan: 2 },
  { id: "monthly_distance", label: "Monthly Distance",  colSpan: 2 },
  { id: "sleep",            label: "Last Night's Sleep",colSpan: 2 },
  { id: "weather",          label: "Weather",           colSpan: 2 },
  { id: "calendar",         label: "Calendar",          colSpan: 2 },
];

const DEFAULT_WIDGETS: WidgetId[] = [
  "readiness",
  "activity_feed",
  "active_goals",
  "insights",
  "sleep",
  "weather",
  "calendar",
];

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

  const navigate = useNavigate();
  const toast = useToast();
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>(DEFAULT_WIDGETS);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const token = eventBus.subscribe("AchievementUnlocked", (event) => {
      const payload = event.payload as AchievementUnlockedPayload;
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === payload.achievementId);
      if (def) {
        toast.info(`Achievement unlocked: ${def.name}`);
      }
    });
    return () => token.unsubscribe();
  }, []);

  function toggleWidget(id: WidgetId, active: boolean) {
    setActiveWidgets((prev) =>
      active ? [...prev, id] : prev.filter((w) => w !== id)
    );
  }

  function renderWidget(id: WidgetId): ReactNode {
    switch (id) {
      case "readiness":        return <ReadinessWidget size="2x1" />;
      case "activity_feed":    return <ActivityFeedWidget size="2x1" />;
      case "active_goals":     return <ActiveGoalsWidget size="2x2" />;
      case "insights":         return <InsightsWidget size="2x1" />;
      case "weekly_volume":    return <WeeklyVolumeWidget size="2x1" />;
      case "sleep_breakdown":  return <SleepBreakdownWidget size="2x1" />;
      case "hrv":              return <HRVWidget size="2x1" />;
      case "resting_hr":       return <RestingHRWidget size="2x1" />;
      case "body_battery":     return <BodyBatteryWidget size="1x1" />;
      case "plan_adherence":   return <PlanAdherenceWidget size="2x1" />;
      case "macros":           return <MacrosWidget size="2x1" />;
      case "calories":         return <CaloriesWidget size="1x1" />;
      case "habits":           return <HabitsWidget size="2x1" />;
      case "monthly_distance": return <MonthlyDistanceWidget size="2x1" />;
      case "sleep":
        return lastNight ? (
          <SleepLarge
            session={lastNight}
            goalMinutes={GOAL_MINUTES}
            weeklyTrend={weeklyTrend}
            scoreHistory={scoreHistory}
          />
        ) : null;
      case "weather":   return <WeatherWidget />;
      case "calendar":  return <CalendarLarge />;
      default: return null;
    }
  }

  return (
    <Column>
      <WelcomeWidget
        workoutsThisWeek={workoutsThisWeek}
        streak={streak}
        scoreClass={scoreClass}
      />

      {isFirstRun && (
        <Surface>
          <Column>
            <strong>Three things to try</strong>
            <Column>
              <Row align="center">
                <Column gap={1} className="grow">
                  <Text size="caption">Log your first workout</Text>
                  <Text size="detail">Track exercises, sets, reps, and weight.</Text>
                </Column>
                <Button variant="secondary" size="sm" onClick={() => navigate("/sessions/new")}>
                  Start session
                </Button>
              </Row>
              <Row align="center">
                <Column gap={1} className="grow">
                  <Text size="caption">Plan a route</Text>
                  <Text size="detail">Map out a run or ride before you head out.</Text>
                </Column>
                <Button variant="secondary" size="sm" onClick={() => navigate("/plan-route")}>
                  Open map
                </Button>
              </Row>
              <Row align="center">
                <Column gap={1} className="grow">
                  <Text size="caption">Track your health</Text>
                  <Text size="detail">Log sleep, nutrition, body metrics, and more.</Text>
                </Column>
                <Button variant="secondary" size="sm" onClick={() => navigate("/profile")}>
                  View profile
                </Button>
              </Row>
            </Column>
          </Column>
        </Surface>
      )}

      <Row align="center" justify="between">
        <Text size="caption">Widgets</Text>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditOpen(true)}
        >
          Edit widgets
        </Button>
      </Row>

      <Grid variant="widget" autoRows="sm">
        {activeWidgets.map((id) => {
          const def = WIDGET_DEFS.find((d) => d.id === id);
          if (!def) return null;
          const content = renderWidget(id);
          if (!content) return null;
          return (
            <GridItem key={id} colSpan={def.colSpan}>
              {content}
            </GridItem>
          );
        })}
      </Grid>

      {/* Edit widgets panel */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit widgets"
        size="md"
        footer={<Button variant="ghost" onClick={() => setEditOpen(false)}>Done</Button>}
      >
        <Column gap={1}>
          {WIDGET_DEFS.map((def) => (
            <Row key={def.id} align="center" justify="between" className="list-divider-sm">
              <Text size="detail">{def.label}</Text>
              <input
                type="checkbox"
                checked={activeWidgets.includes(def.id)}
                onChange={(e) => toggleWidget(def.id, e.target.checked)}
                aria-label={`Show ${def.label}`}
              />
            </Row>
          ))}
        </Column>
      </Modal>
    </Column>
  );
}
