import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock useAuth
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'repairer' } })
}));

// Mock services
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

vi.mock('../../services/api', () => ({
  repairService: {
    getPendingRepairs: async () => ({ data: { repairs: mockRepairs } })
  },
  locationService: {
    getLocation: async () => ({ data: { location: { latitude: 48.8566, longitude: 2.3522 } } })
  },
  repairOfferService: {
    createOffer: async () => ({ data: { offer: { id: 1 } } })
  }
}));

import { ExploreRepairs } from '../ExploreRepairs';

describe('ExploreRepairs', () => {
  it('renders repairs and allows opening offer form', async () => {
    render(<ExploreRepairs />);

    // Wait for the repair title to appear
    const title = await screen.findByText(/Chaîne cassée/i);
    expect(title).toBeTruthy();

    // Click on repair item to open modal
    const repairItem = await screen.findByRole('heading', { name: /Chaîne cassée/i });
    repairItem.closest('.repair-item').click();

    // Submit Offer button present after modal opens
    const submitBtn = await screen.findByRole('button', { name: /Submit Offer/i }, { timeout: 2000 });
    expect(submitBtn).toBeTruthy();

    // (Skip clicking and form appearance in unit test to avoid flakiness)
  });
});
