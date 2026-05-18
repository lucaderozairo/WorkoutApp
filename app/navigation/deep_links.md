# Deep Links

External URL → internal route mapping.

## Schemes
- `fitapp://` (mobile)
- `https://app.example.com/` (web, universal links)

## Mappings

| External | Internal |
|---|---|
| `/share/session/:id` | `/progress/session/:id` |
| `/share/run/:id` | `/progress/session/:id?type=run` |
| `/event/:id` | `/social/event/:id` |
| `/invite/:token` | `/social/accept-invite?token=:token` |
| `/blueprint/:id` | `/sessions?blueprint=:id` |

## Resolution
1. Platform shell receives URL.
2. `deep_links` resolver matches against table.
3. Auth guard runs (may defer the link until login).
4. Router navigates with parsed params.

## Unknown links
Unknown links route to a generic "open in browser" fallback rather than crashing.
