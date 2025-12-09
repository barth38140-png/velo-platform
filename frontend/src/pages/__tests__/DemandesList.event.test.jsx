// Mock du hook useRepairs
let repairsData = [{ id: 1, title: 'r1', status: 'assignée' }];
let refreshFn;
vi.mock('../../hooks/useRepairs', () => ({
  useRepairs: () => ({
    repairs: repairsData,
    loading: false,
    error: null,
    refresh: refreshFn
  })
}));


import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock import.meta.env avant tout import du service
if (!import.meta.env) {
  Object.defineProperty(import.meta, 'env', {
    value: { VITE_API_URL: 'http://localhost:3000/api' },
    writable: true
  });
} else {
  import.meta.env.VITE_API_URL = 'http://localhost:3000/api';
}

// Import du service et du composant après le mock
import DemandesList from '../DemandesList';

// Mock du contexte utilisateur
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'repairer', name: 'Réparateur Test' }, token: 'fake-token', loading: false, error: null })
}));

// Mock complet du service utilisé (évite import.meta.env)
vi.mock('../../services/api', () => ({
  repairService: {
    getMyRepairs: vi.fn().mockResolvedValue({ data: { repairs: [{ id: 1, title: 'r1', status: 'pending' }] } })
  }
}));



describe('DemandesList refresh on offer events', () => {
  beforeEach(() => {
    repairsData = [{ id: 1, title: 'r1', status: 'assignée' }];
    refreshFn = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('appelle refresh du hook lors de offerStatusChanged', async () => {
    global.renderWithProviders(<DemandesList />);
    await waitFor(() => {
      const badges = screen.getAllByText(/assignée/i);
      expect(badges.some(el => el.className.includes('status-badge'))).toBe(true);
    });
    await act(async () => {
      window.dispatchEvent(new CustomEvent('offerStatusChanged', { detail: { repairId: 1, status: 'accepted' } }));
    });
    expect(refreshFn).toHaveBeenCalled();
  });
});

describe('DemandesList rendering', () => {
  test('affiche la demande avec le statut assignée', () => {
    global.renderWithProviders(
      <DemandesList
        repairs={[{ id: 1, title: 'r1', status: 'assignée' }]}
        loading={false}
        error={null}
        onDelete={() => {}}
        onSelect={() => {}}
        selected={null}
        lastUpdated={null}
      />
    );
    const badges = screen.getAllByText(/👤 Assignée/i);
    expect(badges.some(el => el.className.includes('status-badge'))).toBe(true);
  });
});
