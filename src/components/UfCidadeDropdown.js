// src/components/UfCidadeDropdown.js
import React, { memo, useMemo } from 'react';
import { Grid, TextField, Autocomplete, CircularProgress } from '@mui/material';
import useUfCidadeDropdowns from '../hooks/useUfCidadeDropdowns';

/**
 * Componente reutilizável para pares de dropdowns UF e Cidade
 * 
 * Props:
 * - valueUf: valor da UF selecionada
 * - valueCidade: valor da cidade selecionada
 * - onChangeUf: callback quando a UF muda (recebe o valor da nova UF)
 * - onChangeCidade: callback quando a cidade muda (recebe o valor da nova cidade)
 * - labelUf: label do campo UF (opcional, padrão: "UF")
 * - labelCidade: label do campo Cidade (opcional, padrão: "Cidade")
 * - errorUf: mensagem de erro para UF (opcional)
 * - errorCidade: mensagem de erro para Cidade (opcional)
 * - gridBreakpoints: objeto com breakpoints para os Grid items (opcional)
 *   Exemplo: { uf: { xs: 12, md: 6 }, cidade: { xs: 12, md: 6 } }
 */
const UfCidadeDropdown = ({
  valueUf,
  valueCidade,
  onChangeUf,
  onChangeCidade,
  labelUf = "UF",
  labelCidade = "Cidade",
  errorUf,
  errorCidade,
  gridBreakpoints = {},
  originalValueCidade = null
}) => {
  // Extrair breakpoints ou usar padrões
  const { uf: ufBp = { xs: 12, md: 6 }, cidade: cidadeBp = { xs: 12, md: 6 } } = gridBreakpoints;
  const {
    ufOptions,
    cidadeOptions,
    loadingUf,
    loadingCidade,
    handleUfChange,
    handleCidadeChange,
  } = useUfCidadeDropdowns(valueUf, valueCidade);

  // Handler interno para UF
  const handleUfChangeInternal = (event, newValue) => {
    const newUf = newValue ? newValue.sigla : '';
    handleUfChange(newUf);
    if (onChangeUf) {
      onChangeUf(newUf);
    }
  };

  // Handler interno para Cidade
  const handleCidadeChangeInternal = (event, newValue) => {
    let newCidade = '';
    
    if (newValue) {
      // Se for uma string (freeSolo), usar diretamente
      if (typeof newValue === 'string') {
        newCidade = newValue;
      } else {
        // Se for um objeto, extrair o nome
        newCidade = newValue.nome || newValue.value || '';
      }
    }
    
    handleCidadeChange(newCidade);
    if (onChangeCidade) {
      onChangeCidade(newCidade);
    }
  };

  // Encontrar a UF selecionada
  const ufSelecionadaObj = useMemo(() => {
    if (!ufOptions || ufOptions.length === 0) return null;
    return ufOptions.find(u => u.value === valueUf || u.sigla === valueUf) || null;
  }, [ufOptions, valueUf]);

  // Encontrar a cidade selecionada - com fallback para valor original do banco
  const cidadeSelecionadaObj = useMemo(() => {
    if (!cidadeOptions || cidadeOptions.length === 0) {
      if (valueCidade) {
        // Criar um objeto temporário com o valor original do banco
        return { nome: valueCidade, value: valueCidade, isOriginal: true };
      }
      return null;
    }
    
    let cidade = cidadeOptions.find(c => c.value === valueCidade || c.nome === valueCidade);
    
    // Se não encontrou na lista e temos um valor original do banco, usar ele como fallback
    if (!cidade && valueCidade) {
      cidade = { nome: valueCidade, value: valueCidade, isOriginal: true };
    }
    
    return cidade;
  }, [cidadeOptions, valueCidade]);


  // Não renderizar se não há opções disponíveis
  if (!Array.isArray(ufOptions) || ufOptions.length === 0) {
    return (
      <>
        <Grid item {...ufBp}>
          <TextField
            label={labelUf}
            variant="outlined"
            size="small"
            disabled
            value="Carregando estados..."
            error={!!errorUf}
            helperText={errorUf}
            InputProps={{
              endAdornment: loadingUf ? <CircularProgress color="inherit" size={20} /> : null,
            }}
          />
        </Grid>
        <Grid item {...cidadeBp}>
          <TextField
            label={labelCidade}
            variant="outlined"
            size="small"
            disabled
            value="Carregando cidades..."
            error={!!errorCidade}
            helperText={errorCidade}
            InputProps={{
              endAdornment: loadingCidade ? <CircularProgress color="inherit" size={20} /> : null,
            }}
          />
        </Grid>
      </>
    );
  }

  // Validar se os valores são válidos antes de renderizar
  const ufValue = ufSelecionadaObj || null;
  const cidadeValue = cidadeSelecionadaObj || null;

  return (
    <>
      <Grid item {...ufBp}>
        <Autocomplete
          options={ufOptions}
          getOptionLabel={(option) => option.sigla || ''}
          value={ufValue}
          onChange={handleUfChangeInternal}
          renderInput={(params) => (
            <TextField
              {...params}
              label={labelUf}
              variant="outlined"
              size="small"
              error={!!errorUf}
              helperText={errorUf}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingUf ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          isOptionEqualToValue={(option, value) => {
            // Tratar valores nulos/vazios
            if (!option && !value) return true;
            if (!option || !value) return false;
            
            // Comparação por sigla
            return option.sigla === value.sigla;
          }}
          noOptionsText="Nenhum estado encontrado"
          loading={loadingUf}
        />
      </Grid>
      <Grid item {...cidadeBp}>
        <Autocomplete
          freeSolo
          options={cidadeOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            if (!option) return '';
            return option.nome || option.value || '';
          }}
          value={cidadeValue}
          onChange={handleCidadeChangeInternal}
          isOptionEqualToValue={(option, value) => {
            // Tratar valores nulos/vazios
            if (!option && !value) return true;
            if (!option || !value) return false;
            
            // Comparação por string
            if (typeof option === 'string' || typeof value === 'string') {
              return String(option) === String(value);
            }
            
            // Comparação por objeto
            return option.nome === value.nome || option.value === value.value;
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={labelCidade}
              variant="outlined"
              size="small"
              error={!!errorCidade}
              helperText={errorCidade || (cidadeSelecionadaObj?.isOriginal ? "Valor original do banco de dados" : "")}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingCidade ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          disabled={!valueUf}
          noOptionsText={!valueUf ? "Selecione uma UF" : "Nenhuma cidade encontrada"}
          loading={loadingCidade}
        />
      </Grid>
    </>
  );
};

export default memo(UfCidadeDropdown);
