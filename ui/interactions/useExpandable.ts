import { useState, useCallback } from "react";

export function useExpandable(initial = false) {
  const [expanded, setExpanded] = useState(initial);
  const toggle = useCallback(() => setExpanded((p) => !p), []);
  return { expanded, toggle };
}
