import { useState } from 'react';
import { Download, MoreVertical, Pause, Play, Share2, Trash2, X } from 'lucide-react';
import { Row, Column, Grid } from '@ui/layout';
import { Surface, Button, Text } from '@ui/atoms';

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
    <Column>
      <Row align="center" justify="between" style={{ padding: 'var(--s-3) var(--s-4)', background: 'var(--surface-0)', borderBottom: '1px solid var(--line)' }}>
        <Row gap={1}>
          <Text size="detail">{name}</Text>
        </Row>
        <Row gap={1} align="center">
          {isActive ? (
            <>
              <Button type="button" variant="primary" size="sm" onClick={onFinish}>Finish</Button>
              {timerNotStarted ? (
                <Button type="button" variant="primary" size="sm" className="session-timer-start" onClick={onStartTimer}>
                  <Play size={13} /> Start
                </Button>
              ) : (
                <Button type="button" variant="secondary" size="sm" onClick={isPaused ? onResume : onPause}>
                  {isPaused ? <Play size={13} /> : <Pause size={13} />}
                </Button>
              )}
            </>
          ) : (
            <Button type="button" variant="primary" size="sm" onClick={() => onDone?.()}>Edit</Button>
          )}
          {onExport && (
            <Button type="button" variant="secondary" size="sm" onClick={onExport}>
              <Download size={13} />
            </Button>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={handleShare}>
            <Share2 size={13} />
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setMenuOpen(v => !v)}>
            <MoreVertical size={13} />
          </Button>
        </Row>
      </Row>

      <Surface><Grid variant="double">
        {isActive && timerDisplay && !timerNotStarted && (
          <Column gap={1} align="center">
            <Text size="eyebrow">Timer</Text>
            <Text size="detail" mono className="num">{timerDisplay}</Text>
          </Column>
        )}
        <Column gap={1} align="center">
          <Text size="eyebrow">Start</Text>
          <Text size="detail" mono className="num">{startTime ?? '—'}</Text>
        </Column>
        <Column gap={1} align="center">
          <Text size="eyebrow">End</Text>
          <Text size="detail" mono className="num">{endTime ?? '—'}</Text>
        </Column>
        <Column gap={1} align="center">
          <Text size="eyebrow">Date</Text>
          <Text size="detail" mono className="num">{date ?? dateLabel}</Text>
        </Column>
        <Column gap={1} align="center">
          <Text size="eyebrow">Duration</Text>
          <Text size="detail" mono className="num">{duration ?? '—'}</Text>
        </Column>
      </Grid></Surface>

      {menuOpen && (
        <div className="modal-overlay">
          <Surface>
            <Column>
              <Row justify="between" align="center">
                <Text size="detail">Session Options</Text>
                <Button type="button" variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                  <X size={10} className="faint" />
                </Button>
              </Row>
              <Button
                type="button"
                size="sm"
                className="warning"
                onClick={() => { setMenuOpen(false); onClearSession(); }}
              >
                <Trash2 size={9} /> Delete session
              </Button>
            </Column>
          </Surface>
        </div>
      )}
    </Column>
  );
}
