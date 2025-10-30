import { useMemo } from 'react';

/**
 * Hook para validar valores de Select contra opções disponíveis
 * Implementa a validação: options.includes(selected) ? selected : ""
 */
export const useSafeSelect = (value, options = [], multiple = false) => {
  return useMemo(() => {
    // Se não há valor, retorna valor padrão
    if (!value || value === '') {
      return multiple ? [] : '';
    }

    // Se não há opções, retorna valor padrão para evitar erros
    if (!Array.isArray(options) || options.length === 0) {
      return multiple ? [] : '';
    }

    // Para seleção múltipla
    if (multiple) {
      if (!Array.isArray(value)) return [];
      
      // Filtra apenas valores que existem nas opções
      return value.filter(val => {
        return options.some(option => {
          if (typeof option === 'string') {
            return option === val;
          }
          if (typeof option === 'object' && option !== null) {
            return option.value === val || option.id === val || option === val;
          }
          return false;
        });
      });
    }

    // Para seleção única - implementa a validação solicitada
    const valueExists = options.some(option => {
      if (typeof option === 'string') {
        return option === value;
      }
      if (typeof option === 'object' && option !== null) {
        return option.value === value || option.id === value || option === value;
      }
      return false;
    });

    // Aplica a regra: options.includes(selected) ? selected : ""
    return valueExists ? value : '';
  }, [value, options, multiple]);
};

export default useSafeSelect;
