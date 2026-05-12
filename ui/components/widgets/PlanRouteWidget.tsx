import { useNavigate } from 'react-router-dom';

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
    <div className="surface column compact widget-1x1 space-between">
      <span className="label">Plan a Route</span>
      <p className="detail">Map out a run or ride before you go.</p>
      <button  className='chip sm' onClick={handlePlan}>Open route planner</button>
    </div>
  );
}
