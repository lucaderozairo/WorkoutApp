import { useState } from 'react';
import { useCommand } from '@ui/bindings';
import {
  handleLogRestingHR,
  handleLogSubjectiveRPE,
  getTodaySubjectiveRPE,
} from '@features/readiness';
import type { Id } from '@shared/types';

const USER_ID = 'user-001' as Id<'User'>;

export function SubjectiveAndHRInputs() {
  const [hrInput, setHrInput] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null);
  const { dispatch: logHR } = useCommand(handleLogRestingHR);
  const { dispatch: logFeeling } = useCommand(handleLogSubjectiveRPE);
  const todayFeeling = getTodaySubjectiveRPE();

  async function submitHR() {
    const bpm = parseInt(hrInput, 10);
    if (!bpm || bpm < 30 || bpm > 200) return;
    await logHR({ type: 'LogRestingHR', userId: USER_ID, bpm, date: new Date().toISOString().slice(0, 10) });
    setHrInput('');
  }

  async function submitFeeling(score: number) {
    setSelectedFeeling(score);
    await logFeeling({ type: 'LogSubjectiveRPE', userId: USER_ID, score });
  }

  return (
    <div className="column">
      <div className="row">
        <input
          className="input"
          type="number"
          placeholder="Resting HR"
          value={hrInput}
          onChange={(event) => setHrInput(event.target.value)}
          min={30}
          max={200}
        />
        <button className="secondary" onClick={submitHR}>Log HR</button>
      </div>
      <div className="column">
        <p className="caption">How do you feel today?</p>
        <div className="row">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              className={selectedFeeling === score || (todayFeeling === score && selectedFeeling == null) ? 'primary' : 'secondary'}
              onClick={() => submitFeeling(score)}
            >
              {score}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
