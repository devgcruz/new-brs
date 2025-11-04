// Importar configuração da API
import { API_CONFIG } from '../config/api.js';
const API_BASE_URL = API_CONFIG.BASE_URL;

// Função para fazer requisições autenticadas
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token inválido, redirecionar para login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
    
    // Tratar erro 422 (Unprocessable Content) - validação
    if (response.status === 422) {
      try {
        const errorData = await response.json();
        // Verificar se há erros específicos do Laravel
        if (errorData.errors) {
          // Obter primeira mensagem de erro
          const firstError = Object.values(errorData.errors)[0][0];
          throw new Error(firstError);
        }
        const errorMessage = errorData.message || 'Dados inválidos';
        throw new Error(errorMessage);
      } catch (parseError) {
        throw new Error('Erro de validação nos dados enviados');
      }
    }
    
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

const entradaService = {
  // Retorna lista de entradas com suporte a paginação
  async getEntradas(filtros = {}, pagination = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Adicionar filtros à query string
      if (filtros && typeof filtros === 'object') {
        Object.keys(filtros).forEach(key => {
          if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
            queryParams.append(key, filtros[key]);
          }
        });
      }
      
      // Adicionar parâmetros de paginação
      if (pagination.page) {
        queryParams.append('page', pagination.page);
      }
      if (pagination.per_page) {
        queryParams.append('per_page', pagination.per_page);
      }
      // Permitir buscar todos os registros para relatórios
      if (pagination.all === true) {
        queryParams.append('all', 'true');
      }

      const url = `/entradas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      return {
        success: response.success,
        data: response.data?.data || [],
        meta: response.data?.meta || {}
      };
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  },

  // Retorna entrada por ID
  async getEntradaById(id) {
    try {
      const response = await makeAuthenticatedRequest(`/entradas/${id}`);
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao buscar entrada:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Criar nova entrada
  async createEntrada(data) {
    try {
      const response = await makeAuthenticatedRequest('/entradas', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao criar entrada:', error);
      
      // Tratar especificamente erro de placa duplicada
      const isPlacaError = error.message && (
        error.message.includes('já está cadastrada') || 
        error.message.includes('placa') && error.message.includes('cadastrada')
      );
      
      if (isPlacaError) {
        return {
          success: false,
          message: error.message,
          errorType: 'placa_duplicada'
        };
      }
      
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Atualizar entrada
  async updateEntrada(id, data) {
    try {
      const response = await makeAuthenticatedRequest(`/entradas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao atualizar entrada:', error);
      
      // Tratar especificamente erro de placa duplicada
      const isPlacaError = error.message && (
        error.message.includes('já está cadastrada') || 
        error.message.includes('placa') && error.message.includes('cadastrada')
      );
      
      if (isPlacaError) {
        return {
          success: false,
          message: error.message,
          errorType: 'placa_duplicada'
        };
      }
      
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Deletar entrada
  async deleteEntrada(id) {
    try {
      const response = await makeAuthenticatedRequest(`/entradas/${id}`, {
        method: 'DELETE'
      });
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao deletar entrada:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Obter estatísticas
  async getStatistics() {
    try {
      const response = await makeAuthenticatedRequest('/entradas/statistics');
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // CORREÇÃO APLICADA AQUI:
  // Removemos o bloco 'catch' com dados mocados para garantir que a verificação
  // de placa seja sempre feita através da chamada real à API.
  async checkPlacaExists(placa) {
    try {
      const response = await makeAuthenticatedRequest(`/entradas/check-placa?placa=${encodeURIComponent(placa)}`);
      return {
        success: response.success,
        exists: response.data?.exists || false
      };
    } catch (error) {
      console.error('Erro ao verificar placa:', error);
      // Em caso de erro, a função agora lança a exceção em vez de retornar um valor falso.
      throw error;
    }
  },

  // Obter dados unificados para formulários de registro
  async getRegistroFormData() {
    try {
      const response = await makeAuthenticatedRequest('/form-data/registros');
      return response;
    } catch (error) {
      console.error('Erro ao buscar dados do formulário:', error);
      return {
        success: false,
        message: error.message,
        data: {
          posicoes: [],
          marcas: [],
          seguradoras: [],
          colaboradores: [],
          prestadores: []
        }
      };
    }
  },

  /**
   * Busca todos os dados de uma entrada, incluindo observações, para o relatório.
   * @param {number} id - O ID_Entrada
   * @returns {Promise<Object>} Resposta da API com os dados completos
   */
  async getEntradaCompleta(id) {
    try {
      const response = await makeAuthenticatedRequest(`/entrada-completa?id=${id}`);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erro ao buscar dados completos do registro');
      }
    } catch (error) {
      console.error('Erro em getEntradaCompleta:', error);
      throw error;
    }
  }

};

export default entradaService;