/// <reference types="cypress" />

// Test E2E : modification et affichage de la position réparateur

describe('Profil réparateur - Position géographique', () => {
  const email = 'reparateur-demo@velo.com';
  const password = 'demo1234';

  it('Connexion, modification position, sauvegarde et vérification', () => {
    // Connexion
    cy.visit('/login');
    cy.get('input[type=email]').type(email);
    cy.get('input[type=password]').type(password);
    cy.get('button[type=submit]').click();
    cy.url().should('include', '/dashboard');

    // Aller sur le profil
    cy.contains('Profil').click();
    cy.url().should('include', '/dashboard');
    cy.contains('My Profile');

    // Passer en édition
    cy.contains('Edit Profile').click();

    // Modifier la position sur la carte (simuler un clic sur la carte)
    cy.get('.profile-field label').contains('Position géographique').parent().within(() => {
      cy.get('.leaflet-container').click(100, 100); // clic sur la carte
    });

    // Enregistrer
    cy.contains('Enregistrer').click();
    cy.contains('Repairer profile updated successfully!');

    // Recharger la page et vérifier la persistance
    cy.reload();
    cy.contains('Profil').click();
    cy.contains('Adresse sélectionnée :');

    // Vérifier l'affichage sur la carte des réparateurs (client)
    cy.visit('/dashboard?tab=repairers');
    cy.get('.leaflet-container').should('exist');
    // Vérifier qu'un marqueur bleu ou rouge est affiché (selon sélection)
    cy.get('img[alt="marker"]').should('exist');
  });
});
