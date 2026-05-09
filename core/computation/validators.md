# Validators

Pure rule functions used by command handlers.

```
validate(command) → Result<void, ValidationError[]>
```

Validators do not perform lookups (no DB, no clock). For rules that require state ("user has not already done X today"), the command handler combines a validator with a repository read.
