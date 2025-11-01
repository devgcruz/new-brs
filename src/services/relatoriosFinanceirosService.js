import { API_CONFIG, makeRequest } from '../config/api.js';
const API_BASE_URL = API_CONFIG.BASE_URL;

// Usar a função makeRequest do config/api.js que já tem toda a lógica de retry e tratamento de erros
const makeAuthenticatedRequest = makeRequest;

const relatoriosFinanceirosService = {
  // Buscar relatórios financeiros com filtros
  async getRelatorios(filtros = {}, pagination = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Adicionar filtros à query string
      if (filtros.dataInicio) {
        queryParams.append('data_inicio', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        queryParams.append('data_fim', filtros.dataFim);
      }
      if (filtros.status && filtros.status !== 'todos') {
        queryParams.append('status', filtros.status);
      }
      
      // Adicionar parâmetros de paginação
      if (pagination.page) {
        queryParams.append('page', pagination.page);
      }
      if (pagination.per_page) {
        queryParams.append('per_page', pagination.per_page);
      }

      const url = `/relatorios-financeiros${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await makeAuthenticatedRequest(url);
      
      return {
        success: response.success,
        data: response.data?.relatorios || [],
        estatisticas: response.data?.estatisticas || {},
        meta: response.data?.meta || {}
      };
    } catch (error) {
      console.error('Erro ao buscar relatórios financeiros:', error);
      return {
        success: false,
        message: error.message,
        data: [],
        estatisticas: {},
        meta: {}
      };
    }
  },

  // Gerar dados para PDF
  async gerarDadosParaPDF(filtros = {}) {
    try {
      const response = await makeAuthenticatedRequest('/relatorios-financeiros', {
        method: 'POST',
        body: JSON.stringify(filtros)
      });
      
      return {
        success: response.success,
        data: response.data?.relatorios || [],
        filtros: response.data?.filtros_aplicados || {}
      };
    } catch (error) {
      console.error('Erro ao gerar dados para PDF:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  },

  // Exportar para Excel
  async exportarParaExcel(filtros = {}, dadosRelatorios = null) {
    try {
      // Se não foi passado dadosRelatorios, buscar do servidor
      let dadosResponse;
      if (dadosRelatorios) {
        dadosResponse = { success: true, data: dadosRelatorios };
      } else {
        dadosResponse = await this.gerarDadosParaPDF(filtros);
      }
      
      if (!dadosResponse.success) {
        throw new Error(dadosResponse.message);
      }

      // Importar XLSX dinamicamente
      const { default: XLSX } = await import('xlsx');
      
      // Preparar dados para exportação
      const dadosTabela = [];
      
      dadosResponse.data.forEach((relatorio) => {
        const { entrada, financeiros } = relatorio;
        
        if (financeiros.length === 0) {
          // Se não há lançamentos financeiros
          dadosTabela.push({
            'Data': this.formatarData(entrada.data_registro),
            'Veículo': entrada.veiculo || '-',
            'Placa': entrada.placa || '-',
            'Chassi': entrada.chassi || '-',
            'Sinistro': entrada.cod_sinistro || '-',
            'Despesas': '-',
            'Data Pagto Despesas': '-',
            'Nota Fiscal': '-',
            'Honorários': '-',
            'Data Pagto Honorários': '-',
            'Status': '-',
            'Observações': '-'
          });
        } else {
          // Para cada lançamento financeiro
          financeiros.forEach((financeiro) => {
            dadosTabela.push({
              'Data': this.formatarData(entrada.data_registro),
              'Veículo': entrada.veiculo || '-',
              'Placa': entrada.placa || '-',
              'Chassi': entrada.chassi || '-',
              'Sinistro': entrada.cod_sinistro || '-',
              'Despesas': this.formatarMoeda(financeiro.valor_total_recibo),
              'Data Pagto Despesas': this.formatarData(financeiro.data_pagamento_recibo),
              'Nota Fiscal': financeiro.numero_nota_fiscal || '-',
              'Honorários': this.formatarMoeda(financeiro.valor_nota_fiscal),
              'Data Pagto Honorários': this.formatarData(financeiro.data_pagamento_nota_fiscal),
              'Status': financeiro.status_pagamento || 'Pendente',
              'Observações': financeiro.observacao || financeiro.OBSERVACOES || '-'
            });
          });
        }
      });
      
      // Criar workbook
      const ws = XLSX.utils.json_to_sheet(dadosTabela);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatório Financeiro');
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 15 }, // Data
        { wch: 30 }, // Veículo
        { wch: 12 }, // Placa
        { wch: 20 }, // Chassi
        { wch: 15 }, // Sinistro
        { wch: 18 }, // Despesas
        { wch: 20 }, // Data Pagto Despesas
        { wch: 15 }, // Nota Fiscal
        { wch: 18 }, // Honorários
        { wch: 22 }, // Data Pagto Honorários
        { wch: 15 }, // Status
        { wch: 40 }  // Observações
      ];
      ws['!cols'] = colWidths;
      
      // Salvar o arquivo
      const nomeArquivo = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, nomeArquivo);
      
      return {
        success: true,
        message: 'Excel gerado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Exportar para PDF (usando jsPDF)
  async exportarParaPDF(filtros = {}) {
    try {
      // Gerar dados para PDF
      const dadosResponse = await this.gerarDadosParaPDF(filtros);
      
      if (!dadosResponse.success) {
        throw new Error(dadosResponse.message);
      }

      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Configurar fonte
      doc.setFont('helvetica');
      
      // Título do relatório
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO FINANCEIRO', 20, 20);
      
      // Informações do relatório
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
      
      if (filtros.dataInicio && filtros.dataFim) {
        doc.text(`Período: ${filtros.dataInicio} a ${filtros.dataFim}`, 20, 35);
      }
      
      if (filtros.status && filtros.status !== 'todos') {
        doc.text(`Status: ${filtros.status}`, 20, 40);
      }
      
      // Preparar dados para a tabela
      const dadosTabela = [];
      
      dadosResponse.data.forEach((relatorio) => {
        const { entrada, financeiros } = relatorio;
        
        if (financeiros.length === 0) {
          // Se não há lançamentos financeiros
          dadosTabela.push([
            entrada.placa || '-',
            entrada.veiculo || '-',
            entrada.marca || '-',
            entrada.cod_sinistro || '-',
            '-',
            '-',
            '-',
            '-',
            '-',
            '-'
          ]);
        } else {
          // Para cada lançamento financeiro
          financeiros.forEach((financeiro) => {
            dadosTabela.push([
              entrada.placa || '-',
              entrada.veiculo || '-',
              entrada.marca || '-',
              entrada.cod_sinistro || '-',
              this.formatarMoeda(financeiro.valor_total_recibo),
              this.formatarData(financeiro.data_pagamento_recibo),
              this.formatarMoeda(financeiro.valor_nota_fiscal),
              this.formatarData(financeiro.data_pagamento_nota_fiscal),
              financeiro.status_pagamento || 'Pendente',
              financeiro.observacao || '-'
            ]);
          });
        }
      });
      
      // Cabeçalhos da tabela
      const headers = [
        'Placa',
        'Veículo',
        'Marca',
        'Sinistro',
        'Despesas',
        'Data Pag. Despesas',
        'Honorários',
        'Data Pag. Honorários',
        'Status',
        'Observações'
      ];
      
      // Adicionar tabela ao PDF
      autoTable(doc, {
        head: [headers],
        body: dadosTabela,
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          4: { halign: 'right' }, // Despesas
          6: { halign: 'right' }, // Honorários
          5: { halign: 'center' }, // Data Pag. Despesas
          7: { halign: 'center' }, // Data Pag. Honorários
          8: { halign: 'center' }  // Status
        },
        margin: { left: 10, right: 10 }
      });
      
      // Adicionar estatísticas no final
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMO ESTATÍSTICO', 20, finalY);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Registros: ${dadosResponse.data.length}`, 20, finalY + 10);
      
      // Calcular totais
      let totalDespesas = 0;
      let totalHonorarios = 0;
      
      dadosResponse.data.forEach((relatorio) => {
        relatorio.financeiros.forEach((financeiro) => {
          totalDespesas += parseFloat(financeiro.valor_total_recibo || 0);
          totalHonorarios += parseFloat(financeiro.valor_nota_fiscal || 0);
        });
      });
      
      doc.text(`Total Despesas: ${this.formatarMoeda(totalDespesas)}`, 20, finalY + 20);
      doc.text(`Total Honorários: ${this.formatarMoeda(totalHonorarios)}`, 20, finalY + 30);
      doc.text(`Total Geral: ${this.formatarMoeda(totalDespesas + totalHonorarios)}`, 20, finalY + 40);
      
      // Salvar o PDF
      const nomeArquivo = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);
      
      return {
        success: true,
        message: 'PDF gerado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Função auxiliar para formatar moeda
  formatarMoeda(valor) {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  },

  // Função auxiliar para formatar data
  formatarData(data) {
    if (!data) return '-';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return '-';
    }
  },

  /**
   * Busca o relatório financeiro AGRUPADO POR ENTRADA.
   * @param {Object} filters - Filtros, ex: { data_inicio, data_fim }
   * @returns {Promise<Object>} Resposta da API
   */
  async getRelatorioAgrupado(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.data_inicio) params.append('data_inicio', filters.data_inicio);
      if (filters.data_fim) params.append('data_fim', filters.data_fim);
      
      const queryString = params.toString();
      const response = await makeAuthenticatedRequest(`/relatorio-financeiro-agrupado${queryString ? `?${queryString}` : ''}`);
      
      return {
        success: true,
        data: response.data || [],
        meta: response.meta || { total: response.data?.length || 0 }
      };
    } catch (error) {
      console.error('Erro ao buscar relatório financeiro agrupado:', error);
      return { success: false, data: [], message: error.message };
    }
  }
};

export default relatoriosFinanceirosService;
