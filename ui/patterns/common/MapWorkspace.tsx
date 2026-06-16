import type { ReactNode } from 'react';
import { Layer, Layered } from '@ui/layout';

interface MapWorkspaceProps {
  map: ReactNode;
  panel?: ReactNode;
  tools?: ReactNode;
  className?: string;
}

export function MapWorkspace({ map, panel, tools, className }: MapWorkspaceProps) {
  return (
    <div className={['map-workspace', className].filter(Boolean).join(' ')}>
      <div className="map-workspace-panel">{panel}</div>
      <Layered className="map-workspace-map">
        <Layer pin="full">{map}</Layer>
        {tools ? <Layer pin="top-right" z="controls">{tools}</Layer> : null}
      </Layered>
    </div>
  );
}
