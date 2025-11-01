import { makeRequest } from '../config/api';

const seguradoraService = {
  // Buscar todas as seguradoras
  async getAll(page = 1, perPage = 10, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await makeRequest(`/seguradoras?${params.toString()}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar seguradoras:', error);
      throw error;
    }
  },

  // Buscar seguradora por ID
  async getById(id) {
    try {
      const response = await makeRequest(`/seguradoras/${id}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar seguradora:', error);
      throw error;
    }
  },

  // Criar nova seguradora
  async create(seguradoraData) {
    try {
      const response = await makeRequest('/seguradoras', {
        method: 'POST',
        body: JSON.stringify(seguradoraData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar seguradora:', error);
      throw error;
    }
  },

  // Atualizar seguradora
  async update(id, seguradoraData) {
    try {
      const response = await makeRequest(`/seguradoras?id=${id}`, {
        method: 'PUT',
        body: seguradoraData
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar seguradora:', error);
      throw error;
    }
  },

  // Excluir seguradora
  async delete(id) {
    try {
      const response = await makeRequest(`/seguradoras?id=${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao excluir seguradora:', error);
      throw error;
    }
  }
};

export default seguradoraService;


