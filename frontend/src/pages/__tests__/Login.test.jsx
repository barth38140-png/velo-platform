import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

const navigateMock = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(async (email, password) => {
      if (email === 'ok@example.com') return Promise.resolve();
      const err = new Error('bad');
      err.response = { data: { error: 'Invalid credentials' } };
      return Promise.reject(err);
    }),
    loading: false
  })
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock
}));

import { Login } from '../Login';

describe('Login', () => {
  it('submits and navigates on success', async () => {
    const { container } = render(<Login />);

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[type="password"]');

    fireEvent.change(emailInput, { target: { value: 'ok@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error on failed login', async () => {
    const { container } = render(<Login />);

    const emailInput = container.querySelector('input[type="email"]');
    const passwordInput = container.querySelector('input[type="password"]');

    fireEvent.change(emailInput, { target: { value: 'bad@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    const err = await screen.findByText(/Invalid credentials/i);
    expect(err).toBeInTheDocument();
  });
});
