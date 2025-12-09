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
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ExploreRepairs } from '../ExploreRepairs';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'repairer' } })
}));

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    repairService: {
      ...actual.repairService,
      getPendingRepairs: () => Promise.resolve({ data: { repairs: [{ id: 1, title: 'Chaîne cassée', description: 'Remplacer la chaîne', bike_type: 'VTT', location_address: 'Rue des vélos', status: 'pending' }] } })
    },
    repairOfferService: {
      ...actual.repairOfferService,
      createOffer: vi.fn(() => Promise.resolve({ data: { success: true } }))
    }
  };
});

describe('ExploreRepairs - envoi de dates d\'intervention', () => {
  it('valide que la date de fin >= début et appelle createOffer avec ISO', async () => {
    render(<ExploreRepairs />);
    // Ouvrir la modale en cliquant sur la réparation
    const item = await screen.findByTestId('repair-item-1');
    fireEvent.click(item);

    const fromInput = await screen.findByLabelText(/Date de début d'intervention/i);
    const toInput = await screen.findByLabelText(/Date de fin d'intervention/i);
    const priceInput = await screen.findByLabelText(/Votre devis/i);
    const durationInput = await screen.findByLabelText(/Durée estimée/i);

    fireEvent.change(priceInput, { target: { value: '50' } });
    fireEvent.change(durationInput, { target: { value: '2' } });
    fireEvent.change(fromInput, { target: { value: '2025-12-10T09:00' } });
    fireEvent.change(toInput, { target: { value: '2025-12-10T11:00' } });

    const submitBtn = await screen.findByRole('button', { name: /Envoyer l'offre/i });
    fireEvent.click(submitBtn);

    const { repairOfferService } = await import('../../services/api');
    expect(repairOfferService.createOffer).toHaveBeenCalled();
    const args = repairOfferService.createOffer.mock.calls.at(-1);
    expect(args[4]).toMatch(/Z$/); // scheduledFrom ISO string
    expect(args[5]).toMatch(/Z$/); // scheduledTo ISO string
  });
});
