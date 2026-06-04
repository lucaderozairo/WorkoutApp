import { useState, useRef } from 'react';

import type { WidgetSize } from '@ui/components/widgets/widgetPrimitives';
export type { WidgetSize };
export interface WidgetInstance { id: string; size: WidgetSize; }
export interface WidgetDef {
  id: string;
  label: string;
  sizes: WidgetSize[];
  Component: React.FC<{ size: WidgetSize }>;
}

export const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: 'sleep-review', size: '2x2' },
  { id: 'weather', size: '2x1' },
  { id: 'readiness', size: '2x1' },
  { id: 'sleep-breakdown', size: '2x2' },
  { id: 'hrv', size: '2x1' },
  { id: 'resting-hr', size: '2x1' },
  { id: 'plan-adherence', size: '2x1' },
  { id: 'weekly-volume', size: '2x2' },
  { id: 'activity-feed', size: '2x1' },
  { id: 'macros', size: '2x1' },
  { id: 'calories', size: '1x1' },
  { id: 'habits', size: '1x1' },
  { id: 'active-goals', size: '2x2' },
  { id: 'monthly-dist', size: '2x1' },
  { id: 'insights', size: '2x1' },
];

export function useWidgetPrototype(registry: WidgetDef[]) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>(DEFAULT_LAYOUT);
  const [editMode, setEditMode] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const dragId = useRef<string | null>(null);

  function cycleSize(id: string) {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      const def = registry.find(r => r.id === id)!;
      const next = def.sizes[(def.sizes.indexOf(w.size) + 1) % def.sizes.length];
      return { ...w, size: next };
    }));
  }

  function removeWidget(id: string) {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }

  function addWidget(id: string) {
    const def = registry.find(r => r.id === id);
    if (!def) return;
    setWidgets(prev => [...prev, { id, size: def.sizes[0] }]);
    setShowAddPanel(false);
  }

  function handleDragStart(id: string) {
    dragId.current = id;
  }

  function handleDrop(targetId: string) {
    const from = dragId.current;
    if (!from || from === targetId) return;
    setWidgets(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(w => w.id === from);
      const toIdx = next.findIndex(w => w.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    dragId.current = null;
  }

  function enterEdit() { setEditMode(true); }
  function exitEdit() { setEditMode(false); setShowAddPanel(false); }

  const activeIds = new Set(widgets.map(w => w.id));

  return {
    widgets,
    editMode,
    showAddPanel, setShowAddPanel,
    activeIds,
    cycleSize,
    removeWidget,
    addWidget,
    handleDragStart,
    handleDrop,
    enterEdit,
    exitEdit,
  };
}
