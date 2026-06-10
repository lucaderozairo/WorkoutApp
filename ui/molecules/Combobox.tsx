import type { ReactNode } from 'react';
import { useId, useMemo, useState } from 'react';
import { Field } from './Field';

export interface ComboboxOption {
  value: string;
  label: ReactNode;
  searchText?: string;
  disabled?: boolean;
}

interface ComboboxProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  className?: string;
}

export function Combobox({ label, hint, error, value, onChange, options, placeholder, className }: ComboboxProps) {
  const generatedId = useId().replace(/:/g, '');
  const [query, setQuery] = useState('');
  const activeOption = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => {
      const text = String(option.searchText ?? option.label).toLowerCase();
      return text.includes(needle);
    });
  }, [options, query]);

  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="combobox">
          <input
            id={id}
            role="combobox"
            aria-expanded={filtered.length > 0}
            aria-controls={`combobox-list-${generatedId}`}
            aria-autocomplete="list"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={['input', invalid ? 'error' : ''].filter(Boolean).join(' ')}
            value={query || String(activeOption?.label ?? '')}
            placeholder={placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          {filtered.length > 0 && (
            <div id={`combobox-list-${generatedId}`} role="listbox" className="combobox-list">
              {filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  disabled={option.disabled}
                  className="combobox-option"
                  onClick={() => {
                    onChange(option.value);
                    setQuery('');
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Field>
  );
}
