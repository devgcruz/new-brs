import { API_CONFIG, makeRequest } from '../config/api.js';
import * as XLSX from 'xlsx';

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

      // Preparar dados para exportação no formato solicitado
      const dadosTabela = [];
      
      dadosResponse.data.forEach((relatorio) => {
        const { entrada, financeiros } = relatorio;
        
        // Normalizar nomes de campos (suportar maiúsculas e minúsculas)
        const entradaData = {
          data_registro: entrada.data_registro || entrada.data_entrada || entrada.DATA_ENTRADA || entrada.created_at,
          veiculo: entrada.veiculo || entrada.VEICULO || '-',
          placa: entrada.placa || entrada.PLACA || '-',
          chassi: entrada.chassi || entrada.CHASSI || '-',
          cod_sinistro: entrada.cod_sinistro || entrada.COD_SINISTRO || entrada.N_Sinistro || '-',
          seguradora: entrada.seguradora || entrada.SEGURADORA || '-'
        };
        
        if (!financeiros || financeiros.length === 0) {
          // Se não há lançamentos financeiros
          dadosTabela.push({
            'Data': this.formatarData(entradaData.data_registro),
            'Veículo': entradaData.veiculo,
            'Placa': entradaData.placa,
            'Chassi': entradaData.chassi,
            'Sinistro': entradaData.cod_sinistro,
            'Seguradora': entradaData.seguradora,
            'Despesas': '-',
            'Data da Despesa': '-',
            'Data Pagto Despesas': '-',
            'Nota Fiscal': '-',
            'Data da Nota Fiscal': '-',
            'Honorários': '-',
            'Data Pagto Honorários': '-',
            'Status': '-',
            'Observações': '-'
          });
        } else {
          // Para cada lançamento financeiro - criar uma linha por lançamento
          financeiros.forEach((financeiro) => {
            // Normalizar nomes de campos do financeiro
            const finData = {
              valor_total_recibo: financeiro.valor_total_recibo || financeiro.VALOR_TOTAL_RECIBO || 0,
              valor_nota_fiscal: financeiro.valor_nota_fiscal || financeiro.VALOR_NOTA_FISCAL || 0,
              data_nota_fiscal: financeiro.data_nota_fiscal_alt || financeiro.data_nota_fiscal || financeiro.DATA_NOTA_FISCAL || financeiro.created_at || null,
              data_nota_fiscal_honorarios: financeiro.data_nota_fiscal_alt || financeiro.data_nota_fiscal || financeiro.DATA_NOTA_FISCAL || null,
              data_pagamento_recibo: financeiro.data_pagamento_recibo || financeiro.DATA_PAGAMENTO_RECIBO || null,
              data_pagamento_nota_fiscal: financeiro.data_pagamento_nota_fiscal || financeiro.DATA_PAGAMENTO_NOTA_FISCAL || null,
              numero_nota_fiscal: financeiro.numero_nota_fiscal || financeiro.NUMERO_NOTA_FISCAL || '-',
              status_pagamento: financeiro.status_pagamento || financeiro.StatusPG || financeiro.status_pg || 'Pendente',
              observacao: financeiro.observacao || financeiro.OBSERVACOES || financeiro.observacoes || '-'
            };
            
            dadosTabela.push({
              'Data': this.formatarData(entradaData.data_registro),
              'Veículo': entradaData.veiculo,
              'Placa': entradaData.placa,
              'Chassi': entradaData.chassi,
              'Sinistro': entradaData.cod_sinistro,
              'Seguradora': entradaData.seguradora,
              'Despesas': finData.valor_total_recibo ? this.formatarMoeda(finData.valor_total_recibo) : '-',
              'Data da Despesa': this.formatarData(finData.data_nota_fiscal),
              'Data Pagto Despesas': this.formatarData(finData.data_pagamento_recibo),
              'Nota Fiscal': finData.numero_nota_fiscal,
              'Data da Nota Fiscal': this.formatarData(finData.data_nota_fiscal_honorarios),
              'Honorários': finData.valor_nota_fiscal ? this.formatarMoeda(finData.valor_nota_fiscal) : '-',
              'Data Pagto Honorários': this.formatarData(finData.data_pagamento_nota_fiscal),
              'Status': finData.status_pagamento,
              'Observações': finData.observacao
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
        { wch: 25 }, // Seguradora
        { wch: 18 }, // Despesas
        { wch: 18 }, // Data da Despesa
        { wch: 20 }, // Data Pagto Despesas
        { wch: 15 }, // Nota Fiscal
        { wch: 18 }, // Data da Nota Fiscal
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
      // Verificar se a data é inválida
      if (isNaN(date.getTime())) {
        return '-';
      }
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return '-';
    }
  }
};

export default relatoriosFinanceirosService;
