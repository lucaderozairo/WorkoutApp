import { useNavigate } from 'react-router-dom';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

export function PlanRouteWidget() {
  const navigate = useNavigate();

  function handlePlan() {
    navigate('/plan-route', {
      state: {
        profile: 'foot',
        returnTo: '/dashboard',
      },
    });
  }

  return (
    <Surface>
      <Column gap={1} justify="between" className="widget-1x1">
        <Text size="eyebrow">Plan a Route</Text>
        <Text size="detail">Map out a run or ride before you go.</Text>
        <Button variant="secondary" size="sm" onClick={handlePlan}>Open route planner</Button>
      </Column>
    </Surface>
  );
}
