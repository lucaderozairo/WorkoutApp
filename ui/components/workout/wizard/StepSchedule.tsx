function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface StepScheduleProps {
  scheduledDate: string;  // 'YYYY-MM-DD'
  scheduledTime: string;  // 'HH:MM'
  notes: string;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onNotesChange: (n: string) => void;
}

export function StepSchedule({
  scheduledDate,
  scheduledTime,
  notes,
  onDateChange,
  onTimeChange,
  onNotesChange,
}: StepScheduleProps) {
  return (
    <div className="column">
      <div className="column compact">
        <label className="caption" htmlFor="plan-date">Date</label>
        <input
          id="plan-date"
          type="date"
          value={scheduledDate}
          min={todayStr()}
          onChange={e => onDateChange(e.target.value)}
        />
      </div>

      <div className="column compact">
        <label className="caption" htmlFor="plan-time">Time</label>
        <input
          id="plan-time"
          type="time"
          value={scheduledTime}
          onChange={e => onTimeChange(e.target.value)}
        />
      </div>

      <div className="column compact">
        <label className="caption" htmlFor="plan-notes">Notes (optional)</label>
        <textarea
          id="plan-notes"
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Any notes about this session…"
          maxLength={300}
          rows={3}
        />
      </div>
    </div>
  );
}
