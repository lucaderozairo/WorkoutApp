import type { TypeFilter } from "@features/training_log/contract";
export type { TypeFilter };
import { Tabs } from "@ui/molecules";

export type ViewMode = "list" | "month" | "week";
export type TimeRange = "7d" | "30d" | "all";
export type SortOrder = "newest" | "oldest";

export interface SessionFilters {
  view: ViewMode;
  dateRange: TimeRange;
  dateFrom: string;
  dateTo: string;
  type: TypeFilter;
  exercise: string;
  sessionName: string;
  sort: SortOrder;
}

export const DEFAULT_FILTERS: SessionFilters = {
  view: "list",
  dateRange: "all",
  dateFrom: "",
  dateTo: "",
  type: "all",
  exercise: "",
  sessionName: "",
  sort: "newest",
};

const VIEW_TABS = [
  { id: "list", value: "list", label: "≡ List" },
  { id: "month", value: "month", label: "▦ Month" },
  { id: "week", value: "week", label: "⬚ Week" },
];

export function SessionFilterBar({
  filters,
  onChange,
}: {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
}) {
  return (
        <Tabs
          value={filters.view}
          onChange={(v) => onChange({ ...filters, view: v as ViewMode })}
          items={VIEW_TABS}
        />
  );
}
