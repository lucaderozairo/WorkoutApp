import { useState } from 'react';
import { Download, MoreVertical, Pause, Play, Share2, Trash2, X } from 'lucide-react';

export interface SessionHeaderProps {
  name: string;
  dateLabel: string;
  timerDisplay?: string;
  isActive: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onFinish: () => void;
  onDone?: () => void;
  onClearSession: () => void;
  timerNotStarted?: boolean;
  onStartTimer?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  startTime?: string;
  endTime?: string;
  date?: string;
  duration?: string;
}

export function SessionHeader({
  name, dateLabel, timerDisplay, isActive, isPaused = false, onPause = () => {}, onResume = () => {},
  onFinish, onDone, onClearSession, timerNotStarted = false, onStartTimer = () => {},
  onExport, onShare, startTime, endTime, date, duration,
}: SessionHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleShare() {
    if (onShare) { onShare(); return; }
    const shareData = { title: name, text: `Check out my workout: ${name} on ${dateLabel}` };
    if (navigator.share) {
      navigator.share(shareData);
    }
  }

  return (
    <div className="column">
      <div className="row align-center space-between" style={{ padding: 'var(--s-3) var(--s-4)', background: 'var(--surface-0)', borderBottom: '1px solid var(--line)' }}>
        <div className="row compact">
          <span className="detail">{name}</span>
        </div>
        <div className="row compact align-center">
          {isActive ? (
            <>
              <button type="button" className="primary sm" onClick={onFinish}>Finish</button>
              {timerNotStarted ? (
                <button type="button" className="primary sm session-timer-start" onClick={onStartTimer}>
                  <Play size={13} /> Start
                </button>
              ) : (
                <button type="button" className="secondary sm" onClick={isPaused ? onResume : onPause}>
                  {isPaused ? <Play size={13} /> : <Pause size={13} />}
                </button>
              )}
            </>
          ) : (
            <button type="button" className="primary sm" onClick={() => onDone?.()}>Edit</button>
          )}
          {onExport && (
            <button type="button" className="secondary sm" onClick={onExport}>
              <Download size={13} />
            </button>
          )}
          <button type="button" className="secondary sm" onClick={handleShare}>
            <Share2 size={13} />
          </button>
          <button type="button" className="secondary sm" onClick={() => setMenuOpen(v => !v)}>
            <MoreVertical size={13} />
          </button>
        </div>
      </div>

      <div className="surface grid">
        {isActive && timerDisplay && !timerNotStarted && (
          <div className="column compact align-center">
            <span className="eyebrow">Timer</span>
            <span className="mono num detail">{timerDisplay}</span>
          </div>
        )}
        <div className="column compact align-center">
          <span className="eyebrow">Start</span>
          <span className="mono num detail">{startTime ?? '—'}</span>
        </div>
        <div className="column compact align-center">
          <span className="eyebrow">End</span>
          <span className="mono num detail">{endTime ?? '—'}</span>
        </div>
        <div className="column compact align-center">
          <span className="eyebrow">Date</span>
          <span className="mono num detail">{date ?? dateLabel}</span>
        </div>
        <div className="column compact align-center">
          <span className="eyebrow">Duration</span>
          <span className="mono num detail">{duration ?? '—'}</span>
        </div>
      </div>

      {menuOpen && (
        <div className="modal-overlay">
          <div className="surface column">
            <div className="row space-between align-center">
              <span className="detail">Session Options</span>
              <button type="button" className="ghost icon sm" onClick={() => setMenuOpen(false)}>
                <X size={10} className="faint" />
              </button>
            </div>
            <button
              type="button"
              className="sm warning"
              onClick={() => { setMenuOpen(false); onClearSession(); }}
            >
              <Trash2 size={9} /> Delete session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
