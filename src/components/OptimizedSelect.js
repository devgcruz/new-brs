import React, { useState, useCallback, useMemo, memo, forwardRef, useEffect, useRef } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  TextField,
  InputAdornment,
  ListItemText,
  Checkbox,
  Chip,
  OutlinedInput
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useSafeSelect } from '../hooks/useSafeSelect';

// Componente otimizado para Select com busca e virtualização
const OptimizedSelect = forwardRef(({
  label,
  value,
  onChange,
  options = [],
  loading = false,
  disabled = false,
  multiple = false,
  searchable = false,
  placeholder = '',
  emptyMessage = 'Nenhuma opção disponível',
  loadingMessage = 'Carregando...',
  maxHeight = 300,
  renderOption,
  getOptionLabel = (option) => {
    if (!option || option === null || option === undefined) {
      console.warn('OptimizedSelect: option inválida em getOptionLabel:', option);
      return '';
    }
    const label = option?.label || option?.nome || option?.name || String(option) || '';
    if (!label) {
      console.warn('OptimizedSelect: label vazio em getOptionLabel para option:', option);
    }
    return label;
  },
  getOptionValue = (option) => {
    if (!option || option === null || option === undefined) {
      console.warn('OptimizedSelect: option inválida em getOptionValue:', option);
      return '';
    }
    const value = option?.value || option?.id || option || '';
    if (!value) {
      console.warn('OptimizedSelect: valor vazio em getOptionValue para option:', option);
    }
    return value;
  },
  sx = {},
  ...props
}, ref) => {
  // =================== INÍCIO DOS LOGS DE DIAGNÓSTICO ===================
  console.log(
    `[OptimizedSelect: ${label}] RENDERIZANDO`,
    {
      "Valor Recebido (value)": value,
      "Nº de Opções (options.length)": options.length,
      "Opções Disponíveis": options.map(o => o.value),
      "Loading": loading,
      "Disabled": disabled
    }
  );
  // ==================== FIM DOS LOGS DE DIAGNÓSTICO ====================

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const paperRef = useRef(null);

  // Debounce search term to reduce filtering cost on large lists
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  // Filtrar opções baseado no termo de busca
  const filteredOptions = useMemo(() => {
    if (!searchable || !debouncedSearchTerm.trim()) {
      return options;
    }
    const term = debouncedSearchTerm.toLowerCase();
    return options.filter(option => {
      const label = getOptionLabel(option);
      return String(label).toLowerCase().includes(term);
    });
  }, [options, debouncedSearchTerm, searchable, getOptionLabel]);

  // Incremental rendering for large option lists
  const INITIAL_BATCH = 200;
  const BATCH_INCREMENT = 200;

  useEffect(() => {
    if (open) {
      setRenderCount(Math.min(filteredOptions.length, INITIAL_BATCH));
    } else {
      setRenderCount(0);
    }
  }, [open, filteredOptions.length]);

  // Limpar busca
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Handler para mudança de valor
  const handleChange = useCallback((event) => {
    if (!event || !event.target) {
      console.warn('OptimizedSelect: evento inválido recebido:', event);
      return;
    }
    
    const newValue = event.target.value;
    
    // Validar se o valor é válido
    if (newValue === undefined || newValue === null) {
      console.warn('OptimizedSelect: valor inválido recebido:', newValue);
      return;
    }
    
    // Verificar se onChange está definido
    if (typeof onChange !== 'function') {
      console.warn('OptimizedSelect: onChange não é uma função:', onChange);
      return;
    }
    
    onChange(newValue);
    
    // Fechar dropdown após seleção (exceto para múltipla seleção)
    if (!multiple) {
      setOpen(false);
    }
  }, [onChange, multiple]);

  // Handler para abrir/fechar dropdown
  const handleOpen = useCallback(() => {
    if (!disabled && !loading) {
      setOpen(true);
    }
  }, [disabled, loading]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearchTerm(''); // Limpar busca ao fechar
  }, []);

  // Detect scroll near bottom to increase rendered items
  const handleMenuScroll = useCallback((event) => {
    const target = event.currentTarget;
    if (!target) return;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 48;
    if (nearBottom) {
      setRenderCount((prev) => Math.min(prev + BATCH_INCREMENT, filteredOptions.length));
    }
  }, [filteredOptions.length]);

  // Handler para busca
  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  // Renderizar opção customizada
  const renderMenuItem = useCallback((option, index) => {
    if (!option || option === null || option === undefined) {
      console.warn('OptimizedSelect: option inválida em renderMenuItem:', option);
      return null;
    }
    
    const optionValue = getOptionValue(option);
    const optionLabel = getOptionLabel(option);
    
    if (!optionValue || !optionLabel) {
      console.warn('OptimizedSelect: valores inválidos em renderMenuItem:', { option, optionValue, optionLabel });
      return null;
    }
    
    const isSelected = multiple 
      ? (Array.isArray(value) && value.includes(optionValue))
      : value === optionValue;

    if (renderOption) {
      return renderOption(option, { isSelected, index });
    }

    return (
      <MenuItem 
        key={optionValue} 
        value={optionValue}
        selected={isSelected}
        sx={{
          py: 0.5,
          px: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          '&.Mui-selected': {
            backgroundColor: 'primary.light',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.main',
            }
          }
        }}
      >
        {multiple && (
          <Checkbox
            checked={isSelected}
            size="small"
            sx={{ mr: 1 }}
          />
        )}
        <ListItemText 
          primary={optionLabel}
          sx={{
            '& .MuiListItemText-primary': {
              fontSize: '0.875rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }
          }}
        />
      </MenuItem>
    );
  }, [multiple, value, getOptionValue, getOptionLabel, renderOption]);

  // Validar se o valor existe nas opções disponíveis
  const safeValue = useMemo(() => {
    // =================== GUARDA MESTRA DEFINITIVA ===================
    // Se as opções não estiverem prontas, NUNCA retorne um valor.
    // Isso resolve a condição de corrida de forma definitiva, pois o Select
    // interno receberá '' (string vazia), que é sempre um valor válido.
    if (!Array.isArray(options) || options.length === 0) {
      console.log(`[OptimizedSelect: ${label}] BLOQUEADO PELA GUARDA MESTRA. Opções indisponíveis.`);
      return multiple ? [] : '';
    }
    // =================================================================

    if (multiple) {
      if (!Array.isArray(value)) return [];
      return value.filter(val => options.some(opt => getOptionValue(opt) === val));
    }

    if (!value) return '';

    const valueExists = options.some(opt => getOptionValue(opt) === value);

    if (!valueExists) {
      console.warn(`[OptimizedSelect: ${label}] Valor "${value}" não encontrado nas opções. Retornando ''.`);
    }

    return valueExists ? value : '';
  }, [value, options, multiple, getOptionValue, label]);

  // Renderizar valor selecionado para múltipla seleção
  const renderValue = useCallback((selected) => {
    if (!multiple) {
      if (!selected) return '';
      const option = options.find(opt => opt && getOptionValue(opt) === selected);
      return option ? getOptionLabel(option) : '';
    }

    if (Array.isArray(selected) && selected.length > 0) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.slice(0, 3).map((value) => {
            const option = options.find(opt => opt && getOptionValue(opt) === value);
            return option ? (
              <Chip
                key={value}
                label={getOptionLabel(option)}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            ) : null;
          })}
          {selected.length > 3 && (
            <Chip
              label={`+${selected.length - 3}`}
              size="small"
              sx={{ fontSize: '0.75rem' }}
            />
          )}
        </Box>
      );
    }
    return '';
  }, [multiple, options, getOptionValue, getOptionLabel]);

  return (
    <FormControl fullWidth variant="outlined" size="small" sx={sx}>
      <InputLabel>{label}</InputLabel>
      <Select
        ref={ref}
        value={safeValue}
        onChange={handleChange}
        onOpen={handleOpen}
        onClose={handleClose}
        open={open}
        disabled={disabled || loading}
        multiple={multiple}
        renderValue={renderValue}
        input={
          multiple ? (
            <OutlinedInput
              label={label}
              endAdornment={
                loading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={16} />
                  </InputAdornment>
                ) : null
              }
            />
          ) : undefined
        }
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: maxHeight,
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem',
              }
            },
            onScroll: handleMenuScroll
          },
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
        }}
        {...props}
      >
        {/* Campo de busca */}
        {searchable && open && (
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder={`Buscar ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <ClearIcon 
                      fontSize="small" 
                      onClick={clearSearch}
                      sx={{ cursor: 'pointer' }}
                    />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '0.875rem',
                  py: 0.5
                }
              }}
            />
          </Box>
        )}

        {/* Loading state */}
        {loading && (
          <MenuItem disabled>
            <Box display="flex" alignItems="center" gap={1} width="100%">
              <CircularProgress size={16} />
              <span>{loadingMessage}</span>
            </Box>
          </MenuItem>
        )}

        {/* Empty state */}
        {!loading && filteredOptions.length === 0 && (
          <MenuItem disabled>
            <Box display="flex" alignItems="center" gap={1} width="100%">
              <span>{emptyMessage}</span>
            </Box>
          </MenuItem>
        )}

        {/* Opções filtradas com renderização incremental */}
        {!loading && filteredOptions
          .filter(option => option != null) // Filtrar opções nulas/undefined
          .slice(0, renderCount)
          .map((option, index) => 
            renderMenuItem(option, index)
          )}
        {/* Indicador de mais itens */}
        {!loading && renderCount < filteredOptions.length && (
          <MenuItem disabled>
            <Box display="flex" alignItems="center" justifyContent="center" width="100%">
              <span>Carregando mais...</span>
            </Box>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
});

OptimizedSelect.displayName = 'OptimizedSelect';

export default memo(OptimizedSelect);
