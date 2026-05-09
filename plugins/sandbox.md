# Plugin Sandbox

Isolation boundary for plugin execution.

## Web
Plugins run in a Web Worker with a postMessage bridge. No DOM access; UI extensions are declarative.

## Mobile
Plugins run in an isolate/separate process. IPC is structured-clone only.

## Capability enforcement
Every cross-boundary call is checked against the plugin's granted capabilities. Denied calls throw a typed error visible in diagnostics.
