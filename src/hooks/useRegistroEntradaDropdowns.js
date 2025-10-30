 import { useEffect } from 'react';
import useAppDataStore from '../store/appDataStore';

const useRegistroEntradaDropdowns = () => {
  const {
    dropdownData,
    loading,
    error,
    initialized,
    loadDropdownData,
    invalidateCache,
    forceReload,
    clearError,
    isDataLoaded
  } = useAppDataStore();

  // Carregar dados quando o hook for inicializado
  useEffect(() => {
    if (!initialized) {
      loadDropdownData();
    }
  }, [initialized, loadDropdownData]);

  // Função para recarregar dados (útil quando novos itens são adicionados)
  const reloadData = () => {
    invalidateCache();
  };

  // Função para forçar recarregamento (ignora cache)
  const forceReloadData = () => {
    forceReload();
  };

  // Retornar os dados e funções úteis
  return {
    // Dados
    posicoes: dropdownData.posicoes || [],
    marcas: dropdownData.marcas || [],
    seguradoras: dropdownData.seguradoras || [],
    colaboradores: dropdownData.colaboradores || [],
    prestadores: dropdownData.prestadores || [],
    
    // Estados
    loading,
    error,
    initialized,
    isDataLoaded: isDataLoaded(),
    
    // Funções
    reloadData,
    forceReloadData,
    clearError
  };
};

export default useRegistroEntradaDropdowns;


