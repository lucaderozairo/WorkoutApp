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
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button, FileDropSurface, Input } from '@ui/molecules';

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

  function importSleepCsv(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      dispatchImportSleepFromCSV({ type: 'ImportSleepFromCSV', userId: USER_ID, csvText: reader.result as string });
    };
    reader.readAsText(file);
  }

  function importYearTrend(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setWeeklyTrend(parseGarminSleepYearCSV(reader.result as string));
    };
    reader.readAsText(file);
  }

  function renderSubjectiveLogForm() {
    return (
      <Row>
        <Input type="number" step="1" min="1" max="10" placeholder="Sleep" value={slSleep} onChange={e => setSlSleep(e.target.value)} />
        <Input type="number" step="1" min="1" max="10" placeholder="Energy" value={slEnergy} onChange={e => setSlEnergy(e.target.value)} />
        <Input type="number" step="1" min="1" max="10" placeholder="Soreness" value={slSoreness} onChange={e => setSlSoreness(e.target.value)} />
        <Input type="number" step="1" min="1" max="10" placeholder="Mood" value={slMood} onChange={e => setSlMood(e.target.value)} />
        <Button variant="primary" size="sm" onClick={handleLog}>Log</Button>
      </Row>
    );
  }

  return (
    <Column>
      <HealthChartsList slug="sleep" height={100} />

      <Surface>
        <header className="row between">
          <h3>Sleep</h3>
          <div className="row">
            <FileDropSurface accept=".csv" onFiles={files => importSleepCsv(files[0])}>
              <Text size="caption">Import Day CSV</Text>
            </FileDropSurface>
            <FileDropSurface accept=".csv" onFiles={files => importYearTrend(files[0])}>
              <Text size="caption">Import Year Trend</Text>
            </FileDropSurface>
          </div>
        </header>

        {sleepEntries.length > 0 ? (
          <>
            {sleepEntries[0].source !== 'manual' && (
              <div className="column">
                <Text size="eyebrow">GARMIN MEASURED</Text>
                <div className="row between">
                  <div>
                    <p className="value">{sleepEntries[0].sleepScore ?? '—'}</p>
                    <Text as="span" size="caption">{sleepEntries[0].quality ?? '—'}</Text>
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
              <Text size="eyebrow">SUBJECTIVE</Text>
              <div className="row">
                <Text as="span" size="caption">Sleep</Text>
                <span className="value">{sleepEntries[0].sleepQuality ?? '—'}</span>
                <Text as="span" size="caption">Energy</Text>
                <span className="value">{sleepEntries[0].energy ?? '—'}</span>
                <Text as="span" size="caption">Soreness</Text>
                <span className="value">{sleepEntries[0].soreness ?? '—'}</span>
                <Text as="span" size="caption">Mood</Text>
                <span className="value">{sleepEntries[0].mood ?? '—'}</span>
              </div>
              {renderSubjectiveLogForm()}
            </div>

            <div className="column gap-0">
              {sleepEntries.slice(0, 7).map(entry => (
                <div key={entry.id} className="row between">
                  <Text as="time" size="caption">{entry.date ?? new Date(entry.loggedAt).toLocaleDateString()}</Text>
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
            <Text as="p" size="caption">No sleep entries yet.</Text>
            {renderSubjectiveLogForm()}
          </>
        )}

        {weeklyTrend.length > 0 && (
          <div className="column">
            <Text size="eyebrow">SLEEP TREND</Text>
            <div className="row between">
              <Text as="span" size="caption">Score (left axis) · Duration (right axis)</Text>
              <div className="row">
                <Text as="span" size="caption">Need {fmtMin(weeklyTrend[weeklyTrend.length - 1].avgSleepNeedMin)}</Text>
                <Text as="span" size="caption">Bed {weeklyTrend[weeklyTrend.length - 1].avgBedtime}</Text>
                <Text as="span" size="caption">Wake {weeklyTrend[weeklyTrend.length - 1].avgWakeTime}</Text>
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
