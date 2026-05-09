# Priority & Scheduling

Jobs have a priority (`high`, `normal`, `low`) and an optional `not_before` timestamp.

Worker picks: highest priority where `not_before ≤ now`, FIFO within priority.

User-visible work (e.g., chart export) is `high`. Background sync is `normal`. Analytics rollups are `low`.
