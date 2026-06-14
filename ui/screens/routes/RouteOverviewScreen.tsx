import { useEffect, useRef, type CSSProperties } from 'react';
import { Bike, CalendarPlus, Download, Edit3, Footprints, Play, Trash2 } from 'lucide-react';
import { Button, ScreenHeader, Input, ToggleGroup } from '@ui/molecules';
import { Surface, Text } from '@ui/atoms';
import { Column, Grid, Row, Cluster } from '@ui/layout';
import { EmptyState } from '@ui/patterns';
import { formatDuration } from '@shared/utils';
import { RouteMap, type MapCanvasHandle } from '@ui/components/workout/wizard/RouteMap';
import { ElevationProfile } from '@ui/components/routes/ElevationProfile';
import { useRouteOverview } from './useRouteOverview';
import { SURFACES, type SurfaceKey } from './useRoutePlanner';

function profileLabel(profile: 'foot' | 'bike') {
  return profile === 'bike' ? 'Bike' : 'Foot';
}

function profileIcon(profile: 'foot' | 'bike') {
  return profile === 'bike' ? <Bike size={16} /> : <Footprints size={16} />;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function RouteOverviewScreen() {
  const overview = useRouteOverview();
  const {
    navigate, route, routePath, elevationProfile, stats, segments,
    hoveredIndex, setHoveredIndex, hoveredPoint,
    confirmDelete, setConfirmDelete,
    planOpen, setPlanOpen, scheduleDate, setScheduleDate,
    paceMode, setPaceMode, fullPaceInput, setFullPaceInput,
    segmentPaceInputs, setSegmentPaceInput,
    paceError, targetDurationSec, planConfirmation,
    handlePlan, handleEdit, handleUse, handleDelete, handleExportGpx,
  } = overview;

  const mapRef = useRef<MapCanvasHandle>(null);
  useEffect(() => {
    mapRef.current?.highlightPoint(hoveredPoint);
  }, [hoveredPoint]);

  if (!route) {
    return (
      <Grid>
        <ScreenHeader title="Route Not Found" back={() => navigate('/routes')} />
        <EmptyState
          icon="Map"
          title="Route not found"
          message="This saved route is no longer available."
          action={<Button variant="primary" onClick={() => navigate('/routes')}>View routes</Button>}
        />
      </Grid>
    );
  }

  return (
    <Grid gap={4} className="route-detail-screen">
      <ScreenHeader
        title={route.name}
        back={() => navigate('/routes')}
        primary={<Button variant="secondary" size="sm" onClick={handleEdit}><Edit3 size={14} /> Edit route</Button>}
      />

      <Grid cols="minmax(0, 1.25fr) minmax(320px, .75fr)" gap={4} className="route-detail-grid">
        <Column gap={3}>
          <Surface pad="none" className="route-detail-map">
            <RouteMap
              ref={mapRef}
              waypoints={route.waypoints}
              routePath={routePath}
              onChange={() => undefined}
              profile={route.profile}
              readOnly
              showDistanceMarkers
              mode="select"
            />
          </Surface>

          <Surface>
            <Column gap={2}>
              <Text size="eyebrow">Elevation</Text>
              <ElevationProfile
                samples={elevationProfile}
                hoveredIndex={hoveredIndex}
                onHover={setHoveredIndex}
              />
            </Column>
          </Surface>

          {route.description ? (
            <Surface>
              <Column gap={2}>
                <Text size="eyebrow">Description</Text>
                <Text as="p">{route.description}</Text>
              </Column>
            </Surface>
          ) : null}

          {segments.length > 0 ? (
            <Surface>
              <Column gap={2}>
                <Text size="eyebrow">Segments</Text>
                <Column gap={1}>
                  {segments.map(segment => (
                    <Row key={segment.index} justify="between" align="center" gap={2}>
                      <Text size="caption" color="muted">Leg {segment.index + 1}</Text>
                      <Text size="caption" mono>{segment.distanceKm.toFixed(2)} km</Text>
                      <Text size="caption" color="muted" mono>{segment.cumulativeKm.toFixed(2)} km</Text>
                    </Row>
                  ))}
                </Column>
              </Column>
            </Surface>
          ) : null}
        </Column>

        <Column gap={3}>
          <Surface>
            <Column gap={3}>
              <Row justify="between" align="center" gap={2}>
                <Row align="center" gap={2}>
                  <span className="route-card-icon" aria-hidden>{profileIcon(route.profile)}</span>
                  <Column gap={0}>
                    <Text bold>{profileLabel(route.profile)}</Text>
                    <Text size="caption" color="muted">Updated {formatDate(route.updatedAt ?? route.createdAt)}</Text>
                  </Column>
                </Row>
              </Row>

              <Grid cols={2} gap={2}>
                <Surface variant="flat" pad="sm">
                  <Column gap={1}>
                    <Text size="caption" color="muted">Distance</Text>
                    <Text mono bold>{route.distanceKm.toFixed(2)} km</Text>
                  </Column>
                </Surface>
                <Surface variant="flat" pad="sm">
                  <Column gap={1}>
                    <Text size="caption" color="muted">Est. time</Text>
                    <Text mono bold>{stats.time}</Text>
                  </Column>
                </Surface>
                <Surface variant="flat" pad="sm">
                  <Column gap={1}>
                    <Text size="caption" color="muted">Ascent</Text>
                    <Text mono bold>+{stats.elevationGainM} m</Text>
                  </Column>
                </Surface>
                <Surface variant="flat" pad="sm">
                  <Column gap={1}>
                    <Text size="caption" color="muted">Descent</Text>
                    <Text mono bold>-{stats.elevationLossM} m</Text>
                  </Column>
                </Surface>
                <Surface variant="flat" pad="sm">
                  <Column gap={1}>
                    <Text size="caption" color="muted">Max grade</Text>
                    <Text mono bold>{stats.maxGrade.toFixed(1)}%</Text>
                  </Column>
                </Surface>
                <Surface variant="flat" pad="sm">
                  <Column gap={1}>
                    <Text size="caption" color="muted">Min grade</Text>
                    <Text mono bold>{stats.minGrade.toFixed(1)}%</Text>
                  </Column>
                </Surface>
              </Grid>

              <Column gap={2}>
                <Row justify="between" align="center">
                  <Text size="eyebrow">Surface Mix</Text>
                  <Text size="caption" color="muted">{stats.surfaceReal ? 'Measured' : 'Estimated'}</Text>
                </Row>
                <Row className="surface-mix-bar">
                  {SURFACES.map(surface =>
                    stats.surfaceMix[surface.key] > 0 ? (
                      <span
                        key={surface.key}
                        className="surface-mix-segment"
                        data-surface={surface.key}
                        // eslint-disable-next-line no-restricted-syntax -- Surface percentages drive segment widths through the established route planner CSS variable.
                        style={{ "--mix-pct": `${stats.surfaceMix[surface.key]}%` } as CSSProperties}
                        title={`${surface.label}: ${stats.surfaceMix[surface.key]}%`}
                      />
                    ) : null,
                  )}
                </Row>
                <Cluster className="gap-1">
                  {SURFACES.filter(surface => stats.surfaceMix[surface.key] > 0).map(surface => (
                    <Row key={surface.key} align="center" gap={1}>
                      <span className="surface-mix-swatch" data-surface={surface.key as SurfaceKey} />
                      <Text size="caption">{surface.label}</Text>
                      <Text size="caption" color="muted" mono>{stats.surfaceMix[surface.key]}%</Text>
                    </Row>
                  ))}
                </Cluster>
              </Column>
            </Column>
          </Surface>

          <Surface>
            <Column gap={3}>
              <Row justify="between" align="center">
                <Text size="eyebrow">Plan a session</Text>
                {!planOpen ? (
                  <Button variant="secondary" size="sm" onClick={() => setPlanOpen(true)}>
                    <CalendarPlus size={14} /> Plan
                  </Button>
                ) : null}
              </Row>

              {planConfirmation ? (
                <Text size="caption" color="positive">{planConfirmation}</Text>
              ) : null}

              {planOpen ? (
                <Column gap={3}>
                  <Input
                    type="date"
                    label="Schedule"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                  />
                  <Column gap={1}>
                    <Text size="caption" color="muted">Pace target</Text>
                    <ToggleGroup
                      label="Pace target mode"
                      value={paceMode}
                      onChange={setPaceMode}
                      items={[
                        { value: 'full', label: 'Whole route' },
                        { value: 'segments', label: 'Per segment' },
                      ]}
                    />
                  </Column>

                  {paceMode === 'full' ? (
                    <Input
                      label="Pace (min/km)"
                      inputMode="numeric"
                      value={fullPaceInput}
                      onChange={e => setFullPaceInput(e.target.value)}
                      placeholder="5:24"
                    />
                  ) : (
                    <Column gap={1}>
                      {segments.map(segment => (
                        <Row key={segment.index} align="center" gap={2}>
                          <Text size="caption" color="muted">Leg {segment.index + 1}</Text>
                          <Input
                            inputMode="numeric"
                            value={segmentPaceInputs[segment.index] ?? ''}
                            onChange={e => setSegmentPaceInput(segment.index, e.target.value)}
                            placeholder="5:24"
                          />
                        </Row>
                      ))}
                    </Column>
                  )}

                  <Row justify="between" align="center">
                    <Text size="caption" color="muted">Est. moving time</Text>
                    <Text mono bold>{targetDurationSec > 0 ? formatDuration(targetDurationSec) : '—'}</Text>
                  </Row>

                  {paceError ? <Text size="caption" color="negative">{paceError}</Text> : null}

                  <Row gap={1}>
                    <Button variant="primary" onClick={() => void handlePlan()} disabled={!!paceError}>
                      Schedule session
                    </Button>
                    <Button variant="ghost" onClick={() => setPlanOpen(false)}>Cancel</Button>
                  </Row>
                </Column>
              ) : null}
            </Column>
          </Surface>

          <Surface>
            <Column gap={2}>
              <Button variant="primary" onClick={handleUse}>
                <Play size={14} /> Use for session
              </Button>
              <Button variant="secondary" onClick={handleEdit}>
                <Edit3 size={14} /> Edit route
              </Button>
              <Button variant="secondary" onClick={handleExportGpx}>
                <Download size={14} /> Export GPX
              </Button>
              {confirmDelete ? (
                <Row gap={1}>
                  <Button variant="destructive" onClick={() => void handleDelete()}>
                    <Trash2 size={14} /> Delete route
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                </Row>
              ) : (
                <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete route
                </Button>
              )}
            </Column>
          </Surface>
        </Column>
      </Grid>
    </Grid>
  );
}
