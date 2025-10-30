// cypress/support/novoRegistroCommands.js

/**
 * Comandos customizados do Cypress para testes do Novo Registro de Entrada
 */

// Comando para preencher campos obrigatórios básicos
Cypress.Commands.add('preencherCamposObrigatorios', (dados) => {
  cy.get('input[label="Data de Entrada"]').type(dados.dataEntrada || '2023-10-01');
  cy.get('input[label="Marca"]').type(dados.marca || 'Honda');
  cy.get('input[label="Veículo"]').type(dados.veiculo || 'Civic');
  cy.get('input[label="Placa"]').type(dados.placa || 'ABC1234');
  cy.get('input[label="Seguradora"]').type(dados.seguradora || 'Azul Seguros');
});

// Comando para preencher campos básicos do veículo
Cypress.Commands.add('preencherCamposVeiculo', (dados) => {
  cy.get('input[label="Chassi"]').type(dados.chassi || '9BWZZZZZZZZZZZZZZ');
  cy.get('input[label="RENAVAM"]').type(dados.renavam || '12345678901');
  cy.get('input[label="Cor"]').type(dados.cor || 'Branco');
  cy.get('input[label="Ano do Veículo"]').type(dados.anoVeiculo || '2020');
  cy.get('input[label="Ano do Modelo"]').type(dados.anoModelo || '2021');
});

// Comando para preencher informações do sinistro
Cypress.Commands.add('preencherInformacoesSinistro', (dados) => {
  cy.get('input[label="Código do Sinistro"]').type(dados.codSinistro || 'SIN123456');
  cy.get('input[label="Número B.O."]').type(dados.numeroBO || 'BO789012');
  cy.get('input[label="UF do Sinistro"]').type(dados.ufSinistro || 'SP');
  cy.get('input[label="Cidade do Sinistro"]').type(dados.cidadeSinistro || 'São Paulo');
});

// Comando para preencher atribuição e localização
Cypress.Commands.add('preencherAtribuicaoLocalizacao', (dados) => {
  cy.get('input[label="Colaborador"]').type(dados.colaborador || 'João Silva');
  cy.get('input[label="Posição"]').type(dados.posicao || 'Pátio A');
  cy.get('input[label="Número do Processo"]').type(dados.numeroProcesso || 'PROC123456');
  cy.get('input[label="UF (Localização)"]').type(dados.uf || 'RJ');
  cy.get('input[label="Cidade (Localização)"]').type(dados.cidade || 'Rio de Janeiro');
});

// Comando para preencher campos judiciais
Cypress.Commands.add('preencherCamposJudiciais', (dados) => {
  cy.get('input[label="Tipo"]').type('JUDICIAL');
  cy.get('input[label="Comarca"]').type(dados.comarca || 'São Paulo');
  cy.get('input[label="N° Processo"]').type(dados.numeroProcessoJudicial || 'PROC789012');
  cy.get('input[label="Nota Fiscal"]').type(dados.notaFiscal || 'NF345678');
  cy.get('input[label="N° Vara"]').type(dados.numeroVara || 'VARA001');
  cy.get('input[label="DT Pagto"]').type(dados.dataPagamento || '2024-01-15');
  cy.get('input[label="Honorário"]').type(dados.honorario || '5000.00');
  cy.get('input[label="Nome Banco"]').type(dados.nomeBanco || 'Banco do Brasil');
});

// Comando para preencher observação inicial
Cypress.Commands.add('preencherObservacaoInicial', (observacao) => {
  cy.get('textarea[label="Observação Inicial"]').type(observacao || 'Veículo com avarias na lateral esquerda.');
});

// Comando para salvar registro
Cypress.Commands.add('salvarRegistro', () => {
  cy.contains('button', 'Salvar Registro').click();
});

// Comando para cancelar registro
Cypress.Commands.add('cancelarRegistro', () => {
  cy.contains('button', 'Cancelar').click();
});

// Comando para fechar modal
Cypress.Commands.add('fecharModal', () => {
  cy.get('button[aria-label="close"]').click();
});

// Comando para gerar dados de teste completos
Cypress.Commands.add('gerarDadosCompletos', () => {
  const gerarPlacaAleatoria = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';
    let placa = '';
    for (let i = 0; i < 3; i++) placa += letras.charAt(Math.floor(Math.random() * letras.length));
    placa += numeros.charAt(Math.floor(Math.random() * numeros.length));
    placa += letras.charAt(Math.floor(Math.random() * letras.length));
    for (let i = 0; i < 2; i++) placa += numeros.charAt(Math.floor(Math.random() * numeros.length));
    return placa;
  };

  const gerarDataPassada = () => {
    const hoje = new Date();
    const passado = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
    return passado.toISOString().split('T')[0];
  };

  return {
    dataEntrada: gerarDataPassada(),
    marca: 'Honda',
    veiculo: 'Civic',
    placa: gerarPlacaAleatoria(),
    chassi: '9BWZZZZZZZZZZZZZZ',
    renavam: '12345678901',
    cor: 'Branco',
    anoVeiculo: '2020',
    anoModelo: '2021',
    seguradora: 'Azul Seguros',
    codSinistro: 'SIN123456',
    numeroBO: 'BO789012',
    ufSinistro: 'SP',
    cidadeSinistro: 'São Paulo',
    colaborador: 'João Silva',
    posicao: 'Pátio A',
    numeroProcesso: 'PROC123456',
    uf: 'RJ',
    cidade: 'Rio de Janeiro',
    tipo: 'ADM',
    situacao: 'Pendente',
    comarca: 'São Paulo',
    numeroProcessoJudicial: 'PROC789012',
    notaFiscal: 'NF345678',
    numeroVara: 'VARA001',
    dataPagamento: '2024-01-15',
    honorario: '5000.00',
    nomeBanco: 'Banco do Brasil',
    observacoes: 'Veículo com avarias na lateral esquerda.'
  };
});

// Comando para verificar se modal está aberto
Cypress.Commands.add('verificarModalAberto', () => {
  cy.get('[role="dialog"]').should('be.visible');
  cy.contains('Novo Registro de Entrada').should('be.visible');
});

// Comando para verificar se modal está fechado
Cypress.Commands.add('verificarModalFechado', () => {
  cy.get('[role="dialog"]').should('not.exist');
});

// Comando para verificar mensagem de sucesso
Cypress.Commands.add('verificarSucesso', (mensagem) => {
  cy.contains(mensagem || 'Registro salvo com sucesso!').should('be.visible');
});

// Comando para verificar mensagem de erro
Cypress.Commands.add('verificarErro', (mensagem) => {
  cy.contains(mensagem).should('be.visible');
});

// Comando para verificar campos obrigatórios
Cypress.Commands.add('verificarCamposObrigatorios', () => {
  cy.contains('Por favor, preencha os seguintes campos obrigatórios').should('be.visible');
});

// Comando para verificar validação de placa
Cypress.Commands.add('verificarValidacaoPlaca', (invalida = false) => {
  if (invalida) {
    cy.get('input[label="Placa"]').should('have.class', 'Mui-error');
    cy.contains('Placa inválida').should('be.visible');
  } else {
    cy.get('input[label="Placa"]').should('not.have.class', 'Mui-error');
  }
});

// Comando para verificar campos judiciais visíveis
Cypress.Commands.add('verificarCamposJudiciais', (visivel = true) => {
  if (visivel) {
    cy.contains('Dados Judiciais').should('be.visible');
    cy.get('input[label="Comarca"]').should('be.visible');
    cy.get('input[label="N° Processo"]').should('be.visible');
    cy.get('input[label="Nota Fiscal"]').should('be.visible');
    cy.get('input[label="N° Vara"]').should('be.visible');
    cy.get('input[label="DT Pagto"]').should('be.visible');
    cy.get('input[label="Honorário"]').should('be.visible');
    cy.get('input[label="Nome Banco"]').should('be.visible');
  } else {
    cy.contains('Dados Judiciais').should('not.exist');
    cy.get('input[label="Comarca"]').should('not.exist');
    cy.get('input[label="N° Processo"]').should('not.exist');
    cy.get('input[label="Nota Fiscal"]').should('not.exist');
    cy.get('input[label="N° Vara"]').should('not.exist');
    cy.get('input[label="DT Pagto"]').should('not.exist');
    cy.get('input[label="Honorário"]').should('not.exist');
    cy.get('input[label="Nome Banco"]').should('not.exist');
  }
});

// Comando para verificar botão Documentos
Cypress.Commands.add('verificarBotaoDocumentos', (habilitado = false) => {
  if (habilitado) {
    cy.contains('button', 'Documentos').should('not.be.disabled');
  } else {
    cy.contains('button', 'Salve primeiro o registro').should('be.disabled');
  }
});

// Comando para interceptar criação de entrada
Cypress.Commands.add('interceptarCriacaoEntrada', (statusCode = 201, body = null) => {
  const responseBody = body || {
    success: true,
    message: 'Registro salvo com sucesso!',
    data: { id: 1 }
  };

  cy.intercept('POST', '**/api/entradas', {
    statusCode,
    body: responseBody
  }).as('createEntrada');
});

// Comando para interceptar verificação de placa
Cypress.Commands.add('interceptarVerificacaoPlaca', (placa, existe = false) => {
  cy.intercept('GET', `**/api/entradas/check-placa?placa=${placa}`, {
    statusCode: 200,
    body: { success: true, exists }
  }).as('checkPlacaExists');
});

// Comando para interceptar dados do formulário
Cypress.Commands.add('interceptarDadosFormulario', () => {
  cy.intercept('GET', '**/api/form-data/registros', {
    statusCode: 200,
    fixture: 'formDataCompleto.json'
  }).as('getFormData');
});

// Comando para interceptar listagem de entradas
Cypress.Commands.add('interceptarListagemEntradas', (dados = []) => {
  cy.intercept('GET', '**/api/entradas?**', {
    statusCode: 200,
    body: { success: true, data: dados, meta: { total: dados.length } }
  }).as('getEntradas');
});

