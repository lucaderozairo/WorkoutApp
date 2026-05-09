# Producers

Command handlers that emit events. Producers contain the only code in the system allowed to write to the event store.

A producer:
1. Validates the command using `core/computation/validators`
2. Loads the relevant aggregate state via `data/repositories`
3. Computes the resulting events using `core/computation/reducers`
4. Appends events to the event store
5. Publishes events to the bus
