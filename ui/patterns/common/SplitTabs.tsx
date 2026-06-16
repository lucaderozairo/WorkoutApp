import { useState } from 'react';
import type { ReactNode } from 'react';
import { Tabs, TabsContent } from '@ui/molecules';
import { Surface } from '@ui/atoms';

export interface SplitTabsPanel {
  id: string;
  label: string;
  content: ReactNode;
}

interface SplitTabsProps {
  panels: SplitTabsPanel[];
  className?: string;
}

/**
 * Mobile (≤600px): single Surface card with tab bar switching between panels.
 * Desktop (>600px): panels displayed side-by-side, each in its own Surface card.
 */
export function SplitTabs({ panels, className }: SplitTabsProps) {
  const [active, setActive] = useState(panels[0].id);
  const items = panels.map(p => ({ id: p.id, label: p.label }));

  return (
    <>
      <Surface pad="none" className={`split-tabs-mobile${className ? ` ${className}` : ''}`}>
        <Tabs items={items} value={active} onChange={setActive} />
        {panels.map(p => (
          <TabsContent key={p.id} value={p.id} activeValue={active} className="split-tabs-panel">
            <Surface pad="sm" variant='ghost'>
            {p.content}
            </Surface>
          </TabsContent>
        ))}
      </Surface>

      <div className={`split-tabs-split${className ? ` ${className}` : ''}`}>
        {panels.map(p => (
          <Surface key={p.id} pad="sm">{p.content}</Surface>
        ))}
      </div>
    </>
  );
}
