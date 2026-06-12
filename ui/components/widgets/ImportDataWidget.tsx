import { useRef, useState } from 'react';
import { useDataTransfer } from '@ui/components/transfer';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

export function ImportDataWidget() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { importFile } = useDataTransfer();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const summary = await importFile(file);
    setMessage(summary.message);
    setStatus(summary.status === 'ok' ? 'ok' : 'error');

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
