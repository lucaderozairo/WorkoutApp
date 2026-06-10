import type { KeyboardEvent, ReactNode } from "react";
import { useId } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  panelId?: string;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label?: string;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: TabsProps<T>) {
  const generatedId = useId().replace(/:/g, "");
  const selectedIndex = Math.max(0, items.findIndex((item) => item.id === value));
  const classes = ["tabs", className].filter(Boolean).join(" ");

  function tabId(item: TabItem<T>) {
    return `tab-${generatedId}-${item.id}`;
  }

  function panelId(item: TabItem<T>) {
    return item.panelId ?? `panel-${generatedId}-${item.id}`;
  }

  function focusTab(index: number) {
    const item = items[index];
    if (!item) return;
    document.getElementById(tabId(item))?.focus();
    onChange(item.id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!items.length) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTab((selectedIndex + 1) % items.length);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTab((selectedIndex - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(items.length - 1);
    }
  }

  return (
      <div
        role="tablist"
        aria-label={label}
        className={classes}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => {
          const selected = value === item.id;
          return (
          <button
            id={tabId(item)}
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId(item)}
            tabIndex={selected ? 0 : -1}
            className={`tab${selected ? " active" : ""}`}
            onClick={() => onChange(item.id)}>
            {item.label}
          </button>
          );
        })}
      </div>
  );
}

interface TabsContentProps<T extends string> {
  value: T;
  activeValue: T;
  labelledBy?: string;
  id?: string;
  className?: string;
  children: ReactNode;
}

export function TabsContent<T extends string>({
  value,
  activeValue,
  labelledBy,
  id,
  className,
  children,
}: TabsContentProps<T>) {
  return (
    <div
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      hidden={value !== activeValue}
      className={className}
    >
      {children}
    </div>
  );
}
