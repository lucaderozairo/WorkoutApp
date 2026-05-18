import { ScoreRing, SleepStagesBar, fmtMin, PositiveNegativeChart, SparklineArea } from '../shared/Charts';
import type { PositiveNegativeEntry } from '../shared/Charts';
import type { SleepSession } from '@features/readiness';

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
        <div className="surface column">
            <div className="row space-between align-center">
                <span className="caption">Last night</span>
                <span className="caption">{date}</span>
            </div>
            <div className="row space-between align-center">
                <h2>{duration}</h2>
                <span className={`badge ${badge.color}`}>{badge.label}</span>
            </div>
            <SleepStagesBar stages={session.stages} height={12} />
            <div className="cluster space-between">
                <span className="pill deep">Deep {fmtMin(session.stages.deep)}</span>
                <span className="pill light">Light {fmtMin(session.stages.light)}</span>
                <span className="pill rem">REM {fmtMin(session.stages.rem)}</span>
                <span className="pill awake">Awake {fmtMin(session.stages.awake)}</span>
            </div>
        </div>
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
        <div className="surface column">
            <div className="row space-between align-center">
                <span className="caption">Last night</span>
                <span className="caption">{date}</span>
            </div>

            <div className="row align-center space-between">
                <ScoreRing
                    score={session.score}
                    color="var(--color-sleep-deep)"
                    subtitle="score"
                    size={88}
                />
                <div className="column compact align-right">
                    <h2>{duration}</h2>
                    <span className="caption">goal {fmtMin(goalMinutes)} · {debtLabel}</span>
                    <div className="row">
                        <span className={`badge ${badge.color}`}>{badge.label}</span>
                    </div>
                </div>
            </div>

            <SleepStagesBar stages={session.stages} height={16} />

            <div className="space-between grid">
                <div className="column compact align-center">
                    <span className="detail">{fmtMin(session.stages.deep)}</span>
                    <span className="pill deep">Deep</span>
                </div>
                <div className="column compact align-center">
                    <span className="detail">{fmtMin(session.stages.light)}</span>
                    <span className="pill light">Light</span>
                </div>
                <div className="column compact align-center">
                    <span className="detail">{fmtMin(session.stages.rem)}</span>
                    <span className="pill rem">REM</span>
                </div>
                <div className="column compact align-center">
                    <span className="detail">{fmtMin(session.stages.awake)}</span>
                    <span className="pill awake">Awake</span>
                </div>
            </div>

            <hr />

            {scoreHistory && scoreHistory.length > 1 && (
                <div className="column ">
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
                </div>
            )}

            <hr />

            {/* {weekSessions.length > 0 && (<SleepWeekHistory sleepWeekHistory={weekSessions} />
            )} */}

            {trendData && trendData.length > 0 && (
                <div className="column compact align-center">
                    <span className="caption">Weekly trend</span>
                    <PositiveNegativeChart
                        data={trendData}
                        baselineLabel={`${Math.floor(goalMinutes / 60)}h`}
                    />
                </div>
            )}


        </div>
    );
}


export function SleepWeekHistory({ sleepWeekHistory }: { sleepWeekHistory: SleepSession[] }) {

    return (
        <div className="surface">
            <p className='detail'>History</p>
            {/* 7-day sleep history */}
            {sleepWeekHistory.map((sess, index) => {
                const dayName = sess.start.toLocaleDateString(undefined, { weekday: 'short' });
                const sessTotalMin = Math.floor((sess.end.getTime() - sess.start.getTime()) / 60000);
                const sessEfficiency = Math.round(((sessTotalMin - sess.stages.awake) / sessTotalMin) * 100);
                const sessBedtime = sess.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const sessWakeTime = sess.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                    <div key={index} className="compact row space-between align-center">
                        <div className="column compact align-center">
                            <span className="caption">Day</span>
                            <span className="caption">{dayName}</span>
                        </div>
                        <div className="column compact align-center">
                            <span className="caption">Bedtime</span>
                            <span className="caption">{sessBedtime}</span>
                        </div>
                        <div className="column compact align-center">
                            <span className="caption">Wake up</span>
                            <span className="caption">{sessWakeTime}</span>
                        </div>
                        <div className="column compact align-center">
                            <span className="caption">Efficiency</span>
                            <span className="caption">{sessEfficiency}%</span>
                        </div>
                        <div className="column compact align-center">
                            <span className="caption">Score</span>
                            <span className="caption">{sess.score}%</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );

}
