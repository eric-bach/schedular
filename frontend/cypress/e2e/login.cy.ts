/// <reference types="Cypress" />

describe('Launch App', () => {
  it('should display app', () => {
    cy.visit('/');

    cy.contains('Welcome to the SPA');
  });

  Cypress.on('uncaught:exception', (err, runnable) => {
    console.log(err);
    return false;
  });
});
