/**
 * Serviço otimizado para carregar UFs e cidades com cache local
 */

import ufsCidadesData from '../data/ufs_cidades.json';
import cacheService from './cacheService';
// Removido: import ufCidadeService from './ufCidadeService';
// Agora usamos dados fixos do JSON e cache local

class OptimizedUfCidadeService {
  constructor() {
    this.ufs = ufsCidadesData.estados;
    this.cidadesCache = new Map();
    this.loadingPromise = null;
  }

  /**
   * Retorna as UFs (dados fixos do JSON)
   */
  getUfs() {
    return {
      success: true,
      data: this.ufs.map(uf => ({
        id: uf.sigla,
        value: uf.sigla,
        label: uf.nome,
        nome: uf.nome,
        sigla: uf.sigla
      }))
    };
  }

  /**
   * Carrega todas as cidades do Brasil uma única vez
   */
  async loadAllCidades() {
    // Verificar se já está carregando
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Verificar se já existe cache válido
    if (cacheService.hasValidCidades()) {
      const cachedCidades = cacheService.getCidades();
      if (cachedCidades && cachedCidades.length > 0) {
        return {
          success: true,
          data: cachedCidades,
          fromCache: true
        };
      }
    }

    // Carregar de todas as UFs
    this.loadingPromise = this._loadCidadesFromAPI();
    return this.loadingPromise;
  }

  /**
   * Carrega cidades usando dados fixos (não mais da API)
   */
  async _loadCidadesFromAPI() {
    try {
      console.log('🔄 Carregando cidades dos dados fixos...');
      const startTime = Date.now();
      
      // Usar dados fixos do JSON - converter estrutura
      const allCidades = [];
      ufsCidadesData.estados.forEach(estado => {
        estado.cidades.forEach((cidade, index) => {
          allCidades.push({
            id: `${estado.sigla}-${index}`,
            value: cidade,
            label: cidade,
            nome: cidade,
            uf: estado.sigla,
            uf_id: estado.sigla
          });
        });
      });
      
      const endTime = Date.now();
      console.log(`✅ Cidades carregadas: ${allCidades.length} em ${endTime - startTime}ms`);

      // Salvar no cache
      cacheService.setCidades(allCidades);

      return {
        success: true,
        data: allCidades,
        fromCache: false,
        loadTime: endTime - startTime
      };
    } catch (error) {
      console.error('Erro ao carregar cidades dos dados fixos:', error);
      this.loadingPromise = null;
      return {
        success: false,
        error: error.message,
        data: []
      };
    } finally {
      this.loadingPromise = null;
    }
  }

  /**
   * Obtém cidades por UF (usando cache local)
   */
  async getCidadesByUf(ufId) {
    if (!ufId) {
      return {
        success: true,
        data: []
      };
    }

    // Verificar se já temos as cidades em cache
    if (cacheService.hasValidCidades()) {
      const allCidades = cacheService.getCidades();
      if (allCidades && allCidades.length > 0) {
        const cidadesFiltradas = allCidades.filter(cidade => 
          cidade && typeof cidade === 'object' && 
          (cidade.uf === ufId || cidade.uf_id === ufId || cidade.estado_id === ufId)
        );
        
        return {
          success: true,
          data: cidadesFiltradas,
          fromCache: true
        };
      }
    }

    // Se não há cache, carregar todas as cidades primeiro
    const allCidadesResult = await this.loadAllCidades();
    if (!allCidadesResult.success) {
      return allCidadesResult;
    }

    // Filtrar cidades da UF específica
    const cidadesFiltradas = allCidadesResult.data.filter(cidade => 
      cidade && typeof cidade === 'object' && 
      (cidade.uf === ufId || cidade.uf_id === ufId || cidade.estado_id === ufId)
    );

    return {
      success: true,
      data: cidadesFiltradas,
      fromCache: allCidadesResult.fromCache
    };
  }

  /**
   * Força atualização do cache de cidades
   */
  async refreshCidades() {
    cacheService.remove('cidades_v2');
    return this.loadAllCidades();
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return cacheService.getStats();
  }

  /**
   * Limpa o cache de cidades
   */
  clearCache() {
    cacheService.remove('cidades_v2');
    this.cidadesCache.clear();
  }

  /**
   * Verifica se as cidades estão em cache
   */
  hasCidadesInCache() {
    return cacheService.hasValidCidades();
  }

  /**
   * Obtém informações sobre o carregamento
   */
  getLoadingInfo() {
    return {
      isLoading: this.loadingPromise !== null,
      hasCache: this.hasCidadesInCache(),
      stats: this.getCacheStats()
    };
  }
}

// Instância singleton
const optimizedUfCidadeService = new OptimizedUfCidadeService();

export default optimizedUfCidadeService;
