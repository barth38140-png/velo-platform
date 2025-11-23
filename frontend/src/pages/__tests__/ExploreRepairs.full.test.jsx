import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/utils/renderWithRouter.jsx';
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
  it('renders repairs, opens offer form and submits an offer', async () => {
    const { container } = renderWithRouter(<ExploreRepairs />);

    // Wait for repair title to appear
    const title = await screen.findByText(/Chaîne cassée/i);
    expect(title).toBeTruthy();

    // Open the offer form
    const openBtn = await screen.findByRole('button', { name: /Submit Offer/i });
    const user = userEvent.setup();
    await user.click(openBtn);
    // debug: dump container HTML after clicking to inspect DOM
    // eslint-disable-next-line no-console
    console.log('[test-debug] container after click:\n', container.innerHTML);

    // Wait for the form to render and select fields using data-cy attributes
    await waitFor(() => expect(container.querySelector('[data-cy="offer-price-10"]')).not.toBeNull());
    const price = container.querySelector('[data-cy="offer-price-10"]');
    const duration = container.querySelector('[data-cy="offer-duration-10"]');
    const message = container.querySelector('[data-cy="offer-message-10"]');

    await user.clear(price);
    await user.type(price, '25.50');
    await user.clear(duration);
    await user.type(duration, '2');
    await user.clear(message);
    await user.type(message, 'I can fix it');

    // Submit the form
    const submitBtn = container.querySelector('[data-cy="offer-submit-10"]');
    await user.click(submitBtn);

    // After submit, the form should be closed (selectedRepair null)
    await waitFor(() => expect(container.querySelector('[data-cy="offer-form-10"]')).toBeNull());
  });
});
