# Auth

Token lifecycle: acquire, refresh, revoke. The auth module emits events (`auth.TokenRefreshed`, `auth.SessionExpired`) so other features can react.

The auth module does not own user identity — it owns tokens. The `profile` feature owns identity.
