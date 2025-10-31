// Configuração da API
const API_CONFIG = {
  // Em desenvolvimento, o backend (Apache/XAMPP) atende em http://localhost/brs/api
  // Use REACT_APP_API_URL para sobrescrever em outros ambientes
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost/brs/api',
  TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
};

// Headers padrão para todas as requisições
const getDefaultHeaders = (customHeaders = {}, isFormData = false) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...customHeaders
  };
  
  // Só definir Content-Type se não for FormData
  if (!isFormData && !customHeaders['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// Função para fazer requisições com retry automático
const makeRequest = async (url, options = {}) => {
  // Mapear rotas com fallback para ambientes onde o rewrite do host não funciona
  // Em produção, alguns hosts não roteiam "/api/login" para index.php; usar login.php diretamente
  const normalizedUrl = (url === '/login') ? '/login.php' : url;
  const fullUrl = normalizedUrl.startsWith('http') ? normalizedUrl : `${API_CONFIG.BASE_URL}${normalizedUrl}`;
  
  // Detectar se é FormData
  const isFormData = options.body instanceof FormData;
  
  // Preparar headers considerando FormData
  const customHeaders = options.headers || {};
  const headers = getDefaultHeaders(customHeaders, isFormData);
  
  // Preparar body
  let body = options.body;
  if (body && !isFormData && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  const requestOptions = {
    method: options.method || 'GET',
    headers,
    body,
    timeout: API_CONFIG.TIMEOUT,
  };

  let lastError;
  
  for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(fullUrl, {
        ...requestOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Caso especial: login com credenciais incorretas
        if (response.status === 401 && (normalizedUrl.endsWith('/login') || normalizedUrl.endsWith('/login.php'))) {
          try {
            const data = await response.json();
            return data; // retorna para o caller tratar mensagem amigável
          } catch (_) {
            return { success: false, message: 'Usuário ou senha incorretos' };
          }
        }

        if (response.status === 401) {
          // Token inválido em outras rotas: derruba sessão
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
          throw new Error('Sessão expirada');
        }
        
        // Tratar erros de validação (422) de forma especial
        if (response.status === 422) {
          const errorData = await response.json();
          const validationError = new Error('Validation Error');
          validationError.status = 422;
          validationError.errors = errorData.errors || errorData.message;
          throw validationError;
        }
        
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      
      if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
      }
    }
  }
  
  throw lastError;
};

// Função específica para requisições autenticadas (alias para makeRequest)
const makeAuthenticatedRequest = makeRequest;

export { API_CONFIG, makeRequest, makeAuthenticatedRequest };
