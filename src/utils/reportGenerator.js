import jsPDF from 'jspdf';
// Importar autoTable de forma compatível
import autoTable from 'jspdf-autotable';

// Função auxiliar para formatar datas
const formatDate = (dateString) => {
  if (!dateString || dateString === '0000-00-00' || dateString === '0000-00-00 00:00:00') return 'N/A';
  try {
    // Se já estiver no formato brasileiro, retornar como está
    if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Se for formato YYYY-MM-DD, parsear manualmente para evitar problemas de timezone
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const [datePart] = dateString.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      
      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }
      
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    // Para outros formatos, usar o método padrão
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

// Função auxiliar para evitar 'null' ou 'undefined'
const field = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Função auxiliar para formatar ano
const formatAno = (anoVeiculo, anoModelo) => {
  const anoV = anoVeiculo ? String(anoVeiculo).trim() : '';
  const anoM = anoModelo ? String(anoModelo).trim() : '';
  
  if (anoV && anoM && anoV !== anoM) {
    return `${anoV}/${anoM}`;
  }
  return anoV || anoM || '';
};

/**
 * Gera o relatório PDF de uma entrada
 * @param {Object} registro - Dados completos do registro (retornado pela API)
 * @param {Object} usuarioLogado - Objeto do usuário logado (do authStore)
 */
export const generateEntradaReport = (registro, usuarioLogado) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 15; // Posição Y inicial

  // --- CABEÇALHO ---
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('BRS BERNARDO REGULADORA DE SINISTROS', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // --- DADOS DO PROTOCOLO ---
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  const protocolo = field(registro.Protocolo || registro.PROTOCOLO || registro.id || registro.Id_Entrada);
  const posicao = field(registro.POSICAO || registro.Posicao || '');
  const dataEntrada = formatDate(registro.DATA_ENTRADA || registro.Data_Entrada || registro.data_entrada);
  
  doc.text(`PROTOCOLO: ${protocolo}`, margin, y);
  
  doc.setFont(undefined, 'normal');
  doc.text(`Posição: ${posicao}`, pageWidth / 2, y, { align: 'center' });
  doc.text(`DATA DE ENTRADA: ${dataEntrada}`, pageWidth - margin, y, { align: 'right' });
  y += 6;
  doc.line(margin, y, pageWidth - margin, y); // Linha horizontal
  y += 6;

  // --- BLOCOS DE DADOS ---
  const FONT_SIZE_LABEL = 10;
  const FONT_SIZE_VALUE = 10;

  // Função auxiliar para desenhar seções
  const drawSection = (title, data) => {
    // Verificar se precisa de nova página antes de começar a seção
    if (y > pageHeight - 40) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(FONT_SIZE_LABEL);
    doc.setFont(undefined, 'bold');
    doc.text(title, margin, y);
    y += 5;
    
    doc.setFontSize(FONT_SIZE_VALUE);
    doc.setFont(undefined, 'normal');
    
    // Desenhar campos em duas colunas alternadas
    let col1X = margin;
    let col2X = pageWidth / 2 + 10;
    let currentY = y;
    let maxY = currentY;

    data.forEach((item, index) => {
      // Verificar se precisa de nova página
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 15;
        maxY = currentY;
      }

      // Alternar entre colunas
      const isSecondColumn = index % 2 === 1;
      const x = isSecondColumn ? col2X : col1X;
      
      // Desenhar label em negrito
      doc.setFont(undefined, 'bold');
      doc.text(`${item.label}:`, x, currentY);
      // Desenhar valor em normal
      doc.setFont(undefined, 'normal');
      const labelWidth = doc.getTextWidth(item.label + ': ');
      doc.text(field(item.value), x + labelWidth, currentY);
      
      if (isSecondColumn) {
        // Se for segunda coluna, incrementa o Y para a próxima linha
        currentY += 5;
        maxY = currentY;
      } else {
        // Se não for segunda coluna, mantém o Y para a segunda coluna na mesma linha
        maxY = Math.max(maxY, currentY);
      }
    });
    
    // Se houver número ímpar de itens, garantir que o Y seja incrementado
    if (data.length % 2 === 1) {
      maxY += 5;
    }
    
    y = maxY + 6; // Espaço após a seção
  };

  // --- INFORMAÇÕES VEÍCULO ---
  const anoFormatado = formatAno(registro.ANO_VEIC || registro.ANO_VEICULO, registro.ANO_MODELO || registro.ANO_MODELO);
  
  drawSection('INFORMAÇÕES VEÍCULO', [
    { label: 'MARCA', value: registro.MARCA || '' },
    { label: 'VEÍCULO', value: registro.VEICULO || '' },
    { label: 'CHASSI', value: registro.CHASSI || '' },
    { label: 'SEGURADORA', value: registro.SEGURADORA || '' },
    { label: 'POSIÇÃO DO PROCESSO', value: registro.POSICAO || registro.Posicao || '' },
    { label: 'COLABORADOR RESPONSÁVEL', value: registro.colaborador_nome || '' },
    { label: 'ANO', value: anoFormatado },
    { label: 'PLACA', value: registro.PLACA || '' },
    { label: 'CÓD SINISTRO', value: registro.COD_SINISTRO || registro.N_Sinistro || '' },
    { label: 'STATUS PROCESSO', value: registro.TIPO || registro.TIPO_SERVICO || registro.Tipo_Servico || '' },
  ]);

  // Verificar se precisa de nova página antes da próxima seção
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 15;
  }

  // --- DADOS DE LOCALIZAÇÃO E ROUBO/FURTO (lado a lado) ---
  // Verificar se precisa de nova página antes das seções
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 15;
  }

  const sectionTitleY = y;
  const sectionStartY = y + 5;
  
  // Título "DADOS DE LOCALIZAÇÃO"
  doc.setFontSize(FONT_SIZE_LABEL);
  doc.setFont(undefined, 'bold');
  doc.text('DADOS DE LOCALIZAÇÃO', margin, sectionTitleY);
  
  // Título "DADOS DO ROUBO/FURTO" (lado direito)
  const rightSectionX = pageWidth / 2 + 10;
  doc.text('DADOS DO ROUBO/FURTO', rightSectionX, sectionTitleY);
  
  y = sectionStartY;
  
  // Desenhar as duas seções lado a lado
  const boxWidth = (pageWidth - (margin * 2) - 10) / 2; // Largura de cada caixa (menos espaço entre elas)
  const padding = 3;
  const lineHeight = 5;
  
  // === CAIXA ESQUERDA: DADOS DE LOCALIZAÇÃO ===
  const leftBoxX = margin;
  const leftBoxY = y;
  const leftBoxHeight = 3 * lineHeight + (padding * 2); // 2 campos + padding
  
  let currentY = leftBoxY + padding;
  
  // Desenhar campos
  doc.setFontSize(FONT_SIZE_VALUE);
  doc.setFont(undefined, 'bold');
  doc.text('UF:', leftBoxX + padding, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.UF || ''), leftBoxX + padding + 15, currentY);
  currentY += lineHeight;
  
  // Linha separadora removida
  
  doc.setFont(undefined, 'bold');
  doc.text('CIDADE:', leftBoxX + padding, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.CIDADE || registro.Cidade || ''), leftBoxX + padding + 30, currentY);
  
  // Não desenhar borda (removido conforme solicitado)
  
  // === CAIXA DIREITA: DADOS DO ROUBO/FURTO ===
  const rightBoxX = rightSectionX - padding;
  const rightBoxY = y;
  const rightBoxHeight = 4 * lineHeight + (padding * 2); // 3 campos + padding
  
  currentY = rightBoxY + padding;
  
  // Desenhar campos
  doc.setFont(undefined, 'bold');
  doc.text('UF:', rightBoxX + padding, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.UF_SINISTRO || registro.UF_Ocorrencia || ''), rightBoxX + padding + 15, currentY);
  currentY += lineHeight;
  
  // Linha separadora removida
  
  doc.setFont(undefined, 'bold');
  doc.text('CIDADE:', rightBoxX + padding, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.CIDADE_SINISTRO || registro.Cidade_Ocorrencia || ''), rightBoxX + padding + 30, currentY);
  currentY += lineHeight;
  
  // Linha separadora removida
  
  doc.setFont(undefined, 'bold');
  doc.text('NÚMERO BO:', rightBoxX + padding, currentY);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.NUM_BO || registro.N_BO || ''), rightBoxX + padding + 40, currentY);
  
  // Não desenhar borda (removido conforme solicitado)
  
  // Atualizar Y para a posição mais baixa das duas caixas
  y = Math.max(leftBoxY + leftBoxHeight, rightBoxY + rightBoxHeight) + 6;

  // Verificar se precisa de nova página antes das observações
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 15;
  }

  // --- OBSERVAÇÕES ---
  // Verificar se precisa de nova página antes das observações
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 15;
  }

  doc.setFontSize(FONT_SIZE_LABEL);
  doc.setFont(undefined, 'bold');
  doc.text('OBSERVAÇÕES', margin, y);
  y += 8;

  // Desenhar linhas em branco para preenchimento manual
  const linhaHeight = 6; // Altura de cada linha
  const numLinhas = 8; // Número de linhas para preenchimento
  const larguraLinha = pageWidth - (margin * 2); // Largura da linha (largura da página menos margens)
  
  doc.setFontSize(FONT_SIZE_VALUE);
  doc.setFont(undefined, 'normal');
  
  // Desenhar linhas horizontais para o funcionário escrever
  for (let i = 0; i < numLinhas; i++) {
    // Desenhar linha horizontal
    doc.line(margin, y, pageWidth - margin, y);
    y += linhaHeight;
    
    // Verificar se precisa de nova página
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 15;
    }
  }
  
  y += 5; // Espaço após as linhas
  
  // Garantir que o Y não ultrapasse a página
  if (y > pageHeight - 20) {
    y = pageHeight - 20;
  }

  // --- RODAPÉ ---
  const dataGeracao = new Date().toLocaleDateString('pt-BR');
  const loginGeracao = usuarioLogado?.nome || usuarioLogado?.name || usuarioLogado?.username || 'N/A';
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`DATA GERAÇÃO: ${dataGeracao}`, margin, pageHeight - 10);
  doc.text(`LOGIN GERAÇÃO: ${loginGeracao}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Contar número total de páginas
  const totalPages = doc.internal.getNumberOfPages();
  doc.text(`${totalPages}/${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  // --- SALVAR O PDF ---
  const nomeArquivo = `Protocolo_${protocolo}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nomeArquivo);
};

