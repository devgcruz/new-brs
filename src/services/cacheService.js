/**
 * Serviço de cache para gerenciar dados no localStorage com versionamento
 */

const CACHE_VERSION = 'v2';
const CACHE_KEYS = {
  CIDADES: `cidades_${CACHE_VERSION}`,
  COLABORADORES: `colaboradores_${CACHE_VERSION}`,
  CACHE_METADATA: 'cache_metadata'
};

class CacheService {
  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  /**
   * Verifica se o cache está disponível (ambiente cliente)
   */
  isAvailable() {
    return this.isClient && typeof localStorage !== 'undefined';
  }

  /**
   * Salva dados no localStorage com metadados
   */
  set(key, data, metadata = {}) {
    if (!this.isAvailable()) return false;

    try {
      const cacheData = {
        data,
        metadata: {
          timestamp: Date.now(),
          version: CACHE_VERSION,
          ...metadata
        }
      };

      localStorage.setItem(key, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
      return false;
    }
  }

  /**
   * Recupera dados do localStorage
   */
  get(key) {
    if (!this.isAvailable()) return null;

    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      
      // Verificar se a versão é compatível
      if (cacheData.metadata?.version !== CACHE_VERSION) {
        this.remove(key);
        return null;
      }

      return cacheData;
    } catch (error) {
      console.error('Erro ao recuperar do cache:', error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Remove dados do localStorage
   */
  remove(key) {
    if (!this.isAvailable()) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover do cache:', error);
      return false;
    }
  }

  /**
   * Verifica se o cache está válido (não expirado)
   */
  isValid(key, maxAge = 24 * 60 * 60 * 1000) { // 24 horas por padrão
    const cacheData = this.get(key);
    if (!cacheData) return false;

    const age = Date.now() - cacheData.metadata.timestamp;
    return age < maxAge;
  }

  /**
   * Limpa todo o cache da aplicação
   */
  clearAll() {
    if (!this.isAvailable()) return false;

    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  }

  /**
   * Salva cidades no cache
   */
  setCidades(cidades) {
    return this.set(CACHE_KEYS.CIDADES, cidades, {
      type: 'cidades',
      count: cidades.length
    });
  }

  /**
   * Recupera cidades do cache
   */
  getCidades() {
    const cacheData = this.get(CACHE_KEYS.CIDADES);
    return cacheData?.data || null;
  }

  /**
   * Verifica se as cidades estão em cache e válidas
   */
  hasValidCidades() {
    return this.isValid(CACHE_KEYS.CIDADES, 7 * 24 * 60 * 60 * 1000); // 7 dias
  }

  /**
   * Salva colaboradores no cache
   */
  setColaboradores(colaboradores) {
    return this.set(CACHE_KEYS.COLABORADORES, colaboradores, {
      type: 'colaboradores',
      count: colaboradores.length
    });
  }

  /**
   * Recupera colaboradores do cache
   */
  getColaboradores() {
    const cacheData = this.get(CACHE_KEYS.COLABORADORES);
    return cacheData?.data || null;
  }

  /**
   * Verifica se os colaboradores estão em cache e válidos
   */
  hasValidColaboradores() {
    return this.isValid(CACHE_KEYS.COLABORADORES, 24 * 60 * 60 * 1000); // 24 horas
  }

  /**
   * Filtra cidades por UF
   */
  getCidadesByUf(ufId) {
    const cidades = this.getCidades();
    if (!cidades || !Array.isArray(cidades)) return [];

    return cidades.filter(cidade => 
      cidade.uf === ufId || cidade.uf_id === ufId || cidade.estado_id === ufId
    );
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    if (!this.isAvailable()) return null;

    const stats = {
      cidades: {
        cached: false,
        count: 0,
        age: null
      },
      colaboradores: {
        cached: false,
        count: 0,
        age: null
      }
    };

    // Verificar cidades
    const cidadesData = this.get(CACHE_KEYS.CIDADES);
    if (cidadesData) {
      stats.cidades.cached = true;
      stats.cidades.count = cidadesData.data?.length || 0;
      stats.cidades.age = Date.now() - cidadesData.metadata.timestamp;
    }

    // Verificar colaboradores
    const colaboradoresData = this.get(CACHE_KEYS.COLABORADORES);
    if (colaboradoresData) {
      stats.colaboradores.cached = true;
      stats.colaboradores.count = colaboradoresData.data?.length || 0;
      stats.colaboradores.age = Date.now() - colaboradoresData.metadata.timestamp;
    }

    return stats;
  }
}

// Instância singleton
const cacheService = new CacheService();

export default cacheService;
