// custom commands
Cypress.Commands.add('register', (email, password, name = 'E2E User', phone = '000', role = 'client') => {
  cy.visit('/register');
  cy.intercept('POST', '**/api/users/register').as('createUser');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('input[name="name"]').type(name);
  cy.get('input[name="phone"]').type(phone);
  cy.get('select[name="role"]').select(role);
  cy.get('button[type="submit"]').click();
  cy.wait('@createUser', { timeout: 15000 });
});

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.intercept('POST', '**/api/users/login').as('loginUser');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.wait('@loginUser', { timeout: 15000 });
});
