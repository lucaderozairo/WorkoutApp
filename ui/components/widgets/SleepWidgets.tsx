import { ScoreRing, SleepStagesBar, fmtMin, PositiveNegativeChart, SparklineArea } from '@ui/patterns/charts/domain-charts';
import type { PositiveNegativeEntry } from '@ui/patterns/charts/domain-charts';
import type { SleepSession } from '@features/readiness';
import { Row, Column, Cluster, Grid } from '@ui/layout';
import { Surface, Text, Divider } from '@ui/atoms';
import { Badge } from '@ui/molecules';

function scoreBadge(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Good', color: 'green' };
  if (score >= 65) return { label: 'OK', color: 'amber' };
  return { label: 'Poor', color: 'coral' };
}

// ─── sm ──────────────────────────────────────────────────────────────────

export function SleepSmall({ session }: { session: SleepSession }) {
  const totalMinutes = Math.floor((session.end.getTime() - session.start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = `${hours}h ${minutes}m`;
  const date = session.start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const badge = scoreBadge(session.score);

  return (
    <Surface><Column>
      <Row justify="between" align="center">
        <Text size="caption">Last night</Text>
        <Text size="caption">{date}</Text>
      </Row>
      <Row justify="between" align="center">
        <Text as="h2">{duration}</Text>
        <Badge className={badge.color}>{badge.label}</Badge>
      </Row>
      <SleepStagesBar stages={session.stages} height={12} />
      <Cluster justify="between">
        <Badge className="deep">Deep {fmtMin(session.stages.deep)}</Badge>
        <Badge className="light">Light {fmtMin(session.stages.light)}</Badge>
        <Badge className="rem">REM {fmtMin(session.stages.rem)}</Badge>
        <Badge className="awake">Awake {fmtMin(session.stages.awake)}</Badge>
      </Cluster>
    </Column></Surface>
  );
}

// ─── Large ──────────────────────────────────────────────────────────────────

export function SleepLarge({
  session,
  goalMinutes = 480,
  weeklyTrend,
  scoreHistory,
}: {
  session: SleepSession;
  goalMinutes?: number;
  weeklyTrend?: PositiveNegativeEntry[];
  scoreHistory?: Array<{ x: string; y: number }>;
}) {
  const totalMinutes = Math.floor((session.end.getTime() - session.start.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = `${hours}h ${minutes}m`;

  const debtMinutes = goalMinutes - totalMinutes;
  const debtLabel = debtMinutes > 0
    ? `−${fmtMin(debtMinutes)} debt`
    : `+${fmtMin(Math.abs(debtMinutes))} surplus`;

  const date = session.start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const badge = scoreBadge(session.score);

  const trendData = weeklyTrend ?? [];

  return (
    <Surface><Column>
      <Row justify="between" align="center">
        <Text size="caption">Last night</Text>
        <Text size="caption">{date}</Text>
      </Row>

      <Row justify="between" align="center">
        <ScoreRing
          score={session.score}
          color="var(--color-sleep-deep)"
          subtitle="score"
          size={88}
        />
        <Column gap={1} align="end">
          <Text as="h2">{duration}</Text>
          <Text size="caption">goal {fmtMin(goalMinutes)} · {debtLabel}</Text>
          <Row>
            <Badge className={badge.color}>{badge.label}</Badge>
          </Row>
        </Column>
      </Row>

      <SleepStagesBar stages={session.stages} height={16} />

      <Grid variant="double" gap={3}>
        <Column gap={1} align="center">
          <Text size="detail">{fmtMin(session.stages.deep)}</Text>
          <Badge className="deep">Deep</Badge>
        </Column>
        <Column gap={1} align="center">
          <Text size="detail">{fmtMin(session.stages.light)}</Text>
          <Badge className="light">Light</Badge>
        </Column>
        <Column gap={1} align="center">
          <Text size="detail">{fmtMin(session.stages.rem)}</Text>
          <Badge className="rem">REM</Badge>
        </Column>
        <Column gap={1} align="center">
          <Text size="detail">{fmtMin(session.stages.awake)}</Text>
          <Badge className="awake">Awake</Badge>
        </Column>
      </Grid>

      <Divider />

      {scoreHistory && scoreHistory.length > 1 && (
        <Column>
          <Text size="caption">Score trend</Text>
          <SparklineArea
            data={scoreHistory}
            color="var(--color-primary)"
            height={150}
            id="sleep-score"
            yDomain={[0, 100]}
            showXAxis
            showYAxis
            showTooltip
            tooltipFormatter={(v) => `${v}`}
          />
        </Column>
      )}

      <Divider />

      {trendData && trendData.length > 0 && (
        <Column gap={1} align="center">
          <Text size="caption">Weekly trend</Text>
          <PositiveNegativeChart
            data={trendData}
            baselineLabel={`${Math.floor(goalMinutes / 60)}h`}
          />
        </Column>
      )}
    </Column></Surface>
  );
}

export function SleepWeekHistory({ sleepWeekHistory }: { sleepWeekHistory: SleepSession[] }) {
  return (
    <Surface><Column>
      <Text size="detail">History</Text>
      {sleepWeekHistory.map((sess, index) => {
        const dayName = sess.start.toLocaleDateString(undefined, { weekday: 'short' });
        const sessTotalMin = Math.floor((sess.end.getTime() - sess.start.getTime()) / 60000);
        const sessEfficiency = Math.round(((sessTotalMin - sess.stages.awake) / sessTotalMin) * 100);
        const sessBedtime = sess.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sessWakeTime = sess.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <Row key={index} justify="between" align="center" gap={1}>
            <Column gap={1} align="center">
              <Text size="caption">Day</Text>
              <Text size="caption">{dayName}</Text>
            </Column>
            <Column gap={1} align="center">
              <Text size="caption">Bedtime</Text>
              <Text size="caption">{sessBedtime}</Text>
            </Column>
            <Column gap={1} align="center">
              <Text size="caption">Wake up</Text>
              <Text size="caption">{sessWakeTime}</Text>
            </Column>
            <Column gap={1} align="center">
              <Text size="caption">Efficiency</Text>
              <Text size="caption">{sessEfficiency}%</Text>
            </Column>
            <Column gap={1} align="center">
              <Text size="caption">Score</Text>
              <Text size="caption">{sess.score}%</Text>
            </Column>
          </Row>
        );
      })}
    </Column></Surface>
  );
}
