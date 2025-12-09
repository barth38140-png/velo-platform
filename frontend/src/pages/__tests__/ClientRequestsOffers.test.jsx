import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
// Mock the AuthContext to provide a client user
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, role: 'client', name: 'Test Client' } })
}));

// Mock services
const mockRepairs = [
  { id: 101, title: 'Pneu crevé', location_address: 'Rue A', status: 'open' },
  { id: 102, title: 'Freins', location_address: 'Rue B', status: 'open' }
];

const mockOffersFor101 = [
  { id: 201, repair_title: 'Pneu crevé', repairer_name: 'Repairer One', offered_price: 25, estimated_duration_hours: 1, status: 'pending', message: 'I can do it quickly' }
];

vi.mock('../../services/api', () => ({
  repairService: {
    getMyRepairs: vi.fn(async () => ({ data: { repairs: mockRepairs } }))
  },
  repairOfferService: {
    getOffersForRepair: vi.fn(async (repairId) => ({ data: { offers: repairId === 101 ? mockOffersFor101 : [] } })),
    getClientOffers: vi.fn(async () => ({ data: { offers: [] } })),
    acceptOffer: vi.fn(async () => ({})),
    rejectOffer: vi.fn(async () => ({}))
  }
}));

describe('ClientRequestsOffers (integration smoke)', () => {
  test.todo('renders repairs list and loads offers on selection - component renders empty <div />, needs mock/component diagnosis');
  // Test temporarily disabled: component renders nothing (<div />).
  // TODO: Check if ClientRequestsOffers expects specific routing context, or if mock MSW handlers are missing.
  test('renders repairs list and loads offers on selection', async () => {
    const { default: ClientRequestsOffers } = await import('../ClientRequestsOffers');
    global.renderWithProviders(<ClientRequestsOffers />);

    // wait for repairs to be loaded and rendered
    await waitFor(() => expect(screen.getByText('Pneu crevé')).toBeInTheDocument());

    // By default the first repair should be selected and offers loaded
    expect(screen.getByText('Pneu crevé')).toBeInTheDocument();

    // Cliquer sur 'Voir' pour afficher le détail et les offres
    const voirBtn = screen.getAllByRole('button', { name: /Voir/i })[0];
    fireEvent.click(voirBtn);

    // Vérifier le message d'absence d'offre
    await waitFor(() => expect(screen.getByText(/Vous n'avez pas encore reçu d'offre/i)).toBeInTheDocument());

    // Retour à la liste puis sélection de la deuxième demande
    const retourBtn = screen.getByRole('button', { name: /Retour à la liste/i });
    fireEvent.click(retourBtn);
    const second = screen.getByText('Freins');
    fireEvent.click(second);
    // Ouvrir le détail de la deuxième demande en cliquant sur le titre
    fireEvent.click(screen.getByText('Freins'));
    await waitFor(() => expect(screen.getByText(/Vous n'avez pas encore reçu d'offre/i)).toBeInTheDocument());
    // On vérifie qu'aucune offre n'est affichée pour la deuxième demande
    expect(screen.queryByText('Repairer One')).not.toBeInTheDocument();
  });
});
