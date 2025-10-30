// src/components/GenericAutocomplete.js
import React from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';

const GenericAutocomplete = ({
  options = [],
  label,
  value,
  onChange,
  name,
  loading,
  getOptionLabel = (option) => {
    if (!option) return '';
    return option.nome || option.label || option.name || String(option) || '';
  },
  isOptionEqualToValue = (option, value) => {
    // Tratar valores nulos/vazios
    if (!option && !value) return true;
    if (!option || !value) return false;
    
    // Comparação por string
    if (typeof option === 'string' || typeof value === 'string') {
      return String(option) === String(value);
    }
    
    // Comparação por objeto (ID)
    if (option.id && value.id) {
      return option.id === value.id;
    }
    
    // Comparação por nome
    if (option.nome && value.nome) {
      return option.nome === value.nome;
    }
    
    // Comparação direta
    return option === value;
  },
  error,
  helperText
}) => {
  // Não renderizar se não há opções disponíveis
  if (!Array.isArray(options) || options.length === 0) {
    return (
      <TextField
        label={label}
        variant="outlined"
        size="small"
        disabled
        value="Carregando opções..."
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: loading ? <CircularProgress color="inherit" size={20} /> : null,
        }}
      />
    );
  }

  // Encontra o objeto da opção selecionada com base no valor (que pode ser objeto ou string)
  const selectedOption = (() => {
    // Se não há valor ou é string vazia, retorna null
    if (!value || value === '' || value === null || value === undefined) {
      return null;
    }
    
    // Se value é um objeto com ID, buscar pelo ID
    if (typeof value === 'object' && value.id) {
      return options.find(option => option && option.id === value.id) || null;
    }
    
    // Se value é string, buscar pelo nome
    if (typeof value === 'string') {
      return options.find(option => option && option.nome === value) || null;
    }
    
    // Se value é um objeto sem ID, buscar por comparação direta
    if (typeof value === 'object') {
      return options.find(option => isOptionEqualToValue(option, value)) || null;
    }
    
    return null;
  })();

  return (
    <Autocomplete
      options={options}
      getOptionLabel={getOptionLabel}
      value={selectedOption}
      onChange={(event, newValue) => {
        // Retorna o objeto completo ou null
        const simulatedEvent = {
          target: {
            name: name,
            value: newValue || null,
          },
        };
        onChange(simulatedEvent);
      }}
      isOptionEqualToValue={isOptionEqualToValue}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          size="small"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default GenericAutocomplete;

