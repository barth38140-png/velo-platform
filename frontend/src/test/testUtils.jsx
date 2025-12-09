import React from 'react';
import { render } from '@testing-library/react';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

/**
 * Render avec tous les providers nécessaires pour les tests
 */
export function renderWithProviders(ui, options = {}) {
  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
