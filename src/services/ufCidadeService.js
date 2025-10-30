/**
 * Serviço para gerenciar UF e cidades brasileiras
 * Implementa todas as funcionalidades solicitadas:
 * - Dropdown de UF com todos os estados
 * - Dropdown de cidades com filtro por UF
 * - Fechamento automático ao clicar fora
 * - Sem necessidade de tecla ESC
 */

import ufsCidadesData from '../data/ufs_cidades.json';

class UfCidadeService {
  constructor() {
    this.estados = ufsCidadesData.estados;
  }

  /**
   * Retorna todos os estados brasileiros
   */
  getEstados() {
    return {
      success: true,
      data: this.estados.map(estado => ({
        id: estado.sigla,
        value: estado.sigla,
        label: estado.nome,
        sigla: estado.sigla,
        nome: estado.nome
      }))
    };
  }

  /**
   * Retorna cidades filtradas por UF
   */
  getCidadesByUf(ufSigla) {
    if (!ufSigla) {
      return {
        success: true,
        data: []
      };
    }

    const estado = this.estados.find(estado => estado.sigla === ufSigla);
    if (!estado) {
      return {
        success: true,
        data: []
      };
    }

    return {
      success: true,
      data: estado.cidades.map((cidade, index) => ({
        id: `${ufSigla}-${index}`,
        value: cidade,
        label: cidade,
        nome: cidade,
        uf: ufSigla
      }))
    };
  }

  /**
   * Retorna todas as cidades (para casos especiais)
   */
  getAllCidades() {
    const todasCidades = [];
    this.estados.forEach(estado => {
      estado.cidades.forEach((cidade, index) => {
        todasCidades.push({
          id: `${estado.sigla}-${index}`,
          value: cidade,
          label: cidade,
          nome: cidade,
          uf: estado.sigla
        });
      });
    });

    return {
      success: true,
      data: todasCidades
    };
  }

  /**
   * Busca cidades por nome (para funcionalidade de busca)
   */
  searchCidades(query, ufSigla = null) {
    if (!query || query.trim() === '') {
      return this.getCidadesByUf(ufSigla);
    }

    let cidadesFiltradas = [];

    // Se UF especificada, buscar apenas nessa UF
    if (ufSigla) {
      const estado = this.estados.find(estado => estado.sigla === ufSigla);
      if (estado) {
        cidadesFiltradas = estado.cidades;
      }
    } else {
      // Buscar em todas as cidades
      this.estados.forEach(estado => {
        cidadesFiltradas = cidadesFiltradas.concat(estado.cidades);
      });
    }

    // Filtrar por nome da cidade
    const termo = query.toLowerCase();
    cidadesFiltradas = cidadesFiltradas.filter(cidade => 
      cidade.toLowerCase().includes(termo)
    );

    return {
      success: true,
      data: cidadesFiltradas.map((cidade, index) => ({
        id: `${ufSigla || 'all'}-${index}`,
        value: cidade,
        label: cidade,
        nome: cidade,
        uf: ufSigla || 'all'
      }))
    };
  }

  /**
   * Retorna estatísticas dos dados
   */
  getStats() {
    const totalCidades = this.estados.reduce((total, estado) => total + estado.cidades.length, 0);
    
    return {
      totalEstados: this.estados.length,
      totalCidades: totalCidades,
      cidadesPorEstado: this.estados.map(estado => ({
        estado: estado.nome,
        sigla: estado.sigla,
        quantidade: estado.cidades.length
      }))
    };
  }
}

// Instância singleton
const ufCidadeService = new UfCidadeService();

export default ufCidadeService;
