import React from "react";
import type { ElementType, ReactNode } from "react";
import { type Gap } from './_classes';

// ── Gap tokens — numeric 0-5 mirrors --s-{n} token scale ────────────────────
const GAP: Record<Gap, string> = {
  0: "0",
  1: "var(--s-1)",
  2: "var(--s-2)",
  3: "var(--s-3)",
  4: "var(--s-4)",
  5: "var(--s-5)",
};

// ── Min-width tokens for auto-fit / auto-fill ────────────────────────────────
type GridMin = "xs" | "sm" | "md" | "lg" | "xl";
const MIN: Record<GridMin, string> = {
  xs: "100px",
  sm: "150px",
  md: "200px",
  lg: "280px",
  xl: "320px",
};

// ── Auto-rows height tokens ──────────────────────────────────────────────────
type GridAutoRows = "auto" | "sm" | "md" | "lg";
const AUTO_ROWS: Record<GridAutoRows, string> = {
  auto: "auto",
  sm: "minmax(120px, auto)",
  md: "minmax(160px, auto)",
  lg: "minmax(200px, auto)",
};

// ── Placement types ──────────────────────────────────────────────────────────
type GridPlace =
  | "center"
  | "start"
  | "end"
  | "stretch"
  | "start center"
  | "end center";
type GridPlaceSelf = "center" | "start" | "end" | "stretch";
type GridFlow = "row" | "column" | "dense" | "column dense";

// ── Variant presets ──────────────────────────────────────────────────────────
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

type CSSVars = Record<string, string>;

const VARIANTS: Record<GridVariantName, CSSVars> = {
  single: { "--grid-cols": "1fr", "--grid-gap": "var(--s-4)" },
  double: { "--grid-cols": "repeat(2, 1fr)", "--grid-gap": "var(--s-3)" },
  triple: { "--grid-cols": "repeat(3, 1fr)", "--grid-gap": "var(--s-3)" },
  quad: { "--grid-cols": "repeat(4, 1fr)", "--grid-gap": "var(--s-3)" },
  widget: {
    "--grid-cols": "repeat(auto-fill, minmax(150px, 1fr))",
    "--grid-gap": "var(--s-3)",
  },
  columns: {
    "--grid-cols": "repeat(auto-fill, minmax(280px, 1fr))",
    "--grid-gap": "var(--s-4)",
  },
  auto: {
    "--grid-cols": "repeat(auto-fit,  minmax(320px, 1fr))",
    "--grid-gap": "var(--s-4)",
  },
  tiles: {
    "--grid-cols": "repeat(auto-fit,  minmax(150px, 1fr))",
    "--grid-gap": "var(--s-1)",
  },
  cal: { "--grid-cols": "repeat(7, 1fr)", "--grid-gap": "var(--s-2)" },
} as const;

// ── Props ────────────────────────────────────────────────────────────────────
interface GridProps {
  // Container
  variant?: GridVariantName; // default: 'single'
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 12 | (string & {}); // number → repeat(N,1fr); string → raw grid-template-columns, e.g. '40px repeat(7, 1fr)'
  rows?: string; // raw grid-template-rows
  min?: GridMin; // enables auto-fit/fill columns
  fill?: boolean; // use auto-fill instead of auto-fit
  autoRows?: GridAutoRows;
  flow?: GridFlow;
  dense?: boolean; // shorthand: grid-auto-flow dense
  gap?: Gap;
  placeItems?: GridPlace;
  areas?: string; // grid-template-areas value, e.g. '"header header" "sidebar main"'

  // Item — when this Grid is itself a child of another Grid
  area?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | "full";
  rowSpan?: 1 | 2 | 3;
  placeSelf?: GridPlaceSelf;

  as?: ElementType;
  hidden?: boolean;
  className?: string;
  children: ReactNode;
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
}: GridProps) {
  // Always spread variant first so --grid-cols is always explicitly set,
  // preventing inheritance from a parent .grid leaking through.
  const vars: Record<string, string> = { ...VARIANTS[variant] };

  if (cols !== undefined)
    vars["--grid-cols"] = typeof cols === "string" ? cols : `repeat(${cols}, 1fr)`;
  if (rows !== undefined) vars["--grid-rows"] = rows;
  if (min !== undefined)
    vars["--grid-cols"] =
      `repeat(${fill ? "auto-fill" : "auto-fit"}, minmax(${MIN[min]}, 1fr))`;
  if (autoRows !== undefined) vars["--grid-auto-rows"] = AUTO_ROWS[autoRows];
  if (flow !== undefined || dense)
    vars["--grid-flow"] = dense ? "dense" : flow!;
  if (gap !== undefined) vars["--grid-gap"] = GAP[gap];
  if (placeItems !== undefined) vars["--grid-place"] = placeItems;
  if (areas !== undefined) vars["--grid-areas"] = areas;

  const isItem =
    area !== undefined ||
    colSpan !== undefined ||
    rowSpan !== undefined ||
    placeSelf !== undefined;
  if (area !== undefined) vars["--area"] = area;
  if (colSpan !== undefined)
    vars["--col-span"] = colSpan === "full" ? "1 / -1" : `span ${colSpan}`;
  if (rowSpan !== undefined) vars["--row-span"] = `span ${rowSpan}`;
  if (placeSelf !== undefined) vars["--place-self"] = placeSelf;

  const cx = ["grid", isItem && "grid-item", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={cx} style={vars as React.CSSProperties} hidden={hidden}>
      {children}
    </Tag>
  );
}
