// cypress/e2e/testeLoginSimples.cy.js

describe('Teste de Login Simples', () => {
  it('deve fazer login com sucesso', () => {
    cy.visit('/login');
    
    // Aguardar a animação terminar - verificar se o card está visível
    cy.get('.login-card', { timeout: 15000 }).should('be.visible');
    
    // Aguardar um pouco mais para garantir que a animação terminou
    cy.wait(2000);
    
    // Verificar se os campos estão visíveis
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    
    // Preencher e submeter
    cy.get('input[name="username"]').type('guilherme.cruz');
    cy.get('input[name="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    
    // Verificar redirecionamento
    cy.url().should('include', '/dashboard');
  });
});
