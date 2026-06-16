import { GOAL_LABELS, type WidgetGoal } from './widgetGoalPresets';
import { Row } from '@ui/layout';
import { Button } from '@ui/molecules';

interface GoalPickerProps {
  currentGoal: WidgetGoal;
  onSelect: (goal: WidgetGoal, force?: boolean) => boolean;
}

const GOALS = Object.keys(GOAL_LABELS) as WidgetGoal[];

export function GoalPicker({ currentGoal, onSelect }: GoalPickerProps) {
  function handleClick(goal: WidgetGoal) {
    if (goal === currentGoal) return;
    const ok = onSelect(goal);
    if (!ok) {
      const label = GOAL_LABELS[goal];
      const confirmed = window.confirm(
        `Reset your widget layout to the ${label} default? Your current layout will be replaced.`
      );
      if (confirmed) {
        onSelect(goal, true);
      }
    }
  }

  return (
    <Row gap={1} className="goal-picker">
      {GOALS.map(g => (
        <Button
          key={g}
          variant="ghost"
          size="sm"
          active={currentGoal === g}
          onClick={() => handleClick(g)}
        >
          {GOAL_LABELS[g]}
        </Button>
      ))}
    </Row>
  );
}
