import type { WidgetDef } from './widgetTypes';
import {
  ReadinessHomeWidget,
  HRVHomeWidget,
  SleepHomeWidget,
  WeatherHomeWidget,
  BodyBatteryHomeWidget,
  HabitsHomeWidget,
  WeeklyVolumeHomeWidget,
  MacrosHomeWidget,
  RestingHRHomeWidget,
  InsightsHomeWidget,
} from './HomeWidgets';
import { ActivityFeedWidget } from './ActivityFeedWidget';
import { CaloriesWidget } from './CaloriesWidget';
import { PlanAdherenceWidget } from './PlanAdherenceWidget';
import { MonthlyDistanceWidget } from './MonthlyDistanceWidget';
import { NextWorkoutWidget } from './NextWorkoutWidget';
import { LastSessionWidget } from './LastSessionWidget';

export const WIDGET_REGISTRY: WidgetDef[] = [
  { id: 'sleep',          label: 'Sleep',            defaultSize: 'md',   sizes: ['sm', 'wide', 'md', 'lg'], Component: SleepHomeWidget },
  { id: 'readiness',      label: 'Readiness',        defaultSize: 'sm',   sizes: ['sm', 'wide', 'md'],       Component: ReadinessHomeWidget },
  { id: 'hrv',            label: 'HRV',              defaultSize: 'sm',   sizes: ['sm', 'wide', 'md'],       Component: HRVHomeWidget },
  { id: 'weather',        label: 'Weather',          defaultSize: 'lg',   sizes: ['sm', 'wide', 'md', 'lg'], Component: WeatherHomeWidget },
  { id: 'resting-hr',     label: 'Resting HR',       defaultSize: 'sm',   sizes: ['sm', 'wide'],             Component: RestingHRHomeWidget },
  { id: 'body-battery',   label: 'Body Battery',     defaultSize: 'sm',   sizes: ['sm', 'wide'],             Component: BodyBatteryHomeWidget },
  { id: 'weekly-volume',  label: 'Weekly Volume',    defaultSize: 'wide', sizes: ['wide', 'md', 'lg'],       Component: WeeklyVolumeHomeWidget },
  { id: 'activity-feed',  label: 'Recent Sessions',  defaultSize: 'wide', sizes: ['wide', 'md', 'lg'],       Component: ActivityFeedWidget },
  { id: 'habits',         label: 'Habits',           defaultSize: 'sm',   sizes: ['sm', 'wide', 'md'],       Component: HabitsHomeWidget },
  { id: 'macros',         label: 'Macros',           defaultSize: 'wide', sizes: ['wide', 'md'],             Component: MacrosHomeWidget },
  { id: 'calories',       label: 'Calories',         defaultSize: 'sm',   sizes: ['sm'],                    Component: CaloriesWidget },
  { id: 'plan-adherence', label: 'Plan Adherence',   defaultSize: 'wide', sizes: ['wide', 'md'],             Component: PlanAdherenceWidget },
  { id: 'monthly-dist',   label: 'Monthly Distance', defaultSize: 'wide', sizes: ['wide', 'md'],             Component: MonthlyDistanceWidget },
  { id: 'insights',       label: 'Insights',         defaultSize: 'wide', sizes: ['sm', 'wide', 'md', 'lg'], Component: InsightsHomeWidget },
  { id: 'next-workout',   label: 'Next Workout',     defaultSize: 'sm',   sizes: ['sm', 'wide'],             Component: NextWorkoutWidget },
  { id: 'last-session',   label: 'Last Session',     defaultSize: 'wide', sizes: ['sm', 'wide'],             Component: LastSessionWidget },
];
