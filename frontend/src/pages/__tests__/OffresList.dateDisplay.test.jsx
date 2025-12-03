import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import OffresList from '../OffresList';

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    repairOfferService: {
      ...actual.repairOfferService,
      getOffersForRepair: vi.fn(() => Promise.resolve({ data: { offers: [
        { id: 11, repair_request_id: 1, repairer_id: 5, repairer_name: 'Réparateur Alpha', offered_price: 40, estimated_duration_hours: 2, message: 'Disponible mardi matin', status: 'pending', created_at: '2025-12-01T08:00:00Z', scheduled_from: '2025-12-10T09:00:00Z' }
      ] } }))
    }
  };
});

describe("OffresList affiche la date d'intervention", () => {
  it("rend 'Date d'intervention' quand scheduled_from est fourni", async () => {
    const selectedRepair = { id: 1, bike_type: 'VTT' };
    render(<OffresList selectedRepair={selectedRepair} />);

    await waitFor(() => {
      expect(screen.getByText(/Date d'intervention:/i)).toBeInTheDocument();
    });
  });
});
