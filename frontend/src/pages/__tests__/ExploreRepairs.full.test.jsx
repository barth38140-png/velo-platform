// Mock du hook useState uniquement pour userLocation
const originalUseState = React.useState;
beforeAll(() => {
  vi.spyOn(React, 'useState').mockImplementation((init) => {
    const stack = new Error().stack;
    if (init === null && stack && stack.includes('ExploreRepairs')) {
      return [{ latitude: 48.8566, longitude: 2.3522 }, vi.fn()];
    }
    return originalUseState(init);
  });
});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Utiliser la version globale fournie par le setup Vitest
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'repairer' } })
}));


const mockRepairs = [
  {
    id: 10,
    title: 'Chaîne cassée',
    description: 'La chaîne est cassée',
    bike_type: 'VTT',
    location_address: 'Paris',
    location_lat: 48.8566,
    location_lng: 2.3522,
    status: 'pending'
  }
];

// Do not mock services/api here: use MSW handlers to provide deterministic responses
// For deterministic behavior in the jsdom test environment we mock the API
// module used by the component to avoid relying on network interception.
vi.mock('../../services/api', () => ({
  repairService: {
    getPendingRepairs: vi.fn(async () => ({ data: { repairs: [
      {
        id: 10,
        title: 'Chaîne cassée',
        description: 'La chaîne est cassée',
        bike_type: 'VTT',
        location_address: 'Paris',
        location_lat: 48.8566,
        location_lng: 2.3522,
        status: 'pending'
      }
    ] } }))
  },
  repairOfferService: {
    createOffer: vi.fn(async () => ({ data: { offer: { id: 1 } } }))
  }
}));

import { ExploreRepairs } from '../ExploreRepairs';

describe('ExploreRepairs (integration-like)', () => {
  it('soumet une offre avec dates valides (succès)', async () => {
    const { container } = globalThis.renderWithRouter(<ExploreRepairs />);
    const title = await screen.findByText(/Chaîne cassée/i);
    expect(title).toBeTruthy();
    const user = userEvent.setup();
    const repairItem = await screen.findByRole('heading', { name: /Chaîne cassée/i });
    await user.click(repairItem.closest('.repair-item'));
    const openBtn = await screen.findByRole('button', { name: /Proposer une offre/i });
    await user.click(openBtn);
    const price = await screen.findByLabelText(/Votre devis/i);
    const duration = await screen.findByLabelText(/Durée estimée/i);
    const message = await screen.findByLabelText(/Message au client/i);
    const startDate = await screen.findByLabelText(/Date de début/i);
    const endDate = await screen.findByLabelText(/Date de fin/i);
    fireEvent.change(price, { target: { value: '25.50' } });
    fireEvent.change(duration, { target: { value: '2' } });
    fireEvent.change(message, { target: { value: 'Je peux réparer votre vélo' } });
    fireEvent.change(startDate, { target: { value: '2025-12-08T10:00' } });
    fireEvent.change(endDate, { target: { value: '2025-12-08T12:00' } });
    const submitBtn = container.querySelector('[data-cy="offer-submit-10"]');
    await user.click(submitBtn);
    await waitFor(() => expect(container.querySelector('[data-cy="offer-form-10"]')).toBeNull());
  });

  it('affiche une erreur si la date de fin < date de début', async () => {
    const { container } = globalThis.renderWithRouter(<ExploreRepairs />);
    const title = await screen.findByText(/Chaîne cassée/i);
    expect(title).toBeTruthy();
    const user = userEvent.setup();
    const repairItem = await screen.findByRole('heading', { name: /Chaîne cassée/i });
    await user.click(repairItem.closest('.repair-item'));
    const openBtn = await screen.findByRole('button', { name: /Proposer une offre/i });
    await user.click(openBtn);
    const price = await screen.findByLabelText(/Votre devis/i);
    const duration = await screen.findByLabelText(/Durée estimée/i);
    const message = await screen.findByLabelText(/Message au client/i);
    const startDate = await screen.findByLabelText(/Date de début/i);
    const endDate = await screen.findByLabelText(/Date de fin/i);
    fireEvent.change(price, { target: { value: '25.50' } });
    fireEvent.change(duration, { target: { value: '2' } });
    fireEvent.change(message, { target: { value: 'Je peux réparer votre vélo' } });
    // Dates inversées
    fireEvent.change(startDate, { target: { value: '2025-12-08T12:00' } });
    fireEvent.change(endDate, { target: { value: '2025-12-08T10:00' } });
    const submitBtn = container.querySelector('[data-cy="offer-submit-10"]');
    await user.click(submitBtn);
    // Vérifie le message d'erreur
    await waitFor(() => expect(screen.getByText(/La fin doit être postérieure au début/)).toBeInTheDocument());
  });

  it('affiche une erreur si le format de date est invalide', async () => {
    const { container } = globalThis.renderWithRouter(<ExploreRepairs />);
    const title = await screen.findByText(/Chaîne cassée/i);
    expect(title).toBeTruthy();
    const user = userEvent.setup();
    const repairItem = await screen.findByRole('heading', { name: /Chaîne cassée/i });
    await user.click(repairItem.closest('.repair-item'));
    const openBtn = await screen.findByRole('button', { name: /Proposer une offre/i });
    await user.click(openBtn);
    const price = await screen.findByLabelText(/Votre devis/i);
    const duration = await screen.findByLabelText(/Durée estimée/i);
    const message = await screen.findByLabelText(/Message au client/i);
    const startDate = await screen.findByLabelText(/Date de début/i);
    const endDate = await screen.findByLabelText(/Date de fin/i);
    fireEvent.change(price, { target: { value: '25.50' } });
    fireEvent.change(duration, { target: { value: '2' } });
    fireEvent.change(message, { target: { value: 'Je peux réparer votre vélo' } });
    // Format invalide
    fireEvent.change(startDate, { target: { value: 'invalid' } });
    fireEvent.change(endDate, { target: { value: 'invalid' } });
    const submitBtn = container.querySelector('[data-cy="offer-submit-10"]');
    await user.click(submitBtn);
    // Vérifie le message d'erreur
    await waitFor(() => expect(screen.getByText(/Dates d'intervention invalides/)).toBeInTheDocument());
  });
});
