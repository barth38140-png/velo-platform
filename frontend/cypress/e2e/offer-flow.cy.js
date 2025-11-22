describe('Offer flow (repairer -> client)', () => {
  it('client creates repair, repairer submits offer, client accepts (API-driven)', () => {
    const clientEmail = `client_e2e_${Date.now()}@example.com`;
    const repairerEmail = `repairer_e2e_${Date.now()}@example.com`;
    const password = 'Password123!';

    // Client registers and creates a repair via API helper for stability
    cy.register(clientEmail, password, 'Client E2E', '012345', 'client');
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.createRepair({
      title: 'Frein avant',
      description: 'Frein avant grince fortement.',
      bike_type: 'VTC',
      location_address: 'Lyon',
      location_lat: 45.7640,
      location_lng: 4.8357
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([200, 201]);
      const repairId = resp.body?.repair?.id || resp.body?.id;
      cy.wrap(repairId).as('repairId');
    });

    // Logout client
    cy.get('button').contains('Logout').click();

    // Repairer registers and creates an offer via API
    cy.register(repairerEmail, password, 'Repairer E2E', '09876', 'repairer');
    cy.url().should('include', '/dashboard');
    cy.get('@repairId').then((repairId) => {
      cy.createOffer({ repair_request_id: repairId, offered_price: 50, estimated_duration_hours: 2, message: 'Je peux réparer rapidement.' }).then((oresp) => {
        expect(oresp.status).to.be.oneOf([200, 201]);
        const offerId = oresp.body?.offer?.id || oresp.body?.id;
        cy.wrap(offerId).as('offerId');
      });
    });

    // Logout repairer
    cy.get('button').contains('Logout').click();

    // Client login
    cy.login(clientEmail, password);
    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    // Accept offer via API as client
    cy.get('@offerId').then((offerId) => {
      const apiBase = Cypress.env('API_BASE') || '/api';
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        cy.request({
          method: 'PATCH',
          url: `${apiBase}/repair-offers/${offerId}/status`,
          headers: { Authorization: `Bearer ${token}` },
          body: { status: 'accepted' },
          failOnStatusCode: false
        }).then((patchResp) => {
          expect(patchResp.status).to.be.oneOf([200, 201]);
          cy.log('Offer accepted via API: ' + JSON.stringify(patchResp.body));
        });
      });
    });

    // Verify offer status via API for the client
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      const apiBase = Cypress.env('API_BASE') || '/api';
      cy.request({ method: 'GET', url: `${apiBase}/repair-offers/client-offers`, headers: { Authorization: `Bearer ${token}` }, failOnStatusCode: false }).then((resp) => {
        expect(resp.status).to.equal(200);
        cy.log('Client offers: ' + JSON.stringify(resp.body));
        const offers = resp.body?.offers || [];
        expect(offers.length).to.be.greaterThan(0);
      });
      cy.request({ method: 'GET', url: `${apiBase}/repairs`, headers: { Authorization: `Bearer ${token}` }, failOnStatusCode: false }).then((rresp) => {
        expect(rresp.status).to.equal(200);
        cy.log('Client repairs: ' + JSON.stringify(rresp.body));
      });
    });
  });
});
