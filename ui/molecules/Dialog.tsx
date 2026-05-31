import { Button } from '@ui/atoms/Button';
import { Modal } from './Modal';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  confirm: string;
  onConfirm: () => void;
  destructive?: boolean;
  loading?: boolean;
}

export function Dialog({ open, onClose, title, message, confirm, onConfirm, destructive = false, loading = false }: DialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <div className="row justify-end gap-sm">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirm}
          </Button>
        </div>
      }
    >
      {message && <p className="caption">{message}</p>}
    </Modal>
  );
}
