/**
 * Utilitários para gerenciamento de cache
 */

import cacheService from '../services/cacheService';

/**
 * Limpa todo o cache da aplicação
 */
export const clearAllCache = () => {
  try {
    // Limpar cache do localStorage
    cacheService.clearAll();
    
    // Limpar cache específico de dropdowns
    cacheService.remove('dropdownData');
    
    // Limpar outros caches se necessário
    const keysToRemove = [
      'colaboradores_v2',
      'cidades_v2',
      'cache_metadata',
      'dropdownData'
    ];
    
    keysToRemove.forEach(key => {
      cacheService.remove(key);
    });
    
    // Recarregar a página para forçar nova busca de dados
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Limpa apenas o cache de colaboradores
 */
export const clearColaboradoresCache = () => {
  try {
    cacheService.remove('dropdownData');
    cacheService.remove('colaboradores_v2');
    
    // Recarregar a página
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Força o recarregamento dos dados de dropdown
 */
export const forceReloadDropdowns = async () => {
  try {
    // Limpar cache
    cacheService.remove('dropdownData');
    
    // Tentar acessar o store se estiver disponível
    if (typeof window !== 'undefined' && window.forceReloadAppData) {
      window.forceReloadAppData();
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Exibe estatísticas do cache
 */
export const getCacheStats = () => {
  try {
    const stats = cacheService.getStats();
    console.table(stats);
    
    // Verificar cache de dropdowns
    const dropdownCache = cacheService.get('dropdownData');
    if (dropdownCache) {
      return {
        colaboradores: dropdownCache.data?.colaboradores?.length || 0,
        marcas: dropdownCache.data?.marcas?.length || 0,
        seguradoras: dropdownCache.data?.seguradoras?.length || 0,
        posicoes: dropdownCache.data?.posicoes?.length || 0,
        timestamp: new Date(dropdownCache.metadata?.timestamp).toLocaleString()
      };
    }
    
    return stats;
  } catch (error) {
    return null;
  }
};

/**
 * Disponibiliza funções globalmente para uso no console
 */
if (typeof window !== 'undefined') {
  window.clearAllCache = clearAllCache;
  window.clearColaboradoresCache = clearColaboradoresCache;
  window.forceReloadDropdowns = forceReloadDropdowns;
  window.getCacheStats = getCacheStats;
}

export default {
  clearAllCache,
  clearColaboradoresCache,
  forceReloadDropdowns,
  getCacheStats
};
