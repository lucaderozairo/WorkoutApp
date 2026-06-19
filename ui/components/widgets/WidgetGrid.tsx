import { WIDGET_REGISTRY } from './widgetRegistry';
import { WidgetContextMenu } from './WidgetContextMenu';
import { WidgetAddPanel } from './WidgetAddPanel';
import { Button } from '@ui/molecules';
import { Grid } from '@ui/layout';
import type { ContextMenuState, WidgetDef, WidgetInstance, WidgetSize } from './widgetTypes';

interface WidgetGridProps {
  widgets: WidgetInstance[];
  contextMenu: ContextMenuState | null;
  setContextMenu: (v: ContextMenuState | null) => void;
  addPanelOpen: boolean;
  setAddPanelOpen: (v: boolean) => void;
  activeIds: Set<string>;
  setSize: (instanceId: string, size: WidgetSize) => void;
  removeWidget: (instanceId: string) => void;
  addWidget: (id: string) => void;
  handleDragStart: (instanceId: string) => void;
  handleDrop: (targetInstanceId: string) => void;
  openContextMenu: (e: React.MouseEvent, instanceId: string) => void;
  startLongPress: (e: React.PointerEvent, instanceId: string) => void;
  cancelLongPress: () => void;
}

export function WidgetGrid({
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
}: WidgetGridProps) {
  const contextInstance = contextMenu
    ? widgets.find(w => w.instanceId === contextMenu.instanceId)
    : null;
  const contextDef = contextInstance
    ? WIDGET_REGISTRY.find(d => d.id === contextInstance.id)
    : null;

  return (
    <>
      <Grid cols="repeat(2, minmax(0, 1fr))" gap={2}>
        {widgets.map(instance => {
          const def = WIDGET_REGISTRY.find(d => d.id === instance.id);
          if (!def) return null;
          return (
            <div
              key={instance.instanceId}
              className="widget-cell"
              data-size={instance.size}
              draggable
              onDragStart={() => handleDragStart(instance.instanceId)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(instance.instanceId)}
              onContextMenu={e => openContextMenu(e, instance.instanceId)}
              onPointerDown={e => startLongPress(e, instance.instanceId)}
              onPointerUp={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onPointerMove={cancelLongPress}
            >
              <def.Component size={instance.size} />
            </div>
          );
        })}

        <Button
          type="button"
          variant="ghost"
          className="widget-add-tile"
          onClick={() => setAddPanelOpen(true)}
          aria-label="Add widget"
        >
          +
        </Button>
      </Grid>

      {contextMenu && contextInstance && contextDef && (
        <WidgetContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          instance={contextInstance}
          def={contextDef}
          onSetSize={setSize}
          onRemove={removeWidget}
          onClose={() => setContextMenu(null)}
        />
      )}

      {addPanelOpen && (
        <WidgetAddPanel
          registry={WIDGET_REGISTRY}
          activeIds={activeIds}
          onAdd={addWidget}
          onClose={() => setAddPanelOpen(false)}
        />
      )}
    </>
  );
}
