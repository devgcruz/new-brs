import React, { useMemo } from 'react';
import { Select, FormControl, InputLabel, MenuItem } from '@mui/material';

/**
 * Safe MUI Select component that prevents out-of-range value errors
 * Implementa a validação: options.includes(selected) ? selected : ""
 */
const SafeSelect = ({ 
  value, 
  options = [], 
  children, 
  multiple = false,
  ...props 
}) => {
  // Implementa a validação solicitada: options.includes(selected) ? selected : ""
  const safeValue = useMemo(() => {
    if (!value || value === '') {
      return multiple ? [] : '';
    }

    if (!Array.isArray(options) || options.length === 0) {
      return multiple ? [] : '';
    }

    if (multiple) {
      if (!Array.isArray(value)) return [];
      return value.filter(val => options.includes(val));
    }

    // Para seleção única: options.includes(selected) ? selected : ""
    return options.includes(value) ? value : '';
  }, [value, options, multiple]);

  return (
    <FormControl fullWidth>
      <InputLabel>{props.label}</InputLabel>
      <Select
        {...props}
        value={safeValue}
        multiple={multiple}
      >
        {children}
      </Select>
    </FormControl>
  );
};

export default SafeSelect;
