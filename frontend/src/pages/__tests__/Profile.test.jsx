import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/utils/renderWithRouter.jsx';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Some components may rely on a global React variable at import time
globalThis.React = React;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'repairer' }, logout: vi.fn() })
}));

// Do NOT mock services/api here: prefer using MSW handlers to simulate network
// so this test exercises the same request flow as the app.

// For stability in the test environment we mock the API module used by the
// component so the test remains deterministic even if MSW isn't intercepting
vi.mock('../../services/api', () => ({
  authService: {
    getProfile: vi.fn(async () => {
      // debug
      // eslint-disable-next-line no-console
      console.log('mock.getProfile called');
      return ({ data: { user: { id: 1, name: 'Alice', email: 'alice@example.com', phone: '0123456789', role: 'repairer' } } });
    })
  },
  repairerService: {
    getRepairerProfile: vi.fn(async () => {
      // debug
      // eslint-disable-next-line no-console
      console.log('mock.getRepairerProfile called');
      return ({ data: { profile: { skills: 'Wheel repair', bio: 'I fix bikes', rating: 4.2, service_radius_km: 20, is_available: true } } });
    }),
    createProfile: vi.fn(async () => ({ data: { profile: { id: 1 } } }))
  }
}));

import { Profile } from '../Profile';

describe('Profile page', () => {
  it('loads profile, allows editing repairer profile and saving', async () => {
    const { container } = renderWithRouter(<Profile />);

    // Wait for the name input to populate from the mocked profile
    const nameEl = await screen.findByDisplayValue('Alice');
    expect(nameEl).toBeTruthy();

    // Verify repairer fields rendered (use findBy to wait for async load)
    await screen.findByText(/Repairer Profile/i);
    // Wait for the loader to disappear before asserting field values
    await waitFor(() => expect(screen.queryByText(/Chargement du profil/i)).toBeNull(), { timeout: 3000 });
    await waitFor(() => expect(screen.getByDisplayValue('Wheel repair')).toBeTruthy(), { timeout: 2000 });

    // Click Edit (wait for the button to be available)
    const editBtn = await screen.findByRole('button', { name: /Edit Profile/i });
    const user = userEvent.setup();
    await user.click(editBtn);

    // Change skills textarea (select by value to be robust)
    await waitFor(() => expect(screen.getByDisplayValue('Wheel repair')).toBeTruthy());
    const skillsEl = screen.getByDisplayValue('Wheel repair');
    await user.clear(skillsEl);
    await user.type(skillsEl, 'New skills list');

    // Click save (Enregistrer)
    const saveBtn = screen.getByRole('button', { name: /Enregistrer/i });
    await user.click(saveBtn);

    // Expect createProfile to have been called with updated values
    const { repairerService } = await import('../../services/api');
    await waitFor(() => {
      expect(repairerService.createProfile).toHaveBeenCalledWith(
        'New skills list',
        'I fix bikes',
        20,
        true
      );
    });

    // Success message from createProfile flow should appear
    await waitFor(() => expect(screen.getByText(/Repairer profile updated successfully!/i)).toBeInTheDocument());
  });
});
