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
      // Criar FormData para envio de dados e arquivo
      const formData = new FormData();
      
      // Adicionar campos de texto
      formData.append('nome', colaboradorData.nome);
      formData.append('cpf', colaboradorData.cpf);
      formData.append('email', colaboradorData.email);
      formData.append('celular', colaboradorData.celular);
      
      // Adicionar arquivo da CNH se existir
      if (colaboradorData.cnh_foto) {
        formData.append('cnh_foto', colaboradorData.cnh_foto);
      }

      const response = await makeRequest('/colaboradores', {
        method: 'POST',
        body: formData
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
      // Sempre usar FormData para compatibilidade com arquivos
      const formData = new FormData();
      formData.append('nome', colaboradorData.nome);
      formData.append('cpf', colaboradorData.cpf);
      formData.append('email', colaboradorData.email);
      formData.append('celular', colaboradorData.celular);
      formData.append('_method', 'PUT'); // Laravel method spoofing
      
      // Adicionar arquivo da CNH se existir
      if (colaboradorData.cnh_foto) {
        formData.append('cnh_foto', colaboradorData.cnh_foto);
      }
      
      const response = await makeRequest(`/colaboradores/${id}`, {
        method: 'POST', // Usar POST para compatibilidade com FormData
        body: formData
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
