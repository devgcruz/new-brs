import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  CircularProgress,
  Box
} from '@mui/material';

const FormModal = ({ 
  open, 
  onClose, 
  title, 
  onSave, 
  loading = false,
  children,
  maxWidth = 'md',
  fullWidth = true,
  saveButtonText = 'Salvar',
  cancelButtonText = 'Cancelar',
  disableSave = false
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      sx={{
        '& .MuiDialog-paper': {
          width: '100%',
          maxWidth: { xs: '95vw', sm: maxWidth === 'sm' ? '400px' : maxWidth === 'md' ? '600px' : '900px' },
          maxHeight: { xs: '95vh', sm: '80vh' },
          margin: { xs: '8px', sm: '32px' }
        }
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {children}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          {cancelButtonText}
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={loading || disableSave}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              Salvando...
            </Box>
          ) : (
            saveButtonText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormModal;
