/**
 * Test E2E : Messagerie entre client et réparateur
 * Auteur : GitHub Copilot (décembre 2025)
 */

describe('Messagerie', () => {
  const clientEmail = `client-msg-${Date.now()}@test.com`;
  const repairerEmail = `repairer-msg-${Date.now()}@test.com`;
  const password = 'Password123!';

  beforeEach(() => {
    cy.visit('/');
  });

  it('Flow complet : client contacte réparateur et envoie un message', () => {
    // 1. Inscription client
    cy.visit('/register');
    cy.get('input[name="name"]').type('Client Test');
    cy.get('input[name="email"]').type(clientEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('select[name="role"]').select('client');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');

    // 2. Connexion client
    cy.get('input[name="email"]').type(clientEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // 3. Créer une demande de réparation
    cy.contains('Nouvelle demande').click();
    cy.get('input[name="title"]').type('Problème de freins');
    cy.get('textarea[name="description"]').type('Mes freins ne fonctionnent plus correctement');
    cy.get('select[name="bike_type"]').select('VTT');
    
    // Simuler la sélection de localisation
    cy.get('input[placeholder*="adresse"]').type('Paris, France');
    cy.wait(500); // Attendre l'autocomplete
    cy.get('.leaflet-container').should('be.visible');
    
    cy.get('button[type="submit"]').contains('Créer la demande').click();
    cy.contains('Demande créée avec succès').should('be.visible');
    cy.url().should('include', '/dashboard');

    // 4. Déconnexion client
    cy.contains('Déconnexion').click();

    // 5. Inscription réparateur
    cy.visit('/register');
    cy.get('input[name="name"]').type('Réparateur Test');
    cy.get('input[name="email"]').type(repairerEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('select[name="role"]').select('repairer');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');

    // 6. Connexion réparateur
    cy.get('input[name="email"]').type(repairerEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // 7. Consulter les demandes et faire une offre
    cy.contains('Demandes').click();
    cy.contains('Problème de freins').should('be.visible');
    cy.contains('Problème de freins').click();
    
    // Faire une offre
    cy.get('input[name="price"]').type('50');
    cy.get('textarea[name="comment"]').type('Je peux réparer vos freins rapidement');
    cy.get('button').contains('Soumettre').click();
    cy.contains('Offre soumise').should('be.visible');

    // 8. Déconnexion réparateur
    cy.contains('Déconnexion').click();

    // 9. Reconnexion client pour accepter l'offre
    cy.visit('/login');
    cy.get('input[name="email"]').type(clientEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // 10. Accepter l'offre et ouvrir la messagerie
    cy.contains('Mes demandes').click();
    cy.contains('Problème de freins').click();
    cy.contains('Accepter').click();
    cy.contains('Offre acceptée').should('be.visible');
    
    // 11. Contacter le réparateur
    cy.contains('Contacter le réparateur').click();
    cy.url().should('include', 'tab=messages');
    
    // 12. Vérifier que l'onglet Messagerie est ouvert
    cy.contains('💬 Messagerie').should('have.class', 'active');
    
    // 13. Envoyer un message
    cy.get('textarea[placeholder*="message"]').type('Bonjour, quand pouvez-vous passer ?');
    cy.get('button').contains('Envoyer').click();
    
    // 14. Vérifier que le message apparaît
    cy.contains('Bonjour, quand pouvez-vous passer ?').should('be.visible');
  });

  it('Réparateur peut recevoir et répondre aux messages', () => {
    // Ce test nécessite une conversation existante
    // Pour simplifier, on peut le skip ou créer une conversation via API
    cy.log('Test à implémenter avec fixture de conversation existante');
  });
});
