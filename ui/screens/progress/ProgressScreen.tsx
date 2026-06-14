import { Grid, Row, Column } from '@ui/layout';
import type { CardioSport } from '@features/cardio';
import { Tabs, DetailRow, Alert, Badge, Button } from '@ui/molecules';
import { EmptyState, StatTile } from '@ui/patterns';
import { Surface, Text } from '@ui/atoms';
import { SparklineArea } from '@ui/components/charts/domain-charts';
import { useProgressScreen } from './useProgressScreen';
import type { IconType } from 'react-icons';
import {
  MdDirectionsBike, MdDirectionsRun, MdDownhillSkiing, MdFitnessCenter, MdHiking,
  MdKayaking, MdPool, MdRowing, MdSelfImprovement, MdSnowboarding, MdSurfing, MdTerrain,
} from 'react-icons/md';
import { PiBoxingGlove, PiFlame, PiPersonSimpleTaiChi } from 'react-icons/pi';

import '@features/training_log';
import '@features/cardio';
import '@features/insights';
import '@features/progress_analysis';

const SPORT_META: Record<CardioSport, { label: string; Icon: IconType }> = {
  run:       { label: 'RUNS',       Icon: MdDirectionsRun     },
  cycle:     { label: 'CYCLING',    Icon: MdDirectionsBike    },
  swim:      { label: 'SWIMMING',   Icon: MdPool              },
  row:       { label: 'ROWING',     Icon: MdRowing            },
  hike:      { label: 'HIKING',     Icon: MdHiking            },
  ski:       { label: 'SKIING',     Icon: MdDownhillSkiing    },
  snowboard: { label: 'SNOWBOARD',  Icon: MdSnowboarding      },
  climb:     { label: 'CLIMBING',   Icon: MdTerrain           },
  surf:      { label: 'SURFING',    Icon: MdSurfing           },
  kayak:     { label: 'KAYAKING',   Icon: MdKayaking          },
  yoga:      { label: 'YOGA',       Icon: MdSelfImprovement   },
  boxing:    { label: 'BOXING',     Icon: PiBoxingGlove       },
  stretch:   { label: 'STRETCHING', Icon: PiPersonSimpleTaiChi},
  hiit:      { label: 'HIIT',       Icon: PiFlame             },
};

type AlertVariant = 'info' | 'success' | 'warn' | 'error';

function severityVariant(severity: string): AlertVariant {
  switch (severity) {
    case 'error':
    case 'critical': return 'error';
    case 'warning':
    case 'warn': return 'warn';
    case 'success':
    case 'positive': return 'success';
    default: return 'info';
  }
}

/* ── Main Screen ── */

export function ProgressScreen({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const {
    navigate,
    sportFilter, setSportFilter,
    history,
    exerciseList,
    sessionsByType,
    insights,
    totalSets,
    prCount,
    visibleCardioSports,
    cardioBySport,
    sportsToShow,
  } = useProgressScreen();

  return (
    <Grid>
      {/* Sport filter */}
      <Tabs
        value={sportFilter}
        onChange={setSportFilter}
        items={[
          { id: 'all', label: 'All' },
          { id: 'strength', label: <MdFitnessCenter size={16} /> },
          ...visibleCardioSports.map(sport => {
            const { Icon } = SPORT_META[sport];
            return { id: sport, label: <Icon size={16} /> };
          }),
        ]}
      />

      {/* Lift sessions */}
      {(sportFilter === 'all' || sportFilter === 'strength') && (
        <>
          <Surface as="section" className="pad-sm">
            <Grid variant="triple">
              <StatTile value={history.length} label="SESSIONS" />
              <StatTile value={totalSets} label="TOTAL SETS" />
              <StatTile value={prCount} label="PRS" />
            </Grid>
          </Surface>

          {Array.from(sessionsByType.entries()).map(([typeName, sessions]) => {
            const values = sessions.slice(-5).map((s) => s.totalSets);
            return (
              <Surface as="section" key={typeName} className="pad-sm">
                <Row justify="between">
                  <Text as="strong">{typeName}</Text>
                  <Badge active>{sessions.length}×</Badge>
                </Row>
                <SparklineArea data={values.map((y, i) => ({ x: String(i), y }))} height={40} color="var(--accent)" />
                <Text as="p" size="caption">Volume trend · last {values.length} session{values.length !== 1 ? "s" : ""}</Text>
              </Surface>
            );
          })}

          {exerciseList.length > 0 && (
            <>
              <Text as="h3">Exercises</Text>
              {exerciseList.map(({ exerciseName, history: exHistory, plateauDetected }) => {
                const values = exHistory.slice(-5).map(e => e.oneRepMaxEstimate);
                const latest = exHistory[exHistory.length - 1];
                return (
                  <Surface
                    as="section"
                    key={exerciseName}
                    className="gap-1"
                    interactive
                    onClick={() => navigate(`/exercise/${encodeURIComponent(exerciseName)}`)}>
                    <Row justify="between">
                      <Text as="strong">{exerciseName}</Text>
                      <Row>
                        {plateauDetected && <Badge tone="warn" dot>⚠ Plateau</Badge>}
                        <Badge active>{exHistory.length}×</Badge>
                      </Row>
                    </Row>
                    <SparklineArea data={values.map((y, i) => ({ x: String(i), y }))} height={40} color="var(--accent)" />
                    <Row justify="between">
                      <Text as="p" size="caption">Est. 1RM trend · last {values.length} session{values.length !== 1 ? 's' : ''}</Text>
                      {latest && <Text size="caption">{latest.maxWeightKg} kg</Text>}
                    </Row>
                  </Surface>
                );
              })}
            </>
          )}

          {sessionsByType.size === 0 && (
            <EmptyState
              icon="📋"
              title="No sessions yet"
              message="Log your first workout in the Workout tab."
              action={
                onOpenSettings ? (
                  <Button variant="secondary" onClick={onOpenSettings}>
                    Import history
                  </Button>
                ) : undefined
              }
            />
          )}
        </>
      )}

      {/* Cardio sections — one per sport, dynamic */}
      {sportsToShow.map((sport) => {
        const sessions = cardioBySport(sport);
        const meta = SPORT_META[sport];
        const values = sessions
          .slice(-5)
          .map((s) => +(s.distanceMeters / 1000).toFixed(1));
        const totalKm = sessions.reduce((a, s) => a + s.distanceMeters / 1000, 0);
        return (
          <Surface as="section" key={sport} className="pad-sm">
            <Row justify="between">
              <Text as="strong">{meta.label}</Text>
              <Badge>{sessions.length}×</Badge>
            </Row>
            <SparklineArea data={values.map((y, i) => ({ x: String(i), y }))} height={40} color="var(--accent)" />
            <Text as="p" size="caption">
              Distance trend · last {values.length} session{values.length !== 1 ? "s" : ""}
            </Text>
            <DetailRow label="Total distance" value={`${totalKm.toFixed(1)} km`} />
          </Surface>
        );
      })}

      {/* Insights */}
      {insights.length > 0 && (
        <>
          <Text as="h3">Insights</Text>
          {insights.slice(0, 3).map(i => (
            <Alert key={i.id} variant={severityVariant(i.severity)} title={i.title} message={i.message} />
          ))}
        </>
      )}
    </Grid>
  );
}
