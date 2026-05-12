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
    CartesianGrid, Tooltip, Rectangle,
    ResponsiveContainer, XAxis, YAxis,
} from 'recharts';

// #region Sample data
const chartData = [
    { name: 'Page A', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'Page C', uv: 2000, pv: 9800, amt: 2290 },
    { name: 'Page D', uv: 2780, pv: 3908, amt: 2000 },
    { name: 'Page E', uv: 1890, pv: 4800, amt: 2181 },
    { name: 'Page F', uv: 2390, pv: 3800, amt: 2500 },
    { name: 'Page G', uv: 3490, pv: 4300, amt: 2100 },
];

const defaultData = chartData.map(d => ({ x: d.name, y: d.uv }));
const bandedData = chartData.map(d => ({ x: d.name, y: d.uv, lower: Math.round(d.uv * 0.75), delta: Math.round(d.uv * 0.5) }));
const stackedData = chartData.map(d => ({ x: d.name, a: d.uv, b: d.pv, c: d.amt }));
const pieData = chartData.map(d => ({ name: d.name, value: d.uv }));
const scatterData = chartData.map(d => ({ x: d.uv, y: d.pv, z: d.amt }));
const radarData = chartData.map(d => ({ subject: d.name, value: d.uv }));
const radialData = chartData.map((d, i) => ({ name: d.name, value: d.uv, fill: `hsl(${i * 40}, 60%, 55%)` }));
const posNegData = [
    { x: 'Mon', y: 1200 }, { x: 'Tue', y: -800 }, { x: 'Wed', y: 600 },
    { x: 'Thu', y: -400 }, { x: 'Fri', y: 900 }, { x: 'Sat', y: -200 },
    { x: 'Sun', y: 1500 },
];
type TimelineOutcome = 'success' | 'error' | 'pending';
type TimelineItem = { name: string; outcome: TimelineOutcome; firstCycle: [number, number]; secondCycle: [number, number] };

const timelineData: TimelineItem[] = [
    { name: 'TEST 1', outcome: 'success', firstCycle: [0, 3], secondCycle: [4.11, 14.11] },
    { name: 'TEST 2', outcome: 'error', firstCycle: [0, 1.5], secondCycle: [9.11, 12.11] },
    { name: 'TEST 3', outcome: 'success', firstCycle: [3, 5.37], secondCycle: [8.74, 14.48] },
    { name: 'TEST 4', outcome: 'error', firstCycle: [5.37, 7.87], secondCycle: [9.61, 16.98] },
    { name: 'TEST 5', outcome: 'success', firstCycle: [4.87, 8.24], secondCycle: [10.74, 17.35] },
    { name: 'TEST 6', outcome: 'success', firstCycle: [3.24, 5.74], secondCycle: [8.61, 17.85] },
    { name: 'TEST 7', outcome: 'success', firstCycle: [2.74, 9.11], secondCycle: [9.74, 18.22] },
    { name: 'TEST 8', outcome: 'pending', firstCycle: [9.11, 10.61], secondCycle: [12.11, 19.72] },
];

const timelineColor = (outcome: TimelineOutcome) =>
    outcome === 'success' ? 'hsl(160,60%,50%)' : outcome === 'error' ? 'hsl(0,65%,55%)' : 'hsl(220,15%,55%)';

function buildWaterfallData(items: { name: string; value: number }[]) {
    let running = 0;
    return items.map(item => {
        const base = item.value >= 0 ? running : running + item.value;
        const abs = Math.abs(item.value);
        running += item.value;
        return { name: item.name, base, value: abs, raw: item.value };
    });
}
const waterfallData = buildWaterfallData([
    { name: 'Start', value: 1000 },
    { name: 'Sales', value: 500 },
    { name: 'Refund', value: -200 },
    { name: 'Expense', value: -300 },
    { name: 'Bonus', value: 150 },
    { name: 'Total', value: 0 },
]);
// #endregion

export type ChartType =
    | 'bar' | 'line' | 'area' | 'composed'
    | 'pie' | 'radar' | 'radialbar' | 'scatter'
    | 'stacked-bar' | 'percent-area' | 'area-fill-value'
    | 'positive-negative' | 'brush-bar' | 'timeline'
    | 'waterfall' | 'banded';

export function ChartContainer({
    data,
    height = 100,
    chartType = 'line',
    color = 'var(--accent)',
    axisShow = { x: true, y: true },
    fill = false,
}: {
    data?: any[];
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
    data: any[] | undefined;
    color: string;
    axisShow: { x: boolean; y: boolean };
}) {
    const xy = data ?? defaultData;
    const tick = { fontSize: 'var(--t-xs)' };
    const margin = (axisShow.x || axisShow.y)
        ? { top: 5, right: 5, bottom: 5, left: 0 }
        : { top: 2, right: 2, bottom: 2, left: 0 };

    switch (chartType) {

        // ── existing ────────────────────────────────────────────────────────

        case 'bar':
            return (
                <BarChart data={xy} margin={margin}>
                    <Bar dataKey="y" fill={color} />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </BarChart>
            );

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
            const pd = (data ?? pieData).map((d, i) => ({ ...d, fill: `hsl(${i * 40}, 60%, 55%)` }));
            return (
                <PieChart margin={margin}>
                    <Pie data={pd} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" />
                </PieChart>
            );
        }

        case 'radar':
            return (
                <RadarChart data={data ?? radarData} cx="50%" cy="50%" outerRadius="70%" margin={margin}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
                </RadarChart>
            );

        case 'radialbar':
            return (
                <RadialBarChart data={data ?? radialData} cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" margin={margin}>
                    <RadialBar dataKey="value" />
                </RadialBarChart>
            );

        case 'scatter':
            return (
                <ScatterChart margin={margin}>
                    <XAxis dataKey="x" type="number" tick={tick} />
                    <YAxis width={40} dataKey="y" type="number" tick={tick} tickCount={5} />
                    <ZAxis dataKey="z" range={[40, 200]} />
                    <Scatter data={data ?? scatterData} fill={color} />
                </ScatterChart>
            );

        // ── new ─────────────────────────────────────────────────────────────

        case 'stacked-bar':
            return (
                <BarChart data={data ?? stackedData} margin={margin}>
                    <Bar dataKey="a" stackId="s" fill="hsl(220,60%,55%)" />
                    <Bar dataKey="b" stackId="s" fill="hsl(160,60%,50%)" />
                    <Bar dataKey="c" stackId="s" fill="hsl(40,70%,55%)" />
                    {axisShow.x && <XAxis dataKey="x" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </BarChart>
            );

        case 'percent-area':
            return (
                <AreaChart data={data ?? stackedData} stackOffset="expand" margin={margin}>
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
                <AreaChart data={data ?? posNegData} margin={margin}>
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
                <BarChart data={data ?? posNegData} margin={margin}>
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
            const td = (data ?? timelineData) as TimelineItem[];
            const GanttBar = (props: any) => <Rectangle {...props} fill={timelineColor(props.outcome)} radius={4} />;
            const GanttBarActive = (props: any) => <Rectangle {...props} fill={timelineColor(props.outcome)} radius={4} stroke="var(--accent)" strokeWidth={2} />;
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
            const wf = data ?? waterfallData;
            return (
                <BarChart data={wf} margin={margin}>
                    <Bar dataKey="base" stackId="w" fill="transparent" />
                    <Bar dataKey="value" stackId="w" shape={(props: any) => {
                        const { x, y, width, height, index } = props;
                        const item = wf[index];
                        const fill = item.raw >= 0 ? 'hsl(160,60%,50%)' : 'hsl(0,65%,55%)';
                        return <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />;
                    }} />
                    {axisShow.x && <XAxis dataKey="name" tick={tick} />}
                    {axisShow.y && <YAxis width={40} tick={tick} tickCount={5} />}
                </BarChart>
            );
        }

        case 'banded':
            return (
                <ComposedChart data={data ?? bandedData} margin={margin}>
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
