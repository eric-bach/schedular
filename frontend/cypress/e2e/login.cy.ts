/// <reference types="Cypress" />

describe('Launch App', () => {
  it('should display app', () => {
    cy.visit('/');

    cy.contains('Welcome to the SPA');
  });
});
