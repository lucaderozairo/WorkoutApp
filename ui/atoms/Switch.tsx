import { Row } from '../layout/Row';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export function Switch({ checked, onChange, disabled, size = 'md', label, className }: SwitchProps) {
  const classes = ['switch', size !== 'md' ? size : '', className].filter(Boolean).join(' ');

  const btn = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={classes}
      onClick={() => onChange(!checked)}
    >
      <span className="thumb" />
    </button>
  );

  if (!label) return btn;

  return (
    <Row as="label" align="center" gap={3}>
      {btn}
      <span className="caption">{label}</span>
    </Row>
  );
}
