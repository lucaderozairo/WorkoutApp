import { useRef, useState } from 'react';
import { PERSISTED_KEYS } from '@data/sources/local/persistence';
import { viewStore } from '@data/projections/views';
import { importCsv, writeImportToStore } from '@shared/utils/importCsv';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

export function ImportDataWidget() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    if (file.name.endsWith('.csv')) {
      const result = importCsv(text);
      const counts = writeImportToStore(result);
      if (counts.sessionCount > 0 || counts.cardioCount > 0) {
        setMessage(`Imported ${counts.sessionCount} strength + ${counts.cardioCount} cardio sessions.`);
        setStatus('ok');
      } else if (result.errors.length > 0) {
        setMessage(result.errors[0]);
        setStatus('error');
      } else {
        setMessage('No sessions found in CSV.');
        setStatus('error');
      }
    } else {
      try {
        const envelope = JSON.parse(text) as { version: number; data: Record<string, unknown> };
        if (!envelope?.data || typeof envelope.data !== 'object') throw new Error('Invalid format');

        const validKeys = new Set<string>(PERSISTED_KEYS);
        for (const [key, value] of Object.entries(envelope.data)) {
          if (validKeys.has(key)) {
            viewStore.set(key, value);
          }
        }
        setMessage('Data imported successfully.');
        setStatus('ok');
      } catch {
        setMessage('Invalid file — please use an exported backup or CSV.');
        setStatus('error');
      }
    }

    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <Surface>
      <Column gap={1} justify="between" className="widget-1x1">
        <Text size="eyebrow">Import Data</Text>
        <Text size="detail">Restore from a JSON backup or CSV file.</Text>
        <input ref={inputRef} type="file" accept=".json,.csv" onChange={handleFile} hidden />
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>Choose file</Button>
        {status === 'ok' && <Text size="caption" color="positive">{message}</Text>}
        {status === 'error' && <Text size="caption" color="negative">{message}</Text>}
      </Column>
    </Surface>
  );
}
