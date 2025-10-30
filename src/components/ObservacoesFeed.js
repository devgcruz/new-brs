import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import observacaoService from '../services/observacaoService';
import useAuthStore from '../store/authStore';

const ObservacoesFeed = ({ entradaId }) => {
  const [observacoes, setObservacoes] = useState([]);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, observacao: null });
  
  const { user } = useAuthStore();

  // Buscar observações
  const fetchObservacoes = useCallback(async () => {
    if (!entradaId) return;
    
    try {
      setLoadingList(true);
      const response = await observacaoService.getObservacoes(entradaId);
      if (response.success) {
        // Garantir que observacoes seja sempre um array
        const observacoesData = response.data?.observacoes || response.data || [];
        setObservacoes(Array.isArray(observacoesData) ? observacoesData : []);
      } else {
        setObservacoes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar observações:', error);
      setError('Erro ao carregar observações');
      setObservacoes([]);
    } finally {
      setLoadingList(false);
    }
  }, [entradaId]);

  // Carregar observações na inicialização
  useEffect(() => {
    fetchObservacoes();
  }, [fetchObservacoes]);

  // Adicionar nova observação
  const handleAdicionarObservacao = async () => {
    if (!novaObservacao.trim() || !entradaId) return;

    try {
      setLoading(true);
      setError('');
      
      const response = await observacaoService.createObservacao(entradaId, {
        texto: novaObservacao.trim()
      });

      if (response.success) {
        setNovaObservacao('');
        setSuccess('Observação adicionada com sucesso!');
        await fetchObservacoes(); // Recarregar lista
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Erro ao criar observação:', error);
      setError('Erro ao adicionar observação');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de confirmação para excluir
  const handleDeleteClick = (observacao) => {
    setDeleteDialog({ open: true, observacao });
  };

  // Fechar modal de confirmação
  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, observacao: null });
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.observacao) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await observacaoService.deleteObservacao(deleteDialog.observacao.id);
      
      if (response.success) {
        setSuccess('Observação excluída com sucesso!');
        await fetchObservacoes();
        handleDeleteCancel();
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Erro ao excluir observação');
    } finally {
      setLoading(false);
    }
  };

  // Função para obter iniciais do nome
  const getInitials = (nome) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Função para formatar data no formato solicitado (08/10/2025 às 22:42)
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    
    const date = new Date(dateString);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  };

  if (!entradaId) {
    return (
      <Alert severity="info">
        ID da entrada não disponível para carregar observações.
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Título */}
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          color: 'primary.main', 
          fontWeight: 'bold',
          fontSize: { xs: '1rem', sm: '1.1rem' }
        }}
      >
        Observações
      </Typography>

      {/* Mensagens */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Lista de observações */}
      <Paper 
        elevation={1} 
        sx={{ 
          flex: 1, 
          p: 2, 
          mb: 2, 
          overflow: 'auto',
          maxHeight: '60vh',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: '#a8a8a8',
            },
          },
        }}
      >
        {loadingList ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Carregando observações...
            </Typography>
          </Box>
        ) : (Array.isArray(observacoes) && observacoes.length === 0) ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            py={4}
            textAlign="center"
          >
            <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Nenhuma observação ainda.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Seja o primeiro a comentar!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(Array.isArray(observacoes) ? observacoes : []).map((observacao, index) => (
              <React.Fragment key={observacao.id}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <Avatar
                    src={observacao.usuario?.profile_photo_path}
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: 'primary.main',
                      fontSize: '0.875rem',
                      flexShrink: 0
                    }}
                  >
                    {observacao.usuario?.profile_photo_path ? 
                      null : 
                      getInitials(observacao.usuario?.name || 'U')
                    }
                  </Avatar>

                  {/* Conteúdo */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Cabeçalho */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      mb: 0.5,
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 0.5, sm: 1 }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}
                        >
                          {observacao.usuario?.name || 'Usuário'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            textAlign: { xs: 'left', sm: 'right' },
                            flexShrink: 0
                          }}
                        >
                          {formatDate(observacao.created_at)}
                        </Typography>
                        <Tooltip title="Excluir observação">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(observacao)}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': { backgroundColor: 'error.light' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Texto da observação */}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {observacao.texto}
                    </Typography>
                  </Box>
                </Box>

                {/* Divisor (exceto no último item) */}
                {index < (Array.isArray(observacoes) ? observacoes.length : 0) - 1 && (
                  <Divider sx={{ my: 1 }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        )}
      </Paper>

      {/* Formulário para nova observação */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <TextField
          multiline
          rows={3}
          placeholder="Digite sua observação..."
          value={novaObservacao}
          onChange={(e) => setNovaObservacao(e.target.value)}
          variant="outlined"
          size="small"
          disabled={loading}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleAdicionarObservacao}
            disabled={!novaObservacao.trim() || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            size="small"
            sx={{ 
              minWidth: 120,
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </Box>
      </Box>

      {/* Modal de confirmação para exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Tem certeza que deseja excluir esta observação? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ObservacoesFeed;
