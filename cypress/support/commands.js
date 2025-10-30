// ***********************************************
// Custom commands for BRS System Tests
// ***********************************************

// Importar comandos específicos do Novo Registro
import './novoRegistroCommands';

// Comando para login padrão
Cypress.Commands.add('login', (username = 'guilherme.cruz', password = '123456') => {
  cy.session('usuarioLogado', () => {
    cy.visit('/login');
    // Aguardar a animação terminar e o elemento ficar visível
    cy.contains('h1', 'Bernardo', { timeout: 10000 }).should('be.visible');
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// Comando para navegar para página de registros
Cypress.Commands.add('navegarParaRegistros', () => {
  cy.intercept('GET', '**/api/entradas?**', {
    statusCode: 200,
    body: { success: true, data: [], meta: { total: 0 } },
  }).as('getEntradas');

  cy.intercept('GET', '**/api/form-data/registros', {
    statusCode: 200,
    fixture: 'formDataCompleto.json'
  }).as('getFormData');

  cy.visit('/registros');
  cy.wait('@getEntradas');
  cy.wait('@getFormData');
});

// Comando para abrir modal de novo registro
Cypress.Commands.add('abrirModalNovoRegistro', () => {
  cy.get('button[aria-label="adicionar novo registro"]').click();
  cy.verificarModalAberto();
});

// Comando para gerar placa aleatória
Cypress.Commands.add('gerarPlacaAleatoria', () => {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  let placa = '';
  for (let i = 0; i < 3; i++) placa += letras.charAt(Math.floor(Math.random() * letras.length));
  placa += numeros.charAt(Math.floor(Math.random() * numeros.length));
  placa += letras.charAt(Math.floor(Math.random() * letras.length));
  for (let i = 0; i < 2; i++) placa += numeros.charAt(Math.floor(Math.random() * numeros.length));
  return placa;
});

// Comando para gerar placa no formato antigo
Cypress.Commands.add('gerarPlacaAntiga', () => {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  let placa = '';
  for (let i = 0; i < 3; i++) placa += letras.charAt(Math.floor(Math.random() * letras.length));
  placa += '-';
  for (let i = 0; i < 4; i++) placa += numeros.charAt(Math.floor(Math.random() * numeros.length));
  return placa;
});

// Comando para gerar data passada
Cypress.Commands.add('gerarDataPassada', (dias = 30) => {
  const hoje = new Date();
  const passado = new Date(hoje.getTime() - (dias * 24 * 60 * 60 * 1000));
  return passado.toISOString().split('T')[0];
});

// Comando para gerar data futura
Cypress.Commands.add('gerarDataFutura', (dias = 30) => {
  const hoje = new Date();
  const futuro = new Date(hoje.getTime() + (dias * 24 * 60 * 60 * 1000));
  return futuro.toISOString().split('T')[0];
});

// Comando para aguardar carregamento completo
Cypress.Commands.add('aguardarCarregamento', () => {
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist');
});

// Comando para verificar se elemento está visível e clicável
Cypress.Commands.add('verificarElementoInterativo', (seletor) => {
  cy.get(seletor).should('be.visible').and('not.be.disabled');
});

// Comando para limpar todos os campos do formulário
Cypress.Commands.add('limparFormulario', () => {
  cy.get('input').clear();
  cy.get('textarea').clear();
});

// Comando para verificar performance de carregamento
Cypress.Commands.add('verificarPerformance', (tempoMaximo = 3000) => {
  const startTime = Date.now();
  cy.then(() => {
    const loadTime = Date.now() - startTime;
    expect(loadTime).to.be.lessThan(tempoMaximo);
  });
});

// Comando para verificar acessibilidade básica
Cypress.Commands.add('verificarAcessibilidade', () => {
  // Verificar se elementos têm labels apropriados
  cy.get('input').each(($input) => {
    cy.wrap($input).should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
  });
  
  // Verificar se botões têm labels apropriados
  cy.get('button').each(($button) => {
    cy.wrap($button).should('have.attr', 'aria-label').or('have.text');
  });
});

// Comando para verificar responsividade
Cypress.Commands.add('verificarResponsividade', (viewport) => {
  cy.viewport(viewport);
  cy.get('[role="dialog"]').should('be.visible');
  cy.get('input[label="Data de Entrada"]').should('be.visible');
  cy.get('input[label="Marca"]').should('be.visible');
  cy.get('input[label="Veículo"]').should('be.visible');
  cy.get('input[label="Placa"]').should('be.visible');
});

// Comando para verificar integração com API
Cypress.Commands.add('verificarIntegracaoAPI', (endpoint, metodo = 'POST') => {
  cy.intercept(metodo, endpoint).as('apiCall');
  cy.wait('@apiCall').then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    expect(interception.response.body).to.have.property('success', true);
  });
});