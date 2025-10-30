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
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

const prestadorService = {
  // Obter todos os prestadores/colaboradores
  async getAll(page = 1, perPage = 10, search = '') {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('per_page', perPage);
      
      if (search) {
        queryParams.append('search', search);
      }

      const url = `/prestadores${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      return {
        success: response.success,
        data: response.data,
        meta: response.meta
      };
    } catch (error) {
      console.error('Erro ao buscar prestadores:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  },

  // Obter todos os prestadores/colaboradores (método legado)
  async getPrestadores(filtros = {}) {
    return this.getAll(1, 10, filtros.search || '');
  },

  // Obter prestador por ID
  async getPrestadorById(id) {
    try {
      const response = await makeAuthenticatedRequest(`/prestadores/${id}`);
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao buscar prestador:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Criar novo prestador
  async create(data) {
    try {
      const response = await makeAuthenticatedRequest('/prestadores', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao criar prestador:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Atualizar prestador
  async update(id, data) {
    try {
      const response = await makeAuthenticatedRequest(`/prestadores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao atualizar prestador:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Deletar prestador
  async delete(id) {
    try {
      const response = await makeAuthenticatedRequest(`/prestadores/${id}`, {
        method: 'DELETE'
      });
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao deletar prestador:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Métodos legados para compatibilidade
  async createPrestador(data) {
    return this.create(data);
  },

  async updatePrestador(id, data) {
    return this.update(id, data);
  },

  async deletePrestador(id) {
    return this.delete(id);
  },

  // Obter estatísticas
  async getStatistics() {
    try {
      const response = await makeAuthenticatedRequest('/prestadores/statistics');
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
  }
};

export default prestadorService;



