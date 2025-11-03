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

export const generateEntradaReport = (registro, usuarioLogado) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  
  // --- Configurações de Layout ---
  const margin = 15;
  const col2X = pageWidth / 2; // Posição X da segunda coluna
  const labelOffset = 50; // Distância entre o Rótulo e o Valor (ex: PLACA: [50px] TES1234)
  const lineHeight = 7; // Aumentado para mais espaço (menos "colado")
  const sectionSpacing = 10; // Espaço entre seções
  let y = 20; // Posição Y inicial

  // --- CABEÇALHO ---
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('BRS BERNARDO REGULADORA DE SINISTROS', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // --- DADOS DO PROTOCOLO ---
  const protocolo = field(registro.Protocolo || registro.PROTOCOLO || registro.id || registro.Id_Entrada);
  const posicao = field(registro.Posicao || registro.POSICAO || '');
  const dataEntrada = formatDate(registro.Data_Entrada || registro.DATA_ENTRADA || registro.data_entrada);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(`PROTOCOLO: ${protocolo}`, margin, y);
  
  doc.setFont(undefined, 'normal');
  doc.text(`Posição: ${posicao}`, pageWidth / 2, y, { align: 'center' });
  doc.text(`DATA DE ENTRADA: ${dataEntrada}`, pageWidth - margin, y, { align: 'right' });
  y += 6;
  doc.setDrawColor(180, 180, 180); // Cor da linha cinza claro
  doc.line(margin, y, pageWidth - margin, y); // Linha horizontal
  y += sectionSpacing;

  // --- NOVA LÓGICA DE BLOCOS (Moderno e Estilizado) ---
  
  // Função auxiliar para desenhar seções de 2 colunas
  const drawSection = (title, leftItems, rightItems = []) => {
    if(y > 250) { // Check de quebra de página
       doc.addPage();
       y = 20;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(title, margin, y);
    y += (lineHeight * 1.5); // Espaço maior após o título
    
    // Determina o número máximo de linhas (o lado mais comprido)
    const maxRows = Math.max(leftItems.length, rightItems.length);

    for (let i = 0; i < maxRows; i++) {
      if(y > 270) { // Check de quebra de página dentro do loop
         doc.addPage();
         y = 20;
      }

      // --- Coluna da Esquerda ---
      if (i < leftItems.length) {
        const item = leftItems[i];
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`${item.label}:`, margin, y); // Rótulo (Negrito)
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(field(item.value), margin + labelOffset, y); // Valor (Normal)
      }
      
      // --- Coluna da Direita ---
      if (i < rightItems.length) {
        const item = rightItems[i];
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`${item.label}:`, col2X, y); // Rótulo (Negrito)
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(field(item.value), col2X + labelOffset, y); // Valor (Normal)
      }
      y += lineHeight; // Move para a próxima linha
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
  if (y > pageHeight - 60) {
    doc.addPage();
    y = 20;
  }

  // --- DADOS DE LOCALIZAÇÃO E ROUBO/FURTO (lado a lado) ---
  const sectionTitleY = y;
  
  // Título "DADOS DE LOCALIZAÇÃO"
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('DADOS DE LOCALIZAÇÃO', margin, sectionTitleY);
  
  // Título "DADOS DO ROUBO/FURTO" (lado direito)
  const rightSectionX = pageWidth / 2 + 10;
  doc.text('DADOS DO ROUBO/FURTO', rightSectionX, sectionTitleY);
  
  y = sectionTitleY + (lineHeight * 1.5);
  
  // Desenhar as duas seções lado a lado
  const sectionLineHeight = 7;
  
  // === CAIXA ESQUERDA: DADOS DE LOCALIZAÇÃO ===
  let currentY = y;
  
  // Desenhar campos
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('UF:', margin, currentY);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.UF || ''), margin + labelOffset, currentY);
  currentY += sectionLineHeight;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('CIDADE:', margin, currentY);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.CIDADE || registro.Cidade || ''), margin + labelOffset, currentY);
  
  // === CAIXA DIREITA: DADOS DO ROUBO/FURTO ===
  currentY = y;
  
  // Desenhar campos
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('UF:', rightSectionX, currentY);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.UF_SINISTRO || registro.UF_Ocorrencia || ''), rightSectionX + labelOffset, currentY);
  currentY += sectionLineHeight;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('CIDADE:', rightSectionX, currentY);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.CIDADE_SINISTRO || registro.Cidade_Ocorrencia || ''), rightSectionX + labelOffset, currentY);
  currentY += sectionLineHeight;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('NÚMERO BO:', rightSectionX, currentY);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(field(registro.NUM_BO || registro.N_BO || ''), rightSectionX + labelOffset, currentY);
  
  // Atualizar Y para a posição mais baixa das duas caixas
  y = Math.max(y + (sectionLineHeight * 2), currentY + sectionLineHeight) + (sectionSpacing / 2);
  
  // Linha separadora após as seções
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, pageWidth - margin, y);
  y += sectionSpacing;

  // Verificar se precisa de nova página antes das observações
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 20;
  }

  // --- OBSERVAÇÕES (LINHAS EM BRANCO) ---
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('OBSERVAÇÕES', margin, y);
  y += (lineHeight * 1.5);

  // Desenhar linhas em branco para preenchimento manual
  const linhaHeight = 6; // Altura de cada linha
  const numLinhas = 8; // Número de linhas para preenchimento
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setDrawColor(0, 0, 0); // Cor preta para as linhas
  
  // Desenhar linhas horizontais para o funcionário escrever
  for (let i = 0; i < numLinhas; i++) {
    // Desenhar linha horizontal
    doc.line(margin, y, pageWidth - margin, y);
    y += linhaHeight;
    
    // Verificar se precisa de nova página
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }
  }
  
  y += 5; // Espaço após as linhas
  
  // Garantir que o Y não ultrapasse a página
  if (y > pageHeight - 20) {
    y = pageHeight - 20;
  }

  // --- POSICIONAMENTO DO RODAPÉ ---
  // Força o rodapé a ficar no fim da página atual
  if (y < pageHeight - 15) {
      y = pageHeight - 15;
  }
  // Se a tabela terminar muito perto do fim, adiciona uma nova página
  if (y > pageHeight - 15) {
      doc.addPage();
      y = pageHeight - 15;
  }

  // --- RODAPÉ ---
  const dataGeracao = new Date().toLocaleDateString('pt-BR');
  const loginGeracao = usuarioLogado?.nome || usuarioLogado?.name || usuarioLogado?.username || 'N/A';
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`DATA GERAÇÃO: ${dataGeracao}`, margin, y);
  doc.text(`LOGIN GERAÇÃO: ${loginGeracao}`, pageWidth / 2, y, { align: 'center' });
  // Conta o número total de páginas e exibe a página atual
  const pageCount = doc.internal.getNumberOfPages();
  doc.text(`${pageCount}/${pageCount}`, pageWidth - margin, y, { align: 'right' });

  // --- SALVAR O PDF ---
  doc.save(`Protocolo_${protocolo}.pdf`);
};
