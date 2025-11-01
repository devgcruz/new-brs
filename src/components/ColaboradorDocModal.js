import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import BlurredDialog from './BlurredDialog';
import { AttachFile as AttachFileIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import colaboradorDocService from '../services/colaboradorDocService';
import EnhancedNotification from './EnhancedNotification';
import useNotification from '../hooks/useNotification';
import ValidationAlert from './ValidationAlert';


const ColaboradorDocModal = ({ open, onClose, idColaborador }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Hook para notificações melhoradas
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  

  // Carregar documentos quando o modal abrir
  useEffect(() => {
    // Evitar carregar quando for novo colaborador sem ID numérico
    const isValidId = idColaborador && !isNaN(parseInt(idColaborador, 10));
    if (open && isValidId) {
      loadDocs();
    }
  }, [open, idColaborador]);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const response = await colaboradorDocService.getDocsByColaborador(idColaborador);
      
      if (response.success) {
        setDocs(response.data);
      } else {
        showError(response.message || 'Erro ao carregar documentos');
      }
    } catch (err) {
      showError('Erro ao carregar documentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setValidationErrors({});
      
      if (!idColaborador) {
        showError('ID do colaborador não encontrado. Feche e abra o modal novamente.');
        return;
      }
      
      // Inicializar estado de upload
      const fileStates = {};
      files.forEach(file => {
        fileStates[file.name] = { progress: 0, status: 'pending' };
      });
      setUploadProgress(fileStates);
      setUploadingFiles(files.map(f => f.name));
      
      try {
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Processar todos os arquivos
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Atualizar status para processando
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { progress: 10, status: 'processing' }
          }));
          
          // Validar arquivo
          const validationErrors = colaboradorDocService.validateDocFile(file);
          if (validationErrors.length > 0) {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: { progress: 100, status: 'error', error: validationErrors.join(', ') }
            }));
            errors.push(`${file.name}: ${validationErrors.join(', ')}`);
            errorCount++;
            continue;
          }

          // Atualizar progresso
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { progress: 50, status: 'uploading' }
          }));

          // Fazer upload de cada arquivo usando o nome do arquivo como descrição
          const response = await colaboradorDocService.uploadDoc(idColaborador, file.name, file);
          
          if (response.success) {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: { progress: 100, status: 'success' }
            }));
            successCount++;
          } else {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: { progress: 100, status: 'error', error: response.message || 'Erro no upload' }
            }));
            errors.push(`${file.name}: ${response.message || 'Erro no upload'}`);
            errorCount++;
          }
        }
        
        // Mostrar resultado final
        if (successCount > 0) {
          showSuccess(`${successCount} documento(s) enviado(s) com sucesso!`);
          await loadDocs(); // Recarregar lista
        }
        
        if (errorCount > 0) {
          showError(`${errorCount} arquivo(s) com erro: ${errors.join('; ')}`);
        }
        
        // Limpar estados de upload após 3 segundos
        setTimeout(() => {
          setUploadProgress({});
          setUploadingFiles([]);
        }, 3000);
        
      } catch (err) {
        showError('Erro ao enviar documentos. Tente novamente.');
        setUploadProgress({});
        setUploadingFiles([]);
      } finally {
        event.target.value = '';
      }
    }
  };

  const handleDeleteDoc = (doc) => {
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDoc = async () => {
    if (docToDelete) {
      try {
        setLoading(true);
        const response = await colaboradorDocService.deleteDoc(docToDelete.id);
        
        if (response.success) {
          showSuccess(response.message || 'Documento removido com sucesso!');
          await loadDocs(); // Recarregar lista
        } else {
          // Tratar especificamente o caso de documento não encontrado
          if (response.message === 'Documento não encontrado') {
            showWarning('Documento não encontrado. Pode já ter sido removido.');
            await loadDocs(); // Recarregar lista para atualizar
          } else {
            showError(response.message || 'Erro ao remover documento');
          }
        }
      } catch (err) {
        showError('Erro ao remover documento. Tente novamente.');
      } finally {
        setLoading(false);
        setDeleteDialogOpen(false);
        setDocToDelete(null);
      }
    }
  };

  const cancelDeleteDoc = () => {
    setDeleteDialogOpen(false);
    setDocToDelete(null);
  };

  const handleViewDoc = (doc) => {
    try {
      setViewingDoc(doc);
    } catch (err) {
      showError('Erro ao abrir documento para visualização');
    }
  };


  const handleClose = () => {
    setValidationErrors({});
    setViewingDoc(null);
    setDeleteDialogOpen(false);
    setDocToDelete(null);
    setDocs([]); // Limpar lista de documentos
    setUploadProgress({}); // Limpar progresso de upload
    setUploadingFiles([]); // Limpar lista de arquivos sendo enviados
    onClose();
  };

  return (
    <BlurredDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="doc-modal-title"
    >
      <DialogTitle id="doc-modal-title">
        Documentos do Colaborador #{idColaborador}
      </DialogTitle>
      <DialogContent sx={{ mt: 3.125 }}>
        {/* Alert de validação */}
        <ValidationAlert 
          errors={validationErrors}
          show={Object.keys(validationErrors).length > 0}
          severity="error"
          title="Corrija os seguintes erros:"
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<AttachFileIcon />}
            disabled={uploadingFiles.length > 0}
            sx={{ mr: 2 }}
          >
            {uploadingFiles.length > 0 ? <CircularProgress size={20} /> : 'Selecionar Documentos (Múltiplos)'}
            <input
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              onChange={handleFileUpload}
            />
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Máximo 50MB por arquivo. Formatos aceitos: PDF, JPG, PNG. Múltiplos documentos podem ser selecionados de uma vez.
          </Typography>
        </Box>

        {/* Seção de Progresso de Upload */}
        {uploadingFiles.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Enviando Documentos ({uploadingFiles.length})
            </Typography>
            <Paper sx={{ p: 2 }}>
              {uploadingFiles.map((fileName) => {
                const progress = uploadProgress[fileName] || { progress: 0, status: 'pending' };
                return (
                  <Box key={fileName} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                        {fileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {progress.progress}%
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                      <Box
                        sx={{
                          width: `${progress.progress}%`,
                          height: '100%',
                          bgcolor: progress.status === 'error' ? 'error.main' : 
                                  progress.status === 'success' ? 'success.main' : 'primary.main',
                          borderRadius: 1,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                    {progress.status === 'error' && progress.error && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {progress.error}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Paper>
          </Box>
        )}


        <Typography variant="h6" gutterBottom>
          Documentos Anexados ({docs.length})
        </Typography>

        <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
          {loading && docs.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : docs.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum documento anexado ainda
              </Typography>
            </Box>
          ) : (
            <List>
              {docs.map((doc) => (
                <ListItem key={doc.id} divider>
                  <ListItemText
                    primary={doc.DESCRICAO}
                    secondary={`Upload: ${doc.DATA_REGISTRO ? new Date(doc.DATA_REGISTRO).toLocaleDateString('pt-BR') : 'Data não disponível'}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="visualizar"
                      onClick={() => handleViewDoc(doc)}
                      color="primary"
                      sx={{ mr: 1 }}
                      disabled={loading}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="deletar"
                      onClick={() => handleDeleteDoc(doc)}
                      color="error"
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>

      {/* Dialog de Visualização de Documento */}
      <Dialog
        open={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        maxWidth="lg"
        fullWidth
        aria-labelledby="doc-viewer-title"
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            WebkitBackdropFilter: 'blur(15px)'
          }
        }}
      >
        <DialogTitle id="doc-viewer-title">
          {viewingDoc?.DESCRICAO}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            height: '70vh',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid #ccc',
            borderRadius: 1,
            bgcolor: '#f5f5f5'
          }}>
            {viewingDoc && (
              <iframe
                src={colaboradorDocService.getDocViewUrl(viewingDoc)}
                width="100%"
                height="100%"
                style={{ border: 'none', borderRadius: '4px' }}
                title={viewingDoc.DESCRICAO}
                onError={() => showError('Erro ao carregar documento. Verifique se o arquivo existe.')}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingDoc(null)} variant="outlined">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteDoc}
        aria-labelledby="delete-dialog-title"
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            WebkitBackdropFilter: 'blur(15px)'
          }
        }}
      >
        <DialogTitle id="delete-dialog-title">
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar o documento "{docToDelete?.DESCRICAO}"? 
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={cancelDeleteDoc} 
            variant="contained" 
            color="error"
          >
            NÃO
          </Button>
          <Button 
            onClick={confirmDeleteDoc} 
            variant="outlined" 
            sx={{ 
              color: 'grey.600',
              borderColor: 'grey.400',
              '&:hover': {
                borderColor: 'grey.500',
                backgroundColor: 'grey.50'
              }
            }}
          >
            Deletar
          </Button>
        </DialogActions>
      </Dialog>
      {/* Notificação melhorada */}
      <EnhancedNotification
        open={notification.open}
        onClose={hideNotification}
        message={notification.message}
        severity={notification.severity}
        duration={notification.duration}
        position={{ vertical: 'top', horizontal: 'center' }}
      />
    </BlurredDialog>
  );
};

export default ColaboradorDocModal;

