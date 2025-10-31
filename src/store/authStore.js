import { create } from 'zustand';
import authService from '../services/authService';
import userService from '../services/userService';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  initialized: false,
  isInitializing: false,

  // Inicializa o estado de autenticação
  init: async () => {
    const { loading, isAuthenticated, initialized, isInitializing } = get();
    
    // Evitar múltiplas inicializações
    if (initialized) {
      return;
    }
    
    if (isInitializing) {
      return;
    }
    
    set({ loading: true, isInitializing: true });
    
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        try {
          // Verificar se o token ainda é válido
          const currentUser = await authService.getCurrentUser();
          
          if (currentUser) {
            set({
              token,
              isAuthenticated: true,
              user: currentUser,
              loading: false,
              initialized: true,
              isInitializing: false
            });
          } else {
            // Token inválido, limpar dados
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            set({
              token: null,
              isAuthenticated: false,
              user: null,
              loading: false,
              initialized: true,
              isInitializing: false
            });
          }
        } catch (error) {
          // Em caso de erro, limpar dados
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          set({
            token: null,
            isAuthenticated: false,
            user: null,
            loading: false,
            initialized: true,
            isInitializing: false
          });
        }
      } else {
        set({
          token: null,
          isAuthenticated: false,
          user: null,
          loading: false,
          initialized: true,
          isInitializing: false
        });
      }
    } catch (error) {
      set({
        token: null,
        isAuthenticated: false,
        user: null,
        loading: false,
        initialized: true,
        isInitializing: false
      });
    }
  },

  // Verifica se usuário tem permissão
  hasPermission: (permission) => {
    const { user } = get();
    
    if (!user) return false;
    
    // Se for administrador (via role ou nível), dar acesso total
    if (user.roles && Array.isArray(user.roles) && user.roles.includes('Administrador')) {
      return true;
    }
    
    if (user.nivel === 'Administrador') {
      return true;
    }
    
    // Mapeamento de roles para permissões específicas
    const rolePermissionMap = {
      'Administrador': ['dashboard', 'registros', 'relatorios', 'gerenciar-usuarios', 'usuarios'],
      'Analista': ['dashboard', 'registros', 'relatorios'],
      'Operador': ['dashboard', 'registros'],
      'Visualizador': ['dashboard']
    };
    
    // Verificar se algum role do usuário tem a permissão
    if (user.roles && Array.isArray(user.roles)) {
      for (const roleName of user.roles) {
        const rolePerms = rolePermissionMap[roleName];
        if (rolePerms && rolePerms.includes(permission)) {
          return true;
        }
      }
    }
    
    // Verificar permissões específicas no array de permissões (campo JSON do banco)
    if (user.permissoes && Array.isArray(user.permissoes)) {
      return user.permissoes.includes(permission);
    }
    
    return false;
  },

  // Verifica se usuário é administrador
  isAdmin: () => {
    const { user } = get();
    return user && user.roles && user.roles.includes('Administrador');
  },

  // Login
  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login(username, password);
      
      if (response.success) {
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        return { success: true };
      } else {
        set({
          loading: false,
          error: response.message || 'Erro ao fazer login'
        });
        return { success: false, error: response.message };
      }
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Erro ao fazer login'
      });
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Erro silencioso no logout
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: false
      });
    }
  },

  // Atualiza dados do usuário
  updateUser: (updatedUser) => {
    set({ user: updatedUser });
  },

  // Limpa erros
  clearError: () => set({ error: null })
}));

export default useAuthStore;

