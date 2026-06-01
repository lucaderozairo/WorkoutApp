import { SettingsContent } from '@ui/components/modals/SettingsModal';
import { ScreenHeader } from '@ui/molecules';
import { Grid } from '@ui/layout';
import { useSettingsScreen } from './useSettingsScreen';

export function SettingsScreen() {
  const { navigate } = useSettingsScreen();
  return (
    <Grid>
      <ScreenHeader title="Settings" back={() => navigate(-1)} />
      <SettingsContent />
    </Grid>
  );
}
