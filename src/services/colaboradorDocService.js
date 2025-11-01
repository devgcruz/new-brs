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

const colaboradorDocService = {
  // Listar documentos de um colaborador
  async getDocsByColaborador(colaboradorId) {
    try {
      const response = await makeAuthenticatedRequest(`/colaborador-docs?ID_Colaborador=${colaboradorId}`);
      const data = await response.json();
      
      return {
        success: data.success,
        data: data.data || []
      };
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  },

  // Upload de documento
  async uploadDoc(colaboradorId, descricao, file) {
    try {
      const token = localStorage.getItem('auth_token');
      
      const formData = new FormData();
      
      const colaboradorIdInt = parseInt(colaboradorId);
      
      if (isNaN(colaboradorIdInt)) {
        throw new Error('ID do colaborador inválido');
      }
      
      formData.append('ID_Colaborador', colaboradorIdInt);
      formData.append('descricao', descricao);
      formData.append('doc_file', file);

      const response = await fetch(`${API_BASE_URL}/colaborador-docs`, {
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
      console.error('Erro ao fazer upload do documento:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Download de documento
  async downloadDoc(docId, filename) {
    try {
      const response = await makeAuthenticatedRequest(`/colaborador-docs/${docId}/download`);
      
      if (response.ok) {
        // Criar blob e fazer download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `documento_${docId}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true };
      } else {
        throw new Error('Erro ao fazer download');
      }
    } catch (error) {
      console.error('Erro ao fazer download do documento:', error);
      return {
        success: false,
        message: error.message
      };
    }
  },

  // Visualizar documento
  getDocViewUrl(doc) {
    // Usar token específico de visualização do documento (mais seguro que auth_token)
    const viewToken = doc.token_visualizacao || doc.token;
    if (!viewToken) {
      console.error('Token de visualização não encontrado no documento');
      return '';
    }
    return `${API_BASE_URL}/colaborador-docs-view?id=${doc.id}&token=${encodeURIComponent(viewToken)}`;
  },

  // Excluir documento
  async deleteDoc(docId) {
    try {
      const response = await makeAuthenticatedRequest(`/colaborador-docs?id=${docId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      return {
        success: data.success,
        message: data.message
      };
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      
      // Tratar especificamente o erro 404
      if (error.message && error.message.includes('404')) {
        return {
          success: false,
          message: 'Documento não encontrado'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Erro ao excluir documento'
      };
    }
  },

  // Validar arquivo (permite PDFs e imagens)
  validateDocFile(file) {
    const errors = [];
    
    // Verificar se é um arquivo
    if (!file) {
      errors.push('Nenhum arquivo selecionado');
      return errors;
    }

    // Tipos permitidos
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    
    // Verificar tipo de arquivo
    if (!allowedTypes.includes(file.type)) {
      errors.push('Tipo de arquivo não permitido. Apenas PDFs e imagens (JPG, PNG) são aceitos.');
    }

    // Verificar extensão
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push('Extensão de arquivo não permitida. Use PDF, JPG ou PNG.');
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

export default colaboradorDocService;

