import { makeAuthenticatedRequest } from '../config/api';

const observacaoService = {
  /**
   * Buscar observações de uma entrada
   */
  async getObservacoes(entradaId) {
    try {
      const response = await makeAuthenticatedRequest(`/entradas/${entradaId}/observacoes`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar observações:', error);
      throw error;
    }
  },

  /**
   * Criar nova observação
   */
  async createObservacao(entradaId, data) {
    try {
      const response = await makeAuthenticatedRequest(`/entradas/${entradaId}/observacoes`, {
        method: 'POST',
        body: data
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar observação:', error);
      throw error;
    }
  },

  async deleteObservacao(observacaoId) {
    try {
      const response = await makeAuthenticatedRequest(`/observacoes/${observacaoId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao excluir observação:', error);
      throw error;
    }
  }
};

export default observacaoService;
