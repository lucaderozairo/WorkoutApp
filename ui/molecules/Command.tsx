import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

export interface CommandItem {
  id: string;
  label: ReactNode;
  keywords?: string[];
  disabled?: boolean;
  onSelect: () => void;
}

interface CommandProps {
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function Command({ items, placeholder = 'Search commands', emptyMessage = 'No commands found', className }: CommandProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => {
      const haystack = [item.label, ...(item.keywords ?? [])].join(' ').toLowerCase();
      return haystack.includes(needle);
    });
  }, [items, query]);

  return (
    <div className={['command', className].filter(Boolean).join(' ')}>
      <input
        className="input command-input"
        value={query}
        placeholder={placeholder}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div role="listbox" className="command-list">
        {filtered.length ? filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            disabled={item.disabled}
            className="command-item"
            onClick={item.onSelect}
          >
            {item.label}
          </button>
        )) : <span className="caption muted command-empty">{emptyMessage}</span>}
      </div>
    </div>
  );
}
