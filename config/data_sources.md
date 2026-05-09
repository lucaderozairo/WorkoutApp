# Data Source Configuration

Per-environment endpoints and credential references for every remote source.

```
data_sources:
  cloud_db:        { url, key_ref }
  weather:         { url, key_ref }
  sleep_provider:  { vendor, url, key_ref }
  news:            { url, key_ref }
```

Credentials are *references* to secure storage entries — never inline values.
