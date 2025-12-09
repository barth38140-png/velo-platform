

import '@testing-library/jest-dom';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ExploreRepairs } from '../ExploreRepairs';

// Mock du hook useAuth pour retourner un utilisateur réparateur
const mockUser = { id: 1, email: 'repairer@test.com', role: 'repairer', name: 'Réparateur Test' };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, token: 'fake-token', loading: false, error: null })
}));

// Mock complet des services utilisés
vi.mock('../../services/api', () => ({
  repairService: {
    getPendingRepairs: vi.fn(async () => ({ data: { repairs: [{
      id: 10,
      title: 'Chaîne cassée',
      description: 'La chaîne est cassée',
      bike_type: 'VTT',
      location_address: 'Paris',
      location_lat: 48.8566,
      location_lng: 2.3522,
      status: 'pending',
      created_at: '2024-06-01T12:00:00Z',
      client_name: 'Client Test'
    }] } })),
  },
  locationService: {
    getLocation: vi.fn(async () => ({ data: { location: { latitude: 48.8566, longitude: 2.3522 } } })),
  },
  repairOfferService: {
    createOffer: vi.fn(async () => ({ data: { offer: { id: 1 } } })),
  }
}));

// Mock du hook useState uniquement pour userLocation
const originalUseState = React.useState;
vi.spyOn(React, 'useState').mockImplementation((init) => {
  // On cible uniquement le state userLocation (null au départ)
  const stack = new Error().stack;
  if (init === null && stack && stack.includes('ExploreRepairs')) {
    return [{ latitude: 48.8566, longitude: 2.3522 }, vi.fn()];
  }
  return originalUseState(init);
});

describe('ExploreRepairs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders repairs and allows opening offer form', async () => {
    const { container } = global.renderWithProviders(<ExploreRepairs />);
    // Attendre l'affichage du titre de la réparation
    const title = await screen.findByText(/Chaîne cassée/i);
    expect(title).toBeTruthy();

    const user = userEvent.setup();

    // Cliquer sur l'item réparation pour ouvrir le détail
    const repairItem = await screen.findByTestId('repair-item-10');
    await user.click(repairItem);

    // Le bouton pour ouvrir le formulaire d'offre est "Proposer une offre"
    const openBtn = await screen.findByRole('button', { name: /Proposer une offre/i });
    await user.click(openBtn);

    // Attendre que le formulaire soit affiché
    const price = await screen.findByLabelText(/Votre devis/i);
    const duration = await screen.findByLabelText(/Durée estimée/i);
    const message = await screen.findByLabelText(/Message/i);

    // Remplacement par fireEvent.change pour robustesse jsdom
    fireEvent.change(price, { target: { value: '25.50' } });
    fireEvent.change(duration, { target: { value: '2' } });
    fireEvent.change(message, { target: { value: 'Je peux réparer votre vélo' } });

    // Soumettre le formulaire
    const submitBtn = container.querySelector('[data-cy="offer-submit-10"]');
    await user.click(submitBtn);

    // Après soumission, le formulaire doit être fermé
    await waitFor(() => expect(container.querySelector('[data-cy="offer-form-10"]')).toBeNull());
  });
});
