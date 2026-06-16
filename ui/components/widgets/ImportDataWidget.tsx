import { useState } from 'react';
import { useDataTransfer } from '@ui/components/transfer';
import { Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { FileDropSurface } from '@ui/molecules';

export function ImportDataWidget() {
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { importFile } = useDataTransfer();

  async function handleFile(file: File | undefined) {
    if (!file) return;

    const summary = await importFile(file);
    setMessage(summary.message);
    setStatus(summary.status === 'ok' ? 'ok' : 'error');
  }

  return (
    <Surface>
      <Column gap={1} justify="between" className="widget-1x1">
        <Text size="eyebrow">Import Data</Text>
        <Text size="detail">Restore from a JSON backup or CSV file.</Text>
        <FileDropSurface accept=".json,.csv" onFiles={files => handleFile(files[0])}>
          <Text size="caption">Choose file</Text>
        </FileDropSurface>
        {status === 'ok' && <Text size="caption" color="positive">{message}</Text>}
        {status === 'error' && <Text size="caption" color="negative">{message}</Text>}
      </Column>
    </Surface>
  );
}
