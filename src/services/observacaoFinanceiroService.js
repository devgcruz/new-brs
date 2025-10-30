import { makeAuthenticatedRequest } from '../config/api';

const observacaoFinanceiroService = {
  /**
   * Buscar observações de um lançamento financeiro
   */
  async getObservacoesFinanceiro(financeiroId) {
    try {
      console.log('🔍 observacaoFinanceiroService: Buscando observações para financeiroId:', financeiroId);
      const response = await makeAuthenticatedRequest(`/financeiros/${financeiroId}/observacoes`);
      console.log('📥 observacaoFinanceiroService: Resposta recebida:', response);
      return response;
    } catch (error) {
      console.error('❌ observacaoFinanceiroService: Erro ao buscar observações do lançamento financeiro:', error);
      throw error;
    }
  },

  /**
   * Criar nova observação para um lançamento financeiro
   */
  async createObservacaoFinanceiro(financeiroId, data) {
    try {
      const response = await makeAuthenticatedRequest(`/financeiros/${financeiroId}/observacoes`, {
        method: 'POST',
        body: data
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar observação do lançamento financeiro:', error);
      throw error;
    }
  },

  /**
   * Excluir observação de um lançamento financeiro
   */
  async deleteObservacaoFinanceiro(observacaoId) {
    try {
      const response = await makeAuthenticatedRequest(`/observacoes-financeiro/${observacaoId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao excluir observação do lançamento financeiro:', error);
      throw error;
    }
  },

  /**
   * Upload de foto para observação
   */
  async uploadFotoObservacao(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'observacao_financeiro');

      const response = await makeAuthenticatedRequest('/upload', {
        method: 'POST',
        body: formData
      });
      return response;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    }
  }
};

export default observacaoFinanceiroService;
