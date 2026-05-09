# Logger

Structured logging. Every log line is JSON with: ts, level, message, correlation_id, fields.

## Levels
`trace | debug | info | warn | error | fatal`

## Sinks
Configurable per environment: console, file, remote ingestion endpoint.

## PII
Logger redacts known PII fields by default. Free-form messages must not contain user data.
