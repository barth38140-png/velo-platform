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

// MSW is now started lazily by importing `frontend/test/msw/setup.js` from
// individual test suites that need network interception. This reduces the
// global setup cost. Example import from a test file:
//   import '../../../test/msw/setup';

