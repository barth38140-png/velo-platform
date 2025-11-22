// custom commands
Cypress.Commands.add('register', (email, password, name = 'E2E User', phone = '000', role = 'client') => {
  // Create user directly via API to avoid UI routing issues in the test environment
  const apiBase = Cypress.env('API_BASE') || '/api';
  const usersBase = `${apiBase}/users`;
  cy.request({ method: 'POST', url: `${usersBase}/register`, body: { email, password, name, phone, role }, failOnStatusCode: false })
    .then((resp) => {
      if (resp.status === 201 || resp.status === 200) {
            const token = resp.body.token;
            cy.visit('/', {
              onBeforeLoad(win) {
                win.localStorage.setItem('token', token);
                win.history.replaceState({}, '', '/dashboard');
              }
            });
            cy.window().then((win) => win.dispatchEvent(new PopStateEvent('popstate')));
      } else if (resp.status === 409) {
        // user exists, try login
        return cy.request({ method: 'POST', url: `${usersBase}/login`, body: { email, password } }).then((r) => {
              const token = r.body.token;
              cy.visit('/', {
                onBeforeLoad(win) {
                  win.localStorage.setItem('token', token);
                  win.history.replaceState({}, '', '/dashboard');
                }
              });
              cy.window().then((win) => win.dispatchEvent(new PopStateEvent('popstate')));
        });
      } else {
        throw new Error('Failed to register user in e2e helper: ' + JSON.stringify(resp.body));
      }
    });
});

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.intercept('POST', '**/api/users/login').as('loginUser');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.wait('@loginUser', { timeout: 15000 });
});

// Create a repair directly via API using the token stored in localStorage
Cypress.Commands.add('createRepair', (payload) => {
  const apiBase = Cypress.env('API_BASE') || '/api';
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    return cy.request({
      method: 'POST',
      url: `${apiBase}/repairs`,
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
      failOnStatusCode: false,
    });
  });
});

// Create an offer as the currently authenticated repairer
Cypress.Commands.add('createOffer', (payload) => {
  const apiBase = Cypress.env('API_BASE') || '/api';
  return cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    return cy.request({
      method: 'POST',
      url: `${apiBase}/repair-offers`,
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
      failOnStatusCode: false,
    });
  });
});

// Login via API and set token in localStorage (does not rely on UI)
Cypress.Commands.add('loginViaApi', (email, password) => {
  const apiBase = Cypress.env('API_BASE') || '/api';
  return cy.request({ method: 'POST', url: `${apiBase}/users/login`, body: { email, password }, failOnStatusCode: false }).then((resp) => {
    if (resp.status === 200 && resp.body?.token) {
      const token = resp.body.token;
      // set token in localStorage by visiting root and setting before app loads
      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token);
          win.history.replaceState({}, '', '/dashboard');
        }
      });
      cy.window().then((win) => win.dispatchEvent(new PopStateEvent('popstate')));
      return resp;
    }
    throw new Error('loginViaApi failed: ' + JSON.stringify(resp.body));
  });
});

// Common intercept helpers to centralize API routes and aliases
Cypress.Commands.add('interceptPendingRepairs', () => {
  return cy.intercept('GET', '**/repairs/pending-requests**').as('getPendingRepairs');
});

Cypress.Commands.add('interceptClientOffers', () => {
  return cy.intercept('GET', '**/repair-offers/client-offers**').as('getClientOffers');
});

Cypress.Commands.add('interceptPatchOffer', () => {
  return cy.intercept('PATCH', '**/repair-offers/*/status').as('patchOffer');
});

// Intercept endpoints and respond with local fixtures for stable UI tests
Cypress.Commands.add('stubPendingRepairsFixture', () => {
  return cy.intercept('GET', '**/repairs/pending-requests**', { fixture: 'pending-repairs.json' }).as('getPendingRepairs');
});

Cypress.Commands.add('stubClientOffersFixture', () => {
  return cy.intercept('GET', '**/repair-offers/client-offers**', { fixture: 'client-offers.json' }).as('getClientOffers');
});
