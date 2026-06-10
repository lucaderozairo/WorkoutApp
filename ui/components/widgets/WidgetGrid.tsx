import { useWidgetGrid } from './useWidgetGrid';
import { WIDGET_REGISTRY } from './widgetRegistry';
import { WidgetContextMenu } from './WidgetContextMenu';
import { WidgetAddPanel } from './WidgetAddPanel';

export function WidgetGrid() {
  const {
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
  } = useWidgetGrid(WIDGET_REGISTRY);

  const contextInstance = contextMenu
    ? widgets.find(w => w.instanceId === contextMenu.instanceId)
    : null;
  const contextDef = contextInstance
    ? WIDGET_REGISTRY.find(d => d.id === contextInstance.id)
    : null;

  return (
    <>
      <div className="widget-grid">
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

        <button
          type="button"
          className="widget-add-tile"
          onClick={() => setAddPanelOpen(true)}
          aria-label="Add widget"
        >
          +
        </button>
      </div>

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
