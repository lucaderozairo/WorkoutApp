# Models

Versioned ML model definitions. Each model directory contains:
- `model.json` — architecture + hyperparams
- `weights/` — versioned weight files
- `card.md` — model card (intended use, limitations, evaluation)

Models are loaded by `core/analytics/inference`. Training happens offline; this directory holds artifacts only.
