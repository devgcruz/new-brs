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
  Typography
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema de validação genérico
const createItemSchema = (itemName) => z.object({
  nome: z
    .string()
    .min(1, `${itemName} é obrigatório`)
    .min(2, `${itemName} deve ter pelo menos 2 caracteres`)
    .max(255, `${itemName} deve ter no máximo 255 caracteres`)
});

const GenericCrudModal = ({ 
  open, 
  onClose, 
  onSave, 
  item = null, 
  itemName = 'item' 
}) => {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const isEditing = !!item;
  const schema = createItemSchema(itemName);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur'
  });

  // Resetar formulário quando modal abrir/fechar
  useEffect(() => {
    if (open) {
      if (item) {
        setValue('nome', item.nome);
      } else {
        reset();
      }
      setValidationErrors({});
    }
  }, [open, item, setValue, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setValidationErrors({});
      
      await onSave(data);
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      
      // Tratar erros de validação do backend
      if (error.response?.status === 422 && error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
      } else {
        setValidationErrors({
          nome: ['Erro interno do servidor']
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      setValidationErrors({});
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
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
        {isEditing ? `Editar ${itemName}` : `Novo ${itemName}`}
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
          <TextField
            id="nome"
            label={`Nome do ${itemName}`}
            fullWidth
            margin="normal"
            {...register('nome')}
            error={!!errors.nome || !!validationErrors.nome}
            helperText={
              errors.nome?.message || 
              validationErrors.nome?.[0] || 
              `Digite o nome do ${itemName}`
            }
            disabled={loading}
            autoFocus
          />

          {/* Exibir erros de validação do backend */}
          {Object.keys(validationErrors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {Object.values(validationErrors).flat().join(', ')}
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading || !isValid}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              {isEditing ? 'Atualizando...' : 'Criando...'}
            </Box>
          ) : (
            isEditing ? 'Atualizar' : 'Criar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenericCrudModal;


