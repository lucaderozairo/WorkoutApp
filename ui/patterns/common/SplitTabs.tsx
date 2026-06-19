import { useState } from 'react';
import type { ReactNode } from 'react';
import { Tabs, TabsContent } from '@ui/molecules';
import { Skeleton, Surface } from '@ui/atoms';
import { Row } from '@ui/layout';
import { Section } from './Section';

export interface SplitTabsPanel {
  id: string;
  label: string;
  content: ReactNode;
}

interface SplitTabsProps {
  panels: SplitTabsPanel[];
  className?: string;
}

interface SplitTabsSkeletonProps {
  panels?: number;
  className?: string;
}

function SplitTabsPanelSkeleton() {
  return <Section.Skeleton gap={2} rows={3} />;
}

function SplitTabsSkeleton({ panels = 2, className }: SplitTabsSkeletonProps) {
  return (
    <>
      <Surface pad="none" className={`split-tabs-mobile${className ? ` ${className}` : ''}`} aria-hidden>
        <Row gap={2} className="pad-sm">
          {Array.from({ length: panels }, (_, index) => (
            <Skeleton key={index} size="line" short className="text-9" />
          ))}
        </Row>
        <Surface pad="sm" variant="ghost">
          <SplitTabsPanelSkeleton />
        </Surface>
      </Surface>

      <div className={`split-tabs-split${className ? ` ${className}` : ''}`} aria-hidden>
        {Array.from({ length: panels }, (_, index) => (
          <Surface key={index} pad="sm">
            <SplitTabsPanelSkeleton />
          </Surface>
        ))}
      </div>
    </>
  );
}

/**
 * Mobile (<=600px): single Surface card with tab bar switching between panels.
 * Desktop (>600px): panels displayed side-by-side, each in its own Surface card.
 */
function SplitTabsImpl({ panels, className }: SplitTabsProps) {
  const [active, setActive] = useState(panels[0].id);
  const items = panels.map(p => ({ id: p.id, label: p.label }));

  return (
    <>
      <Surface pad="none" className={`split-tabs-mobile${className ? ` ${className}` : ''}`}>
        <Tabs items={items} value={active} onChange={setActive} />
        {panels.map(p => (
          <TabsContent key={p.id} value={p.id} activeValue={active} className="split-tabs-panel">
            <Surface pad="sm" variant="ghost">
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

export const SplitTabs = Object.assign(SplitTabsImpl, { Skeleton: SplitTabsSkeleton });
