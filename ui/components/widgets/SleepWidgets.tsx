import { ScoreRing, SleepStagesBar, fmtMin, PositiveNegativeChart, SparklineArea } from '@ui/patterns/charts/domain-charts';
import type { PositiveNegativeEntry } from '@ui/patterns/charts/domain-charts';
import type { SleepSession } from '@features/readiness';
import { Row, Column, Cluster , Grid } from '@ui/layout';
import { Surface } from '@ui/atoms';

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
                <span className="caption">Last night</span>
                <span className="caption">{date}</span>
            </Row>
            <Row justify="between" align="center">
                <h2>{duration}</h2>
                <span className={`badge ${badge.color}`}>{badge.label}</span>
            </Row>
            <SleepStagesBar stages={session.stages} height={12} />
            <Cluster justify="between">
                <span className="badge deep">Deep {fmtMin(session.stages.deep)}</span>
                <span className="badge light">Light {fmtMin(session.stages.light)}</span>
                <span className="badge rem">REM {fmtMin(session.stages.rem)}</span>
                <span className="badge awake">Awake {fmtMin(session.stages.awake)}</span>
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

    const efficiency = Math.round(((totalMinutes - session.stages.awake) / totalMinutes) * 100);
    const bedtime = session.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const wakeTime = session.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = session.start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    const badge = scoreBadge(session.score);

    const trendData = weeklyTrend ?? [];

    return (
        <Surface><Column>
            <Row justify="between" align="center">
                <span className="caption">Last night</span>
                <span className="caption">{date}</span>
            </Row>

            <Row justify="between" align="center">
                <ScoreRing
                    score={session.score}
                    color="var(--color-sleep-deep)"
                    subtitle="score"
                    size={88}
                />
                <Column gap={1} align="end">
                    <h2>{duration}</h2>
                    <span className="caption">goal {fmtMin(goalMinutes)} · {debtLabel}</span>
                    <Row>
                        <span className={`badge ${badge.color}`}>{badge.label}</span>
                    </Row>
                </Column>
            </Row>

            <SleepStagesBar stages={session.stages} height={16} />

            <Grid variant="double" gap={3}>
                <Column gap={1} align="center">
                    <span className="detail">{fmtMin(session.stages.deep)}</span>
                    <span className="badge deep">Deep</span>
                </Column>
                <Column gap={1} align="center">
                    <span className="detail">{fmtMin(session.stages.light)}</span>
                    <span className="badge light">Light</span>
                </Column>
                <Column gap={1} align="center">
                    <span className="detail">{fmtMin(session.stages.rem)}</span>
                    <span className="badge rem">REM</span>
                </Column>
                <Column gap={1} align="center">
                    <span className="detail">{fmtMin(session.stages.awake)}</span>
                    <span className="badge awake">Awake</span>
                </Column>
            </Grid>

            <hr />

            {scoreHistory && scoreHistory.length > 1 && (
                <Column>
                    <span className="caption">Score trend</span>
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

            <hr />

            {/* {weekSessions.length > 0 && (<SleepWeekHistory sleepWeekHistory={weekSessions} />
            )} */}

            {trendData && trendData.length > 0 && (
                <Column gap={1} align="center">
                    <span className="caption">Weekly trend</span>
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
            <p className='detail'>History</p>
            {/* 7-day sleep history */}
            {sleepWeekHistory.map((sess, index) => {
                const dayName = sess.start.toLocaleDateString(undefined, { weekday: 'short' });
                const sessTotalMin = Math.floor((sess.end.getTime() - sess.start.getTime()) / 60000);
                const sessEfficiency = Math.round(((sessTotalMin - sess.stages.awake) / sessTotalMin) * 100);
                const sessBedtime = sess.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const sessWakeTime = sess.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                    <Row key={index} justify="between" align="center" gap={1}>
                        <Column gap={1} align="center">
                            <span className="caption">Day</span>
                            <span className="caption">{dayName}</span>
                        </Column>
                        <Column gap={1} align="center">
                            <span className="caption">Bedtime</span>
                            <span className="caption">{sessBedtime}</span>
                        </Column>
                        <Column gap={1} align="center">
                            <span className="caption">Wake up</span>
                            <span className="caption">{sessWakeTime}</span>
                        </Column>
                        <Column gap={1} align="center">
                            <span className="caption">Efficiency</span>
                            <span className="caption">{sessEfficiency}%</span>
                        </Column>
                        <Column gap={1} align="center">
                            <span className="caption">Score</span>
                            <span className="caption">{sess.score}%</span>
                        </Column>
                    </Row>
                );
            })}
        </Column></Surface>
    );

}
