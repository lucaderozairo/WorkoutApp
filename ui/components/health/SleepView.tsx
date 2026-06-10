import { useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { handleImportSleepFromCSV, handleLogSleep, parseGarminSleepYearCSV } from '@features/readiness';
import type { SleepEntryView, WeeklySleepTrend } from '@features/readiness';
import type { Id } from '@shared/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { HealthChartsList } from './HealthChartsList';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface, Text, Chip } from '@ui/atoms';

const USER_ID = 'user-001' as Id<'User'>;

function fmtMin(min: number | null): string {
  if (min === null) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function SleepView() {
  const sleepEntries = (useQuery<SleepEntryView[]>('sleep_history') ?? []) as SleepEntryView[];
  const { dispatch: dispatchImportSleepFromCSV } = useCommand(handleImportSleepFromCSV);
  const { dispatch: dispatchLogSleep } = useCommand(handleLogSleep);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklySleepTrend[]>([]);
  const [slSleep, setSlSleep] = useState('');
  const [slEnergy, setSlEnergy] = useState('');
  const [slSoreness, setSlSoreness] = useState('');
  const [slMood, setSlMood] = useState('');

  const handleLog = () => {
    const sq = parseInt(slSleep, 10);
    const en = parseInt(slEnergy, 10);
    const so = parseInt(slSoreness, 10);
    const md = parseInt(slMood, 10);
    if (![sq, en, so, md].some(v => isNaN(v) || v < 1 || v > 10)) {
      dispatchLogSleep({ type: 'LogSleep', userId: USER_ID, sleepQuality: sq, energy: en, soreness: so, mood: md });
      setSlSleep(''); setSlEnergy(''); setSlSoreness(''); setSlMood('');
    }
  };

  return (
    <Column>
      <HealthChartsList slug="sleep" height={100} />

      <Surface>
        <header className="row between">
          <h3>Sleep</h3>
          <div className="row">
            <label className="secondary small">
              Import Day CSV
              <input
                type="file"
                accept=".csv"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    dispatchImportSleepFromCSV({ type: 'ImportSleepFromCSV', userId: USER_ID, csvText: reader.result as string });
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
            <label className="secondary small">
              Import Year Trend
              <input
                type="file"
                accept=".csv"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setWeeklyTrend(parseGarminSleepYearCSV(reader.result as string));
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </header>

        {sleepEntries.length > 0 ? (
          <>
            {sleepEntries[0].source !== 'manual' && (
              <div className="column">
                <span className="label">GARMIN MEASURED</span>
                <div className="row between">
                  <div>
                    <p className="value">{sleepEntries[0].sleepScore ?? '—'}</p>
                    <span className="caption">{sleepEntries[0].quality ?? '—'}</span>
                  </div>
                  <div className="row">
                    <span className="pill">Deep {fmtMin(sleepEntries[0].deepMin)}</span>
                    <span className="pill">Light {fmtMin(sleepEntries[0].lightMin)}</span>
                    <span className="pill">REM {fmtMin(sleepEntries[0].remMin)}</span>
                    <span className="pill">Awake {fmtMin(sleepEntries[0].awakeMin)}</span>
                  </div>
                </div>
                <div className="row-natural">
                  {sleepEntries[0].hrv !== null && <span className="pill">HRV {sleepEntries[0].hrv}ms</span>}
                  {sleepEntries[0].restingHr !== null && <span className="pill">RHR {sleepEntries[0].restingHr}bpm</span>}
                  {sleepEntries[0].overnightHr !== null && <span className="pill">Overnight HR {sleepEntries[0].overnightHr}bpm</span>}
                  {sleepEntries[0].respiration !== null && <span className="pill">Resp {sleepEntries[0].respiration}brpm</span>}
                  {sleepEntries[0].bodyBatteryChange !== null && (
                    <span className="pill">Body Battery {sleepEntries[0].bodyBatteryChange > 0 ? '+' : ''}{sleepEntries[0].bodyBatteryChange}</span>
                  )}
                  {sleepEntries[0].stressAvg !== null && <span className="pill">Stress {sleepEntries[0].stressAvg}</span>}
                  {sleepEntries[0].restlessMoments !== null && <span className="pill">Restless {sleepEntries[0].restlessMoments}</span>}
                </div>
              </div>
            )}

            <div className="column">
              <span className="label">SUBJECTIVE</span>
              <div className="row">
                <span className="caption">Sleep</span>
                <span className="value">{sleepEntries[0].sleepQuality ?? '—'}</span>
                <span className="caption">Energy</span>
                <span className="value">{sleepEntries[0].energy ?? '—'}</span>
                <span className="caption">Soreness</span>
                <span className="value">{sleepEntries[0].soreness ?? '—'}</span>
                <span className="caption">Mood</span>
                <span className="value">{sleepEntries[0].mood ?? '—'}</span>
              </div>
              <div className="row">
                <input type="number" step="1" min="1" max="10" placeholder="Sleep" value={slSleep} onChange={e => setSlSleep(e.target.value)} />
                <input type="number" step="1" min="1" max="10" placeholder="Energy" value={slEnergy} onChange={e => setSlEnergy(e.target.value)} />
                <input type="number" step="1" min="1" max="10" placeholder="Soreness" value={slSoreness} onChange={e => setSlSoreness(e.target.value)} />
                <input type="number" step="1" min="1" max="10" placeholder="Mood" value={slMood} onChange={e => setSlMood(e.target.value)} />
                <button className="primary small" onClick={handleLog}>Log</button>
              </div>
            </div>

            <div className="column gap-0">
              {sleepEntries.slice(0, 7).map(entry => (
                <div key={entry.id} className="row between">
                  <time className="caption">{entry.date ?? new Date(entry.loggedAt).toLocaleDateString()}</time>
                  <div className="row">
                    {entry.source !== 'manual' && entry.sleepScore !== null && (
                      <span className="pill">{entry.sleepScore} {entry.quality}</span>
                    )}
                    {entry.sleepQuality !== null && (
                      <span className={`value ${entry.score >= 70 ? 'good' : 'warning'}`}>{entry.score}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="caption">No sleep entries yet.</p>
            <div className="row">
              <input type="number" step="1" min="1" max="10" placeholder="Sleep" value={slSleep} onChange={e => setSlSleep(e.target.value)} />
              <input type="number" step="1" min="1" max="10" placeholder="Energy" value={slEnergy} onChange={e => setSlEnergy(e.target.value)} />
              <input type="number" step="1" min="1" max="10" placeholder="Soreness" value={slSoreness} onChange={e => setSlSoreness(e.target.value)} />
              <input type="number" step="1" min="1" max="10" placeholder="Mood" value={slMood} onChange={e => setSlMood(e.target.value)} />
              <button className="primary small" onClick={handleLog}>Log</button>
            </div>
          </>
        )}

        {weeklyTrend.length > 0 && (
          <div className="column">
            <span className="label">SLEEP TREND</span>
            <div className="row between">
              <span className="caption">Score (left axis) · Duration (right axis)</span>
              <div className="row">
                <span className="caption">Need {fmtMin(weeklyTrend[weeklyTrend.length - 1].avgSleepNeedMin)}</span>
                <span className="caption">Bed {weeklyTrend[weeklyTrend.length - 1].avgBedtime}</span>
                <span className="caption">Wake {weeklyTrend[weeklyTrend.length - 1].avgWakeTime}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weeklyTrend}>
                <XAxis dataKey="weekLabel" tick={false} />
                <YAxis yAxisId="score" domain={[0, 100]} width={28} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="dur" orientation="right" tickFormatter={(v: number) => fmtMin(v)} width={42} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v, name) =>
                    name === 'avgDurationMin' ? fmtMin(v as number) : v
                  }
                  labelFormatter={(l) => l}
                />
                <Line yAxisId="score" type="monotone" dataKey="avgScore" stroke="var(--accent)" dot={false} strokeWidth={2} />
                <Line yAxisId="dur" type="monotone" dataKey="avgDurationMin" stroke="var(--text-2)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Surface>
    </Column>
  );
}
