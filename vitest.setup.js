console.info('✅ Setup Vitest chargé');
import React from 'react';
import { vi, expect as vitestExpect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

globalThis.expect = vitestExpect;
import '@testing-library/jest-dom';
globalThis.React = React;
globalThis.renderWithRouter = (ui, options) => {
  return render(ui, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>, ...options });
};

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

const _mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => _mockNavigate
  };
});
