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
    removeItem: () => {}
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

// MSW setup — handlers are defined in test/msw/handlers.js
try {
  // Avoid starting MSW more than once per worker
  if (!globalThis.__MSW_SERVER_SETUP__) {
    globalThis.__MSW_SERVER_SETUP__ = true;
    try {
      // Prefer a direct dynamic import so errors are visible in test output
      const mod = await import('./test/msw/server.js');
      const { server } = mod;
      beforeAll(() => {
        server.listen({ onUnhandledRequest: 'warn' });
        // eslint-disable-next-line no-console
        console.log('MSW server started for tests');
      });
      afterEach(() => server.resetHandlers());
      afterAll(() => server.close());
    } catch (err) {
      // If MSW fails to import/start, surface the error so we can debug
      // eslint-disable-next-line no-console
      console.error('Failed to start MSW server in vitest.setup.js:', err);
      throw err;
    }
  }
} catch (err) {
  // If msw isn't installed, tests will continue without network mocking
}
