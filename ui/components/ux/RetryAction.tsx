interface RetryActionProps {
  onRetry: () => void;
  label?: string;
}

export function RetryAction({ onRetry, label = 'Try again' }: RetryActionProps) {
  return (
    <button className="ghost" onClick={onRetry}>
      {label}
    </button>
  );
}
