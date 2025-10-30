import { makeRequest } from '../config/api';

const marcaService = {
  // Buscar todas as marcas
  async getAll(page = 1, perPage = 10, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await makeRequest(`/marcas?${params.toString()}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar marcas:', error);
      throw error;
    }
  },

  // Buscar marca por ID
  async getById(id) {
    try {
      const response = await makeRequest(`/marcas/${id}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar marca:', error);
      throw error;
    }
  },

  // Criar nova marca
  async create(marcaData) {
    try {
      const response = await makeRequest('/marcas', {
        method: 'POST',
        body: JSON.stringify(marcaData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar marca:', error);
      throw error;
    }
  },

  // Atualizar marca
  async update(id, marcaData) {
    try {
      const response = await makeRequest(`/marcas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(marcaData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar marca:', error);
      throw error;
    }
  },

  // Excluir marca
  async delete(id) {
    try {
      const response = await makeRequest(`/marcas/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao excluir marca:', error);
      throw error;
    }
  }
};

export default marcaService;


