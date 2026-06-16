import { Search, X } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { Button } from './Button';
import { Input } from './Input';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: string;
  error?: string;
  loading?: boolean;
  onClear?: () => void;
}

export function SearchInput({ value, onClear, loading, placeholder = 'Search', ...rest }: SearchInputProps) {
  const hasValue = value !== undefined && String(value).length > 0;
  const clearButton = hasValue && onClear ? (
    <Button type="button" variant="ghost" size="icon-sm" aria-label="Clear search" onClick={onClear}>
      <X size={14} aria-hidden="true" />
    </Button>
  ) : null;

  return (
    <Input
      {...rest}
      type="search"
      value={value}
      loading={loading}
      placeholder={placeholder}
      leading={<Search size={14} aria-hidden="true" />}
      trailing={clearButton}
      controlClassName="search-input"
    />
  );
}
