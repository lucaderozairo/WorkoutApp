import React from "react";
import type { ElementType, KeyboardEventHandler, ReactNode } from "react";
import type { Gap } from "./_classes";

type GridMin = "xs" | "sm" | "md" | "lg" | "xl";
const MIN: Record<GridMin, string> = {
  xs: "100px",
  sm: "150px",
  md: "200px",
  lg: "280px",
  xl: "320px",
};

type GridAutoRows = "auto" | "sm" | "md" | "lg";
const AUTO_ROWS: Record<GridAutoRows, string> = {
  auto: "auto",
  sm: "minmax(120px, auto)",
  md: "minmax(160px, auto)",
  lg: "minmax(200px, auto)",
};

type GridPlace =
  | "center"
  | "start"
  | "end"
  | "stretch"
  | "start center"
  | "end center";
type GridPlaceSelf = "center" | "start" | "end" | "stretch";
type GridFlow = "row" | "column" | "dense" | "column dense";

type GridVariantName =
  | "single"
  | "double"
  | "triple"
  | "quad"
  | "widget"
  | "columns"
  | "auto"
  | "tiles"
  | "cal";

const VARIANT_CLASS: Record<GridVariantName, string> = {
  single: "grid-single",
  double: "grid-double",
  triple: "grid-triple",
  quad: "grid-quad",
  widget: "grid-widget",
  columns: "grid-columns",
  auto: "grid-auto",
  tiles: "grid-tiles",
  cal: "grid-cal",
};

type CSSVars = Record<string, string>;

interface GridProps {
  // Container
  variant?: GridVariantName;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 12 | (string & {});
  rows?: string;
  min?: GridMin;
  fill?: boolean;
  autoRows?: GridAutoRows;
  flow?: GridFlow;
  dense?: boolean;
  gap?: Gap;
  placeItems?: GridPlace;
  areas?: string;

  // Item, when this Grid is itself a child of another Grid.
  area?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | "full";
  rowSpan?: 1 | 2 | 3;
  placeSelf?: GridPlaceSelf;

  as?: ElementType;
  hidden?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  onKeyDown?: KeyboardEventHandler;
}

export function Grid({
  variant = "single",
  cols,
  rows,
  min,
  fill = false,
  autoRows,
  flow,
  dense = false,
  gap,
  placeItems,
  areas,
  area,
  colSpan,
  rowSpan,
  placeSelf,
  as: Tag = "div",
  hidden,
  className,
  children,
  onClick,
  onKeyDown,
}: GridProps) {
  const vars: CSSVars = {};

  if (cols !== undefined) {
    vars["--grid-cols"] =
      typeof cols === "string" ? cols : `repeat(${cols}, 1fr)`;
  }
  if (rows !== undefined) vars["--grid-rows"] = rows;
  if (min !== undefined) {
    vars["--grid-cols"] =
      `repeat(${fill ? "auto-fill" : "auto-fit"}, minmax(${MIN[min]}, 1fr))`;
  }
  if (autoRows !== undefined) vars["--grid-auto-rows"] = AUTO_ROWS[autoRows];
  if (flow !== undefined || dense) {
    vars["--grid-flow"] =
      dense && flow && !flow.includes("dense")
        ? `${flow} dense`
        : dense
          ? flow ?? "dense"
          : flow!;
  }
  if (placeItems !== undefined) vars["--grid-place"] = placeItems;
  if (areas !== undefined) vars["--grid-areas"] = areas;

  const isItem =
    area !== undefined ||
    colSpan !== undefined ||
    rowSpan !== undefined ||
    placeSelf !== undefined;
  if (area !== undefined) vars["--area"] = area;
  if (colSpan !== undefined) {
    vars["--col-span"] = colSpan === "full" ? "1 / -1" : `span ${colSpan}`;
  }
  if (rowSpan !== undefined) vars["--row-span"] = `span ${rowSpan}`;
  if (placeSelf !== undefined) vars["--place-self"] = placeSelf;

  const cx = [
    "grid",
    VARIANT_CLASS[variant],
    gap !== undefined ? `gap-${gap}` : "",
    isItem && "grid-item",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (hidden) return null;

  return (
    // eslint-disable-next-line no-restricted-syntax -- Grid uses runtime CSS custom properties for typed layout variants and named areas.
    <Tag className={cx} style={vars as React.CSSProperties} onClick={onClick} onKeyDown={onKeyDown}>
      {children}
    </Tag>
  );
}
