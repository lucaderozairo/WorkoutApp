# mobile renderers

Platform-specific implementations of primitives and patterns. The shared layouts in `ui/layouts` resolve to the appropriate platform implementation at compile or run time.

What lives here:
- Platform-native primitive implementations (e.g. iOS-style navigation bar)
- Platform-specific gesture handlers
- Platform-specific safe-area handling
- Platform-specific keyboard / input adjustments
