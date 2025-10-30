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
  DialogActions,
  Card,
  CardContent,
  CardMedia,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import observacaoFinanceiroService from '../../services/observacaoFinanceiroService';
import useAuthStore from '../../store/authStore';

const ObservacoesFinanceiroFeed = ({ financeiroId }) => {
  const [observacoes, setObservacoes] = useState([]);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [fotoSelecionada, setFotoSelecionada] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, observacao: null });
  
  const { user } = useAuthStore();

  // Buscar observações
  const fetchObservacoes = useCallback(async () => {
    if (!financeiroId) {
      console.log('❌ ObservacoesFinanceiroFeed: financeiroId não fornecido');
      return;
    }
    
    console.log('🔍 ObservacoesFinanceiroFeed: Buscando observações para financeiroId:', financeiroId);
    
    try {
      setLoadingList(true);
      const response = await observacaoFinanceiroService.getObservacoesFinanceiro(financeiroId);
      console.log('📥 ObservacoesFinanceiroFeed: Resposta da API:', response);
      
      if (response.success) {
        const observacoesData = response.data?.observacoes || [];
        console.log('✅ ObservacoesFinanceiroFeed: Observações encontradas:', observacoesData.length);
        setObservacoes(Array.isArray(observacoesData) ? observacoesData : []);
      } else {
        console.log('❌ ObservacoesFinanceiroFeed: Resposta não foi bem-sucedida:', response);
        setObservacoes([]);
      }
    } catch (error) {
      console.error('❌ ObservacoesFinanceiroFeed: Erro ao buscar observações:', error);
      setError('Erro ao carregar observações');
      setObservacoes([]);
    } finally {
      setLoadingList(false);
    }
  }, [financeiroId]);

  // Carregar observações na inicialização
  useEffect(() => {
    fetchObservacoes();
  }, [fetchObservacoes]);

  // Manipular seleção de foto
  const handleFotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFotoSelecionada(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setFotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remover foto selecionada
  const handleRemoveFoto = () => {
    setFotoSelecionada(null);
    setFotoPreview(null);
  };

  // Adicionar nova observação
  const handleAdicionarObservacao = async () => {
    if (!novaObservacao.trim() || !financeiroId) return;

    try {
      setLoading(true);
      setError('');
      
      let fotoUrl = null;
      
      // Upload da foto se houver
      if (fotoSelecionada) {
        const uploadResponse = await observacaoFinanceiroService.uploadFotoObservacao(fotoSelecionada);
        if (uploadResponse.success) {
          fotoUrl = uploadResponse.data.url;
        }
      }
      
      const response = await observacaoFinanceiroService.createObservacaoFinanceiro(financeiroId, {
        texto: novaObservacao.trim(),
        foto_url: fotoUrl
      });

      if (response.success) {
        setNovaObservacao('');
        setFotoSelecionada(null);
        setFotoPreview(null);
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
      const response = await observacaoFinanceiroService.deleteObservacaoFinanceiro(deleteDialog.observacao.id);
      
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

  if (!financeiroId) {
    return (
      <Alert severity="info">
        ID do lançamento financeiro não disponível para carregar observações.
      </Alert>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0,
      maxHeight: '100%' // Garante que não ultrapasse o container pai
    }}>
      {/* Título */}
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 2, 
          color: 'primary.main', 
          fontWeight: 'bold',
          fontSize: { xs: '1rem', sm: '1.1rem' },
          flexShrink: 0
        }}
      >
        Observações do Lançamento
      </Typography>

      {/* Mensagens */}
      {(error || success) && (
        <Box sx={{ flexShrink: 0, mb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 1 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
        </Box>
      )}

      {/* Lista de observações com scroll - SEMPRE com altura fixa */}
      <Paper 
        elevation={1} 
        sx={{ 
          flex: 1,
          p: { xs: 1.5, sm: 2 }, 
          mb: 2, 
          overflow: 'auto',
          minHeight: 0,
          maxHeight: '300px', // Altura fixa para garantir que o formulário seja sempre visível
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '4px',
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
            py={{ xs: 3, sm: 4 }}
            textAlign="center"
            sx={{ minHeight: 200 }}
          >
            <PersonIcon sx={{ 
              fontSize: { xs: 40, sm: 48 }, 
              color: 'text.secondary', 
              mb: 1 
            }} />
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Nenhuma observação ainda.
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              Seja o primeiro a comentar!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(Array.isArray(observacoes) ? observacoes : []).map((observacao, index) => (
              <React.Fragment key={observacao.id}>
                <Card elevation={0} sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider',
                  mb: 2,
                  '&:last-child': { mb: 0 }
                }}>
                  <CardContent sx={{ 
                    p: { xs: 1.5, sm: 2 }, 
                    '&:last-child': { pb: { xs: 1.5, sm: 2 } } 
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 1.5, sm: 2 }, 
                      alignItems: 'flex-start' 
                    }}>
                      {/* Avatar */}
                      <Avatar
                        src={observacao.usuario?.profile_photo_url}
                        sx={{ 
                          width: { xs: 32, sm: 40 }, 
                          height: { xs: 32, sm: 40 }, 
                          bgcolor: 'primary.main',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          flexShrink: 0
                        }}
                      >
                        {observacao.usuario?.profile_photo_url ? 
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
                          mb: 1,
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 0.5, sm: 1 }
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            flexWrap: 'wrap'
                          }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 'bold',
                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                              }}
                            >
                              {observacao.usuario?.name || 'Usuário'}
                            </Typography>
                            {observacao.foto_url && (
                              <Chip 
                                icon={<PhotoCameraIcon />} 
                                label="Foto" 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              />
                            )}
                          </Box>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            flexShrink: 0
                          }}>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                textAlign: { xs: 'left', sm: 'right' },
                                whiteSpace: 'nowrap'
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
                                  p: 0.5,
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
                            wordBreak: 'break-word',
                            mb: observacao.foto_url ? 2 : 0
                          }}
                        >
                          {observacao.texto}
                        </Typography>

                        {/* Foto da observação */}
                        {observacao.foto_url && (
                          <CardMedia
                            component="img"
                            image={observacao.foto_url}
                            alt="Foto da observação"
                            sx={{
                              maxWidth: { xs: '100%', sm: 300 },
                              maxHeight: { xs: 150, sm: 200 },
                              borderRadius: 1,
                              objectFit: 'cover',
                              width: '100%'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </React.Fragment>
            ))}
          </Box>
        )}
      </Paper>

      {/* Formulário para nova observação - ABSOLUTAMENTE FIXO */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 1,
        flexShrink: 0,
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        pt: 2,
        position: 'sticky',
        bottom: 0,
        zIndex: 1
      }}>
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
        
        {/* Preview da foto */}
        {fotoPreview && (
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <CardMedia
              component="img"
              image={fotoPreview}
              alt="Preview da foto"
              sx={{
                maxWidth: { xs: 150, sm: 200 },
                maxHeight: { xs: 100, sm: 150 },
                borderRadius: 1,
                objectFit: 'cover'
              }}
            />
            <IconButton
              size="small"
              onClick={handleRemoveFoto}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1
        }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="foto-observacao"
              type="file"
              onChange={handleFotoChange}
            />
            <label htmlFor="foto-observacao">
              <IconButton
                color="primary"
                aria-label="adicionar foto"
                component="span"
                size="small"
                disabled={loading}
              >
                <PhotoCameraIcon />
              </IconButton>
            </label>
            {fotoSelecionada && (
              <Chip 
                icon={<AttachFileIcon />} 
                label={fotoSelecionada.name} 
                size="small" 
                onDelete={handleRemoveFoto}
                color="primary"
                variant="outlined"
                sx={{ maxWidth: { xs: 120, sm: 200 } }}
              />
            )}
          </Box>
          
          <Button
            variant="contained"
            onClick={handleAdicionarObservacao}
            disabled={!novaObservacao.trim() || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            size="small"
            sx={{ 
              minWidth: { xs: 100, sm: 120 },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              flexShrink: 0
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

export default ObservacoesFinanceiroFeed;
