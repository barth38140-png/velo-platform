
import '../../../test/msw/setup';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { authService, repairerService } from '../../services/api';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { Profile } from '../Profile';

const mockUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  phone: '0123456789',
  role: 'repairer'
};

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: vi.fn() })
}));

describe('Profile page', () => {
  beforeEach(() => {
    vi.spyOn(authService, 'getProfile').mockResolvedValue({ data: { user: mockUser } });
    vi.spyOn(repairerService, 'getRepairerProfile').mockResolvedValue({ data: { profile: {
      skills: 'Wheel repair',
      bio: 'I fix bikes',
      rating: 4.2,
      service_radius_km: 20,
      is_available: true,
      id: 1
    } } });
    vi.spyOn(repairerService, 'createProfile').mockResolvedValue({ data: { profile: { id: 1 } } });
    globalThis.localStorage = window.localStorage;
    window.localStorage.setItem('token', 'test-token');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche le nom du profil après chargement', async () => {
    render(<Profile />);
    await waitFor(() => expect(screen.queryByText(/Chargement du profil/i)).toBeNull(), { timeout: 3000 });
    expect(screen.getByDisplayValue('Alice')).toBeTruthy();
  });

  it('loads profile, allows editing repairer profile and saving', async () => {
    const { container } = render(<Profile />);
    await waitFor(() => expect(screen.queryByText(/Chargement du profil/i)).toBeNull(), { timeout: 3000 });
    const nameEl = await screen.findByDisplayValue('Alice');
    expect(nameEl).toBeTruthy();
    await screen.findByText(/Repairer Profile/i);
    await waitFor(() => expect(screen.queryByText(/Chargement du profil/i)).toBeNull(), { timeout: 3000 });
    await waitFor(() => expect(screen.getByDisplayValue('Wheel repair')).toBeTruthy(), { timeout: 2000 });
    const editBtn = await screen.findByRole('button', { name: /Edit Profile/i });
    const user = userEvent.setup();
    await user.click(editBtn);
    await waitFor(() => expect(screen.getByDisplayValue('Wheel repair')).toBeTruthy());
    const skillsEl = screen.getByDisplayValue('Wheel repair');
    fireEvent.change(skillsEl, { target: { value: 'New skills list' } });
    const saveBtn = screen.getByRole('button', { name: /Enregistrer/i });
    await user.click(saveBtn);
    await waitFor(() => {
      expect(repairerService.createProfile).toHaveBeenCalledWith(
        'New skills list',
        'I fix bikes',
        20,
        true
      );
    });
    await waitFor(() => expect(screen.getByText(/Repairer profile updated successfully!/i)).toBeInTheDocument());
  });
});

// ...le reste du code et des tests existants...
