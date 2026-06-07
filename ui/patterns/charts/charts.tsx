import {
    BarChart, Bar,
    LineChart, Line,
    AreaChart, Area,
    ComposedChart,
    PieChart, Pie,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    RadialBarChart, RadialBar,
    ScatterChart, Scatter, ZAxis,
    Brush, ReferenceLine,
    CartesianGrid, Tooltip, Rectangle, LabelList,
    ResponsiveContainer, XAxis, YAxis,
} from 'recharts';

/** A single chart row. Shapes vary per chart type (x/y, a/b/c, subject/value, …),
 *  so keys are open but values stay primitive — no `any`. */
export type ChartDatum = Record<string, number | string | undefined>;

// Note: recharts' custom `shape`/`content`/`activeBar` renderers are typed by the
// library against precise internal prop types (ActiveShape<BarShapeProps>,
// LabelContentType). Those callbacks keep `any` params — narrowing them fights
// recharts' generics for no real safety gain (they only render presentational SVG).

type TimelineOutcome = 'success' | 'error' | 'pending';
type TimelineItem = { name: string; outcome: TimelineOutcome; firstCycle: [number, number]; secondCycle: [number, number] };

const timelineColor = (outcome: TimelineOutcome) =>
    outcome === 'success' ? 'hsl(160,60%,50%)' : outcome === 'error' ? 'hsl(0,65%,55%)' : 'hsl(220,15%,55%)';

const GanttBar = (props: any) => <Rectangle {...props} fill={timelineColor(props.outcome)} radius={4} />;
const GanttBarActive = (props: any) => <Rectangle {...props} fill={timelineColor(props.outcome)} radius={4} stroke="var(--accent)" strokeWidth={2} />;

// Canonical definition lives in shared/contracts; imported for local use and
// re-exported so existing `@ui/patterns/charts/charts` consumers keep working.
import type { ChartType } from '@shared/contracts';
export type { ChartType };

export function ChartContainer({
    data,
    height = 100,
    chartType = 'line',
    color = 'var(--accent)',
    axisShow = { x: true, y: true },
    fill = false,
}: {
    data?: ChartDatum[];
    height?: number;
    chartType?: ChartType;
    color?: string;
    axisShow?: { x: boolean; y: boolean };
    fill?: boolean;
}) {
    return (
        <>
            {
                fill ? (
                    <ResponsiveContainer width="100%" height={"100%"}>
                        <ChartSelector chartType={chartType} data={data} color={color} axisShow={axisShow} />
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height={height}>
                        <ChartSelector chartType={chartType} data={data} color={color} axisShow={axisShow} />
                    </ResponsiveContainer>)
            }
        </>
    );
}

function ChartSelector({ chartType, data, color, axisShow }: {
    chartType: ChartType;
    data: ChartDatum[] | undefined;
    color: string;
    axisShow: { x: boolean; y: boolean };
}) {
    const xy = data ?? [];
    const tick = { fontSize: 'var(--t-xs)' };
    const margin = (axisShow.x || axisShow.y)
        ? { top: 5, right: 5, bottom: 5, left: 0 }
        : { top: 2, right: 2, bottom: 2, left: 0 };

    switch (chartType) {

        case 'bar':
            return (
                <BarChart data={xy} margin={margin}>
                    <Bar dataKey="y" fill={color} />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </BarChart>
            );

        case 'sets-bar': {
            const maxVal = Math.max(...xy.map(d => Number(d.y)), 0);
            const step = maxVal < 50 ? 5 : maxVal < 100 ? 10 : 25;
            const yMax = Math.max(step, Math.ceil(maxVal / step) * step);
            const ticks = Array.from({ length: Math.floor(yMax / step) + 1 }, (_, i) => i * step);
            return (
                <BarChart data={xy} margin={{ top: 34, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
                    <Bar dataKey="y" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                        <LabelList
                            dataKey="reps"
                            position="top"
                            offset={5}
                            content={(props: any) => {
                                const entry = xy[props.index];
                                if (!entry) return null;
                                return (<>
                                    <text x={props.x + props.width / 2} y={props.y - 13} textAnchor="middle" fontSize="var(--t-xs)" fill="var(--ink-faint)">
                                        {entry.y} kg
                                    </text>
                                    <text x={props.x + props.width / 2} y={props.y - 1} textAnchor="middle" fontSize="var(--t-xs)" fill="var(--ink-faint)">
                                        x {entry.reps}
                                    </text>
                                </>
                                );
                            }}
                        />
                    </Bar>
                    {axisShow.x && <XAxis height={20} dataKey="x" tick={tick} tickLine={false} axisLine={false} />}
                    {axisShow.y && <YAxis width={30} tick={tick} ticks={ticks} domain={[0, yMax]} />}
                    <Tooltip
                        contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', fontSize: 'var(--t-xs)' }}
                        formatter={(value, _name, props) => [`${value} kg × ${(props.payload as ChartDatum).reps} reps`]}
                    />
                </BarChart>
            );
        }

        case 'line':
            return (
                <LineChart data={xy} margin={margin}>
                    <Line type="monotone" dataKey="y" stroke={color} dot={false} />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </LineChart>
            );

        case 'area':
            return (
                <AreaChart data={xy} margin={margin}>
                    <Area type="monotone" dataKey="y" stroke={color} fill={color} fillOpacity={0.2} />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </AreaChart>
            );

        case 'composed':
            return (
                <ComposedChart data={xy} margin={margin}>
                    <Area type="monotone" dataKey="y" stroke={color} fill={color} fillOpacity={0.15} />
                    <Bar dataKey="y" fill={color} fillOpacity={0.6} />
                    <Line type="monotone" dataKey="y" stroke={color} dot={false} />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </ComposedChart>
            );

        case 'pie': {
            const pd = (data ?? []).map((d, i) => ({ ...d, fill: `hsl(${i * 40}, 60%, 55%)` }));
            return (
                <PieChart margin={margin}>
                    <Pie data={pd} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" />
                </PieChart>
            );
        }

        case 'radar':
            return (
                <RadarChart data={data ?? []} cx="50%" cy="50%" outerRadius="70%" margin={margin}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
                </RadarChart>
            );

        case 'radialbar':
            return (
                <RadialBarChart data={data ?? []} cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" margin={margin}>
                    <RadialBar dataKey="value" />
                </RadialBarChart>
            );

        case 'scatter':
            return (
                <ScatterChart margin={margin}>
                    <XAxis dataKey="x" type="number" tick={tick} />
                    <YAxis width={40} dataKey="y" type="number" tick={tick} tickCount={5} />
                    <ZAxis dataKey="z" range={[40, 200]} />
                    <Scatter data={data ?? []} fill={color} />
                </ScatterChart>
            );

        case 'stacked-bar':
            return (
                <BarChart data={data ?? []} margin={margin}>
                    <Bar dataKey="a" stackId="s" fill="hsl(220,60%,55%)" />
                    <Bar dataKey="b" stackId="s" fill="hsl(160,60%,50%)" />
                    <Bar dataKey="c" stackId="s" fill="hsl(40,70%,55%)" />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </BarChart>
            );

        case 'percent-area':
            return (
                <AreaChart data={data ?? []} stackOffset="expand" margin={margin}>
                    <Area type="monotone" dataKey="a" stackId="s" stroke="hsl(220,60%,55%)" fill="hsl(220,60%,55%)" />
                    <Area type="monotone" dataKey="b" stackId="s" stroke="hsl(160,60%,50%)" fill="hsl(160,60%,50%)" />
                    <Area type="monotone" dataKey="c" stackId="s" stroke="hsl(40,70%,55%)" fill="hsl(40,70%,55%)" />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tickFormatter={v => `${Math.round(+v * 100)}%`} tick={tick} tickCount={5} />}
                </AreaChart>
            );

        case 'area-fill-value': {
            const good = 'hsl(160,60%,50%)';
            const bad = 'hsl(0,65%,55%)';
            return (
                <AreaChart data={data ?? []} margin={margin}>
                    <defs>
                        <linearGradient id="fillByValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={good} stopOpacity={0.4} />
                            <stop offset="65%" stopColor={good} stopOpacity={0.1} />
                            <stop offset="65%" stopColor={bad} stopOpacity={0.1} />
                            <stop offset="100%" stopColor={bad} stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="strokeByValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="65%" stopColor={good} />
                            <stop offset="65%" stopColor={bad} />
                        </linearGradient>
                    </defs>
                    <ReferenceLine y={0} stroke="var(--line-strong)" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="y" stroke="url(#strokeByValue)" fill="url(#fillByValue)" dot={false} />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </AreaChart>
            );
        }

        case 'positive-negative':
            return (
                <BarChart data={data ?? []} margin={margin}>
                    <ReferenceLine y={0} stroke="var(--line-strong)" />
                    <Bar dataKey="y" shape={(props: any) => {
                        const { x, y, width, height, value } = props;
                        const h = Math.abs(height);
                        const top = height < 0 ? y + height : y;
                        return <rect x={x} y={top} width={width} height={h} fill={value >= 0 ? 'hsl(160,60%,50%)' : 'hsl(0,65%,55%)'} rx={2} />;
                    }} />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} domain={['auto', 'auto']} tick={tick} tickCount={5} />}
                </BarChart>
            );

        case 'brush-bar':
            return (
                <BarChart data={xy} margin={margin}>
                    <Bar dataKey="y" fill={color} />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                    <Brush dataKey="x" stroke="var(--line-mid)" />
                </BarChart>
            );

        case 'timeline': {
            const td = (data ?? []) as unknown as TimelineItem[];
            return (
                <BarChart layout="vertical" data={td} margin={margin}>
                    <CartesianGrid strokeDasharray="2 2" horizontal={false} />
                    <Tooltip shared={false} />
                    <XAxis type="number" dataKey={undefined} domain={[0, 20]} tickCount={5} label={{ value: 'Time (s)', position: 'insideBottomRight', style: { fontSize: 'var(--t-xs)' } }} tick={tick} />
                    <YAxis width={40} type="category" dataKey="name" tick={tick} />
                    <Bar dataKey="firstCycle" stackId="t" shape={GanttBar} activeBar={GanttBarActive} />
                    <Bar dataKey="secondCycle" stackId="t" shape={GanttBar} activeBar={GanttBarActive} />
                </BarChart>
            );
        }

        case 'waterfall': {
            const wf = data ?? [];
            return (
                <BarChart data={wf} margin={margin}>
                    <Bar dataKey="base" stackId="w" fill="transparent" />
                    <Bar dataKey="value" stackId="w" shape={(props: any) => {
                        const { x, y, width, height, index } = props;
                        const item = wf[index];
                        const fill = Number(item?.raw) >= 0 ? 'hsl(160,60%,50%)' : 'hsl(0,65%,55%)';
                        return <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />;
                    }} />
                    {axisShow.x && <XAxis dataKey="name" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </BarChart>
            );
        }

        case 'banded':
            return (
                <ComposedChart data={data ?? []} margin={margin}>
                    <Area type="monotone" dataKey="lower" stackId="b" stroke="none" fill="transparent" legendType="none" />
                    <Area type="monotone" dataKey="delta" stackId="b" stroke="none" fill={color} fillOpacity={0.15} legendType="none" />
                    <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={false} />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </ComposedChart>
            );
    }
}

export default ChartContainer;
