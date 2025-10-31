// Importar configuração da API
import { API_CONFIG } from '../config/api.js';
const API_BASE_URL = API_CONFIG.BASE_URL;

// Função para fazer requisições autenticadas
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const defaultOptions = {
    headers: {
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...options.headers }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token inválido, redirecionar para login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
    throw new Error(`Erro ${response.status}: ${response.statusText}`);
  }

  return response;
};

const pdfService = {
  // Listar PDFs de uma entrada
  async getPdfsByEntrada(entradaId) {
    try {
      const response = await makeAuthenticatedRequest(`/pdfs?entrada_id=${entradaId}`);
      const data = await response.json();
      
      return {
        success: data.success,
        data: data.data || []
      };
    } catch (error) {
      console.error('Erro ao buscar PDFs:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  },

  // Upload de PDF
  async uploadPdf(entradaId, descricao, file) {
    try {
      const token = localStorage.getItem('auth_token');
      
      const formData = new FormData();
      
      const entradaIdInt = parseInt(entradaId);
      
      if (isNaN(entradaIdInt)) {
        throw new Error('ID da entrada inválido');
      }
      
      formData.append('entrada_id', entradaIdInt);
      formData.append('descricao', descricao);
      formData.append('pdf_file', file);

      const response = await fetch(`${API_BASE_URL}/pdfs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
          // Não definir Content-Type para FormData - deixar o browser definir automaticamente
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
          throw new Error('Sessão expirada');
        }
        
        // Capturar resposta para debug
        const responseText = await response.text();
        
        // Se a resposta for HTML, é um erro do servidor
        if (responseText.startsWith('<!DOCTYPE')) {
          throw new Error(`Erro do servidor (${response.status}): Resposta HTML recebida`);
        }
        
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: data.success,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Erro ao fazer upload do PDF:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Download de PDF
  async downloadPdf(pdfId, filename) {
    try {
      const response = await makeAuthenticatedRequest(`/pdfs/${pdfId}/download`);
      
      if (response.ok) {
        // Criar blob e fazer download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `pdf_${pdfId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true };
      } else {
        throw new Error('Erro ao fazer download');
      }
    } catch (error) {
      console.error('Erro ao fazer download do PDF:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Visualizar PDF
  getViewPdfUrl(pdf) {
    // Usar token específico de visualização do PDF (mais seguro que auth_token)
    const viewToken = pdf.token_visualizacao || pdf.token;
    if (!viewToken) {
      console.error('Token de visualização não encontrado no PDF');
      return '';
    }
    return `${API_BASE_URL}/pdfs?id=${pdf.id}&action=view&token=${encodeURIComponent(viewToken)}`;
  },

  // Excluir PDF
  async deletePdf(pdfId) {
    try {
      const response = await makeAuthenticatedRequest(`/pdfs/${pdfId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('Erro ao excluir PDF:', error);
      
      // Tratar especificamente o erro 404
      if (error.message && error.message.includes('404')) {
        return {
          success: false,
          message: 'PDF não encontrado'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Erro ao excluir PDF'
      };
    }
  },

  // Validar arquivo PDF
  validatePdfFile(file) {
    const errors = [];
    
    // Verificar se é um arquivo
    if (!file) {
      errors.push('Nenhum arquivo selecionado');
      return errors;
    }

    // Verificar tipo de arquivo
    if (file.type !== 'application/pdf') {
      errors.push('Apenas arquivos PDF são permitidos');
    }

    // Verificar tamanho (50MB máximo)
    const maxSize = 50 * 1024 * 1024; // 50MB em bytes
    if (file.size > maxSize) {
      errors.push('Arquivo muito grande. Tamanho máximo: 50MB');
    }

    // Verificar se o arquivo não está vazio
    if (file.size === 0) {
      errors.push('Arquivo vazio não é permitido');
    }

    return errors;
  },

  // Formatar tamanho do arquivo
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

export default pdfService;
