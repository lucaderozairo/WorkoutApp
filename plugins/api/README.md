# Plugin API

The contract every plugin implements.

```
interface Plugin {
  manifest: PluginManifest
  register(ctx: PluginContext): Promise<void>
  unregister(): Promise<void>
}

interface PluginManifest {
  name: string
  version: string
  capabilities: Capability[]
  ui_extensions?: UIExtension[]
  event_subscriptions?: EventTypeFilter[]
}
```

## Capabilities (requestable)
- `read:<feature>` — read access to a feature's queries
- `emit:<event_type>` — permission to publish a specific event type
- `ui:dashboard_widget` — register a widget on the dashboard
- `ui:tab` — register a top-level tab

Capabilities are reviewed at install and revocable at any time.
