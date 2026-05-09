# Plugin Loader

Discovers and mounts plugins listed in `config/plugins`.

## Lifecycle per plugin
1. **Discover** — locate manifest under `plugins/installed/<name>`
2. **Validate** — check declared capabilities against `core/security/policy`
3. **Sandbox** — instantiate inside `plugins/sandbox` boundary
4. **Register** — call plugin's `register(container, eventBus)` hook
5. **Activate** — fire `plugin.activated` event

## Capability model
Plugins request capabilities (e.g., `read:training_log`, `emit:custom_event`). The policy engine grants or denies based on user trust level. Denied plugins do not load.

## Hot reload
Plugins can be unloaded and reloaded at runtime without restarting the app. State held by a plugin is checkpointed on unload.
