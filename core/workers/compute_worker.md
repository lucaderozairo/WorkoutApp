# Compute Worker

Off-main-thread CPU work. Runs in a Web Worker (web), Isolate (mobile), or thread (desktop).

## Job types
- Chart data downsampling
- Insights computation
- Projection rebuild for large streams
- Route GPS smoothing

## Contract
Workers communicate only via message passing. They have no access to the event bus, container, or network. Inputs and outputs are pure data.
