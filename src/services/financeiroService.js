import { makeAuthenticatedRequest } from '../config/api';

const financeiroService = {
  // Buscar todos os lançamentos financeiros
  async getFinanceiros(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/financeiro?${queryString}` : '/financeiro';
      const response = await makeAuthenticatedRequest(url);
      return response;
    } catch (error) {
      console.error('Erro ao buscar financeiros:', error);
      throw error;
    }
  },

  // Buscar lançamentos financeiros por entrada
  async getFinanceirosByEntrada(entradaId) {
    try {
      const response = await makeAuthenticatedRequest(`/entradas/${entradaId}/financeiros`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar financeiros por entrada:', error);
      throw error;
    }
  },

  // Buscar lançamento financeiro específico
  async getFinanceiro(id) {
    try {
      const response = await makeAuthenticatedRequest(`/financeiro/${id}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar financeiro:', error);
      throw error;
    }
  },

  // Criar novo lançamento financeiro
  async createFinanceiro(data) {
    try {
      const response = await makeAuthenticatedRequest('/financeiro', {
        method: 'POST',
        body: data
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar financeiro:', error);
      throw error;
    }
  },

  // Criar lançamento financeiro para entrada específica
  async createFinanceiroForEntrada(entradaId, data) {
    try {
      // Mapear campos do frontend para o que o backend espera
      // Se há valor de recibo, usar como honorários; se há valor de nota fiscal, usar como despesas
      const honorarios = parseFloat(data.VALOR_TOTAL_RECIBO || 0);
      const despesas = parseFloat(data.VALOR_NOTA_FISCAL || 0);
      
      const mappedData = {
        Honorarios: honorarios,
        Vlr_Despesas: despesas,
        StatusPG: data.StatusPG || 'Pendente',
        DATA_NF: data.DATA_NOTA_FISCAL || '',
        OBSERVACOES: data.OBSERVACOES || '',
        NUMERO_RECIBO: data.NUMERO_RECIBO || '',
        data_recibo: data.data_recibo || '',
        DATA_PAGAMENTO_RECIBO: data.DATA_PAGAMENTO_RECIBO || '',
        NUMERO_NOTA_FISCAL: data.NUMERO_NOTA_FISCAL || '',
        DATA_PAGAMENTO_NOTA_FISCAL: data.DATA_PAGAMENTO_NOTA_FISCAL || '',
        status_nota_fiscal: data.status_nota_fiscal || ''
      };
      
      const response = await makeAuthenticatedRequest(`/entradas/${entradaId}/financeiros`, {
        method: 'POST',
        body: mappedData
      });
      
      return response;
    } catch (error) {
      console.error('Erro ao criar financeiro para entrada:', error);
      throw error;
    }
  },

  // Atualizar lançamento financeiro
  async updateFinanceiro(id, data) {
    try {
      const response = await makeAuthenticatedRequest(`/financeiro/${id}`, {
        method: 'PUT',
        body: data
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar financeiro:', error);
      throw error;
    }
  },

  // Excluir lançamento financeiro
  async deleteFinanceiro(id) {
    try {
      const response = await makeAuthenticatedRequest(`/financeiro/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao excluir financeiro:', error);
      throw error;
    }
  },

  // Buscar financeiro por entrada (método antigo - manter para compatibilidade)
  async getByEntrada(entradaId) {
    try {
      const response = await makeAuthenticatedRequest(`/financeiro/entrada/${entradaId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar financeiro por entrada:', error);
      throw error;
    }
  },

  // Estatísticas financeiras
  async getStatistics() {
    try {
      const response = await makeAuthenticatedRequest('/financeiro/statistics');
      return response;
    } catch (error) {
      console.error('Erro ao buscar estatísticas financeiras:', error);
      throw error;
    }
  },

  // Atualizar status de um lançamento financeiro
  async updateStatus(id, newStatus) {
    try {
      const response = await makeAuthenticatedRequest(`/financeiros/${id}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar status do financeiro:', error);
      throw error;
    }
  }
};

export default financeiroService;
