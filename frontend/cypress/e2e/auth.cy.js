describe('Auth flow', () => {
  it('can register and login a user', () => {
    const email = `e2e_user_${Date.now()}@example.com`;
    const password = 'Password123!';

    cy.register(email, password, 'E2E Client', '012345', 'client');
    // after register the app should redirect to /dashboard (allow more time)
    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    // ensure user is logged in (logout button visible), then logout and login again
    cy.contains(/Logout|Déconnexion/, { timeout: 5000 }).should('exist').click();
    cy.login(email, password);
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
  });
});
