import { exportEnvelope } from '@data/sources/local/persistence';

export function ExportDataWidget() {
  function handleExport() {
    const json = exportEnvelope();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-data-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="surface column compact widget-1x1 space-between">
      <span className="label">Export Data</span>
      <p className="detail">Download all your workout data as a JSON file.</p>
      <button className='chip sm' onClick={handleExport}>Download backup</button>
    </div>
  );
}
