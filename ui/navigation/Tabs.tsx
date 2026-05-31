import type { ReactNode } from 'react';

interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'row';
}

export function Tabs({ tabs, active, onChange, variant = 'underline' }: TabsProps) {
  const classes = ['tabs', variant === 'row' ? 'row' : ''].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          className={['tab', tab.id === active ? 'active' : ''].filter(Boolean).join(' ')}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
