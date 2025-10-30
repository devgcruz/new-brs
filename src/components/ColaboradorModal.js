import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  FormHelperText,
  Typography
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import colaboradorService from '../services/colaboradorService';
import useAppDataStore from '../store/appDataStore';

// Schema de validação com Zod - campos opcionais
const colaboradorSchema = z.object({
  nome: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 3,
      'Nome deve ter pelo menos 3 caracteres'
    )
    .refine(
      (val) => !val || val.length <= 255,
      'Nome deve ter no máximo 255 caracteres'
    ),
  cpf: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val),
      'CPF deve estar no formato 000.000.000-00'
    ),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || z.string().email().safeParse(val).success,
      'Email deve ter um formato válido'
    )
    .refine(
      (val) => !val || val.length <= 255,
      'Email deve ter no máximo 255 caracteres'
    ),
  celular: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\(\d{2}\) \d{5}-\d{4}$/.test(val),
      'Celular deve estar no formato (00) 00000-0000'
    ),
  cnh_foto: z
    .any()
    .optional()
    .refine(
      (file) => {
        if (!file) return true; // Arquivo é opcional
        return file instanceof File;
      },
      'Arquivo inválido'
    )
    .refine(
      (file) => {
        if (!file) return true; // Arquivo é opcional
        return ['image/jpeg', 'image/png'].includes(file.type);
      },
      'Apenas arquivos JPEG e PNG são aceitos'
    )
    .refine(
      (file) => {
        if (!file) return true; // Arquivo é opcional
        return file.size <= 2 * 1024 * 1024; // 2MB
      },
      'Arquivo deve ter no máximo 2MB'
    )
});

const ColaboradorModal = ({ open, onClose, colaborador, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [validationErrors, setValidationErrors] = useState({});

  // Hook para acessar o store de dados
  const { invalidateColaboradoresCache } = useAppDataStore();

  const isEditing = !!colaborador;

  // Configuração do react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
    reset
  } = useForm({
    resolver: zodResolver(colaboradorSchema),
    mode: 'onBlur',
    defaultValues: {
      nome: '',
      cpf: '',
      email: '',
      celular: '',
      cnh_foto: null
    }
  });

  // Preencher formulário quando estiver editando ou limpar quando abrir para novo colaborador
  useEffect(() => {
    if (open) {
      if (colaborador) {
        setValue('nome', colaborador.nome || '');
        setValue('cpf', colaborador.cpf || '');
        setValue('email', colaborador.email || '');
        setValue('celular', colaborador.celular || '');
      } else {
        reset();
      }
      setValidationErrors({});
      setAlert({ show: false, message: '', type: 'success' });
    }
  }, [open, colaborador, setValue, reset]);

  // Função para limpar erros de validação quando o usuário digita
  const clearFieldError = (fieldName) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Função para aplicar máscara do CPF
  const handleCpfChange = (e) => {
    const value = e.target.value;
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      const formatted = numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      setValue('cpf', formatted);
      clearFieldError('cpf');
      trigger('cpf');
    }
  };

  // Função para aplicar máscara do celular
  const handleCelularChange = (e) => {
    const value = e.target.value;
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      const formatted = numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      setValue('celular', formatted);
      clearFieldError('celular');
      trigger('celular');
    }
  };

  // Função para lidar com upload de arquivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('cnh_foto', file);
      clearFieldError('cnh_foto');
      trigger('cnh_foto');
    }
  };

  // Função de submit do formulário
  const onSubmit = async (data) => {
    setLoading(true);
    setAlert({ show: false, message: '', type: 'success' });
    setValidationErrors({});

    try {
      let response;
      if (isEditing) {
        response = await colaboradorService.update(colaborador.id, data);
      } else {
        response = await colaboradorService.create(data);
      }
      
      setAlert({
        show: true,
        message: response.message || `Colaborador ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`,
        type: 'success'
      });

      // Invalidar cache de colaboradores para atualizar os dropdowns
      console.log('🔄 ColaboradorModal: Invalidando cache de colaboradores...');
      invalidateColaboradoresCache();

      // Fechar modal após 1 segundo
      setTimeout(() => {
        onSaved();
      }, 1000);

    } catch (error) {
      // Verificar se é erro de validação (422)
      if (error.status === 422 && error.errors) {
        setValidationErrors(error.errors);
        setAlert({
          show: true,
          message: 'Por favor, corrija os erros abaixo e tente novamente.',
          type: 'error'
        });
      } else {
        // Tratar outros tipos de erro
        let errorMessage = `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} colaborador. Tente novamente.`;
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          errorMessage = Object.values(errors).flat().join(', ');
        }

        setAlert({
          show: true,
          message: errorMessage,
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      sx={{
        '& .MuiDialog-paper': {
          width: '100%',
          maxWidth: { xs: '95vw', sm: '600px' },
          maxHeight: { xs: '95vh', sm: '80vh' },
          margin: { xs: '8px', sm: '32px' }
        }
      }}
    >
      <DialogTitle>
        {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
      </DialogTitle>
      
      <DialogContent>
        {alert.show && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 3 }}
            onClose={() => setAlert({ show: false, message: '', type: 'success' })}
          >
            {alert.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register('nome')}
            margin="normal"
            fullWidth
            id="nome"
            label="Nome Completo"
            autoComplete="name"
            autoFocus
            disabled={loading}
            error={!!errors.nome || !!validationErrors.nome}
            helperText={errors.nome?.message || validationErrors.nome?.[0]}
            onChange={(e) => {
              clearFieldError('nome');
              register('nome').onChange(e);
            }}
          />

          <TextField
            {...register('cpf')}
            margin="normal"
            fullWidth
            id="cpf"
            label="CPF"
            autoComplete="off"
            onChange={handleCpfChange}
            disabled={loading}
            placeholder="000.000.000-00"
            inputProps={{ maxLength: 14 }}
            error={!!errors.cpf || !!validationErrors.cpf}
            helperText={errors.cpf?.message || validationErrors.cpf?.[0]}
          />

          <TextField
            {...register('email')}
            margin="normal"
            fullWidth
            id="email"
            label="Email"
            autoComplete="email"
            type="email"
            disabled={loading}
            error={!!errors.email || !!validationErrors.email}
            helperText={errors.email?.message || validationErrors.email?.[0]}
            onChange={(e) => {
              clearFieldError('email');
              register('email').onChange(e);
            }}
          />

          <TextField
            {...register('celular')}
            margin="normal"
            fullWidth
            id="celular"
            label="Celular"
            autoComplete="tel"
            onChange={handleCelularChange}
            disabled={loading}
            placeholder="(00) 00000-0000"
            inputProps={{ maxLength: 15 }}
            error={!!errors.celular || !!validationErrors.celular}
            helperText={errors.celular?.message || validationErrors.celular?.[0]}
          />

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Foto da CNH (Opcional)
            </Typography>
            <TextField
              id="cnh_foto"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              disabled={loading}
              fullWidth
              error={!!errors.cnh_foto || !!validationErrors.cnh_foto}
              helperText={errors.cnh_foto?.message || validationErrors.cnh_foto?.[0] || 'Formatos aceitos: JPEG, PNG. Tamanho máximo: 2MB'}
              inputProps={{
                'aria-label': 'Foto da CNH'
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            isEditing ? 'Atualizar' : 'Cadastrar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ColaboradorModal;
