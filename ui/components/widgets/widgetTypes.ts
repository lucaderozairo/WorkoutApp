import type React from 'react';
import type { WidgetSize } from './widgetPrimitives';

export type { WidgetSize } from './widgetPrimitives';

export interface WidgetDef {
  id: string;
  label: string;
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  removable?: boolean;
  Component: React.FC<{ size: WidgetSize }>;
}

export interface WidgetInstance {
  id: string;
  instanceId: string;
  size: WidgetSize;
}

export interface ContextMenuState {
  instanceId: string;
  x: number;
  y: number;
}
