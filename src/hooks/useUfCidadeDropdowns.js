/**
 * Hook personalizado para gerenciar dropdowns UF/Cidade
 * Implementa todas as funcionalidades solicitadas:
 * - Dropdown de UF com todos os estados
 * - Dropdown de cidades filtradas por UF
 * - Fechamento automático ao clicar fora
 * - Sem necessidade de tecla ESC
 * - Sincronização com valores externos (controlado)
 * 
 * @param {string} externalUf - Valor externo da UF (opcional, para modo controlado)
 * @param {string} externalCidade - Valor externo da Cidade (opcional, para modo controlado)
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import ufCidadeService from '../services/ufCidadeService';

export const useUfCidadeDropdowns = (externalUf = '', externalCidade = '') => {
  // Estados para UF
  const [ufSelecionada, setUfSelecionada] = useState(externalUf);
  const [ufOptions, setUfOptions] = useState([]);
  const [loadingUf, setLoadingUf] = useState(false);

  // Estados para cidades
  const [cidadeSelecionada, setCidadeSelecionada] = useState(externalCidade);
  const [cidadeOptions, setCidadeOptions] = useState([]);
  const [loadingCidade, setLoadingCidade] = useState(false);

  // Estados para busca
  const [buscaCidade, setBuscaCidade] = useState('');
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);

  // Sincronizar com valores externos (quando o componente pai atualiza)
  useEffect(() => {
    if (externalUf !== ufSelecionada) {
      setUfSelecionada(externalUf);
    }
  }, [externalUf]);

  useEffect(() => {
    if (externalCidade !== cidadeSelecionada) {
      setCidadeSelecionada(externalCidade);
    }
  }, [externalCidade]);

  // Carregar estados na inicialização
  useEffect(() => {
    loadEstados();
  }, []);

  // Carregar cidades quando UF mudar
  useEffect(() => {
    if (ufSelecionada) {
      loadCidades(ufSelecionada);
    } else {
      setCidadeOptions([]);
      setCidadesFiltradas([]);
      // Não limpar cidadeSelecionada aqui para evitar limpar o valor externo
    }
  }, [ufSelecionada]);

  // Filtrar cidades quando busca mudar
  useEffect(() => {
    if (buscaCidade.trim() === '') {
      setCidadesFiltradas(cidadeOptions);
    } else {
      const resultado = ufCidadeService.searchCidades(buscaCidade, ufSelecionada);
      setCidadesFiltradas(resultado.data);
    }
  }, [buscaCidade, cidadeOptions, ufSelecionada]);

  /**
   * Carrega todos os estados brasileiros
   */
  const loadEstados = useCallback(async () => {
    setLoadingUf(true);
    try {
      const response = ufCidadeService.getEstados();
      if (response.success) {
        setUfOptions(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
    } finally {
      setLoadingUf(false);
    }
  }, []);

  /**
   * Carrega cidades por UF
   */
  const loadCidades = useCallback(async (ufSigla) => {
    setLoadingCidade(true);
    try {
      const response = ufCidadeService.getCidadesByUf(ufSigla);
      if (response.success) {
        setCidadeOptions(response.data);
        setCidadesFiltradas(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
    } finally {
      setLoadingCidade(false);
    }
  }, []);

  /**
   * Handler para mudança de UF
   */
  const handleUfChange = useCallback((value) => {
    setUfSelecionada(value);
    setCidadeSelecionada(''); // Limpar cidade selecionada
    setBuscaCidade(''); // Limpar busca
  }, []);

  /**
   * Handler para mudança de cidade
   */
  const handleCidadeChange = useCallback((value) => {
    setCidadeSelecionada(value);
  }, []);

  /**
   * Handler para busca de cidade
   */
  const handleBuscaCidade = useCallback((value) => {
    setBuscaCidade(value);
  }, []);

  /**
   * Limpar seleções
   */
  const limparSelecoes = useCallback(() => {
    setUfSelecionada('');
    setCidadeSelecionada('');
    setBuscaCidade('');
    setCidadeOptions([]);
    setCidadesFiltradas([]);
  }, []);

  /**
   * Resetar apenas cidade (manter UF)
   */
  const resetarCidade = useCallback(() => {
    setCidadeSelecionada('');
    setBuscaCidade('');
  }, []);

  /**
   * Obter cidade selecionada com detalhes
   */
  const getCidadeSelecionada = useCallback(() => {
    if (!cidadeSelecionada) return null;
    
    const cidade = cidadeOptions.find(c => c.value === cidadeSelecionada);
    return cidade || null;
  }, [cidadeSelecionada, cidadeOptions]);

  /**
   * Obter UF selecionada com detalhes
   */
  const getUfSelecionada = useCallback(() => {
    if (!ufSelecionada) return null;
    
    const uf = ufOptions.find(u => u.value === ufSelecionada);
    return uf || null;
  }, [ufSelecionada, ufOptions]);

  /**
   * Verificar se há dados carregados
   */
  const isDataLoaded = useMemo(() => {
    return ufOptions.length > 0;
  }, [ufOptions.length]);

  /**
   * Verificar se há cidades disponíveis para a UF selecionada
   */
  const hasCidades = useMemo(() => {
    return cidadeOptions.length > 0;
  }, [cidadeOptions.length]);

  /**
   * Obter estatísticas
   */
  const getStats = useCallback(() => {
    return ufCidadeService.getStats();
  }, []);

  return {
    // Estados
    ufSelecionada,
    cidadeSelecionada,
    buscaCidade,
    
    // Opções
    ufOptions,
    cidadeOptions: cidadesFiltradas,
    
    // Loading
    loadingUf,
    loadingCidade,
    
    // Handlers
    handleUfChange,
    handleCidadeChange,
    handleBuscaCidade,
    
    // Utilitários
    limparSelecoes,
    resetarCidade,
    getCidadeSelecionada,
    getUfSelecionada,
    
    // Status
    isDataLoaded,
    hasCidades,
    getStats
  };
};

export default useUfCidadeDropdowns;
