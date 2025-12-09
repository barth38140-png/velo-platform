import { AuthContext } from '../src/context/AuthContext';
import { ExploreRepairs } from '../src/pages/ExploreRepairs';
import { render, screen, waitFor } from '@testing-library/react';

import { vi } from 'vitest';
import * as api from '../src/services/api';

// Mock API
vi.spyOn(api.repairService, 'getPendingRepairs').mockResolvedValue({ data: { repairs: [
  { id: 1, title: 'Test Réparation', description: 'Test desc', bike_type: 'VTT', location_address: 'Grenoble', main_need: 'Freins', client_name: 'Alice', urgent: true, created_at: new Date().toISOString() }
] } });

const user = { id: 42, role: 'repairer', name: 'Testeur' };

describe('ExploreRepairs intégration', () => {
  it('affiche les demandes à explorer et le bouton offre', async () => {
    render(
      <AuthContext.Provider value={{ user }}>
        <ExploreRepairs />
      </AuthContext.Provider>
    );
    await waitFor(() => expect(screen.getByText('Test Réparation')).toBeInTheDocument());
    expect(screen.getByText('Proposer une offre')).toBeInTheDocument();
  });
});
