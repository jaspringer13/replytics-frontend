/**
 * Global polyfills for server-side rendering
 */

// Polyfill for 'self' global
if (typeof self === 'undefined') {
  (global as any).self = global;
}

// Polyfill for 'window' if needed
if (typeof window === 'undefined') {
  (global as any).window = {};
}

// Export empty object to make this a module
export {};