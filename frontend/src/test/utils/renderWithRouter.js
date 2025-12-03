import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

export function renderWithRouter(ui, options) {
  return render(ui, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>, ...options });
}
