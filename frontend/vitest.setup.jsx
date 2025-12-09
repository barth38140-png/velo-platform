console.info('✅ Setup Vitest chargé');
console.info('✅ Setup Vitest chargé');
import React from 'react';
import { vi, expect as vitestExpect } from 'vitest';
import { renderWithRouter } from './src/test/utils/renderWithRouter.jsx';
import { renderWithProviders } from './src/test/testUtils.jsx';

// Ensure vitest's expect is available for libraries that reference it at import time
globalThis.expect = vitestExpect;

// Now load testing helpers that may reference `expect`
import '@testing-library/jest-dom';

// Expose React globally for modules that expect it
globalThis.React = React;

// Expose the tested utility globally for all test files
globalThis.renderWithRouter = renderWithRouter;
globalThis.renderWithProviders = renderWithProviders;

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

// MSW est maintenant activé globalement pour tous les tests Vitest
import './test/msw/setup';

