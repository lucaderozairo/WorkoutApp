import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useCommand } from '@ui/bindings';
import type { Id } from '@shared/types';
import { distanceKm as haversineKm } from '@shared/geo';
import type { SavedRoute } from '@features/routes';
import { exportSavedRouteGpx, getRouteSummary, handleDeleteSavedRoute } from '@features/routes';
import { summarizeSurfaceMix } from '@features/routes/domain/surface';
import {
  formatPace,
  parsePace,
  handlePlanSession,
  estimateTargetDuration,
  validatePaceTarget,
  type PaceTarget,
} from '@features/planning';
import { estimateSurfaceMix, formatMin, type ActivityId } from './useRoutePlanner';

const USER_ID = 'user-001' as Id<'User'>;

export type PaceMode = 'full' | 'segments';

function activityForRoute(route?: SavedRoute): ActivityId {
  return route?.profile === 'bike' ? 'ride' : 'run';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface OverviewSegment {
  index: number;
  distanceKm: number;
  cumulativeKm: number;
}

export function useRouteOverview() {
  const navigate = useNavigate();
  const { routeId } = useParams<{ routeId: string }>();
  const savedRoutes = (useQuery('saved_routes') ?? []) as SavedRoute[];
  const route = savedRoutes.find(r => r.id === routeId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { dispatch: deleteRoute } = useCommand(handleDeleteSavedRoute);
  const { dispatch: planSession } = useCommand(handlePlanSession);

  const activity = activityForRoute(route);
  const distanceKm = route?.distanceKm ?? 0;
  const elevationProfile = route?.elevationProfile ?? [];
  const routePath = route?.routePath ?? route?.waypoints ?? [];

  const stats = useMemo(() => {
    const paceSecPerKm = activity === 'ride' ? 180 : 324;
    const grades = elevationProfile.map(s => s.grade);
    return {
      activity,
      time: formatMin((distanceKm * paceSecPerKm) / 60),
      surfaceMix: route?.surfaceSegments?.length
        ? summarizeSurfaceMix(route.surfaceSegments, distanceKm)
        : estimateSurfaceMix(activity, route?.waypoints.length ?? 0, distanceKm),
      surfaceReal: !!route?.surfaceSegments?.length,
      waypointCount: route?.waypoints.length ?? 0,
      elevationGainM: route?.elevationGainM ?? 0,
      elevationLossM: route?.elevationLossM ?? 0,
      maxGrade: grades.length ? Math.max(...grades) : 0,
      minGrade: grades.length ? Math.min(...grades) : 0,
    };
  }, [activity, route, distanceKm, elevationProfile]);

  const segments = useMemo<OverviewSegment[]>(() => {
    const waypoints = route?.waypoints ?? [];
    if (waypoints.length < 2) return [];
    let cumulative = 0;
    return waypoints.slice(1).map((point, i) => {
      const km = haversineKm(waypoints[i], point);
      cumulative += km;
      return { index: i, distanceKm: km, cumulativeKm: cumulative };
    });
  }, [route]);

  const hoveredPoint = hoveredIndex != null && routePath.length
    ? routePath[Math.min(hoveredIndex, routePath.length - 1)]
    : null;

  // ─── Plan a session ─────────────────────────────────────────────────────────
  const [planOpen, setPlanOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(todayIso());
  const [paceMode, setPaceMode] = useState<PaceMode>('full');
  const [fullPaceInput, setFullPaceInput] = useState(formatPace(activity === 'ride' ? 180 : 324));
  const [segmentPaceInputs, setSegmentPaceInputs] = useState<Record<number, string>>({});
  const [planConfirmation, setPlanConfirmation] = useState<string | null>(null);

  const paceTarget = useMemo<PaceTarget | undefined>(() => {
    if (paceMode === 'full') {
      const secs = parsePace(fullPaceInput);
      return secs > 0 ? { kind: 'full', paceSecPerKm: secs } : undefined;
    }
    const builtSegments = segments
      .map(segment => {
        const raw = segmentPaceInputs[segment.index];
        const secs = raw ? parsePace(raw) : 0;
        if (secs <= 0) return null;
        const fromKm = segment.cumulativeKm - segment.distanceKm;
        return { fromKm, toKm: segment.cumulativeKm, paceSecPerKm: secs };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    return builtSegments.length > 0 ? { kind: 'segments', segments: builtSegments } : undefined;
  }, [paceMode, fullPaceInput, segmentPaceInputs, segments]);

  const targetDurationSec = estimateTargetDuration(distanceKm, paceTarget);
  const paceError = validatePaceTarget(distanceKm, paceTarget);

  async function handlePlan() {
    if (!route || paceError || !paceTarget) return;
    const planType = route.profile === 'bike' ? 'cycle' : 'run';
    const scheduledAt = new Date(`${scheduleDate}T08:00:00`).getTime();
    const result = await planSession({
      type: 'PlanSession',
      userId: USER_ID,
      planType,
      name: route.name,
      scheduledAt,
      notes: '',
      routeId: route.id,
      routeSnapshot: getRouteSummary(route.id),
      paceTarget,
      routeWaypoints: route.waypoints,
      distanceKm,
    });
    if (!result.ok) return;
    setPlanConfirmation(
      `Session planned for ${new Date(scheduledAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`,
    );
    setPlanOpen(false);
  }

  function handleEdit() {
    if (!route) return;
    navigate(`/routes/${route.id}/edit`);
  }

  function handleUse() {
    if (!route) return;
    const selected = route.profile === 'bike' ? 'cycle' : 'run';
    navigate('/sessions/new', {
      state: {
        waypoints: route.waypoints,
        distanceKm: route.distanceKm,
        profile: route.profile,
        callerState: { selected, name: route.name, date: todayIso() },
      },
    });
  }

  async function handleDelete() {
    if (!route) return;
    await deleteRoute({ type: 'DeleteSavedRoute', routeId: route.id });
    navigate('/routes', { replace: true });
  }

  function handleExportGpx() {
    if (!route) return;
    const blob = new Blob([exportSavedRouteGpx(route)], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${route.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'route'}.gpx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function setSegmentPaceInput(index: number, value: string) {
    setSegmentPaceInputs(prev => ({ ...prev, [index]: value }));
  }

  return {
    navigate,
    route,
    routePath,
    elevationProfile,
    stats,
    segments,
    hoveredIndex,
    setHoveredIndex,
    hoveredPoint,
    confirmDelete,
    setConfirmDelete,
    // plan
    planOpen,
    setPlanOpen,
    scheduleDate,
    setScheduleDate,
    paceMode,
    setPaceMode,
    fullPaceInput,
    setFullPaceInput,
    segmentPaceInputs,
    setSegmentPaceInput,
    paceTarget,
    paceError,
    targetDurationSec,
    planConfirmation,
    handlePlan,
    handleEdit,
    handleUse,
    handleDelete,
    handleExportGpx,
  };
}
