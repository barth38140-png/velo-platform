describe('Create repair flow (client)', () => {
  it('registers a client and creates a repair request (API-driven)', () => {
    const email = `client_${Date.now()}@example.com`;
    const password = 'Password123!';

    const apiBase = Cypress.env('API_BASE') || '/api';

    // Register then login via API, create a repair including lat/lng (simulate map pick), and verify it appears in list
    cy.request('POST', `${apiBase}/users/register`, { email, password, name: 'Client E2E', phone: '012345', role: 'client' })
      .then((reg) => {
        expect([200, 201]).to.include(reg.status);
        return cy.request('POST', `${apiBase}/users/login`, { email, password });
      })
      .then((login) => {
        const token = login.body.token;
        return cy.request({
          method: 'POST',
          url: `${apiBase}/repairs`,
          headers: { Authorization: `Bearer ${token}` },
          body: {
            title: 'Chaîne cassée',
            description: 'La chaîne a cassé après une sortie. Besoin de réparation.',
            bike_type: 'VTT',
            location_lat: 48.8566,
            location_lng: 2.3522,
            location_address: 'Paris'
          }
        }).then((createRes) => {
          expect([200, 201]).to.include(createRes.status);
          return cy.request({ method: 'GET', url: `${apiBase}/repairs`, headers: { Authorization: `Bearer ${token}` } }).then((list) => {
            const found = (list.body.repairs || []).some(r => r.title === 'Chaîne cassée');
            expect(found).to.be.true;
          });
        });
      });
  });
});
