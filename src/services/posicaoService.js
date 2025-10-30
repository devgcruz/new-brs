import { makeRequest } from '../config/api';

const posicaoService = {
  // Buscar todas as posições
  async getAll(page = 1, perPage = 10, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await makeRequest(`/posicoes?${params.toString()}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar posições:', error);
      throw error;
    }
  },

  // Buscar posição por ID
  async getById(id) {
    try {
      const response = await makeRequest(`/posicoes/${id}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar posição:', error);
      throw error;
    }
  },

  // Criar nova posição
  async create(posicaoData) {
    try {
      const response = await makeRequest('/posicoes', {
        method: 'POST',
        body: JSON.stringify(posicaoData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar posição:', error);
      throw error;
    }
  },

  // Atualizar posição
  async update(id, posicaoData) {
    try {
      const response = await makeRequest(`/posicoes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(posicaoData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar posição:', error);
      throw error;
    }
  },

  // Excluir posição
  async delete(id) {
    try {
      const response = await makeRequest(`/posicoes/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao excluir posição:', error);
      throw error;
    }
  }
};

export default posicaoService;


