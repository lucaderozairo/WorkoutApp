# Feature Manifest

Declares which features are active for the current build. Read once at startup.

## Schema
```
{
  "features": [
    { "name": "training_log",      "enabled": true,  "version": "1.0" },
    { "name": "cardio",            "enabled": true,  "version": "1.0" },
    { "name": "progress_analysis", "enabled": true,  "version": "1.0" },
    { "name": "scheduling",        "enabled": true,  "version": "1.0" },
    { "name": "readiness",         "enabled": true,  "version": "1.0" },
    { "name": "conditions",        "enabled": true,  "version": "1.0" },
    { "name": "news_feed",         "enabled": true,  "version": "1.0" },
    { "name": "insights",          "enabled": true,  "version": "1.0" },
    { "name": "social",            "enabled": true,  "version": "1.0" },
    { "name": "profile",           "enabled": true,  "version": "1.0" }
  ]
}
```

## Build variants
- **Full** — all features enabled
- **Lite** — `news_feed`, `social`, `insights` disabled
- **Trainer** — adds `client_management` plugin

Disabled features are not loaded; their routes are hidden by the router guard and their projections are skipped during rebuild.
