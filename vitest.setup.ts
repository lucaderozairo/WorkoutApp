import '@testing-library/jest-dom';

// jsdom has no ResizeObserver; components like RouteMap construct one on mount.
// Provide a no-op stub so they can render under test.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
