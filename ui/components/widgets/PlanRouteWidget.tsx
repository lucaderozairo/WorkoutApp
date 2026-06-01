import { useNavigate } from 'react-router-dom';
import { Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

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
        <span className="label">Plan a Route</span>
        <p className="detail">Map out a run or ride before you go.</p>
        <button  className='chip sm' onClick={handlePlan}>Open route planner</button>
      </Column>
    </Surface>
  );
}
