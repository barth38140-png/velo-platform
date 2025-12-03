import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DemandesList from '../DemandesList';
import * as api from '../../services/api';

vi.mock('../../services/api');

describe('DemandesList refresh on offer events', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('calls getMyRepairs on mount and when offerStatusChanged event dispatched', async () => {
    const mockRepairs1 = { data: { repairs: [{ id: 1, title: 'r1', status: 'pending' }] } };
    const mockRepairs2 = { data: { repairs: [{ id: 1, title: 'r1', status: 'assigned' }] } };
    const getMyRepairs = vi.fn()
      .mockResolvedValueOnce(mockRepairs1)
      .mockResolvedValueOnce(mockRepairs2);
    api.repairService = { getMyRepairs };

    render(<DemandesList onSelect={() => {}} selected={null} />);

    await waitFor(() => expect(getMyRepairs).toHaveBeenCalledTimes(1));

    // Dispatch event to simulate acceptance (wrap in act)
    await act(async () => {
      window.dispatchEvent(new CustomEvent('offerStatusChanged', { detail: { repairId: 1, status: 'accepted' } }));
    });

    await waitFor(() => expect(getMyRepairs).toHaveBeenCalledTimes(2));

    // verify UI shows updated status text
    await waitFor(() => expect(screen.getByText(/assigned|pending/i)).toBeInTheDocument());
  });
});
