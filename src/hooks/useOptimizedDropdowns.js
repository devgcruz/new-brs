import { useState, useCallback, useMemo, useRef } from 'react';
import prestadorService from '../services/prestadorService';
import cacheService from '../services/cacheService';

// Função debounce personalizada
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Hook personalizado para gerenciar dropdowns de forma otimizada (apenas Colaboradores)
export const useOptimizedDropdowns = () => {
  // Estados das opções
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cache para evitar chamadas desnecessárias
  const cacheRef = useRef({
    colaboradores: null
  });

  // Função para carregar colaboradores (com cache)
  const loadColaboradores = useCallback(async () => {
    // Verificar cache primeiro
    if (cacheService.hasValidColaboradores()) {
      const cachedColaboradores = cacheService.getColaboradores();
      if (cachedColaboradores && cachedColaboradores.length > 0) {
        setColaboradores(cachedColaboradores);
        cacheRef.current.colaboradores = cachedColaboradores;
        return;
      }
    }

    try {
      const response = await prestadorService.getPrestadores();
      
      if (response.success && Array.isArray(response.data)) {
        const colaboradoresValidos = response.data.filter(item => 
          item && typeof item === 'object' && (item.nome || item.NOME)
        );
        
        setColaboradores(colaboradoresValidos);
        cacheRef.current.colaboradores = colaboradoresValidos;
        
        // Salvar no cache
        cacheService.setColaboradores(colaboradoresValidos);
      } else {
        setColaboradores([]);
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      setColaboradores([]);
    }
  }, []);


  // Função para limpar cache
  const clearCache = useCallback(() => {
    // Limpar cache local
    cacheRef.current = {
      colaboradores: null
    };
    
    // Limpar cache do localStorage
    cacheService.clearAll();
    
    // Resetar estados
    setColaboradores([]);
  }, []);

  // Opções memoizadas para dropdowns
  const colaboradorOptions = useMemo(() => 
    colaboradores.map(colaborador => {
      const nome = colaborador.nome || colaborador.NOME || `Colaborador ${colaborador.id}`;
      return {
        id: colaborador.id || colaborador.ID_PRESTADOR,
        value: nome,
        label: nome,
        nome: nome
      };
    }), [colaboradores]
  );

  // Função para obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    return {
      local: cacheRef.current,
      localStorage: cacheService.getStats()
    };
  }, []);

  return {
    // Estados de loading
    loading,
    
    // Opções formatadas
    colaboradorOptions,
    
    // Funções de carregamento
    loadColaboradores,
    clearCache,
    getCacheStats
  };
};

export default useOptimizedDropdowns;