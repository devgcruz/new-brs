// Importar configuração da API
import { makeRequest } from '../config/api';

const userService = {
  /**
   * Obter todos os usuários com paginação e busca
   * @param {number} page - Página atual (padrão: 1)
   * @param {number} pageSize - Itens por página (padrão: 10)
   * @param {string} search - Termo de busca (padrão: '')
   * @returns {Promise<Object>} Resposta da API
   */
  async getAll(page = 1, pageSize = 10, search = '') {
    try {
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page);
      if (pageSize) queryParams.append('pageSize', pageSize);
      if (search) queryParams.append('search', search);

      const url = `/usuarios${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await makeRequest(url, {
        method: 'GET'
      });
      
      // Garantir que data seja sempre um array
      const data = response.data || [];
      const usuariosArray = Array.isArray(data) ? data : (data?.data || []);
      
      return {
        success: response.success,
        data: usuariosArray,
        meta: response.meta || {}
      };
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return {
        success: false,
        message: error.message,
        data: [],
        meta: {}
      };
    }
  },

  /**
   * Criar novo usuário
   * @param {Object} data - Dados do usuário {name, username, email, password, roles}
   * @returns {Promise<Object>} Resposta da API
   */
  async create(data) {
    try {
      const response = await makeRequest('/usuarios', {
        method: 'POST',
        body: data
      });
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar usuário'
      };
    }
  },

  /**
   * Atualizar usuário existente
   * @param {number} id - ID do usuário
   * @param {Object} data - Dados do usuário {name, username, email, roles}
   * @returns {Promise<Object>} Resposta da API
   */
  async update(id, data) {
    try {
      const response = await makeRequest(`/usuarios?id=${id}`, {
        method: 'PUT',
        body: data
      });
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar usuário'
      };
    }
  },

  /**
   * Deletar usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Resposta da API
   */
  async delete(id) {
    try {
      const response = await makeRequest(`/usuarios?id=${id}`, {
        method: 'DELETE'
      });
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      return {
        success: false,
        message: error.message || 'Erro ao deletar usuário'
      };
    }
  },

  /**
   * Obter roles disponíveis
   * @returns {Promise<Object>} Resposta da API com lista de roles
   */
  async getRoles() {
    try {
      const response = await makeRequest('/usuarios/roles');
      
      // respostaJson retorna: { success: true, data: [...], message: "..." }
      // então response.data já é o array de roles
      let rolesData = [];
      
      if (response && response.success) {
        if (Array.isArray(response.data)) {
          rolesData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          // Se estiver aninhado (caso raro)
          rolesData = response.data.data;
        }
      }
      
      return {
        success: true,
        data: rolesData
      };
    } catch (error) {
      console.error('Erro ao obter roles:', error);
      return {
        success: false,
        message: error.message || 'Erro ao carregar roles',
        data: []
      };
    }
  },

  /**
   * Alternar status do usuário (ativo/inativo)
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Resposta da API
   */
  async toggleStatus(id) {
    try {
      const response = await makeRequest('/usuarios-toggle-status', {
        method: 'POST',
        body: { id }
      });
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      return {
        success: false,
        message: error.message || 'Erro ao alterar status'
      };
    }
  },

  /**
   * Alterar senha do usuário
   * @param {number} id - ID do usuário
   * @param {string} password - Nova senha
   * @returns {Promise<Object>} Resposta da API
   */
  async changePassword(id, password) {
    try {
      const response = await makeRequest('/usuarios-change-password', {
        method: 'POST',
        body: { id, password }
      });
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return {
        success: false,
        message: error.message || 'Erro ao alterar senha'
      };
    }
  },

  /**
   * Atualizar o perfil do próprio utilizador logado
   * @param {Object} data - Dados do perfil {nome, email}
   * @returns {Promise<Object>} Resposta da API com o utilizador atualizado
   */
  async updateProfile(data) {
    try {
      const response = await makeRequest('/profile', {
        method: 'POST', // O endpoint profile.php usa POST para updates
        body: data
      });

      if (!response.success) {
        throw new Error(response.message || 'Erro ao atualizar perfil');
      }
      return response.data; // Retorna o utilizador atualizado

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error; // Propaga o erro para o ProfilePage tratar
    }
  },

  /**
   * Alterar a própria senha do utilizador logado
   * @param {Object} data - {current_password, new_password, new_password_confirmation}
   * @returns {Promise<Object>} Resposta da API
   */
  async changeMyPassword(data) {
    try {
      const response = await makeRequest('/profile-change-password', {
        method: 'POST',
        body: data
      });

      if (!response.success) {
        throw new Error(response.message || 'Erro ao alterar senha');
      }
      return response;

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error; // Propaga o erro
    }
  }
};

export default userService;
