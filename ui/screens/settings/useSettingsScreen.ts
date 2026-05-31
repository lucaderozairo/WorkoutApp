import { useNavigate } from 'react-router-dom';

export function useSettingsScreen() {
  const navigate = useNavigate();
  return { navigate };
}
