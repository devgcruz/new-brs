// cypress/e2e/novoRegistroEdgeCases.cy.js

/**
 * Testes para casos extremos e cenários especiais do modal "Novo Registro de Entrada"
 * Inclui testes de limite, caracteres especiais, validações complexas e integração
 */

describe('Novo Registro de Entrada - Casos Extremos e Integração', () => {
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
      fixture: 'formDataCompleto.json'
    }).as('getFormData');

    cy.visit('/registros');
    cy.wait('@getEntradas');
    cy.wait('@getFormData');
  });

  describe('Testes de Limite de Caracteres', () => {
    it('deve aceitar texto longo na observação inicial', () => {
      const observacaoLonga = 'Este é um teste de observação muito longa que contém várias informações importantes sobre o veículo. ' +
        'O veículo apresenta avarias significativas na lateral esquerda, incluindo amassados profundos na porta do motorista. ' +
        'Além disso, há riscos extensos ao longo de todo o lado esquerdo do veículo. ' +
        'O para-choque dianteiro também apresenta danos consideráveis. ' +
        'Recomenda-se uma avaliação detalhada por um perito antes de iniciar os reparos. ' +
        'O proprietário relatou que o acidente ocorreu em uma via expressa durante chuva forte. ' +
        'Todos os documentos do veículo estão em ordem e o seguro está válido.';

      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios
      cy.get('input[label="Data de Entrada"]').type('2023-10-01');
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Preencher observação longa
      cy.get('textarea[label="Observação Inicial"]').type(observacaoLonga);
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });

    it('deve aceitar caracteres especiais nos campos', () => {
      const dadosEspeciais = {
        veiculo: 'Civic Si-R 2.0L Turbo',
        chassi: '9BWZZZZZZZZZZZZZZ-123',
        renavam: '12345678901-AB',
        cor: 'Branco Pérola',
        codSinistro: 'SIN-2023/001',
        numeroBO: 'BO-789.012/2023',
        comarca: 'São Paulo - Capital',
        numeroProcessoJudicial: 'PROC-123.456.789-0',
        notaFiscal: 'NF-345.678/2023',
        numeroVara: 'VARA-001/SP',
        honorario: 'R$ 5.000,00',
        nomeBanco: 'Banco do Brasil S.A.'
      };

      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios
      cy.get('input[label="Data de Entrada"]').type('2023-10-01');
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type(dadosEspeciais.veiculo);
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Preencher campos com caracteres especiais
      cy.get('input[label="Chassi"]').type(dadosEspeciais.chassi);
      cy.get('input[label="RENAVAM"]').type(dadosEspeciais.renavam);
      cy.get('input[label="Cor"]').type(dadosEspeciais.cor);
      cy.get('input[label="Código do Sinistro"]').type(dadosEspeciais.codSinistro);
      cy.get('input[label="Número B.O."]').type(dadosEspeciais.numeroBO);
      
      // Selecionar tipo JUDICIAL para testar campos judiciais
      cy.get('input[label="Tipo"]').type('JUDICIAL');
      
      cy.get('input[label="Comarca"]').type(dadosEspeciais.comarca);
      cy.get('input[label="N° Processo"]').type(dadosEspeciais.numeroProcessoJudicial);
      cy.get('input[label="Nota Fiscal"]').type(dadosEspeciais.notaFiscal);
      cy.get('input[label="N° Vara"]').type(dadosEspeciais.numeroVara);
      cy.get('input[label="Honorário"]').type(dadosEspeciais.honorario);
      cy.get('input[label="Nome Banco"]').type(dadosEspeciais.nomeBanco);
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });
  });

  describe('Testes de Validação de Datas', () => {
    it('deve aceitar data muito antiga', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('input[label="Data de Entrada"]').type('1990-01-01');
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Verificar se não há erro de validação
      cy.get('input[label="Data de Entrada"]').should('not.have.class', 'Mui-error');
    });

    it('deve aceitar data futura', () => {
      const dataFutura = new Date();
      dataFutura.setFullYear(dataFutura.getFullYear() + 1);
      const dataFuturaStr = dataFutura.toISOString().split('T')[0];

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('input[label="Data de Entrada"]').type(dataFuturaStr);
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Verificar se não há erro de validação
      cy.get('input[label="Data de Entrada"]').should('not.have.class', 'Mui-error');
    });

    it('deve aceitar data de pagamento futura em campos judiciais', () => {
      const dataPagamentoFutura = new Date();
      dataPagamentoFutura.setMonth(dataPagamentoFutura.getMonth() + 6);
      const dataPagamentoFuturaStr = dataPagamentoFutura.toISOString().split('T')[0];

      cy.intercept('POST', '**/api/entradas', {
        statusCode: 201,
        body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
      }).as('createEntrada');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher campos obrigatórios
      cy.get('input[label="Data de Entrada"]').type('2023-10-01');
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      
      // Selecionar tipo JUDICIAL
      cy.get('input[label="Tipo"]').type('JUDICIAL');
      
      // Preencher data de pagamento futura
      cy.get('input[label="DT Pagto"]').type(dataPagamentoFuturaStr);
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntrada');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });
  });

  describe('Testes de Autocomplete e Dropdowns', () => {
    it('deve funcionar com seleção de marca via autocomplete', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Testar autocomplete de marca
      cy.get('input[label="Marca"]').type('Hon');
      cy.contains('Honda').should('be.visible');
      cy.contains('Honda').click();
      
      // Verificar se valor foi selecionado
      cy.get('input[label="Marca"]').should('have.value', 'Honda');
    });

    it('deve funcionar com seleção de seguradora via autocomplete', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Testar autocomplete de seguradora
      cy.get('input[label="Seguradora"]').type('Azul');
      cy.contains('Azul Seguros').should('be.visible');
      cy.contains('Azul Seguros').click();
      
      // Verificar se valor foi selecionado
      cy.get('input[label="Seguradora"]').should('have.value', 'Azul Seguros');
    });

    it('deve funcionar com seleção de colaborador via autocomplete', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Testar autocomplete de colaborador
      cy.get('input[label="Colaborador"]').type('João');
      cy.contains('João Silva').should('be.visible');
      cy.contains('João Silva').click();
      
      // Verificar se valor foi selecionado
      cy.get('input[label="Colaborador"]').should('have.value', 'João Silva');
    });

    it('deve funcionar com seleção de posição via autocomplete', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Testar autocomplete de posição
      cy.get('input[label="Posição"]').type('Pátio');
      cy.contains('Pátio A').should('be.visible');
      cy.contains('Pátio A').click();
      
      // Verificar se valor foi selecionado
      cy.get('input[label="Posição"]').should('have.value', 'Pátio A');
    });
  });

  describe('Testes de UF e Cidade', () => {
    it('deve funcionar com seleção de UF e Cidade do Sinistro', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Testar UF do Sinistro
      cy.get('input[label="UF do Sinistro"]').type('SP');
      cy.contains('SP').should('be.visible');
      cy.contains('SP').click();
      
      // Testar Cidade do Sinistro
      cy.get('input[label="Cidade do Sinistro"]').type('São Paulo');
      cy.contains('São Paulo').should('be.visible');
      cy.contains('São Paulo').click();
      
      // Verificar se valores foram selecionados
      cy.get('input[label="UF do Sinistro"]').should('have.value', 'SP');
      cy.get('input[label="Cidade do Sinistro"]').should('have.value', 'São Paulo');
    });

    it('deve funcionar com seleção de UF e Cidade de Localização', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Testar UF de Localização
      cy.get('input[label="UF (Localização)"]').type('RJ');
      cy.contains('RJ').should('be.visible');
      cy.contains('RJ').click();
      
      // Testar Cidade de Localização
      cy.get('input[label="Cidade (Localização)"]').type('Rio de Janeiro');
      cy.contains('Rio de Janeiro').should('be.visible');
      cy.contains('Rio de Janeiro').click();
      
      // Verificar se valores foram selecionados
      cy.get('input[label="UF (Localização)"]').should('have.value', 'RJ');
      cy.get('input[label="Cidade (Localização)"]').should('have.value', 'Rio de Janeiro');
    });
  });

  describe('Testes de Tipo e Situação', () => {
    it('deve permitir seleção de tipo JUDICIAL', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Testar seleção de tipo JUDICIAL
      cy.get('input[label="Tipo"]').type('JUDICIAL');
      cy.contains('JUDICIAL').should('be.visible');
      cy.contains('JUDICIAL').click();
      
      // Verificar se campos judiciais aparecem
      cy.contains('Dados Judiciais').should('be.visible');
    });

    it('deve permitir seleção de tipo ADM', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Testar seleção de tipo ADM
      cy.get('input[label="Tipo"]').type('ADM');
      cy.contains('ADM').should('be.visible');
      cy.contains('ADM').click();
      
      // Verificar se campos judiciais NÃO aparecem
      cy.contains('Dados Judiciais').should('not.exist');
    });

    it('deve permitir mudança de situação', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Verificar situação padrão
      cy.get('input[label="Situação"]').should('have.value', 'Pendente');
      
      // Testar mudança para Em Andamento
      cy.get('input[label="Situação"]').clear().type('Em Andamento');
      cy.contains('Em Andamento').should('be.visible');
      cy.contains('Em Andamento').click();
      
      // Verificar se valor foi alterado
      cy.get('input[label="Situação"]').should('have.value', 'Em Andamento');
    });
  });

  describe('Testes de Integração com API', () => {
    it('deve enviar todos os campos para a API', () => {
      const dadosCompletos = {
        dataEntrada: '2023-10-01',
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
        tipo: 'JUDICIAL',
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

      cy.intercept('POST', '**/api/entradas', (req) => {
        // Verificar se todos os campos foram enviados
        expect(req.body).to.include.keys([
          'DATA_ENTRADA', 'MARCA', 'VEICULO', 'PLACA', 'CHASSI', 'RENAVAM', 'COR',
          'ANO_VEIC', 'ANO_MODELO', 'SEGURADORA', 'COD_SINISTRO', 'NUM_BO',
          'UF_SINISTRO', 'CIDADE_SINISTRO', 'POSICAO', 'UF', 'CIDADE',
          'NUMERO_PROCESSO', 'TIPO', 'SITUACAO', 'COMARCA', 'NUMERO_PROCESSO_JUDICIAL',
          'NOTA_FISCAL', 'NUMERO_VARA', 'DATA_PAGAMENTO', 'HONORARIO', 'NOME_BANCO',
          'OBSERVACOES'
        ]);
        
        req.reply({
          statusCode: 201,
          body: { success: true, message: 'Registro salvo com sucesso!', data: { id: 1 } }
        });
      }).as('createEntradaCompleta');

      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher todos os campos
      cy.get('input[label="Data de Entrada"]').type(dadosCompletos.dataEntrada);
      cy.get('input[label="Marca"]').type(dadosCompletos.marca);
      cy.get('input[label="Veículo"]').type(dadosCompletos.veiculo);
      cy.get('input[label="Placa"]').type(dadosCompletos.placa);
      cy.get('input[label="Chassi"]').type(dadosCompletos.chassi);
      cy.get('input[label="RENAVAM"]').type(dadosCompletos.renavam);
      cy.get('input[label="Cor"]').type(dadosCompletos.cor);
      cy.get('input[label="Ano do Veículo"]').type(dadosCompletos.anoVeiculo);
      cy.get('input[label="Ano do Modelo"]').type(dadosCompletos.anoModelo);
      cy.get('input[label="Seguradora"]').type(dadosCompletos.seguradora);
      cy.get('input[label="Código do Sinistro"]').type(dadosCompletos.codSinistro);
      cy.get('input[label="Número B.O."]').type(dadosCompletos.numeroBO);
      cy.get('input[label="UF do Sinistro"]').type(dadosCompletos.ufSinistro);
      cy.get('input[label="Cidade do Sinistro"]').type(dadosCompletos.cidadeSinistro);
      cy.get('input[label="Colaborador"]').type(dadosCompletos.colaborador);
      cy.get('input[label="Posição"]').type(dadosCompletos.posicao);
      cy.get('input[label="Número do Processo"]').type(dadosCompletos.numeroProcesso);
      cy.get('input[label="UF (Localização)"]').type(dadosCompletos.uf);
      cy.get('input[label="Cidade (Localização)"]').type(dadosCompletos.cidade);
      cy.get('input[label="Tipo"]').type(dadosCompletos.tipo);
      
      // Campos judiciais
      cy.get('input[label="Comarca"]').type(dadosCompletos.comarca);
      cy.get('input[label="N° Processo"]').type(dadosCompletos.numeroProcessoJudicial);
      cy.get('input[label="Nota Fiscal"]').type(dadosCompletos.notaFiscal);
      cy.get('input[label="N° Vara"]').type(dadosCompletos.numeroVara);
      cy.get('input[label="DT Pagto"]').type(dadosCompletos.dataPagamento);
      cy.get('input[label="Honorário"]').type(dadosCompletos.honorario);
      cy.get('input[label="Nome Banco"]').type(dadosCompletos.nomeBanco);
      
      // Observação inicial
      cy.get('textarea[label="Observação Inicial"]').type(dadosCompletos.observacoes);
      
      cy.contains('button', 'Salvar Registro').click();
      cy.wait('@createEntradaCompleta');
      cy.contains('Registro salvo com sucesso!').should('be.visible');
    });
  });

  describe('Testes de Performance e Carregamento', () => {
    it('deve carregar dados do formulário rapidamente', () => {
      const startTime = Date.now();
      
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      cy.get('[role="dialog"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // Deve carregar em menos de 3 segundos
      });
      
      // Verificar se todos os campos estão disponíveis
      cy.get('input[label="Data de Entrada"]').should('be.visible');
      cy.get('input[label="Marca"]').should('be.visible');
      cy.get('input[label="Veículo"]').should('be.visible');
      cy.get('input[label="Placa"]').should('be.visible');
      cy.get('input[label="Seguradora"]').should('be.visible');
    });

    it('deve manter performance com muitos dados', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Preencher rapidamente vários campos
      cy.get('input[label="Data de Entrada"]').type('2023-10-01');
      cy.get('input[label="Marca"]').type('Honda');
      cy.get('input[label="Veículo"]').type('Civic');
      cy.get('input[label="Placa"]').type(gerarPlacaAleatoria());
      cy.get('input[label="Seguradora"]').type('Azul Seguros');
      cy.get('input[label="Chassi"]').type('9BWZZZZZZZZZZZZZZ');
      cy.get('input[label="RENAVAM"]').type('12345678901');
      cy.get('input[label="Cor"]').type('Branco');
      cy.get('input[label="Ano do Veículo"]').type('2020');
      cy.get('input[label="Ano do Modelo"]').type('2021');
      
      // Verificar se não há travamento
      cy.get('input[label="Código do Sinistro"]').should('be.visible');
      cy.get('input[label="Número B.O."]').should('be.visible');
    });
  });

  describe('Testes de Acessibilidade', () => {
    it('deve ter labels adequados para screen readers', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Verificar se campos têm labels apropriados
      cy.get('input[label="Data de Entrada"]').should('have.attr', 'aria-label');
      cy.get('input[label="Marca"]').should('have.attr', 'aria-label');
      cy.get('input[label="Veículo"]').should('have.attr', 'aria-label');
      cy.get('input[label="Placa"]').should('have.attr', 'aria-label');
      cy.get('input[label="Seguradora"]').should('have.attr', 'aria-label');
    });

    it('deve ter navegação por teclado funcional', () => {
      cy.get('button[aria-label="adicionar novo registro"]').click();
      
      // Testar navegação por Tab
      cy.get('input[label="Data de Entrada"]').focus();
      cy.get('input[label="Data de Entrada"]').tab();
      cy.get('input[label="Marca"]').should('be.focused');
      
      cy.get('input[label="Marca"]').tab();
      cy.get('input[label="Veículo"]').should('be.focused');
    });
  });
});
