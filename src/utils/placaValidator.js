/**
 * Utilitário para validação de placas de veículos brasileiras
 * Suporta tanto o padrão antigo (ABC-1234) quanto o padrão Mercosul (ABC1D23)
 */

/**
 * Valida placa no padrão antigo brasileiro (ABC-1234)
 * @param {string} placa - Placa a ser validada
 * @returns {boolean} - true se válida, false caso contrário
 */
const isValidOldBrazilianPlate = (placa) => {
  // Remove espaços e converte para maiúsculo
  const cleanPlaca = placa.replace(/\s/g, '').toUpperCase();
  
  // Regex para padrão antigo: 3 letras + hífen + 4 números
  const oldPattern = /^[A-Z]{3}-?[0-9]{4}$/;
  
  const patternTest = oldPattern.test(cleanPlaca);
  
  if (!patternTest) {
    return false;
  }
  
  // Verifica se tem exatamente 7 caracteres (sem hífen) ou 8 (com hífen)
  const withoutHyphen = cleanPlaca.replace('-', '');
  
  if (withoutHyphen.length !== 7) {
    return false;
  }
  
  return true;
};

/**
 * Valida placa no padrão Mercosul (ABC1D23)
 * @param {string} placa - Placa a ser validada
 * @returns {boolean} - true se válida, false caso contrário
 */
const isValidMercosulPlate = (placa) => {
  // Remove espaços e converte para maiúsculo
  const cleanPlaca = placa.replace(/\s/g, '').toUpperCase();
  
  // Regex para padrão Mercosul: 3 letras + 1 número + 1 letra + 2 números (com ou sem hífen)
  const mercosulPattern = /^[A-Z]{3}-?[0-9]{1}[A-Z]{1}[0-9]{2}$/;
  
  const patternTest = mercosulPattern.test(cleanPlaca);
  
  if (!patternTest) {
    return false;
  }
  
  // Verifica se tem exatamente 7 caracteres (sem hífen) ou 8 (com hífen)
  const withoutHyphen = cleanPlaca.replace('-', '');
  if (withoutHyphen.length !== 7) {
    return false;
  }
  
  return true;
};

/**
 * Valida se a placa está em qualquer um dos padrões aceitos
 * @param {string} placa - Placa a ser validada
 * @returns {object} - { isValid: boolean, format: string|null, message: string }
 */
export const validatePlaca = (placa) => {
  if (!placa || typeof placa !== 'string') {
    return {
      isValid: false,
      format: null,
      message: 'Placa é obrigatória'
    };
  }
  
  // Remove espaços extras e converte para maiúsculo
  const cleanPlaca = placa.trim().replace(/\s+/g, '').toUpperCase();
  
  if (cleanPlaca.length === 0) {
    return {
      isValid: false,
      format: null,
      message: 'Placa não pode estar vazia'
    };
  }
  
  // Testa padrão antigo brasileiro
  if (isValidOldBrazilianPlate(cleanPlaca)) {
    return {
      isValid: true,
      format: 'old_brazilian',
      message: 'Placa válida (padrão antigo brasileiro)',
      normalizedPlaca: cleanPlaca.replace('-', '') // Remove hífen se presente
    };
  }
  
  // Testa padrão Mercosul
  if (isValidMercosulPlate(cleanPlaca)) {
    return {
      isValid: true,
      format: 'mercosul',
      message: 'Placa válida (padrão Mercosul)',
      normalizedPlaca: cleanPlaca
    };
  }
  
  // Se não corresponde a nenhum padrão
  return {
    isValid: false,
    format: null,
    message: 'Formato de placa inválido. Use o padrão antigo (ABC-1234) ou Mercosul (ABC1D23)'
  };
};

/**
 * Formata a placa para exibição
 * @param {string} placa - Placa a ser formatada
 * @param {string} format - Formato da placa ('old_brazilian' ou 'mercosul')
 * @returns {string} - Placa formatada
 */
export const formatPlaca = (placa, format) => {
  if (!placa) return '';
  
  const cleanPlaca = placa.replace(/\s/g, '').toUpperCase();
  
  if (format === 'old_brazilian') {
    // Formata como ABC-1234
    if (cleanPlaca.length === 7) {
      return `${cleanPlaca.slice(0, 3)}-${cleanPlaca.slice(3)}`;
    }
  }
  
  return cleanPlaca;
};

/**
 * Exemplos de placas válidas para teste
 */
export const validPlacaExamples = {
  old_brazilian: [
    'ABC-1234',
    'XYZ-5678',
    'DEF1234', // sem hífen
    'ghi-9012' // minúsculo
  ],
  mercosul: [
    'ABC1D23',
    'ABC-1D23', // com hífen
    'XYZ4E56',
    'XYZ-4E56', // com hífen
    'def7g89', // minúsculo
    'def-7g89', // minúsculo com hífen
    'JKL2M34',
    'JKL-2M34' // com hífen
  ]
};

/**
 * Exemplos de placas inválidas para teste
 */
export const invalidPlacaExamples = [
  'ABC-123', // muito curta
  'AB-1234', // muito poucas letras
  'ABCD-1234', // muitas letras
  'ABC-12345', // muitos números
  'ABC1D2', // Mercosul muito curta
  'ABC12D3', // Mercosul formato errado
  '123-ABCD', // números nas letras
  'ABC@1234', // caractere especial
  'ABC 1234', // espaço no meio
  '', // vazia
  '   ', // apenas espaços
];

export default validatePlaca;
