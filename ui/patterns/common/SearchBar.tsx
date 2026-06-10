import { Row } from '@ui/layout/Row';
import { Icon } from '@ui/atoms/Icon';
import { Spinner } from '@ui/atoms/Spinner';
import { Button } from '@ui/molecules/Button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  onClear?: () => void;
  onSubmit?: () => void;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search…', loading = false, onClear, onSubmit, className }: SearchBarProps) {
  return (
    <Row align="center" className={['search-bar', className].filter(Boolean).join(' ')}>
      {loading ? <Spinner size="sm" /> : <Icon name="search" size="sm" aria-hidden />}
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        className="min-w-0"
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSubmit?.(); }}
      />
      {value && onClear && (
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear search">
          <Icon name="close" size="sm" />
        </Button>
      )}
    </Row>
  );
}
