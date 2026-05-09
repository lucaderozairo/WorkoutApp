# Policy

Capability and permission rules. Declarative; consulted by the plugin loader and by features that gate sensitive operations.

```
policy.can(actor, action, resource) → bool
```

Examples:
- `can(plugin_x, "read", "training_log")` — gated on capability grant
- `can(user, "delete", session)` — only if user owns the session
