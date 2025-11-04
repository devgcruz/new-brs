import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função auxiliar para formatar datas (Corrigida para evitar datas inválidas)
const formatDate = (dateString) => {
  if (!dateString || dateString === '0000-00-00' || dateString === '1969-12-31') {
    return 'N/A';
  }
  try {
    const date = new Date(dateString);
    // Ajusta para o fuso horário local (evita problemas de UTC de um dia)
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);
    return correctedDate.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  } catch (e) {
    return dateString; // Retorna a string original se falhar
  }
};

// Função auxiliar para formatar datas e horas
const formatDateTime = (dateString) => {
    if (!dateString) return 'Data não disponível';
    try {
        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) return 'Data inválida';
        
        return dateObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Data não disponível';
    }
};

// Função auxiliar para evitar 'null' ou 'undefined'
const field = (value) => value || '';

// Função auxiliar para quebrar texto longo em múltiplas linhas
const drawTextWithWrap = (doc, text, x, y, maxWidth, fontSize, fontStyle = 'normal') => {
  doc.setFontSize(fontSize);
  doc.setFont(undefined, fontStyle);
  
  // Quebra o texto em múltiplas linhas se necessário
  const lines = doc.splitTextToSize(field(text), maxWidth);
  
  // Se não houver texto ou for apenas uma linha, desenha normalmente
  if (lines.length <= 1) {
    doc.text(lines[0] || '', x, y);
    return y;
  }
  
  // Desenha cada linha com espaçamento adequado (ajustado para fontes menores)
  const lineSpacing = fontSize * 0.45; // Espaçamento entre linhas (otimizado para fontes menores)
  let currentY = y;
  
  lines.forEach((line, index) => {
    doc.text(line, x, currentY);
    if (index < lines.length - 1) { // Não adiciona espaçamento após a última linha
      currentY += lineSpacing;
    }
  });
  
  // Retorna a posição Y final após desenhar todas as linhas
  return currentY;
};

export const generateEntradaReport = (registro, usuarioLogado) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  
  // --- Configurações de Layout (Otimizado para mais espaço útil) ---
  const margin = 10; // Reduzido de 15 para 10
  const col2X = pageWidth / 2; // Posição X da segunda coluna
  const labelValueSpacing = 2; // Espaço entre o rótulo e o valor (reduzido para ficar próximo)
  const lineHeight = 5; // Reduzido de 7 para 5
  const sectionSpacing = 6; // Reduzido de 10 para 6
  let y = 12; // Reduzido de 20 para 12

  // --- CABEÇALHO ---
  doc.setFontSize(13); // Aumentado de 12 para 13
  doc.setFont(undefined, 'bold');
  doc.text('BRS BERNARDO REGULADORA DE SINISTROS', pageWidth / 2, y, { align: 'center' });
  y += 7; // Reduzido de 10 para 7

  // --- DADOS DO PROTOCOLO ---
  const protocolo = field(registro.Protocolo || registro.PROTOCOLO || registro.id || registro.Id_Entrada);
  const posicao = field(registro.Posicao || registro.POSICAO || '');
  const dataEntrada = formatDate(registro.Data_Entrada || registro.DATA_ENTRADA || registro.data_entrada);
  
  doc.setFontSize(10); // Aumentado de 9 para 10
  doc.setFont(undefined, 'bold');
  doc.text(`PROTOCOLO: ${protocolo}`, margin, y);
  
  doc.setFont(undefined, 'normal');
  doc.text(`Posição: ${posicao}`, pageWidth / 2, y, { align: 'center' });
  doc.text(`DATA DE ENTRADA: ${dataEntrada}`, pageWidth - margin, y, { align: 'right' });
  y += 4; // Reduzido de 6 para 4
  doc.setDrawColor(180, 180, 180); // Cor da linha cinza claro
  doc.line(margin, y, pageWidth - margin, y); // Linha horizontal
  y += sectionSpacing;

  // --- NOVA LÓGICA DE BLOCOS (Moderno e Estilizado) ---
  
  // Função auxiliar para desenhar seções de 2 colunas
  const drawSection = (title, leftItems, rightItems = []) => {
    if(y > pageHeight - 30) { // Check de quebra de página (ajustado para mais espaço)
       doc.addPage();
       y = 12;
    }

    doc.setFontSize(9); // Aumentado de 8 para 9
    doc.setFont(undefined, 'bold');
    doc.text(title, margin, y);
    y += (lineHeight * 1.2); // Reduzido de 1.5 para 1.2
    
    // Determina o número máximo de linhas (o lado mais comprido)
    const maxRows = Math.max(leftItems.length, rightItems.length);

    for (let i = 0; i < maxRows; i++) {
      if(y > pageHeight - 20) { // Check de quebra de página dentro do loop (ajustado)
         doc.addPage();
         y = 12;
      }

      let maxYForRow = y; // Armazena a posição Y mais baixa desta linha

      // --- Coluna da Esquerda ---
      if (i < leftItems.length) {
        const item = leftItems[i];
        doc.setFontSize(8); // Aumentado de 7 para 8
        doc.setFont(undefined, 'bold');
        const labelText = `${item.label}:`;
        doc.text(labelText, margin, y); // Rótulo (Negrito)
        
        // Calcular posição X do valor baseado na largura do rótulo
        const labelWidth = doc.getTextWidth(labelText);
        const valueX = margin + labelWidth + labelValueSpacing;
        const maxWidthLeft = col2X - valueX - 5; // Largura disponível na coluna esquerda
        
        // Desenhar valor com quebra de linha
        doc.setFontSize(9); // Aumentado de 8 para 9
        doc.setFont(undefined, 'normal');
        const finalY = drawTextWithWrap(doc, item.value, valueX, y, maxWidthLeft, 9, 'normal'); // Aumentado de 8 para 9
        maxYForRow = Math.max(maxYForRow, finalY);
      }
      
      // --- Coluna da Direita ---
      if (i < rightItems.length) {
        const item = rightItems[i];
        doc.setFontSize(8); // Aumentado de 7 para 8
        doc.setFont(undefined, 'bold');
        const labelText = `${item.label}:`;
        doc.text(labelText, col2X, y); // Rótulo (Negrito)
        
        // Calcular posição X do valor baseado na largura do rótulo
        const labelWidth = doc.getTextWidth(labelText);
        const valueX = col2X + labelWidth + labelValueSpacing;
        const maxWidthRight = pageWidth - margin - valueX - 5; // Largura disponível na coluna direita
        
        // Desenhar valor com quebra de linha
        doc.setFontSize(9); // Aumentado de 8 para 9
        doc.setFont(undefined, 'normal');
        const finalY = drawTextWithWrap(doc, item.value, valueX, y, maxWidthRight, 9, 'normal'); // Aumentado de 8 para 9
        maxYForRow = Math.max(maxYForRow, finalY);
      }
      
      // Move Y para a posição mais baixa desta linha (considerando quebras de linha)
      y = maxYForRow + lineHeight;
    }
    
    y += (sectionSpacing / 2); // Espaço antes da linha
    doc.setDrawColor(180, 180, 180); // Cor da linha cinza claro
    doc.line(margin, y, pageWidth - margin, y); // Linha separadora
    y += sectionSpacing; // Espaço após a seção
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

  // --- INFORMAÇÕES VEÍCULO ---
  const anoFormatado = formatAno(registro.ANO_VEIC || registro.ANO_VEICULO, registro.ANO_MODELO || registro.ANO_MODELO);
  
  drawSection('INFORMAÇÕES VEÍCULO', [
    { label: 'MARCA', value: registro.MARCA || '' },
    { label: 'VEÍCULO', value: registro.VEICULO || '' },
    { label: 'COR DO VEÍCULO', value: registro.COR_VEICULO || registro.COR || registro.COR_DO_VEICULO || '' },
    { label: 'RENAVAM', value: registro.RENAVAM || '' },
    { label: 'CHASSI', value: registro.CHASSI || '' },
    { label: 'SEGURADORA', value: registro.SEGURADORA || '' },
    { label: 'POSIÇÃO DO PROCESSO', value: registro.POSICAO || registro.Posicao || '' },
    { label: 'COLABORADOR RESP.', value: registro.colaborador_nome || '' },

  ], [
    { label: 'ANO', value: anoFormatado },
    { label: 'PLACA', value: registro.PLACA || '' },
    { label: 'CÓD SINISTRO', value: registro.COD_SINISTRO || registro.N_Sinistro || '' },
    { label: 'STATUS PROCESSO', value: registro.TIPO || registro.TIPO_SERVICO || registro.Tipo_Servico || '' },
  ]);

  // Verificar se precisa de nova página antes das próximas seções
  if (y > pageHeight - 40) { // Ajustado de 60 para 40
    doc.addPage();
    y = 12;
  }

  // --- DADOS DE LOCALIZAÇÃO E ROUBO/FURTO (lado a lado) ---
  const sectionTitleY = y;
  
  // Título "DADOS DE LOCALIZAÇÃO"
  doc.setFontSize(9); // Aumentado de 8 para 9
  doc.setFont(undefined, 'bold');
  doc.text('DADOS DE LOCALIZAÇÃO', margin, sectionTitleY);
  
  // Título "DADOS DO ROUBO/FURTO" (lado direito)
  const rightSectionX = pageWidth / 2 + 10;
  doc.text('DADOS DO ROUBO/FURTO', rightSectionX, sectionTitleY);
  
  y = sectionTitleY + (lineHeight * 1.2); // Reduzido de 1.5 para 1.2
  
  // Desenhar as duas seções lado a lado
  const sectionLineHeight = 5; // Reduzido de 7 para 5
  
  // === CAIXA ESQUERDA: DADOS DE LOCALIZAÇÃO ===
  let currentY = y;
  let maxYLeft = currentY;
  
  // Desenhar campos
  doc.setFontSize(8); // Aumentado de 7 para 8
  doc.setFont(undefined, 'bold');
  const labelUF = 'UF:';
  doc.text(labelUF, margin, currentY);
  const labelUFWidth = doc.getTextWidth(labelUF);
  const ufValueX = margin + labelUFWidth + labelValueSpacing;
  const maxWidthLeft = rightSectionX - ufValueX - 5; // Largura disponível na coluna esquerda
  doc.setFontSize(9); // Aumentado de 8 para 9
  doc.setFont(undefined, 'normal');
  const ufY = drawTextWithWrap(doc, registro.UF || '', ufValueX, currentY, maxWidthLeft, 9, 'normal'); // Aumentado de 8 para 9
  maxYLeft = Math.max(maxYLeft, ufY);
  currentY = maxYLeft + sectionLineHeight;
  
  doc.setFontSize(8); // Aumentado de 7 para 8
  doc.setFont(undefined, 'bold');
  const labelCidade = 'CIDADE:';
  doc.text(labelCidade, margin, currentY);
  const labelCidadeWidth = doc.getTextWidth(labelCidade);
  const cidadeValueX = margin + labelCidadeWidth + labelValueSpacing;
  const maxWidthCidade = rightSectionX - cidadeValueX - 5;
  doc.setFontSize(9); // Aumentado de 8 para 9
  doc.setFont(undefined, 'normal');
  const cidadeY = drawTextWithWrap(doc, registro.CIDADE || registro.Cidade || '', cidadeValueX, currentY, maxWidthCidade, 9, 'normal'); // Aumentado de 8 para 9
  maxYLeft = Math.max(maxYLeft, cidadeY);
  
  // === CAIXA DIREITA: DADOS DO ROUBO/FURTO ===
  currentY = y;
  let maxYRight = currentY;
  
  // Desenhar campos
  doc.setFontSize(8); // Aumentado de 7 para 8
  doc.setFont(undefined, 'bold');
  doc.text(labelUF, rightSectionX, currentY);
  const ufSinistroValueX = rightSectionX + labelUFWidth + labelValueSpacing;
  const maxWidthRightUF = pageWidth - margin - ufSinistroValueX - 5; // Largura disponível na coluna direita
  doc.setFontSize(9); // Aumentado de 8 para 9
  doc.setFont(undefined, 'normal');
  const ufSinistroY = drawTextWithWrap(doc, registro.UF_SINISTRO || registro.UF_Ocorrencia || '', ufSinistroValueX, currentY, maxWidthRightUF, 9, 'normal'); // Aumentado de 8 para 9
  maxYRight = Math.max(maxYRight, ufSinistroY);
  currentY = maxYRight + sectionLineHeight;
  
  doc.setFontSize(8); // Aumentado de 7 para 8
  doc.setFont(undefined, 'bold');
  doc.text(labelCidade, rightSectionX, currentY);
  const cidadeSinistroValueX = rightSectionX + labelCidadeWidth + labelValueSpacing;
  const maxWidthRightCidade = pageWidth - margin - cidadeSinistroValueX - 5;
  doc.setFontSize(9); // Aumentado de 8 para 9
  doc.setFont(undefined, 'normal');
  const cidadeSinistroY = drawTextWithWrap(doc, registro.CIDADE_SINISTRO || registro.Cidade_Ocorrencia || '', cidadeSinistroValueX, currentY, maxWidthRightCidade, 9, 'normal'); // Aumentado de 8 para 9
  maxYRight = Math.max(maxYRight, cidadeSinistroY);
  currentY = maxYRight + sectionLineHeight;
  
  doc.setFontSize(8); // Aumentado de 7 para 8
  doc.setFont(undefined, 'bold');
  const labelBO = 'NÚMERO BO:';
  doc.text(labelBO, rightSectionX, currentY);
  const labelBOWidth = doc.getTextWidth(labelBO);
  const boValueX = rightSectionX + labelBOWidth + labelValueSpacing;
  const maxWidthRightBO = pageWidth - margin - boValueX - 5;
  doc.setFontSize(9); // Aumentado de 8 para 9
  doc.setFont(undefined, 'normal');
  const boY = drawTextWithWrap(doc, registro.NUM_BO || registro.N_BO || '', boValueX, currentY, maxWidthRightBO, 9, 'normal'); // Aumentado de 8 para 9
  maxYRight = Math.max(maxYRight, boY);
  
  // Atualizar Y para a posição mais baixa das duas caixas
  y = Math.max(maxYLeft, maxYRight) + (sectionSpacing / 2);
  
  // Linha separadora após as seções
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageWidth - margin, y);
  y += sectionSpacing;

  // Verificar se precisa de nova página antes das observações
  if (y > pageHeight - 50) { // Ajustado de 80 para 50
    doc.addPage();
    y = 12;
  }

  // --- OBSERVAÇÕES (LINHAS EM BRANCO) ---
  doc.setFontSize(9); // Aumentado de 8 para 9
  doc.setFont(undefined, 'bold');
  doc.text('OBSERVAÇÕES', margin, y);
  y += (lineHeight * 1.2); // Reduzido de 1.5 para 1.2

  // Desenhar linhas em branco para preenchimento manual
  const linhaHeight = 5; // Reduzido de 6 para 5
  const numLinhas = 10; // Aumentado de 8 para 10 (mais linhas com fonte menor)
  
  doc.setFontSize(9); // Aumentado de 8 para 9
  doc.setFont(undefined, 'normal');
  doc.setDrawColor(0, 0, 0); // Cor preta para as linhas
  
  // Desenhar linhas horizontais para o funcionário escrever
  for (let i = 0; i < numLinhas; i++) {
    // Desenhar linha horizontal
    doc.line(margin, y, pageWidth - margin, y);
    y += linhaHeight;
    
    // Verificar se precisa de nova página
    if (y > pageHeight - 15) { // Ajustado de 30 para 15
      doc.addPage();
      y = 12;
    }
  }
  
  y += 3; // Reduzido de 5 para 3
  
  // Garantir que o Y não ultrapasse a página
  if (y > pageHeight - 12) { // Ajustado de 20 para 12
    y = pageHeight - 12;
  }

  // --- POSICIONAMENTO DO RODAPÉ ---
  // Força o rodapé a ficar no fim da página atual
  if (y < pageHeight - 10) { // Ajustado de 15 para 10
      y = pageHeight - 10;
  }
  // Se a tabela terminar muito perto do fim, adiciona uma nova página
  if (y > pageHeight - 10) { // Ajustado de 15 para 10
      doc.addPage();
      y = pageHeight - 10;
  }

  // --- RODAPÉ ---
  const dataGeracao = new Date().toLocaleDateString('pt-BR');
  const loginGeracao = usuarioLogado?.nome || usuarioLogado?.name || usuarioLogado?.username || 'N/A';
  
  doc.setFontSize(8); // Aumentado de 7 para 8
  doc.setFont(undefined, 'normal');
  doc.text(`DATA GERAÇÃO: ${dataGeracao}`, margin, y);
  doc.text(`LOGIN GERAÇÃO: ${loginGeracao}`, pageWidth / 2, y, { align: 'center' });
  // Conta o número total de páginas e exibe a página atual
  const pageCount = doc.internal.getNumberOfPages();
  doc.text(`${pageCount}/${pageCount}`, pageWidth - margin, y, { align: 'right' });

  // --- SALVAR O PDF ---
  doc.save(`Protocolo_${protocolo}.pdf`);
};
