import { ExpandableCard } from '@ui/components/shared/ExpandableCard';
import type { Appointment } from '@features/scheduling';

function AppointmentRow({ a }: { a: Appointment }) {
  return (
    <div className="row align-center">
      <div className="block bg-primary radius-1" style={{ width: 6, minHeight: 48, flex: 'none' }} />
      <div>
        <p>{a.title}</p>
        <time className="caption">
          {new Date(a.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          {' · '}{a.durationMinutes} min
        </time>
      </div>
    </div>
  );
}

export function ScheduleWidget({ appointments }: { appointments: Appointment[] }) {
  return (
    <ExpandableCard className="compact">
      {toggle => (
        <>
          <header className="row space-between" onClick={toggle}>
            <h3>Schedule</h3>
            <span>›</span>
          </header>
          {appointments.length === 0 ? (
            <p>No appointments today.</p>
          ) : (
            <>
              <div className="column">
                {appointments.slice(0, 2).map(a => <AppointmentRow key={a.id} a={a} />)}
              </div>
              <div className="expandable column" onClick={e => e.stopPropagation()}>
                {appointments.slice(2).map(a => <AppointmentRow key={a.id} a={a} />)}
              </div>
            </>
          )}
        </>
      )}
    </ExpandableCard>
  );
}
