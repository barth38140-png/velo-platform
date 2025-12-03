import React from 'react';
import { vi, expect as vitestExpect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

// Ensure vitest's expect is available for libraries that reference it at import time
globalThis.expect = vitestExpect;

// Now load testing helpers that may reference `expect`
import '@testing-library/jest-dom';

// Expose React globally for modules that expect it
globalThis.React = React;

// Provide a small helper to render components with router context
globalThis.renderWithRouter = (ui, options) => {
  return render(ui, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>, ...options });
};

// Stub localStorage.getItem to return a test token by default so MSW/auth flows don't 401
const ORIGINAL_LOCALSTORAGE = globalThis.localStorage;
try {
  const fakeStorage = {
    getItem: (key) => {
      if (key === 'token' || key === 'authToken' || key === 'access_token') return 'test-token';
      return null;
    },
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };
  globalThis.localStorage = fakeStorage;
} catch (e) {
  // ignore in environments where localStorage is not configurable
}

// Provide a safe default mock for useNavigate to avoid requiring a Router in every test
// Use a stable mock function instance (avoid recreating a new fn each call)
const _mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => _mockNavigate
  };
});

// MSW is now started lazily by importing `frontend/test/msw/setup.js` from
// individual test suites that need network interception. This reduces the
// global setup cost. Example import from a test file:
//   import '../../../test/msw/setup';

// For fully-lazy MSW we attach tiny wrappers that start MSW automatically
// on the first network call (fetch/XHR). The module is cheap to import and
// only performs small runtime monkey-patching.
try {
  // eslint-disable-next-line no-unused-expressions
  await import('./test/msw/lazy.js');
} catch (e) {
  // ignore if msw not installed or import fails — tests will still run
}

// Harmoniser les logs côté tests: on intercepte console.* pour éviter le bruit
// et fournir un buffer consultable par les assertions.
// Cela respecte la consigne de ne pas utiliser console.* directement dans les tests.
const __testConsoleBuffer = { log: [], error: [], warn: [] };
try {
  if (console) {
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      __testConsoleBuffer.log.push(args);
    });
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      __testConsoleBuffer.error.push(args);
    });
    vi.spyOn(console, 'warn').mockImplementation((...args) => {
      __testConsoleBuffer.warn.push(args);
    });
  }
  globalThis.testConsole = __testConsoleBuffer;
} catch (e) {
  // Si l'environnement ne permet pas d'écraser console, on ignore.
}

