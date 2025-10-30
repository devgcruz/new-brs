// src/utils/excelExporter.js
import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileNamePrefix) => {
  if (!data || data.length === 0) {
    console.error("Não há dados para exportar.");
    return { success: false, message: "Não há dados para exportar." };
  }

  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, 25)
    }));
    ws['!cols'] = colWidths;

    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    XLSX.writeFile(wb, `${fileNamePrefix}_${dataAtual}.xlsx`);

    return { success: true, message: "Exportado com sucesso." };
  } catch (error) {
    console.error("Erro ao exportar para Excel:", error);
    return { success: false, message: "Falha na exportação." };
  }
};

