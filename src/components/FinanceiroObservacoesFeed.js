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
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';

const FinanceiroObservacoesFeed = ({ financeiroId, observacaoAtual, onObservacaoChange }) => {
  const [observacoes, setObservacoes] = useState([]);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, observacao: null });
  const [editDialog, setEditDialog] = useState({ open: false, observacao: null, texto: '' });
  
  const { user } = useAuthStore();

  // Função para obter iniciais do nome
  const getInitials = (nome) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Carregar observações existentes do campo OBSERVACAO
  useEffect(() => {
    if (observacaoAtual && observacaoAtual.trim()) {
      // Separar observações concatenadas por " | " em posts individuais
      const observacoesSeparadas = observacaoAtual.split(' | ').map((obs, index) => ({
        id: `existing-obs-${index}`,
        texto: obs.trim(),
        autor: user?.name || 'Usuário Atual',
        data: new Date().toLocaleString('pt-BR'),
        timestamp: new Date().toISOString(),
        usuario: {
          nome: user?.name || 'Usuário Atual',
          profile_photo_url: user?.profile_photo_url || null
        }
      })).filter(obs => obs.texto); // Remover observações vazias
      
      setObservacoes(observacoesSeparadas);
    } else {
      setObservacoes([]);
    }
  }, [observacaoAtual, user?.name]);

  // Função para adicionar nova observação
  const adicionarObservacao = useCallback(async () => {
    if (!novaObservacao.trim() || !financeiroId) return;

    try {
      setLoading(true);
      setError('');

      const novaObs = {
        id: String(Date.now()),
        texto: novaObservacao.trim(),
        autor: user?.name || 'Usuário Atual',
        data: new Date().toLocaleString('pt-BR'),
        timestamp: new Date().toISOString(),
        usuario: {
          nome: user?.name || 'Usuário Atual',
          profile_photo_url: user?.profile_photo_url || null
        }
      };

      setObservacoes(prev => [...prev, novaObs]);
      
      // Combinar todas as observações em um texto para o campo OBSERVACAO
      const todasObservacoes = [...observacoes, novaObs]
        .map(obs => obs.texto.trim())
        .filter(texto => texto)
        .join(' | ');
      onObservacaoChange(todasObservacoes);

      setNovaObservacao('');
      setSuccess('Observação adicionada com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      setError('Erro ao adicionar observação');
    } finally {
      setLoading(false);
    }
  }, [novaObservacao, financeiroId, user?.name, observacoes, onObservacaoChange]);

  // Função para editar observação
  const editarObservacao = useCallback((observacao) => {
    setEditDialog({
      open: true,
      observacao,
      texto: observacao.texto
    });
  }, []);

  // Função para salvar edição
  const salvarEdicao = useCallback(() => {
    if (!editDialog.texto.trim()) return;

    const observacoesAtualizadas = observacoes.map(obs => 
      obs.id === editDialog.observacao.id 
        ? { ...obs, texto: editDialog.texto.trim() }
        : obs
    );

    setObservacoes(observacoesAtualizadas);
    
    // Atualizar o campo OBSERVACAO - concatenar apenas observações não vazias
    const todasObservacoes = observacoesAtualizadas
      .map(obs => obs.texto.trim())
      .filter(texto => texto)
      .join(' | ');
    onObservacaoChange(todasObservacoes);

    setEditDialog({ open: false, observacao: null, texto: '' });
    setSuccess('Observação editada com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
  }, [editDialog, observacoes, onObservacaoChange]);

  // Função para remover observação
  const removerObservacao = useCallback((observacao) => {
    setDeleteDialog({ open: true, observacao });
  }, []);

  // Função para confirmar exclusão
  const confirmarExclusao = useCallback(() => {
    const observacoesAtualizadas = observacoes.filter(obs => obs.id !== deleteDialog.observacao.id);
    setObservacoes(observacoesAtualizadas);
    
    // Atualizar o campo OBSERVACAO - concatenar apenas observações não vazias
    const todasObservacoes = observacoesAtualizadas
      .map(obs => obs.texto.trim())
      .filter(texto => texto)
      .join(' | ');
    onObservacaoChange(todasObservacoes);

    setDeleteDialog({ open: false, observacao: null });
    setSuccess('Observação removida com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
  }, [deleteDialog.observacao, observacoes, onObservacaoChange]);

  // Função para cancelar exclusão
  const cancelarExclusao = useCallback(() => {
    setDeleteDialog({ open: false, observacao: null });
  }, []);

  // Função para cancelar edição
  const cancelarEdicao = useCallback(() => {
    setEditDialog({ open: false, observacao: null, texto: '' });
  }, []);

  if (!financeiroId) {
    return (
      <Alert severity="info">
        ID do lançamento financeiro não disponível para carregar observações.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ 
        color: 'primary.main', 
        fontWeight: 'bold',
        mb: 2
      }}>
        Observações do Lançamento Financeiro
      </Typography>

      {/* Campo para adicionar nova observação */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-end' }
      }}>
        <TextField
          fullWidth
          label="Nova observação"
          multiline
          rows={3}
          value={novaObservacao}
          onChange={(e) => setNovaObservacao(e.target.value)}
          placeholder="Digite uma nova observação sobre este lançamento financeiro..."
          variant="outlined"
          size="small"
          disabled={loading}
          sx={{
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }
          }}
        />
        <Button
          variant="contained"
          onClick={adicionarObservacao}
          disabled={!novaObservacao.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
          sx={{ 
            minWidth: 'auto', 
            px: { xs: 2, sm: 3 },
            py: { xs: 1, sm: 1.5 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            whiteSpace: 'nowrap',
            height: 'fit-content'
          }}
        >
          {loading ? 'Adicionando...' : 'Adicionar'}
        </Button>
      </Box>

      {/* Alertas */}
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
      {observacoes.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body2" color="text.secondary">
            Nenhuma observação adicionada ainda.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Adicione a primeira observação usando o campo acima.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          maxHeight: 400, 
          overflowY: 'auto',
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
        }}>
          {observacoes.map((obs, index) => (
            <Paper
              key={obs.id}
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fafafa'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                mb: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={obs.usuario?.profile_photo_url}
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: 'primary.main',
                      fontSize: '0.75rem',
                      flexShrink: 0
                    }}
                  >
                    {obs.usuario?.profile_photo_url ? 
                      null : 
                      getInitials(obs.usuario?.nome || 'U')
                    }
                  </Avatar>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    {obs.usuario?.nome || obs.autor}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    {obs.data}
                  </Typography>
                  <Tooltip title="Editar observação">
                    <IconButton
                      size="small"
                      onClick={() => editarObservacao(obs)}
                      sx={{ p: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remover observação">
                    <IconButton
                      size="small"
                      onClick={() => removerObservacao(obs)}
                      color="error"
                      sx={{ p: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Typography 
                variant="body2"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {obs.texto}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelarExclusao}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja remover esta observação? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelarExclusao}>Cancelar</Button>
          <Button onClick={confirmarExclusao} color="error" variant="contained">
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de edição */}
      <Dialog
        open={editDialog.open}
        onClose={cancelarEdicao}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Observação</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editDialog.texto}
            onChange={(e) => setEditDialog(prev => ({ ...prev, texto: e.target.value }))}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelarEdicao}>Cancelar</Button>
          <Button onClick={salvarEdicao} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinanceiroObservacoesFeed;
