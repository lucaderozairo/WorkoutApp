import { useRef, useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { handleUpdateProfile, handleSetUnitPreference } from '@features/profile';
import { viewStore } from '@data/projections/views';
import {
  exportEnvelope,
  clearStorage,
  PERSISTED_KEYS,
  type PersistedKey,
// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
} from '@data/sources/local/persistence';
import type { Id } from '@shared/types';
import { importCsv, writeImportToStore } from '@shared/utils/importCsv';
import { exportAllSessionsCsv } from '@shared/utils/exportCsv';
import { triggerDownload } from '@shared/utils/csv';
import { getActivityHistory } from '@features/training_log';
import type { CardioSession } from '@features/cardio/domain/types';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Button, Switch } from '@ui/molecules';

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

  const handleThemeToggle = (isDark: boolean) => {
    const next = isDark ? 'dark' : 'light';
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
    const history = getActivityHistory();
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
        const sessionsData = parsed.data.sessions as { byId?: Record<string, unknown> } | undefined;
        const sessionCount = sessionsData?.byId ? Object.keys(sessionsData.byId).length : 0;
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
      <Column as="section">
        <Text as="h3" size="caption">Appearance</Text>
        <Row justify="between" align="center">
          <Text size="caption">{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</Text>
          <Switch checked={theme === 'dark'} onChange={handleThemeToggle} />
        </Row>
      </Column>

      <Column as="section">
        <Text as="h3" size="caption">Data</Text>
        <Row justify="between" align="center">
          <Text size="caption">Export history</Text>
          <Row gap={1}>
            <Button variant="secondary" size="sm" onClick={exportData}>Export JSON</Button>
            <Button variant="secondary" size="sm" onClick={exportDataCsv}>Export CSV</Button>
          </Row>
        </Row>
        <Row justify="between" align="center">
          <Column gap={1}>
            <Text size="caption">Import history</Text>
            {importStatus && <Text size="caption">{importStatus}</Text>}
          </Column>
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            hidden
            onChange={handleImportFile}
          />
        </Row>
        <Row justify="between" align="center">
          <Text size="caption">Clear All Data</Text>
          <Button variant="destructive" size="sm" onClick={clearAllData}>Clear All</Button>
        </Row>
      </Column>

      <Column as="section">
        <Text as="h3" size="caption">About</Text>
        <Row justify="between" align="center">
          <Text size="caption">Version</Text>
          <Text size="caption">0.1.0</Text>
        </Row>
      </Column>
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
      <div onClick={e => e.stopPropagation()}>
        <Surface as="section">
          <Column>
            <Row justify="between" align="center">
              <Text as="h3">Settings</Text>
              <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
            </Row>
            <SettingsContent />
          </Column>
        </Surface>
      </div>
    </div>
  );
}
