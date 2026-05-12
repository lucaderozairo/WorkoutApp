import type { ChartType } from '../../ui/patterns/charts/charts'

export type MiniChartDef = {
  label: string
  chartType: ChartType
  data: { x: string; y: number }[]
  color?: string
  currentValue?: string
}

const D = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const W = ['W1', 'W2', 'W3', 'W4']

const d = (ys: number[]) => D.map((x, i) => ({ x, y: ys[i] }))
const w = (ys: number[]) => W.map((x, i) => ({ x, y: ys[i] }))

export const CATEGORY_MOCK_CHARTS: Record<string, MiniChartDef[]> = {
  'activity-mobility': [
    { label: 'Steps',    chartType: 'line', data: d([8200, 10500, 6800, 11200, 7400, 9800, 12000]), currentValue: '12,000 steps' },
    { label: 'Distance', chartType: 'line', data: d([6.2, 8.1, 5.0, 9.3, 5.5, 7.8, 10.2]),         currentValue: '10.2 km' },
    { label: 'Workouts', chartType: 'bar',  data: d([0, 1, 0, 1, 0, 1, 1]),                          currentValue: '4 / wk' },
    { label: 'VO₂ Max',  chartType: 'line', data: w([44, 45, 44, 46]),                               currentValue: '46 ml/kg/min' },
    { label: 'Daylight', chartType: 'line', data: d([45, 120, 30, 90, 60, 180, 150]),                currentValue: '150 min' },
  ],
  'body-measurements': [
    { label: 'Weight',    chartType: 'line', data: d([74.2, 74.0, 73.8, 74.1, 73.9, 83.7, 73.5]), currentValue: '73.5 kg' },
    { label: 'BMI',       chartType: 'line', data: d([22.8, 22.7, 22.6, 22.7, 22.6, 22.5, 22.4]), currentValue: '22.4' },
    { label: 'Body Fat',  chartType: 'line', data: d([20.1, 19.9, 19.8, 20.0, 19.7, 19.6, 19.5]), currentValue: '19.5%' },
  ],
  'injuries': [
    { label: 'Active',   chartType: 'bar', data: d([2, 2, 2, 1, 1, 1, 0]), currentValue: '0 active',   color: 'hsl(0,65%,55%)' },
    { label: 'Resolved', chartType: 'bar', data: d([0, 0, 0, 1, 1, 1, 2]), currentValue: '2 resolved', color: 'hsl(160,60%,50%)' },
  ],
  'routes': [
    { label: 'Saved Routes', chartType: 'bar', data: d([1, 1, 2, 2, 3, 5, 5]), currentValue: '5 routes' },
  ],
  'cycle-tracking': [
    { label: 'BBT',      chartType: 'line', data: d([36.4, 36.5, 36.3, 36.7, 36.8, 36.5, 36.4]), currentValue: '36.4°C' },
    { label: 'LH Surge', chartType: 'line', data: d([5, 6, 8, 15, 22, 18, 8]),                    currentValue: '8 mIU/mL', color: 'hsl(300,60%,60%)' },
  ],
  'heart': [
    { label: 'Heart Rate',    chartType: 'line', data: d([68, 75, 72, 80, 66, 77, 70]), currentValue: '70 bpm',  color: 'hsl(0,65%,55%)' },
    { label: 'Resting HR',    chartType: 'line', data: d([52, 50, 53, 51, 49, 54, 50]), currentValue: '50 bpm',  color: 'hsl(0,50%,65%)' },
    { label: 'HRV',           chartType: 'line', data: d([52, 48, 61, 55, 63, 44, 58]), currentValue: '58 ms',   color: 'hsl(200,65%,55%)' },
  ],
  'vitals': [
    { label: 'SpO₂',        chartType: 'line', data: d([98, 97, 98, 99, 97, 98, 98]), currentValue: '98%',      color: 'hsl(200,65%,55%)' },
    { label: 'Blood Press.', chartType: 'line', data: d([118, 121, 116, 120, 117, 119, 122]), currentValue: '119 mmHg' },
    { label: 'Glucose',      chartType: 'line', data: d([88, 95, 82, 101, 87, 93, 90]), currentValue: '90 mg/dL', color: 'hsl(40,70%,55%)' },
  ],
  'sleep': [
    { label: 'Duration', chartType: 'area', data: d([7.5, 6.8, 8.1, 7.2, 6.5, 8.8, 7.9]), currentValue: '7.9 h',  color: 'hsl(220,60%,55%)' },
    { label: 'Score',    chartType: 'line', data: d([78, 68, 85, 74, 62, 90, 81]),         currentValue: '81 / 100' },
  ],
  'nutrition': [
    { label: 'Calories',  chartType: 'bar',  data: d([2100, 1950, 2300, 1850, 2200, 2450, 2150]), currentValue: '2150 kcal', color: 'hsl(40,70%,55%)' },
    { label: 'Hydration', chartType: 'bar',  data: d([1.8, 2.1, 1.6, 2.4, 1.9, 2.6, 2.2]),       currentValue: '2.2 L',     color: 'hsl(200,65%,55%)' },
  ],
  'mental-wellbeing': [
    { label: 'Mindfulness', chartType: 'bar',  data: d([10, 0, 15, 20, 0, 30, 10]), currentValue: '10 min',  color: 'hsl(260,55%,60%)' },
    { label: 'Mood',        chartType: 'line', data: d([7, 6, 8, 7, 5, 9, 8]),       currentValue: '8 / 10',  color: 'hsl(160,60%,50%)' },
  ],
  'symptoms': [
    { label: 'Pain',    chartType: 'bar',  data: d([2, 3, 1, 2, 4, 1, 0]), currentValue: '0 / 10', color: 'hsl(0,65%,55%)' },
    { label: 'Fatigue', chartType: 'line', data: d([3, 4, 2, 5, 3, 2, 1]), currentValue: '1 / 10', color: 'hsl(40,70%,55%)' },
  ],
  'hearing': [
    { label: 'Env. Sound',  chartType: 'line', data: d([52, 65, 48, 58, 71, 45, 50]), currentValue: '50 dB',  color: 'hsl(160,60%,50%)' },
    { label: 'Headphones',  chartType: 'line', data: d([75, 68, 80, 72, 78, 65, 70]), currentValue: '70 dB',  color: 'hsl(40,70%,55%)' },
  ],
  'medications': [
    { label: 'Doses Taken', chartType: 'bar', data: d([1, 1, 0, 1, 1, 1, 1]), currentValue: '6 / 7 days', color: 'hsl(160,60%,50%)' },
  ],
  'health-records': [
    { label: 'Lab Events', chartType: 'bar', data: d([0, 0, 1, 0, 0, 0, 0]), currentValue: '1 this week' },
  ],
  'readiness': [
    { label: 'Readiness Score', chartType: 'line', data: d([82, 76, 88, 71, 85, 79, 83]), currentValue: '83 / 100', color: 'hsl(160,60%,50%)' },
  ],
  'body-battery': [
    { label: 'Body Battery', chartType: 'area', data: d([78, 65, 82, 70, 58, 85, 73]), currentValue: '73%', color: 'hsl(40,70%,55%)' },
  ],
  'stress': [
    { label: 'Stress Score', chartType: 'line', data: d([28, 45, 22, 38, 51, 19, 30]), currentValue: '30 / 100', color: 'hsl(0,65%,55%)' },
  ],
  'skin-temperature': [
    { label: 'Deviation', chartType: 'line', data: d([-1, 2, -3, 1, 4, -2, 0].map(v => v / 10)), currentValue: '0.0°C', color: 'hsl(200,65%,55%)' },
  ],
  'goals-records': [
    { label: 'PRs Set',       chartType: 'bar',  data: d([0, 0, 1, 0, 0, 2, 0]), currentValue: '3 total',    color: 'hsl(40,70%,55%)' },
    { label: 'Active Goals',  chartType: 'line', data: d([3, 3, 4, 4, 4, 3, 3]), currentValue: '3 active',   color: 'hsl(160,60%,50%)' },
  ],
}
