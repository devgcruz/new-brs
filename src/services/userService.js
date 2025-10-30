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

// Serviço para gerenciamento de usuários integrado com a API
class UserService {
  constructor() {
    this.currentUser = this.loadCurrentUser();
  }

  // Carregar usuário atual do localStorage
  loadCurrentUser() {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error);
    }
    return null;
  }

  // Fazer logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  // Verificar se usuário tem permissão
  hasPermission(permission) {
    if (!this.currentUser) {
      this.currentUser = this.loadCurrentUser();
    }
    
    if (!this.currentUser) return false;
    
    // Se for administrador, dar acesso total
    if (this.isAdmin()) {
      return true;
    }
    
    // Verificar permissões específicas
    return this.currentUser.permissoes && this.currentUser.permissoes.includes(permission);
  }

  // Verificar se usuário é administrador
  isAdmin() {
    if (!this.currentUser) return false;
    
    // Verificar se o usuário tem o role 'Administrador'
    return this.currentUser.roles && this.currentUser.roles.includes('Administrador');
  }

  // Obter todos os usuários
  async getAllUsers(filtros = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filtros && typeof filtros === 'object') {
        Object.keys(filtros).forEach(key => {
          if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
            queryParams.append(key, filtros[key]);
          }
        });
      }

      const url = `/usuarios${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      return {
        success: response.success,
        data: response.data,
        meta: response.meta
      };
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  // Obter usuário por ID
  async getUserById(id) {
    try {
      const response = await makeAuthenticatedRequest(`/usuarios/${id}`);
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Criar novo usuário
  async createUser(userData) {
    try {
      const response = await makeAuthenticatedRequest('/usuarios', {
        method: 'POST',
        body: JSON.stringify(userData)
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
        message: error.message
      };
    }
  }

  // Atualizar usuário
  async updateUser(id, userData) {
    try {
      const response = await makeAuthenticatedRequest(`/usuarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(userData)
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
        message: error.message
      };
    }
  }

  // Excluir usuário
  async deleteUser(id) {
    try {
      const response = await makeAuthenticatedRequest(`/usuarios/${id}`, {
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
        message: error.message
      };
    }
  }

  // Alterar status do usuário
  async toggleUserStatus(id) {
    try {
      const response = await makeAuthenticatedRequest(`/usuarios/${id}/toggle-status`, {
        method: 'PATCH'
      });
      
      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Obter estatísticas dos usuários
  async getUserStats() {
    try {
      const response = await makeAuthenticatedRequest('/usuarios/statistics');
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

  // Obter roles disponíveis
  async getRoles() {
    try {
      const response = await makeAuthenticatedRequest('/usuarios/roles');
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao obter roles:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  // Atualizar perfil do usuário atual
  async updateProfile(userData) {
    try {
      const response = await makeAuthenticatedRequest('/profile', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      // Atualizar dados do usuário atual no localStorage
      const updatedUser = response.data;
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      this.currentUser = updatedUser;
      
      return updatedUser;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  // Alterar senha do usuário atual
  async changePassword(passwordData) {
    try {
      const response = await makeAuthenticatedRequest('/profile/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData)
      });
      
      return response;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  }

  // Obter usuário atual
  getCurrentUser() {
    return this.currentUser;
  }

  // Forçar recarga do usuário atual
  refreshCurrentUser() {
    this.currentUser = this.loadCurrentUser();
    return this.currentUser;
  }

  // Verificar se usuário está logado
  isLoggedIn() {
    return this.currentUser !== null;
  }
}

// Instância única do serviço
const userService = new UserService();

export default userService;
