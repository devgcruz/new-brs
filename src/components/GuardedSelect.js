import React from 'react';
import { TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';

/**
 * Componente Select ultra-seguro que previne o erro "out-of-range".
 * Ele se recusa a renderizar o Select com um valor inválido,
 * mostrando um campo de texto desabilitado em seu lugar.
 */
const GuardedSelect = ({
  value,
  onChange,
  options = [],
  label,
  disabled = false,
  loading = false,
  loadingMessage = "Carregando...",
  emptyMessage = "Nenhuma opção disponível",
  ...props
}) => {
  // 1. Verifica se o valor atual existe na lista de opções.
  // As opções devem ser um array de objetos { value: string, label: string }.
  const valueExists = options.some(option => option && option.value === value);

  // 2. Se está carregando, mostra indicador de loading
  if (loading) {
    return (
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        label={label}
        value={loadingMessage}
        disabled
        InputProps={{
          endAdornment: <div style={{ width: 20, height: 20, border: '2px solid #ccc', borderTop: '2px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        }}
      />
    );
  }

  // 3. Se não há opções disponíveis, mostra mensagem
  if (!options || options.length === 0) {
    return (
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        label={label}
        value={emptyMessage}
        disabled
      />
    );
  }

  // 4. Se o valor é inválido (existe mas não está na lista), renderiza um placeholder.
  // Isso impede que o MUI Select seja renderizado em um estado inconsistente.
  if (value && !valueExists) {
    return (
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        label={label}
        value="Carregando seleção..."
        disabled
      />
    );
  }

  // 5. Se o valor é válido ou vazio, renderiza o Select normalmente.
  return (
    <FormControl fullWidth variant="outlined" size="small" disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''} // Garante que o valor nunca seja null/undefined
        onChange={onChange}
        label={label}
        {...props}
      >
        {options.map((option) => (
          option && (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          )
        ))}
      </Select>
    </FormControl>
  );
};

export default GuardedSelect;
