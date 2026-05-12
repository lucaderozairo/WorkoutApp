import { useRef, useState } from 'react';
import { PERSISTED_KEYS } from '@data/sources/local/persistence';
import { viewStore } from '@data/projections/views';

export function ImportDataWidget() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const envelope = JSON.parse(reader.result as string) as { version: number; data: Record<string, unknown> };
        if (!envelope?.data || typeof envelope.data !== 'object') throw new Error('Invalid format');

        const validKeys = new Set<string>(PERSISTED_KEYS);
        for (const [key, value] of Object.entries(envelope.data)) {
          if (validKeys.has(key)) {
            viewStore.set(key, value);
          }
        }
        setStatus('ok');
      } catch {
        setStatus('error');
      }
      // Reset input so the same file can be re-imported if needed
      if (inputRef.current) inputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <div className="surface column compact widget-1x1 space-between">
      <span className="label">Import Data</span>
      <p className="detail">Restore from a previously exported backup file.</p>
      <input ref={inputRef} type="file" accept=".json" onChange={handleFile} hidden />
      <button className='chip sm' onClick={() => inputRef.current?.click()}>Choose file</button>
      {status === 'ok' && <span className="caption value good">Data imported successfully.</span>}
      {status === 'error' && <span className="caption value poor">Invalid file — please use an exported backup.</span>}
    </div>
  );
}
