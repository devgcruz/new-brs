import { create } from 'zustand';
import entradaService from '../services/entradaService';
import cacheService from '../services/cacheService';

const useAppDataStore = create((set, get) => ({
  // Estado dos dados dos dropdowns
  dropdownData: {
    posicoes: [],
    marcas: [],
    seguradoras: [],
    colaboradores: [],
    prestadores: [],
  },
  
  // Estados de controle
  loading: false,
  error: null,
  lastUpdated: null,
  initialized: false,

  // Carregar dados dos dropdowns
  loadDropdownData: async () => {
    const { loading, initialized } = get();
    
    // Evitar múltiplas chamadas simultâneas
    if (loading) {
      return;
    }

    // Verificar cache primeiro
    const cacheKey = 'dropdownData';
    const cachedData = cacheService.get(cacheKey);
    
    if (cachedData && cacheService.isValid(cacheKey, 60 * 60 * 1000)) { // 60 minutos
      set({
        dropdownData: cachedData.data,
        lastUpdated: cachedData.metadata.timestamp,
        initialized: true,
        error: null
      });
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await entradaService.getRegistroFormData();
      
      if (response.success) {
        const data = response.data;
        
        // Salvar no cache
        cacheService.set(cacheKey, data, {
          type: 'dropdownData',
          count: {
            posicoes: data.posicoes?.length || 0,
            marcas: data.marcas?.length || 0,
            seguradoras: data.seguradoras?.length || 0,
            colaboradores: data.colaboradores?.length || 0,
            prestadores: data.prestadores?.length || 0,
          }
        });

        set({
          dropdownData: data,
          lastUpdated: Date.now(),
          loading: false,
          initialized: true,
          error: null
        });
      } else {
        throw new Error(response.message || 'Erro ao carregar dados');
      }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        initialized: true
      });
    }
  },

  // Invalidar cache e recarregar dados
  invalidateCache: () => {
    cacheService.remove('dropdownData');
    set({ initialized: false, lastUpdated: null });
    get().loadDropdownData();
  },

  // Invalidar cache específico de colaboradores
  invalidateColaboradoresCache: () => {
    cacheService.remove('dropdownData');
    set({ initialized: false, lastUpdated: null });
    get().loadDropdownData();
  },

  // Forçar recarregamento (ignora cache)
  forceReload: () => {
    cacheService.remove('dropdownData');
    set({ initialized: false, lastUpdated: null, loading: false });
    get().loadDropdownData();
  },

  // Limpar erro
  clearError: () => set({ error: null }),

  // Obter dados específicos
  getPosicoes: () => get().dropdownData.posicoes || [],
  getMarcas: () => get().dropdownData.marcas || [],
  getSeguradoras: () => get().dropdownData.seguradoras || [],
  getColaboradores: () => get().dropdownData.colaboradores || [],
  getPrestadores: () => get().dropdownData.prestadores || [],

  // Verificar se os dados estão carregados
  isDataLoaded: () => {
    const { initialized, dropdownData } = get();
    return initialized && (
      dropdownData.posicoes?.length > 0 ||
      dropdownData.marcas?.length > 0 ||
      dropdownData.seguradoras?.length > 0 ||
      dropdownData.colaboradores?.length > 0 ||
      dropdownData.prestadores?.length > 0
    );
  },

  // Obter estatísticas do cache
  getCacheStats: () => {
    const cacheKey = 'dropdownData';
    const cachedData = cacheService.get(cacheKey);
    
    if (!cachedData) {
      return {
        cached: false,
        age: null,
        count: { posicoes: 0, marcas: 0, seguradoras: 0, colaboradores: 0, prestadores: 0 }
      };
    }

    return {
      cached: true,
      age: Date.now() - cachedData.metadata.timestamp,
      count: cachedData.metadata.count || {},
      timestamp: cachedData.metadata.timestamp
    };
  }
}));

export default useAppDataStore;
