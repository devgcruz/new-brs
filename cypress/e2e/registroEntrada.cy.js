// cypress/e2e/registroEntrada.cy.js

/**
 * Gera uma placa de veículo aleatória no formato Mercosul (LLLNLNN).
 * @returns {string} Uma placa aleatória, ex: "RVF4A21".
 */
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

describe('Fluxo Completo e Detalhado do Registro de Entrada', () => {
    const placaAleatoria = gerarPlacaAleatoria();
    const veiculo = {
        marca: 'Honda',
        modelo: 'Civic',
        placa: placaAleatoria,
        dataEntrada: '2023-11-20',
        seguradora: 'Azul Seguros'
    };
    let registroId = 1;

    beforeEach(() => {
        cy.session('usuarioLogado', () => {
            cy.log('**Executando login pela interface...**');
            cy.intercept('POST', '**/api/login').as('loginRequest');
            cy.intercept('GET', '**/api/me').as('getMe');

            cy.visit('/login');

            // Aguardar a animação terminar e o elemento ficar visível
            cy.contains('h1', 'Bernardo', { timeout: 10000 }).should('be.visible');

            // Agora que temos certeza que estamos na página certa, podemos prosseguir.
            cy.get('input[name="username"]').type('guilherme.cruz');
            cy.get('input[name="password"]').type('123456');
            cy.get('button[type="submit"]').click();

            cy.wait('@loginRequest');
            cy.wait('@getMe');
            cy.url().should('include', '/dashboard');
        });

        // Prepara o ambiente para o teste da página de registros
        cy.intercept('GET', '**/api/entradas?**', {
            statusCode: 200,
            body: { success: true, data: [], meta: { total: 0 } },
        }).as('getEntradasInicial');

        cy.intercept('GET', '**/api/form-data/registros', {
            statusCode: 200,
            fixture: 'formData.json'
        }).as('getFormData');

        cy.visit('/registros');
        cy.url().should('include', '/registros');
        cy.wait('@getEntradasInicial');
    });

    it('deve realizar o fluxo completo: criar, buscar, adicionar observação, adicionar financeiro, editar e excluir', () => {

        // --- 1. CRIAR NOVO REGISTRO ---
        cy.log('**Iniciando: Criação de Registro**');

        cy.intercept('POST', '**/api/entradas', {
            statusCode: 201,
            body: { success: true, message: 'Registro criado com sucesso!', data: { id: registroId, ...veiculo } },
        }).as('createEntrada');

        cy.intercept('GET', '**/api/entradas?**', {
            statusCode: 200,
            body: {
                success: true,
                data: [{ id: registroId, ...veiculo, situacao: 'Pendente', colaborador: { nome: 'Funcionário Teste' } }],
                meta: { total: 1 }
            }
        }).as('getEntradasAfterCreate');

        cy.get('button[aria-label="adicionar novo registro"]').click();

        cy.get('input[label="Data de Entrada"]').type(veiculo.dataEntrada);
        cy.get('input[name="marca"]').type(veiculo.marca);
        cy.get('input[label="Veículo"]').type(veiculo.modelo);
        cy.get('input[label="Placa"]').type(veiculo.placa);
        cy.get('input[name="seguradora"]').type(veiculo.seguradora);

        cy.contains('button', 'Salvar Registro').click();
        cy.wait('@createEntrada');
        cy.contains('Registro criado com sucesso!').should('be.visible');
        cy.wait('@getEntradasAfterCreate');

        // --- 2. BUSCAR O REGISTRO CRIADO ---
        cy.log('**Iniciando: Busca do Registro**');
        
        cy.get('input[placeholder*="Buscar por placa"]').type(veiculo.placa);
        cy.get('.MuiCard-root').should('have.length', 1);
        cy.contains('.MuiCard-root', veiculo.placa).should('be.visible');

        // --- 3. ADICIONAR OBSERVAÇÃO E FINANCEIRO ---
        cy.log('**Iniciando: Adicionar Observação e Financeiro**');
        
        cy.intercept('GET', `**/api/entradas/${registroId}/observacoes`, { body: { success: true, data: [] } }).as('getObservacoes');
        cy.intercept('POST', `**/api/entradas/${registroId}/observacoes`, { statusCode: 201, body: { success: true, data: { id: 10, texto: 'Veículo com avarias na lateral.' } } }).as('postObservacao');
        cy.intercept('GET', `**/api/entradas/${registroId}/financeiros`, { body: { success: true, data: [] } }).as('getFinanceiros');
        cy.intercept('POST', `**/api/entradas/${registroId}/financeiros`, { statusCode: 201, body: { success: true, data: { id: 20, descricao: 'Pagamento Guincho', valor: '150.00' } } }).as('postFinanceiro');

        cy.contains('.MuiCard-root', veiculo.placa).click();

        cy.contains('button', 'Observações').click();
        cy.wait('@getObservacoes');
        
        const novaObservacao = 'Veículo com avarias na lateral esquerda.';
        cy.get('textarea[placeholder*="Digite uma nova observação"]').type(novaObservacao);
        cy.contains('button', 'Adicionar').click();

        cy.wait('@postObservacao');
        cy.contains(novaObservacao).should('be.visible');

        cy.contains('button', 'Financeiro').click();
        cy.wait('@getFinanceiros');

        cy.get('input[name="descricao"]').type('Pagamento Guincho');
        cy.get('input[name="valor"]').type('15000');
        cy.contains('button', 'Adicionar Lançamento').click();
        
        cy.wait('@postFinanceiro');
        cy.contains('td', 'Pagamento Guincho').should('be.visible');
        cy.contains('td', 'R$ 150,00').should('be.visible');

        // --- 4. EDITAR O REGISTRO PRINCIPAL ---
        cy.log('**Iniciando: Edição do Registro**');

        cy.intercept('PUT', `**/api/entradas/${registroId}`, {
            statusCode: 200,
            body: { success: true, message: 'Registro atualizado com sucesso!' }
        }).as('updateEntrada');

        cy.contains('button', 'Dados do Registro').click();
        
        cy.get('input[label="Situação"]').parent().click();
        cy.get('li[data-option-index="1"]').click();

        cy.contains('button', 'Salvar Alterações').click();
        cy.wait('@updateEntrada');
        cy.contains('Registro atualizado com sucesso!').should('be.visible');

        // --- 5. EXCLUIR O REGISTRO ---
        cy.log('**Iniciando: Exclusão do Registro**');

        cy.intercept('DELETE', `**/api/entradas/${registroId}`, {
            statusCode: 200,
            body: { success: true, message: 'Registro excluído com sucesso' }
        }).as('deleteEntrada');
        
        cy.intercept('GET', '**/api/entradas?**', {
            statusCode: 200,
            body: { success: true, data: [], meta: { total: 0 } },
        }).as('getEntradasAfterDelete');

        cy.contains('.MuiCard-root', veiculo.placa).click();
        cy.get('button[title="Excluir registro"]').click();
        cy.get('div[role="dialog"]').contains('button', 'Excluir').click();

        cy.wait('@deleteEntrada');
        cy.contains('Registro excluído com sucesso!').should('be.visible');
        cy.wait('@getEntradasAfterDelete');
        cy.contains('.MuiCard-root', veiculo.placa).should('not.exist');
        cy.contains('Nenhum registro encontrado').should('be.visible');
    });
});