import { makeRequest } from '../config/api';

const colaboradorService = {
  // Buscar todos os colaboradores
  async getAll(page = 1, perPage = 10, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString()
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await makeRequest(`/colaboradores?${params.toString()}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      throw error;
    }
  },

  // Buscar colaborador por ID
  async getById(id) {
    try {
      const response = await makeRequest(`/colaboradores/${id}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Erro ao buscar colaborador:', error);
      throw error;
    }
  },

  // Cadastrar novo colaborador
  async create(colaboradorData) {
    try {
      // Filtrar campos vazios/undefined antes de enviar
      const body = {};
      if (colaboradorData.nome) body.nome = colaboradorData.nome;
      if (colaboradorData.cpf) body.cpf = colaboradorData.cpf;
      if (colaboradorData.email) body.email = colaboradorData.email;
      if (colaboradorData.contato) body.telefone = colaboradorData.contato; // Backend espera 'telefone', frontend usa 'contato'
      
      const response = await makeRequest('/colaboradores', {
        method: 'POST',
        body
      });
      
      return response;
    } catch (error) {
      console.error('Erro ao cadastrar colaborador:', error);
      throw error;
    }
  },

  // Atualizar colaborador
  async update(id, colaboradorData) {
    try {
      // Filtrar campos vazios/undefined antes de enviar
      const body = {};
      if (colaboradorData.nome) body.nome = colaboradorData.nome;
      if (colaboradorData.cpf !== undefined) body.cpf = colaboradorData.cpf || '';
      if (colaboradorData.email !== undefined) body.email = colaboradorData.email || '';
      if (colaboradorData.contato !== undefined) body.telefone = colaboradorData.contato || ''; // Backend espera 'telefone', frontend usa 'contato'
      
      const response = await makeRequest(`/colaboradores/${id}`, {
        method: 'PUT',
        body
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar colaborador:', error);
      throw error;
    }
  },

  // Excluir colaborador
  async delete(id) {
    try {
      const response = await makeRequest(`/colaboradores/${id}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao excluir colaborador:', error);
      throw error;
    }
  }
};

export default colaboradorService;
