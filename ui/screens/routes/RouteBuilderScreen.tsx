import { useParams } from 'react-router-dom';
import type { SavedRoute } from '@features/routes';
import { RoutePlannerScreen } from './RoutePlannerScreen';

export function RouteBuilderScreen() {
  const { routeId } = useParams<{ routeId: string }>();
  return <RoutePlannerScreen routeId={routeId as SavedRoute['id'] | undefined} />;
}
