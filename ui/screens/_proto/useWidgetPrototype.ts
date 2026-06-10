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
  { id: 'sleep-review',    size: 'md' },
  { id: 'weather',         size: 'wide' },
  { id: 'readiness',       size: 'wide' },
  { id: 'sleep-breakdown', size: 'md' },
  { id: 'hrv',             size: 'wide' },
  { id: 'resting-hr',      size: 'wide' },
  { id: 'plan-adherence',  size: 'wide' },
  { id: 'weekly-volume',   size: 'md' },
  { id: 'activity-feed',   size: 'wide' },
  { id: 'macros',          size: 'wide' },
  { id: 'calories',        size: 'sm' },
  { id: 'habits',          size: 'sm' },
  { id: 'active-goals',    size: 'md' },
  { id: 'monthly-dist',    size: 'wide' },
  { id: 'insights',        size: 'wide' },
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
