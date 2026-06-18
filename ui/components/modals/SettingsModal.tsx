import { useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { handleUpdateProfile, handleSetUnitPreference } from '@features/profile';
import type { Id } from '@shared/types';
import { useDataTransfer } from '@ui/components/transfer';
import { Row, Column } from '@ui/layout';
import { Text } from '@ui/atoms';
import { Button, FileDropSurface, Modal, Switch } from '@ui/molecules';

interface SettingsModalProps {
  onClose: () => void;
}

const USER_ID = 'user-001' as Id<'User'>;

type ProfileView = { displayName: string; email: string; unitPreference: string };

export function SettingsContent() {
  const profile = useQuery('profile');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'high-contrast') return 'dark';
    return t === 'light' ? 'light' : 'dark';
  });
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const { dispatch: dispatchUpdateProfile } = useCommand(handleUpdateProfile);
  const { dispatch: setUnitsCmd } = useCommand(handleSetUnitPreference);
  const { importFile, exportAllJson, exportAllCsv, clearAll } = useDataTransfer();

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

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    const summary = await importFile(file);
    setImportStatus(summary.message);
  };

  const clearAllData = () => {
    if (window.confirm('Clear all data? This cannot be undone.')) {
      clearAll();
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
            <Button variant="secondary" size="sm" onClick={exportAllJson}>Export JSON</Button>
            <Button variant="secondary" size="sm" onClick={exportAllCsv}>Export CSV</Button>
          </Row>
        </Row>
        <Row justify="between" align="center">
          <Column gap={1}>
            <Text size="caption">Import history</Text>
            {importStatus && <Text size="caption">{importStatus}</Text>}
          </Column>
          <FileDropSurface accept=".json,.csv" onFiles={files => handleImportFile(files[0])}>
            <Text size="caption">Import</Text>
          </FileDropSurface>
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
    <Modal open onClose={onClose}>
      <Column>
            <Row justify="between" align="center">
              <Text as="h3">Settings</Text>
              <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
            </Row>
            <SettingsContent />
      </Column>
    </Modal>
  );
}
