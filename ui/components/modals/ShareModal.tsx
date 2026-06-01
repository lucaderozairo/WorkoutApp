import { useState } from 'react';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

interface ShareModalProps {
  type: 'session' | 'workout' | 'run';
  data: {
    title: string;
    date: string;
    summary: string;
    details: Array<{ label: string; value: string }>;
  };
  onClose: () => void;
}

export function ShareModal({ data, onClose }: ShareModalProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>
        <Surface as="section">
          <Column>
          <Row justify="between">
            <h3>Share Workout</h3>
            <button className="ghost sm" onClick={onClose}>✕</button>
          </Row>

          <Row>
            <button
              className={`secondary sm ${theme === 'dark' ? 'primary sm' : ''}`}
              onClick={() => setTheme('dark')}
            >
              Dark
            </button>
            <button
              className={`secondary sm ${theme === 'light' ? 'primary sm' : ''}`}
              onClick={() => setTheme('light')}
            >
              Light
            </button>
          </Row>

          <div className={`card ${theme === 'dark' ? 'surface' : ''}`}>
            <div className="value">{data.title}</div>
            <div className="caption">{data.date}</div>
            <div>{data.summary}</div>
            {data.details.length > 0 && (
              <table className="share-table">
                <tbody>
                  {data.details.map((d, i) => (
                    <tr key={i}>
                      <td className="caption">{d.label}</td>
                      <td>{d.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Row>
            <button className="primary" onClick={() => window.print()}>Copy as Image</button>
          </Row>
          </Column>
        </Surface>
      </div>
    </div>
  );
}
