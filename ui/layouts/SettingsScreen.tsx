import { useNavigate } from 'react-router-dom';
import { SettingsContent } from '@ui/components/modals/SettingsModal';

export function SettingsScreen() {
  const navigate = useNavigate();
  return (
    <div className="column">
      <header className="row space-between">
        <h2>Settings</h2>
        <button className="ghost sm" onClick={() => navigate(-1)}>
          Back
        </button>
      </header>
      <SettingsContent />
    </div>
  );
}
