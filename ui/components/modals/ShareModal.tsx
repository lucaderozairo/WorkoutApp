import { useState } from 'react';
import { Row, Column } from '@ui/layout';
import { Surface, Button, Text, Table, TableRow, TableCell } from '@ui/atoms';

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
            <Text as="h3">Share Workout</Text>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </Row>

          <Row gap={1}>
            <Button
              variant={theme === 'dark' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
            <Button
              variant={theme === 'light' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
          </Row>

          <Surface variant={theme === 'dark' ? 'default' : 'plain'} pad="md">
            <Column gap={2}>
              <Text bold>{data.title}</Text>
              <Text size="caption" color="muted">{data.date}</Text>
              <Text>{data.summary}</Text>
              {data.details.length > 0 && (
                <Table>
                  <tbody>
                    {data.details.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell muted>{d.label}</TableCell>
                        <TableCell>{d.value}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              )}
            </Column>
          </Surface>

          <Row>
            <Button variant="primary" onClick={() => window.print()}>Copy as Image</Button>
          </Row>
          </Column>
        </Surface>
      </div>
    </div>
  );
}
