import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  return (
    <div className="row surface">
      <WifiOff size={16} />
      <span>You're offline. Changes will sync when reconnected.</span>
    </div>
  );
}
