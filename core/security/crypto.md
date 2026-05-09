# Crypto

Encryption primitives. Wraps platform-native crypto APIs (WebCrypto, CryptoKit, Tink).

## Operations
- `encrypt(plaintext, keyId) → ciphertext`
- `decrypt(ciphertext, keyId) → plaintext`
- `sign(data, keyId) → signature`
- `verify(data, signature, keyId) → bool`

Algorithms are not configurable here — they're chosen once and locked. Changing them requires a key rotation event in the audit log.
