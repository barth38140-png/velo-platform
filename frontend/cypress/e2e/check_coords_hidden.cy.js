describe('Dashboard - coords hidden', () => {
  it('does not show Lat/Lng on the dashboard MapPicker', () => {
    const email = 'e2e_check_coords@example.com';
    const password = 'Password123!';

    // Ensure user exists and login via API helper (use relative /api so proxy works in all environments)
    const apiBase = Cypress.env('API_BASE') || '/api';
    cy.request({ method: 'POST', url: `${apiBase}/users/register`, body: { email, password, name: 'E2E Check', phone: '000', role: 'client' }, failOnStatusCode: false })
      .then((resp) => {
        // If created or already exists, login via API and set token
        return cy.request({ method: 'POST', url: `${apiBase}/users/login`, body: { email, password } });
      })
      .then((login) => {
        const token = login.body.token;
        cy.visit('/', {
          onBeforeLoad(win) {
            win.localStorage.setItem('token', token);
            win.history.replaceState({}, '', '/dashboard');
          }
        });
        cy.window().then((win) => win.dispatchEvent(new PopStateEvent('popstate')));

        // Wait a moment for dashboard to render
        cy.get('.dashboard-main', { timeout: 20000 }).should('exist');
        // Open the "Nouvelle demande" tab
        cy.contains('➕ Nouvelle demande').click();

        // Assert coords are not present
        cy.get('.map-picker').should('exist');
        cy.get('.coords').should('not.exist');
        cy.contains('Lat:').should('not.exist');
        cy.contains('Lng:').should('not.exist');

        // Take a screenshot for review
        cy.screenshot('dashboard-no-coords');
      });
  });
});
