import { useRef, useState } from 'react';
import type { ContextMenuState, WidgetDef, WidgetInstance, WidgetSize } from './widgetTypes';

export type { ContextMenuState, WidgetDef, WidgetInstance, WidgetSize };

const STORAGE_KEY = 'widget-grid-v1';

const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: 'sleep', instanceId: 'sleep', size: 'md' },
  { id: 'readiness', instanceId: 'readiness', size: 'sm' },
  { id: 'hrv', instanceId: 'hrv', size: 'sm' },
  { id: 'weather', instanceId: 'weather', size: 'lg' },
];

function loadLayout(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WidgetInstance[];
  } catch {}
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: WidgetInstance[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {}
}

export function useWidgetGrid(registry: WidgetDef[]) {
  const [widgets, setWidgetsRaw] = useState<WidgetInstance[]>(loadLayout);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const dragId = useRef<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setWidgets(updater: (prev: WidgetInstance[]) => WidgetInstance[]) {
    setWidgetsRaw(prev => {
      const next = updater(prev);
      saveLayout(next);
      return next;
    });
  }

  function setSize(instanceId: string, size: WidgetSize) {
    setWidgets(prev => prev.map(w => w.instanceId === instanceId ? { ...w, size } : w));
    setContextMenu(null);
  }

  function removeWidget(instanceId: string) {
    setWidgets(prev => prev.filter(w => w.instanceId !== instanceId));
    setContextMenu(null);
  }

  function addWidget(id: string) {
    const def = registry.find(r => r.id === id);
    if (!def) return;
    setWidgets(prev => [...prev, { id, instanceId: `${id}-${Date.now()}`, size: def.defaultSize }]);
    setAddPanelOpen(false);
  }

  function handleDragStart(instanceId: string) {
    dragId.current = instanceId;
  }

  function handleDrop(targetInstanceId: string) {
    const from = dragId.current;
    if (!from || from === targetInstanceId) return;
    setWidgets(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(w => w.instanceId === from);
      const toIdx = next.findIndex(w => w.instanceId === targetInstanceId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    dragId.current = null;
  }

  function openContextMenu(e: React.MouseEvent, instanceId: string) {
    e.preventDefault();
    setContextMenu({ instanceId, x: e.clientX, y: e.clientY });
  }

  function startLongPress(e: React.PointerEvent, instanceId: string) {
    if (e.pointerType === 'mouse') return;
    const { clientX, clientY } = e;
    longPressTimer.current = setTimeout(() => {
      setContextMenu({ instanceId, x: clientX, y: clientY });
    }, 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  const activeIds = new Set(widgets.map(w => w.id));

  return {
    widgets,
    contextMenu,
    setContextMenu,
    addPanelOpen,
    setAddPanelOpen,
    activeIds,
    setSize,
    removeWidget,
    addWidget,
    handleDragStart,
    handleDrop,
    openContextMenu,
    startLongPress,
    cancelLongPress,
  };
}
