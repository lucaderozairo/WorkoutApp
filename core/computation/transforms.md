# Transforms

Reusable, pure data transforms shared across features.

Examples:
- `groupBy(items, keyFn)`
- `rollingAverage(series, window)`
- `paceFromDistanceTime(meters, seconds)`
- `normalizeWeightUnit(value, fromUnit, toUnit)`
- `detectPlateau(series, threshold)`

Transforms have no domain knowledge — they take data and return data.
