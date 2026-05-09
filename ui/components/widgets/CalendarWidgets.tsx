import { useQuery } from '@ui/bindings';
import type { Sport } from '@data/mock/workouts';
import type { MockCalendarEvent } from '@data/mock/calendar';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;


export function CalendarGrid({ year, month }: { year: number; month: number }) {
    const today = new Date();
    const todayDate = today.getDate();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const workoutCalendar = (useQuery<Record<number, Sport[]>>('workout_calendar') ?? {}) as Record<number, Sport[]>;

    const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [
        ...Array<null>(startOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <div className="cal">
            {DAY_LABELS.map(label => (
                <span key={label} className="day">{label}</span>
            ))}
            {cells.map((day, i) => {
                if (day === null) return <span key={`e-${i}`} className="day" />;
                const isToday = isCurrentMonth && day === todayDate;
                const primarySport = (workoutCalendar[day] ?? [])[0];

                return (
                    <button key={day} className="day" {...(isToday ? { 'data-today': '' } : {})}>
                        <span>{day}</span>
                        <span className={`dot ${primarySport ?? ''}`} style={primarySport ? undefined : { visibility: 'hidden' }} />
                    </button>
                );
            })}
        </div>
    );
}


// ─── CalendarLarge ───────────────────────────────────────────────────────────

export function CalendarLarge() {
    const today = new Date();
    const label = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const upcoming = (useQuery<MockCalendarEvent[]>('calendar_upcoming') ?? []) as MockCalendarEvent[];

    return (
        <div className="surface column">
            <div className="row space-between align-center compact">
                <button className="ghost icon">‹</button>
                <span className="caption">{label}</span>
                <button className="ghost icon">›</button>
            </div>
            <CalendarGrid year={today.getFullYear()} month={today.getMonth()} />

            <h3>Coming up</h3>
            <div className="column compact">
                {upcoming.map(ev => (
                    <div key={ev.day} className="surface row align-center compact">
                        <div style={{
                            width: 42, height: 42,
                            borderRadius: 'var(--r-md)',
                            background: 'var(--accent-soft)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <span className="eyebrow" style={{ fontSize: 9 }}>{ev.month}</span>
                            <span style={{ fontSize: 'var(--t-lg)', lineHeight: 1 }}>{ev.day}</span>
                        </div>
                        <div className="column compact" style={{ flex: 1 }}>
                            <div className="row space-between align-center">
                                <span className="detail">{ev.title}</span>
                                <span className={`pill ${ev.sport}`}>{ev.sport}</span>
                            </div>
                            <span className="caption">{ev.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
