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
import pdfService from '../services/pdfService';
import EnhancedNotification from './EnhancedNotification';
import useNotification from '../hooks/useNotification';
import ValidationAlert from './ValidationAlert';


const PdfModal = ({ open, onClose, registroId }) => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Hook para notificações melhoradas
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  

  // Carregar PDFs quando o modal abrir
  useEffect(() => {
    // Evitar carregar quando for novo registro sem ID numérico
    const isValidId = registroId && !isNaN(parseInt(registroId, 10));
    if (open && isValidId) {
      loadPdfs();
    }
  }, [open, registroId]);

  const loadPdfs = async () => {
    try {
      setLoading(true);
      const response = await pdfService.getPdfsByEntrada(registroId);
      
      if (response.success) {
        setPdfs(response.data);
      } else {
        showError(response.message || 'Erro ao carregar PDFs');
      }
    } catch (err) {
      showError('Erro ao carregar PDFs. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setValidationErrors({});
      
      if (!registroId) {
        showError('ID do registro não encontrado. Feche e abra o modal novamente.');
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
          const validationErrors = pdfService.validatePdfFile(file);
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
          const response = await pdfService.uploadPdf(registroId, file.name, file);
          
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
          showSuccess(`${successCount} PDF(s) enviado(s) com sucesso!`);
          await loadPdfs(); // Recarregar lista
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
        showError('Erro ao enviar PDFs. Tente novamente.');
        setUploadProgress({});
        setUploadingFiles([]);
      } finally {
        event.target.value = '';
      }
    }
  };

  const handleDeletePdf = (pdf) => {
    setPdfToDelete(pdf);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePdf = async () => {
    if (pdfToDelete) {
      try {
        setLoading(true);
        const response = await pdfService.deletePdf(pdfToDelete.id);
        
        if (response.success) {
          showSuccess(response.message || 'PDF removido com sucesso!');
          await loadPdfs(); // Recarregar lista
        } else {
          // Tratar especificamente o caso de PDF não encontrado
          if (response.message === 'PDF não encontrado') {
            showWarning('PDF não encontrado. Pode já ter sido removido.');
            await loadPdfs(); // Recarregar lista para atualizar
          } else {
            showError(response.message || 'Erro ao remover PDF');
          }
        }
      } catch (err) {
        showError('Erro ao remover PDF. Tente novamente.');
      } finally {
        setLoading(false);
        setDeleteDialogOpen(false);
        setPdfToDelete(null);
      }
    }
  };

  const cancelDeletePdf = () => {
    setDeleteDialogOpen(false);
    setPdfToDelete(null);
  };

  const handleViewPdf = (pdf) => {
    try {
      setViewingPdf(pdf);
    } catch (err) {
      showError('Erro ao abrir PDF para visualização');
    }
  };


  const handleClose = () => {
    setValidationErrors({});
    setViewingPdf(null);
    setDeleteDialogOpen(false);
    setPdfToDelete(null);
    setPdfs([]); // Limpar lista de PDFs
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
      aria-labelledby="pdf-modal-title"
    >
      <DialogTitle id="pdf-modal-title">
        Gerenciamento de PDFs - Registro #{registroId}
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
            {uploadingFiles.length > 0 ? <CircularProgress size={20} /> : 'Selecionar PDFs (Múltiplos)'}
            <input
              type="file"
              hidden
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
            />
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Máximo 50MB por arquivo. Múltiplos PDFs podem ser selecionados de uma vez.
          </Typography>
        </Box>

        {/* Seção de Progresso de Upload */}
        {uploadingFiles.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Enviando PDFs ({uploadingFiles.length})
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
          PDFs Anexados ({pdfs.length})
        </Typography>

        <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
          {loading && pdfs.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : pdfs.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nenhum PDF anexado ainda
              </Typography>
            </Box>
          ) : (
            <List>
              {pdfs.map((pdf) => (
                <ListItem key={pdf.id} divider>
                  <ListItemText
                    primary={pdf.DESCRICAO}
                    secondary={`Upload: ${pdf.DATA_REGISTRO ? new Date(pdf.DATA_REGISTRO).toLocaleDateString('pt-BR') : 'Data não disponível'}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="visualizar"
                      onClick={() => handleViewPdf(pdf)}
                      color="primary"
                      sx={{ mr: 1 }}
                      disabled={loading}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="deletar"
                      onClick={() => handleDeletePdf(pdf)}
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

      {/* Dialog de Visualização de PDF */}
      <Dialog
        open={!!viewingPdf}
        onClose={() => setViewingPdf(null)}
        maxWidth="lg"
        fullWidth
        aria-labelledby="pdf-viewer-title"
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            WebkitBackdropFilter: 'blur(15px)'
          }
        }}
      >
        <DialogTitle id="pdf-viewer-title">
          {viewingPdf?.DESCRICAO}
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
            {viewingPdf && (
              <iframe
                src={pdfService.getViewPdfUrl(viewingPdf)}
                width="100%"
                height="100%"
                style={{ border: 'none', borderRadius: '4px' }}
                title={viewingPdf.DESCRICAO}
                onError={() => showError('Erro ao carregar PDF. Verifique se o arquivo existe.')}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingPdf(null)} variant="outlined">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeletePdf}
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
            Tem certeza que deseja deletar o PDF "{pdfToDelete?.DESCRICAO}"? 
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={cancelDeletePdf} 
            variant="contained" 
            color="error"
          >
            NÃO
          </Button>
          <Button 
            onClick={confirmDeletePdf} 
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

export default PdfModal;


