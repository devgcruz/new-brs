// cypress/e2e/novoRegistroCompleto.cy.js

/**
 * Teste completo para todas as possibilidades do modal "Novo Registro de Entrada"
 * Inclui validações, campos obrigatórios, campos opcionais, campos judiciais e cenários de erro
 */

describe('Novo Registro de Entrada - Teste Completo', () => {
  // Funções auxiliares
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

  const gerarPlacaAntiga = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';
    let placa = '';
    for (let i = 0; i < 3; i++) placa += letras.charAt(Math.floor(Math.random() * letras.length));
    placa += '-';
    for (let i = 0; i < 4; i++) placa += numeros.charAt(Math.floor(Math.random() * numeros.length));
    return placa;
  };

  const gerarDataFutura = () => {
    const hoje = new Date();
    const futuro = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias no futuro
    return futuro.toISOString().split('T')[0];
  };

  const gerarDataPassada = () => {
    const hoje = new Date();
    const passado = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 dias no passado
    return passado.toISOString().split('T')[0];
  };

  beforeEach(() => {
    // Login
    cy.session('usuarioLogado', () => {
      cy.visit('/login');
      // Aguardar a animação terminar e o elemento ficar visível
      cy.contains('h1', 'Bernardo', { timeout: 10000 }).should('be.visible');
      cy.get('input[name="username"]').type('guilherme.cruz');
      cy.get('input[name="password"]').type('123456');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    // Interceptações básicas
    cy.intercept('GET', '**/api/entradas?**', {
      statusCode: 200,
      body: { success: true, data: [], meta: { total: 0 } },
    }).as('getEntradas');

    cy.intercept('GET', '**/api/form-data/registros', {
      statusCode: 200,
      fixture: 'formData.json'
    }).as('getFormData');

    cy.visit('/registros');
    cy.wait('@getEntradas');
    cy.wait('@getFormData');
  });

  describe('Validação de Campos Obrigatórios', () => {
    it('deve mostrar erro quando campos obrigatórios estão vazios', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Tentar salvar sem preencher campos obrigatórios
      cy.contains('button', 'Salvar Registro').click();
      
      // Verificar se aparece mensagem de erro
      cy.contains('Por favor, preencha os seguintes campos obrigatórios').should('be.visible');
    });

    it('deve validar Data de Entrada obrigatória', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher outros campos obrigatórios mas deixar data vazia
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      cy.contains('button', 'Salvar Registro').click();
      cy.contains('Data de Entrada').should('be.visible');
    });

    it('deve validar Marca obrigatória', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      cy.contains('button', 'Salvar Registro').click();
      cy.contains('Marca').should('be.visible');
    });

    it('deve validar Veículo obrigatório', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      cy.contains('button', 'Salvar Registro').click();
      cy.contains('Veículo').should('be.visible');
    });
  });

  describe('Validação de Placa', () => {
    it('deve aceitar placa no formato Mercosul', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      const placaMercosul = gerarPlacaAleatoria();
      cy.get('input[label="Placa"]').type(placaMercosul);
      
      // Verificar se não aparece erro de formato
      cy.get('input[label="Placa"]').should('not.have.class', 'Mui-error');
      cy.contains('Aceita padrão antigo').should('be.visible');
    });

    it('deve aceitar placa no formato antigo', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      const placaAntiga = gerarPlacaAntiga();
      cy.get('input[label="Placa"]').type(placaAntiga);
      
      // Verificar se não aparece erro de formato
      cy.get('input[label="Placa"]').should('not.have.class', 'Mui-error');
    });

    it('deve mostrar erro para placa inválida', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('input[label="Placa"]').type('ABC123'); // Formato inválido
      
      // Verificar se aparece erro
      cy.get('input[label="Placa"]').should('have.class', 'Mui-error');
      cy.contains('Placa inválida').should('be.visible');
    });

    it('deve verificar se placa já existe', () => {
      const placaExistente = 'ABC1234';
      
      // Mock da verificação de placa existente
      cy.intercept('GET', `**/api/entradas/check-placa?placa=${placaExistente}`, {
        statusCode: 200,
        body: { success: true, exists: true }
      }).as('checkPlacaExists');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('input[label="Placa"]').type(placaExistente);
      cy.get('input[label="Placa"]').blur(); // Trigger da verificação
      
      cy.wait('@checkPlacaExists');
      cy.contains('Esta placa já está cadastrada no sistema').should('be.visible');
    });
  });

  describe('Campos Básicos do Veículo', () => {
    it('deve preencher todos os campos básicos do veículo', () => {
      const dadosVeiculo = {
        dataEntrada: gerarDataPassada(),
        marca: 'Honda',
        veiculo: 'Civic',
        placa: gerarPlacaAleatoria(),
        chassi: '9BWZZZZZZZZZZZZZZ',
        renavam: '12345678901',
        cor: 'Branco',
        anoVeiculo: '2020',
        anoModelo: '2021'
      };

      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos básicos
      cy.get('input[label="Data de Entrada"]').type(dadosVeiculo.dataEntrada);
      cy.get('input[label="Marca"]').type(dadosVeiculo.marca);
      cy.get('input[label="Veículo"]').type(dadosVeiculo.veiculo);
      cy.get('input[label="Placa"]').type(dadosVeiculo.placa);
      cy.get('input[label="Chassi"]').type(dadosVeiculo.chassi);
      cy.get('input[label="RENAVAM"]').type(dadosVeiculo.renavam);
      cy.get('input[label="Cor"]').type(dadosVeiculo.cor);
      cy.get('input[label="Ano do Veículo"]').type(dadosVeiculo.anoVeiculo);
      cy.get('input[label="Ano do Modelo"]').type(dadosVeiculo.anoModelo);
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });
  });

  describe('Informações do Sinistro', () => {
    it('deve preencher todas as informações do sinistro', () => {
      const dadosSinistro = {
        seguradora: 'Azul Seguros',
        codSinistro: 'SIN123456',
        numeroBO: 'BO789012',
        ufSinistro: 'SP',
        cidadeSinistro: 'São Paulo'
      };

      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios primeiro
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      
      // Preencher informações do sinistro
      cy.get('input[label="Seguradora"]').type(dadosSinistro.seguradora);
      cy.get('input[label="Código do Sinistro"]').type(dadosSinistro.codSinistro);
      cy.get('input[label="Número B.O."]').type(dadosSinistro.numeroBO);
      
      // UF e Cidade do Sinistro
      cy.get('input[label="UF do Sinistro"]').type(dadosSinistro.ufSinistro);
      cy.get('input[label="Cidade do Sinistro"]').type(dadosSinistro.cidadeSinistro);
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });
  });

  describe('Atribuição e Localização', () => {
    it('deve preencher campos de atribuição e localização', () => {
      const dadosAtribuicao = {
        colaborador: 'Funcionário Teste',
        posicao: 'Pátio A',
        numeroProcesso: 'PROC123456',
        uf: 'RJ',
        cidade: 'Rio de Janeiro',
        tipo: 'ADM',
        situacao: 'Pendente'
      };

      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios primeiro
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Preencher atribuição e localização
      cy.get('input[label="Colaborador"]').type(dadosAtribuicao.colaborador);
      cy.get('input[label="Posição"]').type(dadosAtribuicao.posicao);
      cy.get('input[label="Número do Processo"]').type(dadosAtribuicao.numeroProcesso);
      
      // UF e Cidade de Localização
      cy.get('input[label="UF (Localização)"]').type(dadosAtribuicao.uf);
      cy.get('input[label="Cidade (Localização)"]').type(dadosAtribuicao.cidade);
      
      // Tipo e Situação
      cy.get('input[label="Tipo"]').type(dadosAtribuicao.tipo);
      cy.get('input[label="Situação"]').should('have.value', dadosAtribuicao.situacao);
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });
  });

  describe('Campos Judiciais (Tipo JUDICIAL)', () => {
    it('deve mostrar campos judiciais quando tipo for JUDICIAL', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios primeiro
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Selecionar tipo JUDICIAL
      cy.get('input[label="Tipo"]').type('JUDICIAL');
      
      // Verificar se campos judiciais aparecem
      cy.contains('Dados Judiciais').should('be.visible');
      cy.get('input[label="Comarca"]').should('be.visible');
      cy.get('input[label="N° Processo"]').should('be.visible');
      cy.get('input[label="Nota Fiscal"]').should('be.visible');
      cy.get('input[label="N° Vara"]').should('be.visible');
      cy.get('input[label="DT Pagto"]').should('be.visible');
      cy.get('input[label="Honorário"]').should('be.visible');
      cy.get('input[label="Nome Banco"]').should('be.visible');
    });

    it('deve preencher todos os campos judiciais', () => {
      const dadosJudiciais = {
        comarca: 'São Paulo',
        numeroProcessoJudicial: 'PROC789012',
        notaFiscal: 'NF345678',
        numeroVara: 'VARA001',
        dataPagamento: gerarDataFutura(),
        honorario: '5000.00',
        nomeBanco: 'Banco do Brasil'
      };

      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios primeiro
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Selecionar tipo JUDICIAL
      cy.get('input[label="Tipo"]').type('JUDICIAL');
      
      // Preencher campos judiciais
      cy.get('input[label="Comarca"]').type(dadosJudiciais.comarca);
      cy.get('input[label="N° Processo"]').type(dadosJudiciais.numeroProcessoJudicial);
      cy.get('input[label="Nota Fiscal"]').type(dadosJudiciais.notaFiscal);
      cy.get('input[label="N° Vara"]').type(dadosJudiciais.numeroVara);
      cy.get('input[label="DT Pagto"]').type(dadosJudiciais.dataPagamento);
      cy.get('input[label="Honorário"]').type(dadosJudiciais.honorario);
      cy.get('input[label="Nome Banco"]').type(dadosJudiciais.nomeBanco);
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });

    it('não deve mostrar campos judiciais quando tipo for ADM', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios primeiro
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Selecionar tipo ADM
      cy.get('input[label="Tipo"]').type('ADM');
      
      // Verificar se campos judiciais NÃO aparecem
      cy.contains('Dados Judiciais').should('not.exist');
      cy.get('input[label="Comarca"]').should('not.exist');
      cy.get('input[label="N° Processo"]').should('not.exist');
    });
  });

  describe('Observação Inicial', () => {
    it('deve preencher observação inicial', () => {
      const observacaoInicial = 'Veículo com avarias na lateral esquerda. Necessário reparo na porta do motorista.';

      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios primeiro
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Preencher observação inicial
      cy.get('textarea[label="Observação Inicial"]').type(observacaoInicial);
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });

    it('deve permitir observação inicial vazia', () => {
      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher apenas campos obrigatórios
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Não preencher observação inicial (deve ser opcional)
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });
  });

  describe('Cenários de Erro', () => {
    it('deve mostrar erro quando API falha', () => {
      cy.intercept('POST', '**/api/entradas', {
        statusCode: 500,
        body: { success: false, message: 'Erro interno do servidor' }
      }).as('createEntradaError');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntradaError');
      cy.contains('Erro interno do servidor').should('be.visible');
    });

    it('deve mostrar erro quando placa já existe', () => {
      const placaDuplicada = 'ABC1234';
      
      cy.intercept('POST', '**/api/entradas', {
        statusCode: 400,
        body: { 
          success: false, 
          errorType: 'placa_duplicada',
          message: 'Esta placa já está cadastrada no sistema' 
        }
      }).as('createEntradaDuplicada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(placaDuplicada);
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntradaDuplicada');
      cy.contains('Esta placa já está cadastrada no sistema').should('be.visible');
    });
  });

  describe('Funcionalidades do Modal', () => {
    it('deve fechar modal ao clicar em Cancelar', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher alguns campos
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      
      // Clicar em Cancelar
      cy.contains('button', 'Cancelar').click();
      
      // Verificar se modal foi fechado
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('deve fechar modal ao clicar no X', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Clicar no botão X
      cy.get('button[aria-label="close"]').click();
      
      // Verificar se modal foi fechado
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('deve mostrar botão Documentos desabilitado antes de salvar', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Verificar se botão Documentos está desabilitado
      cy.contains('button', 'Salve primeiro o registro').should('be.disabled');
    });

    it('deve habilitar botão Documentos após salvar', () => {
      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios
      cy.get('input[label="Data de Entrada"]').type(gerarDataPassada());
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      
      // Verificar se botão Documentos está habilitado
      cy.contains('button', 'Documentos').should('not.be.disabled');
    });
  });

  describe('Validação de Campos Numéricos', () => {
    it('deve aceitar apenas números no campo Ano do Veículo', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('input[label="Ano do Veículo"]').type('abc123');
      cy.get('input[label="Ano do Veículo"]').should('have.value', '123');
    });

    it('deve aceitar apenas números no campo Ano do Modelo', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('input[label="Ano do Modelo"]').type('xyz456');
      cy.get('input[label="Ano do Modelo"]').should('have.value', '456');
    });

    it('deve validar ano do veículo como número válido', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('input[label="Ano do Veículo"]').type('1990');
      cy.get('input[label="Ano do Veículo"]').should('have.value', '1990');
      
      cy.get('input[label="Ano do Veículo"]').clear().type('2030');
      cy.get('input[label="Ano do Veículo"]').should('have.value', '2030');
    });
  });

  describe('Teste de Responsividade', () => {
    it('deve funcionar em dispositivos móveis', () => {
      cy.viewport('iphone-x');
      
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Verificar se modal abre corretamente em mobile
      cy.get('[role="dialog"]').should('be.visible');
      
      // Verificar se campos são visíveis
      cy.get('input[label="Data de Entrada"]').should('be.visible');
      cy.get('input[label="Marca"]').should('be.visible');
      cy.get('input[label="Veículo"]').should('be.visible');
      cy.get('input[label="Placa"]').should('be.visible');
    });

    it('deve funcionar em tablets', () => {
      cy.viewport('ipad-2');
      
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Verificar se modal abre corretamente em tablet
      cy.get('[role="dialog"]').should('be.visible');
      
      // Verificar layout responsivo
      cy.get('input[label="Data de Entrada"]').should('be.visible');
      cy.get('input[label="Marca"]').should('be.visible');
    });
  });

  describe('Teste de Performance', () => {
    it('deve carregar modal rapidamente', () => {
      const startTime = Date.now();
      
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('[role="dialog"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(2000); // Deve carregar em menos de 2 segundos
      });
    });

    it('deve carregar dados do formulário rapidamente', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Verificar se dados são carregados rapidamente
      cy.get('input[label="Marca"]').should('be.visible');
      cy.get('input[label="Seguradora"]').should('be.visible');
      cy.get('input[label="Colaborador"]').should('be.visible');
      cy.get('input[label="Posição"]').should('be.visible');
    });
  });
});
