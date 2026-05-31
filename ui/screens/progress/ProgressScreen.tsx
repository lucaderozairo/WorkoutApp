import { useState, useId } from 'react';
import { Grid, Row, Column } from '@ui/layout';
import { useNavigate } from 'react-router-dom';
import type { ActivityHistoryItem } from '@features/training_log';
import type { CardioSession, CardioSport } from '@features/cardio';
import { EmptyState, Tabs, StatTile, DetailRow, Alert } from '@ui/molecules';
import { Button, Badge, Surface, Text, SegmentBar } from '@ui/atoms';
import { SparklineArea } from '@ui/patterns/charts/domain-charts';
import { ShareModal } from '@ui/components/modals/ShareModal';
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

const SPORT_META: Record<CardioSport, { label: string; Icon: IconType; color: string }> = {
  run:       { label: 'RUNS',       Icon: MdDirectionsRun,     color: 'run' },
  cycle:     { label: 'CYCLING',    Icon: MdDirectionsBike,    color: 'cycle' },
  swim:      { label: 'SWIMMING',   Icon: MdPool,              color: 'swim' },
  row:       { label: 'ROWING',     Icon: MdRowing,            color: 'rowing' },
  hike:      { label: 'HIKING',     Icon: MdHiking,            color: 'strength' },
  ski:       { label: 'SKIING',     Icon: MdDownhillSkiing,    color: 'strength' },
  snowboard: { label: 'SNOWBOARD',  Icon: MdSnowboarding,      color: 'strength' },
  climb:     { label: 'CLIMBING',   Icon: MdTerrain,           color: 'strength' },
  surf:      { label: 'SURFING',    Icon: MdSurfing,           color: 'strength' },
  kayak:     { label: 'KAYAKING',   Icon: MdKayaking,          color: 'strength' },
  yoga:      { label: 'YOGA',       Icon: MdSelfImprovement,   color: 'strength' },
  boxing:    { label: 'BOXING',     Icon: PiBoxingGlove,       color: 'strength' },
  stretch:   { label: 'STRETCHING', Icon: PiPersonSimpleTaiChi,color: 'strength' },
  hiit:      { label: 'HIIT',       Icon: PiFlame,             color: 'strength' },
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function categoryIcon(category: string): string {
  switch (category) {
    case 'strength': return '🏋️';
    case 'cardio': return '🏃';
    case 'mobility': return '🧘';
    default: return '💪';
  }
}

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

/* ── Session Card (expandable) ── */

function SessionCard({ session }: { session: ActivityHistoryItem }) {
  const navigate = useNavigate();
  const id = useId();
  const [shareData, setShareData] = useState<{
    title: string; date: string; summary: string;
    details: Array<{ label: string; value: string }>;
  } | null>(null);

  const icon = categoryIcon(session.category);
  const accent = session.category === 'strength' ? 'strength' : 'run';

  return (
    <Surface as="section" className={`tight${session.hasPR ? ' accent' : ''}`}>
      <input type="checkbox" id={id} className="exp-toggle" />
      <label htmlFor={id} className="exp-trigger column interactive">
        <Row justify="between">
          <Column gap={0}>
            <Text as="time" size="caption">{new Date(session.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Text>
            <Text as="p">{session.name}</Text>
            <Row>
              <Badge color={accent === 'run' ? 'c-cardio' : undefined}>{icon} {session.exerciseCount} exercises</Badge>
              {session.hasPR && <Badge active dot>🏆 PR</Badge>}
            </Row>
          </Column>
          <Row>
            <SegmentBar value={session.totalSets} max={Math.max(session.totalSets, 10)} />
            <Text className="chevron">›</Text>
          </Row>
        </Row>
      </label>
      <Column className="expandable">
        <DetailRow label="Duration" value={formatDuration(session.durationSeconds)} />
        <DetailRow label="Total sets" value={session.totalSets} />
        <DetailRow label="Exercises" value={session.exerciseCount} />
        <Row>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            navigate(`/sessions/${session.id}`);
          }}>📋 Details</Button>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            setShareData({
              title: session.name,
              date: new Date(session.startedAt).toLocaleDateString(),
              summary: `${session.exerciseCount} exercises · ${session.totalSets} sets`,
              details: [
                { label: 'Duration', value: formatDuration(session.durationSeconds) },
                { label: 'Sets', value: String(session.totalSets) },
                { label: 'Exercises', value: String(session.exerciseCount) },
              ],
            });
          }}>📤 Share</Button>
        </Row>
      </Column>
      {shareData && <ShareModal type="session" data={shareData} onClose={() => setShareData(null)} />}
    </Surface>
  );
}

/* ── Cardio Session Card (expandable) ── */

function sportColor(sport: string): string {
  switch (sport) {
    case 'run': return 'run';
    case 'cycle': return 'cycle';
    case 'swim': return 'swim';
    case 'row': return 'rowing';
    default: return 'strength';
  }
}

const SPORT_TOKEN: Record<string, string> = {
  run: 'c-cardio', cycle: 'c-nutrition', swim: 'c-water', rowing: 'c-recovery', strength: 'c-strength',
};

function CardioSessionCard({ session }: { session: CardioSession }) {
  const navigate = useNavigate();
  const id = useId();
  const color = sportColor(session.sport);
  const distKm = session.distanceMeters / 1000;
  const duration = formatDuration(session.durationSeconds);
  const pace = session.durationSeconds > 0 && session.distanceMeters > 0
    ? session.durationSeconds / (session.distanceMeters / 1000) : 0;
  const heartRate = session.gpsTrack?.avgHeartRate;
  const elevationGain = session.gpsTrack?.elevationGain;

  return (
    <Surface as="section" className="tight">
      <input type="checkbox" id={id} className="exp-toggle" />
      <label htmlFor={id} className="exp-trigger column interactive">
        <Row justify="between">
          <Column gap={0}>
            <Text as="time" size="caption">{new Date(session.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            <Text as="p">{session.sport.charAt(0).toUpperCase() + session.sport.slice(1)}{session.notes ? ` — ${session.notes}` : ''}</Text>
          </Column>
          <Column gap={0}>
            <Text as="p" className={color}>{distKm.toFixed(1)}km</Text>
            <Text as="time" size="caption">{duration}</Text>
          </Column>
        </Row>
        <Row>
          {pace > 0 && (
            <Badge color={color !== 'strength' ? SPORT_TOKEN[color] : undefined}>{Math.floor(pace / 60)}:{String(Math.floor(pace % 60)).padStart(2, '0')}/km</Badge>
          )}
          {heartRate != null && <Badge color="c-strength" dot>♥ {Math.round(heartRate)}bpm</Badge>}
          {elevationGain != null && elevationGain > 0 && <Badge dot>↑ {Math.round(elevationGain)}m</Badge>}
        </Row>
      </label>
      <Column className="expandable">
        <DetailRow label="Distance" value={`${distKm.toFixed(2)} km`} />
        <DetailRow label="Duration" value={duration} />
        {heartRate != null && (
          <DetailRow label="Avg heart rate" value={`${Math.round(heartRate)} bpm`} />
        )}
        <Button variant="ghost" size="sm" onClick={(e) => {
          e.stopPropagation();
          navigate(`/sessions/${session.id}`);
        }}>📋 Details</Button>
      </Column>
    </Surface>
  );
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
          <Surface as="section" className="tight">
            <Grid variant="triple">
              <StatTile value={history.length} label="SESSIONS" />
              <StatTile value={totalSets} label="TOTAL SETS" />
              <StatTile value={prCount} label="PRS" />
            </Grid>
          </Surface>

          {Array.from(sessionsByType.entries()).map(([typeName, sessions]) => {
            const values = sessions.slice(-5).map((s) => s.totalSets);
            return (
              <Surface as="section" key={typeName} className="tight">
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
                    className="compact"
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
          <Surface as="section" key={sport} className="tight">
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
            <Alert key={i.id} variant={severityVariant(i.severity)} title={i.severity} message={i.message} />
          ))}
        </>
      )}
    </Grid>
  );
}
