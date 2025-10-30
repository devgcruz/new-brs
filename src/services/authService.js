// Importar configuração da API
import { API_CONFIG, makeRequest } from '../config/api.js';
const API_BASE_URL = API_CONFIG.BASE_URL;

// Serviço de autenticação integrado com a API Laravel
const authService = {
  // Login real com a API
  async login(username, password) {
    try {
      const data = await makeRequest('/login', {
        method: 'POST',
        body: {
          usuario: username,
          senha: password
        }
      });

      if (data.success) {
        // Salvar token no localStorage
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_data', JSON.stringify(data.data.user));
        return data;
      } else {
        throw new Error(data.message || 'Erro no login');
      }
    } catch (error) {
      throw new Error(error.message || 'Erro de conexão com o servidor');
    }
  },

  // Registro de novo usuário
  async register(userData) {
    try {
      const data = await makeRequest('/register', {
        method: 'POST',
        body: userData
      });

      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Erro no registro');
      }
    } catch (error) {
      throw new Error(error.message || 'Erro de conexão com o servidor');
    }
  },

  // Logout real com a API
  async logout() {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        await makeRequest('/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      // Erro silencioso no logout
    } finally {
      // Limpar dados locais
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  },

  // Obter dados do usuário autenticado
  async getCurrentUser() {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        return null;
      }

      const data = await makeRequest('/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (data.success) {
        return data.data;
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      this.logout();
      return null;
    }
  },

  // Verificar se o usuário está autenticado
  isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    return !!token;
  },

  // Obter token de autenticação
  getToken() {
    return localStorage.getItem('auth_token');
  },

  // Verificar permissão do usuário
  async checkPermission(permission) {
    try {
      const token = this.getToken();
      
      if (!token) {
        return false;
      }

      const data = await makeRequest(`/check-permission/${permission}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return data.success && data.data.has_permission;
    } catch (error) {
      return false;
    }
  }
};

export default authService;


