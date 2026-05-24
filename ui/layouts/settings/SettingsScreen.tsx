import { SettingsContent } from '@ui/components/modals/SettingsModal';
import { ScreenHeader } from '@ui/components/shared';
import { useSettingsScreen } from './useSettingsScreen';

export function SettingsScreen() {
  const { navigate } = useSettingsScreen();
  return (
    <div className="column">
      <ScreenHeader title="Settings" back={() => navigate(-1)} />
      <SettingsContent />
    </div>
  );
}
