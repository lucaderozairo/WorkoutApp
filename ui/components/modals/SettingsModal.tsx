import { useRef, useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { handleUpdateProfile, handleSetUnitPreference } from '@features/profile';
import { viewStore } from '@data/projections/views';
import {
  exportEnvelope,
  clearStorage,
  PERSISTED_KEYS,
  type PersistedKey,
} from '@data/sources/local/persistence';
import type { Id } from '@shared/types';
import { importCsv, writeImportToStore } from '@shared/utils/importCsv';
import { exportAllSessionsCsv } from '@shared/utils/exportCsv';
import { triggerDownload } from '@shared/utils/csv';
import type { SessionHistoryItem } from '@features/training_log';
import type { CardioSession } from '@features/cardio/domain/types';

interface SettingsModalProps {
  onClose: () => void;
}

const USER_ID = 'user-001' as Id<'User'>;

type ProfileView = { displayName: string; email: string; unitPreference: string };

export function SettingsContent() {
  const profile = useQuery<ProfileView>('profile');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'high-contrast') return 'dark';
    return t === 'light' ? 'light' : 'dark';
  });
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { dispatch: dispatchUpdateProfile } = useCommand(handleUpdateProfile);
  const { dispatch: setUnitsCmd } = useCommand(handleSetUnitPreference);

  const handleSaveProfile = async () => {
    await dispatchUpdateProfile({ type: 'UpdateProfile', userId: USER_ID, displayName, email });
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value === '0' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const setMetric = async () => {
    await setUnitsCmd({ type: 'SetUnitPreference', userId: USER_ID, units: 'metric' });
    setUnits('metric');
  };

  const setImperial = async () => {
    await setUnitsCmd({ type: 'SetUnitPreference', userId: USER_ID, units: 'imperial' });
    setUnits('imperial');
  };

  const exportData = () => {
    const json = exportEnvelope();
    const blob = new Blob([json], { type: 'application/json' });
    triggerDownload(blob, `workout-data-${new Date().toISOString().split('T')[0]}.json`);
  };

  const exportDataCsv = () => {
    const history = viewStore.get<SessionHistoryItem[]>('session_history') ?? [];
    const cardioView = viewStore.get<{ sessions: CardioSession[] }>('recent_cardio_sessions') ?? { sessions: [] };
    exportAllSessionsCsv(history, cardioView.sessions);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();

      if (file.name.endsWith('.csv')) {
        const result = importCsv(text);
        const counts = writeImportToStore(result);
        if (counts.sessionCount > 0 || counts.cardioCount > 0) {
          setImportStatus(`Imported ${counts.sessionCount} strength + ${counts.cardioCount} cardio sessions.`);
        } else if (result.errors.length > 0) {
          setImportStatus(result.errors[0]);
        } else {
          setImportStatus('No sessions found in CSV.');
        }
      } else {
        const parsed = JSON.parse(text) as { version?: number; data?: Record<string, unknown> };
        if (parsed.version !== 1 || !parsed.data || typeof parsed.data !== 'object') {
          setImportStatus('Invalid file format.');
          return;
        }
        for (const key of PERSISTED_KEYS) {
          const value = parsed.data[key];
          if (value !== undefined) viewStore.set(key as PersistedKey, value);
        }
        const sessionCount = Array.isArray(parsed.data.session_history)
          ? parsed.data.session_history.length
          : 0;
        setImportStatus(`Imported — ${sessionCount} session${sessionCount !== 1 ? 's' : ''} loaded.`);
      }
    } catch {
      setImportStatus('Could not read file.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAllData = () => {
    if (window.confirm('Clear all data? This cannot be undone.')) {
      clearStorage();
      window.location.reload();
    }
  };

  return (
    <>
      {/* <section className="column">
        <h3 className="caption">Profile</h3>
        <div className="column">
          {profile ? (
            <div className="row">
              <span className="caption">{profile.displayName}</span>
              <span className="caption">{profile.email}</span>
            </div>
          ) : null}
          <input className="input" placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="primary sm" onClick={handleSaveProfile}>Save</button>
        </div>
      </section> */}

      <section className="column">
        <h3 className="caption">Appearance</h3>
        <div className="row space-between align-center">
          <span className="caption">{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
          <label className="switch">
            <input type="range" min="0" max="1" value={theme === 'light' ? 0 : 1} onChange={handleThemeChange} />
          </label>
        </div>
        {/* <div className="row space-between align-center">
          <span className="caption">Units</span>
          <div className="row">
            <button
              className={`secondary sm ${units === 'metric' ? 'primary sm' : ''}`}
              onClick={setMetric}
            >
              Metric
            </button>
            <button
              className={`secondary sm ${units === 'imperial' ? 'primary sm' : ''}`}
              onClick={setImperial}
            >
              Imperial
            </button>
          </div>
        </div> */}
      </section>

      <section className="column">
        <h3 className="caption">Data</h3>
        <div className="row space-between align-center">
          <span className="caption">Export history</span>
          <div className="row compact">
            <button className="secondary sm" onClick={exportData}>Export JSON</button>
            <button className="secondary sm" onClick={exportDataCsv}>Export CSV</button>
          </div>
        </div>
        <div className="row space-between align-center">
          <div className="column compact">
            <span className="caption">Import history</span>
            {importStatus && <span className="caption">{importStatus}</span>}
          </div>
          <button className="secondary sm" onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            hidden
            onChange={handleImportFile}
          />
        </div>
        <div className="row space-between align-center">
          <span className="caption">Clear All Data</span>
          <button className="danger sm" onClick={clearAllData}>Clear All</button>
        </div>
      </section>

      <section className="column">
        <h3 className="caption">About</h3>
        <div className="row space-between align-center">
          <span className="caption">Version</span>
          <span className="caption">0.1.0</span>
        </div>
      </section>
    </>
  );
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <section className="surface" onClick={e => e.stopPropagation()}>
        <div className="row space-between align-center">
          <h3>Settings</h3>
          <button className="ghost sm" onClick={onClose}>✕</button>
        </div>
        <SettingsContent />
      </section>
    </div>
  );
}
