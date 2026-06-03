import type { ReactNode } from "react";
import { Row } from "@ui/layout";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: TabsProps<T>) {
  const classes = ["tabs", className].filter(Boolean).join(" ");
  return (
      <Row
        justify="between"
        gap={0}
        className={classes}
        children={items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={value === item.id}
            className={`tab${value === item.id ? " active" : ""}`}
            onClick={() => onChange(item.id)}>
            {item.label}
          </button>
        ))}
      />
  );
}
