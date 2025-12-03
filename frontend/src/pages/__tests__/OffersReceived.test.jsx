import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Expose React globally in case a module's compiled output references it
globalThis.React = React;

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 2, role: 'client' } })
}));

// Mock socket to avoid attempting real socket connections
vi.mock('../../services/socket', () => ({
  socket: { on: vi.fn(), off: vi.fn() }
}));

// Mock repairOfferService to avoid network/auth issues in unit tests
// For deterministic behavior in unit tests we mock the API module here. MSW
// can be used for integration tests, but mocking the service keeps this test
// stable in the jsdom environment where XHR interception can be flaky.
vi.mock('../../services/api', () => ({
  repairOfferService: {
    getClientOffers: vi.fn(async () => ({ data: { offers: [
      { id: 5, repair_title: 'Flat tire', repairer_name: 'Bob', status: 'pending', price: 15, duration: 2, message: 'I can do it' }
    ] } })),
    acceptOffer: vi.fn(async () => ({ data: { ok: true } })),
    rejectOffer: vi.fn(async () => ({ data: { ok: true } }))
  }
}));

import { OffersReceived } from '../OffersReceived';

describe('OffersReceived page', () => {
  it('renders offers and accepts an offer', async () => {
    render(<OffersReceived />);

    // Wait for the offer title to appear
    const title = await screen.findByText(/Flat tire/i);
    expect(title).toBeTruthy();

    // Click accept button
    const acceptBtn = await screen.findByRole('button', { name: /Accepter/i });
    fireEvent.click(acceptBtn);

    // After accepting, MSW will respond and the UI should reflect the accepted status
    await waitFor(() => expect(screen.getByText(/ACCEPTED/i)).toBeTruthy());
  });
});
