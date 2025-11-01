import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Snackbar,
  Fade,
  Grow
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Comment as CommentIcon } from '@mui/icons-material';
import entradaService from '../services/entradaService';
import NovoRegistroModal from '../components/NovoRegistroModal';
import EditarRegistroModal from '../components/EditarRegistroModal';
import PaginationControls from '../components/PaginationControls';
import AccessibleFab from '../components/AccessibleFab';
import ConfirmationDialog from '../components/ConfirmationDialog';
import EnhancedNotification from '../components/EnhancedNotification';
import useNotification from '../hooks/useNotification';

const RegistrosPage = () => {
  const [entradas, setEntradas] = useState([]);
  const [filteredEntradas, setFilteredEntradas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  
  // Estados para confirmação de edição
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedEntrada, setSelectedEntrada] = useState(null);
  
  // Hook para notificações melhoradas
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();
  
  // Estados de paginação
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15
  });

  const loadEntradas = useCallback(async (page = pagination.currentPage, perPage = pagination.perPage) => {
    try {
      setLoading(true);
      const response = await entradaService.getEntradas({}, { page, per_page: perPage });
      
      if (response.success && Array.isArray(response.data)) {
        setEntradas(response.data);
        setFilteredEntradas(response.data); // Definir filteredEntradas com os dados carregados
        setPagination({
          currentPage: response.meta?.current_page || page,
          lastPage: response.meta?.last_page || 1,
          total: response.meta?.total || 0,
          perPage: response.meta?.per_page || perPage
        });
        setError('');
      } else {
        setEntradas([]); // Garantir que entradas seja sempre um array
        setFilteredEntradas([]); // Garantir que filteredEntradas seja sempre um array
        setError(response.message || 'Erro ao carregar registros');
      }
    } catch (err) {
      setEntradas([]); // Garantir que entradas seja sempre um array
      setFilteredEntradas([]); // Garantir que filteredEntradas seja sempre um array
      setError('Erro ao carregar registros');
    } finally {
      setLoading(false);
    }
  }, []); // Remover dependências para evitar loops

  const searchEntradas = useCallback(async (searchTerm, page = 1, perPage = null) => {
    try {
      setLoading(true);
      const currentPerPage = perPage || 15; // Usar valor padrão em vez de pagination.perPage
      const response = await entradaService.getEntradas(
        { search: searchTerm }, 
        { page, per_page: currentPerPage }
      );
      
      if (response.success && Array.isArray(response.data)) {
        setEntradas(response.data);
        setFilteredEntradas(response.data); // Mostrar todos os resultados da busca
        setPagination({
          currentPage: response.meta?.current_page || page,
          lastPage: response.meta?.last_page || 1,
          total: response.meta?.total || 0,
          perPage: response.meta?.per_page || currentPerPage
        });
        setError('');
      } else {
        setEntradas([]);
        setFilteredEntradas([]);
        setError(response.message || 'Erro ao buscar registros');
      }
    } catch (err) {
      setEntradas([]);
      setFilteredEntradas([]);
      setError('Erro ao buscar registros');
    } finally {
      setLoading(false);
    }
  }, []); // Remover dependências para evitar loops

  useEffect(() => {
    loadEntradas(1, 15); // Carrega primeira página com 15 registros
  }, []); // Executa apenas uma vez na montagem

  // Busca com debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchEntradas(searchTerm, 1);
      } else {
        loadEntradas(1, 15); // Usar valor fixo em vez de pagination.perPage
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Remover dependências das funções para evitar loops

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSaveSuccess = async () => {
    try {
      setIsModalOpen(false);
      await loadEntradas();
      showSuccess('Registro criado com sucesso!');
    } catch (err) {
      showError('Erro ao atualizar lista após salvar.');
    }
  };

  const handleEditClick = (registro) => {
    if (registro.situacao === 'Finalizado') {
      setSelectedEntrada(registro);
      setConfirmationOpen(true);
    } else {
      setSelectedRegistro(registro);
      setEditModalOpen(true);
    }
  };

  const handleConfirmEdit = () => {
    setConfirmationOpen(false);
    if (selectedEntrada) {
      setSelectedRegistro(selectedEntrada);
      setEditModalOpen(true);
    }
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedRegistro(null);
  };

  const handleSaveEdit = async (formData) => {
    try {
      // Recarrega a lista de registros para mostrar as alterações
      await loadEntradas();
      
      // Fechar o modal
      setEditModalOpen(false);
      setSelectedRegistro(null);
      
      // Mostrar notificação de sucesso
      showSuccess('Registro atualizado com sucesso!');
      
    } catch (err) {
      showError('Erro ao atualizar registro. Tente novamente.');
    }
  };

  const handleDelete = async (registroId) => {
    try {
      await loadEntradas(); // Recarrega a lista de registros
      setEditModalOpen(false);
      setSelectedRegistro(null);
      
      // Mostrar notificação de sucesso
      showSuccess('Registro excluído com sucesso!');
    } catch (err) {
      showError('Erro ao excluir registro. Tente novamente.');
    }
  };

  // Funções de paginação
  const handlePageChange = (newPage) => {
    if (searchTerm.trim()) {
      searchEntradas(searchTerm, newPage);
    } else {
      loadEntradas(newPage, 15); // Usar valor fixo
    }
  };

  const handlePerPageChange = (newPerPage) => {
    if (searchTerm.trim()) {
      searchEntradas(searchTerm, 1, newPerPage);
    } else {
      loadEntradas(1, newPerPage); // Volta para primeira página
    }
  };

  const getPosicaoColor = (posicao) => {
    switch (posicao) {
      // Pátios - Azul
      case 'Pátio A':
        return 'primary';
      case 'Pátio B':
        return 'primary';
      case 'Pátio C':
        return 'primary';
      
      // Oficina - Laranja
      case 'Oficina Parceira':
        return 'warning';
      
      // Documentos - Amarelo/Laranja
      case 'AGUARDA DOCUMENTOS':
        return 'warning';
      case 'DOCTOS RECEBIDO':
        return 'info';
      case 'DOCTOS RECEBIDO REP':
        return 'info';
      case 'DOCTOS ENVIADO REP':
        return 'info';
      
      // Status finais - Verde/Vermelho
      case 'FINALIZADO':
        return 'success';
      case 'CANCELADO':
        return 'error';
      
      // Padrão
      default:
        return 'default';
    }
  };

  const getSituacaoChipColor = (situacao) => {
    switch (situacao) {
      case 'Finalizado':
        return 'success';
      case 'Em Andamento':
        return 'warning';
      case 'Pendente':
        return 'info';
      default:
        return 'default';
    }
  };


  // Função para obter o último post de observação
  const getUltimaObservacao = (entrada) => {
    // Priorizar observações dinâmicas (nova API)
    if (entrada.observacoes && Array.isArray(entrada.observacoes) && entrada.observacoes.length > 0) {
      return entrada.observacoes[entrada.observacoes.length - 1];
    }
    
    // Fallback para observações antigas
    if (entrada.observacoes_posts && Array.isArray(entrada.observacoes_posts) && entrada.observacoes_posts.length > 0) {
      return entrada.observacoes_posts[entrada.observacoes_posts.length - 1];
    }
    
    return null;
  };

  // Função para formatar a data da observação
  const formatarDataObservacao = (data) => {
    if (!data) return 'Data não disponível';
    
    try {
      let dateObj;
      
      if (typeof data === 'string') {
        // Tenta diferentes estratégias de parsing
        if (data.includes('T') || data.includes('Z')) {
          // Formato ISO
          dateObj = new Date(data);
        } else if (data.includes('/') && data.includes(',')) {
          // Formato brasileiro DD/MM/YYYY, HH:MM:SS
          const [datePart, timePart] = data.split(', ');
          const [day, month, year] = datePart.split('/');
          const [hour, minute, second] = timePart.split(':');
          
          dateObj = new Date(
            parseInt(year), 
            parseInt(month) - 1, 
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
          );
        } else if (data.includes('/')) {
          // Formato brasileiro DD/MM/YYYY
          const parts = data.split('/');
          if (parts.length === 3) {
            dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
          } else {
            dateObj = new Date(data);
          }
        } else if (data.includes('-')) {
          // Formato YYYY-MM-DD
          dateObj = new Date(data);
        } else {
          // Tenta parsear diretamente
          dateObj = new Date(data);
        }
      } else if (data instanceof Date) {
        dateObj = data;
      } else if (typeof data === 'number') {
        // Timestamp
        dateObj = new Date(data);
      } else {
        return 'Data não disponível';
      }
      
      // Verifica se a data é válida
      if (isNaN(dateObj.getTime())) {
        return 'Data inválida';
      }
      
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data não disponível';
    }
  };

  // Componente para o tooltip das observações
  const ObservacoesTooltip = ({ observacoes }) => {
    if (!observacoes || !Array.isArray(observacoes) || observacoes.length === 0) {
      return (
        <Paper sx={{ p: 2, maxWidth: 400 }}>
          <Typography variant="body2" color="text.secondary">
            Nenhuma observação encontrada
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper sx={{ p: 2, maxWidth: 400, maxHeight: 300, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Observações ({observacoes.length})
        </Typography>
        <List dense>
          {observacoes.map((obs, index) => {
            
            return (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {obs.usuario?.name || obs.nome || 'Usuário'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatarDataObservacao(obs.data || obs.data_criacao || obs.created_at)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {obs.texto || obs.observacao || obs.descricao || 'Sem texto'}
                    </Typography>
                  }
                />
              </ListItem>
              {index < observacoes.length - 1 && <Divider />}
            </React.Fragment>
            );
          })}
        </List>
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Registros de Entrada
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          placeholder="Busca por: placa, chassi, renavam, protocolo, veículo, marca, seguradora, posição ou situação..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* --- INÍCIO DA SOLUÇÃO DE ANIMAÇÃO --- */}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 2. Spinner central APENAS para o primeiro carregamento */}
      {loading && entradas.length === 0 && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      )}

      {/* 3. Lógica "Nenhum resultado" */}
      {!loading && filteredEntradas.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'Nenhum registro encontrado para a busca' : 'Nenhum registro encontrado'}
          </Typography>
        </Box>
      )}

      {/* 4. Wrapper de conteúdo com animação de "fade" (opacidade) */}
      {/* Mantém os cards antigos visíveis enquanto carrega novos */}
      <Fade in={!loading || entradas.length > 0} timeout={300}>
        <Box sx={{
          transition: 'opacity 0.3s ease-in-out',
          opacity: loading && entradas.length > 0 ? 0.6 : 1, // Fica semi-transparente ao recarregar
          pointerEvents: loading ? 'none' : 'auto', // Desativa cliques durante a recarga
        }}>
          <Grid container spacing={2}>
          {(Array.isArray(filteredEntradas) ? filteredEntradas : []).map((entrada, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={entrada.id || `entrada-${index}`}>
              <Grow 
                in={!loading || entradas.length > 0} 
                timeout={400}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: entrada.SITUACAO === 'Finalizado' ? '#e8f5e9' : 'inherit',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleEditClick(entrada)}
                >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  flex: 1
                }}
              >
                <Typography variant="h6" component="div" gutterBottom>
                  {String(entrada.MARCA || '')} {String(entrada.VEICULO || '')}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Placa: {String(entrada.PLACA || '')}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Seguradora: {String(entrada.SEGURADORA || '')}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Colaborador: {entrada.colaborador_nome || 'N/A'}
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    Situação:
                  </Typography>
                  <Chip
                    label={entrada.SITUACAO || 'Pendente'}
                    color={getSituacaoChipColor(entrada.SITUACAO)}
                    size="small"
                  />
                </Box>

                {/* Área de observações */}
                <Box sx={{ mt: 2, flex: 1 }}>
                  {getUltimaObservacao(entrada) ? (
                    <Tooltip
                      title={<ObservacoesTooltip observacoes={entrada.observacoes || entrada.observacoes_posts} />}
                      placement="top"
                      arrow
                      componentsProps={{
                        tooltip: {
                          sx: {
                            maxWidth: 'none',
                            '& .MuiTooltip-tooltip': {
                              backgroundColor: 'transparent',
                              boxShadow: 'none',
                              padding: 0
                            }
                          }
                        }
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1,
                          backgroundColor: 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'grey.100'
                          }
                        }}
                      >
                        <CommentIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              fontWeight: 'bold',
                              color: 'primary.main'
                            }}
                          >
                            Última observação
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'text.secondary'
                            }}
                          >
                            {getUltimaObservacao(entrada).texto || getUltimaObservacao(entrada).observacao || getUltimaObservacao(entrada).descricao || 'Sem texto'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {`${getUltimaObservacao(entrada).usuario?.name || 'Usuário'} em `}{formatarDataObservacao(getUltimaObservacao(entrada).data || getUltimaObservacao(entrada).data_criacao || getUltimaObservacao(entrada).created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200',
                         minHeight: '81.92px'
                      }}
                    >
                      <CommentIcon sx={{ fontSize: 16, color: 'grey.400' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            fontWeight: 'bold',
                            color: 'grey.500'
                          }}
                        >
                          Observações
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.disabled',
                            fontStyle: 'italic'
                          }}
                        >
                          Ainda não há observações.
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
                
                <Typography variant="caption" display="block" sx={{ mt: 'auto', pt: 1 }}>
                  Entrada: {entrada.DATA_ENTRADA && entrada.DATA_ENTRADA !== '0000-00-00' 
                    ? new Date(entrada.DATA_ENTRADA).toLocaleDateString('pt-BR')
                    : 'N/A'
                  }
                </Typography>
              </CardContent>
            </Card>
              </Grow>
          </Grid>
        ))}
        </Grid>
      </Box>
      </Fade>
      {/* --- FIM DA SOLUÇÃO DE ANIMAÇÃO --- */}

      {/* Controles de paginação */}
      <PaginationControls
        currentPage={pagination.currentPage}
        lastPage={pagination.lastPage}
        total={pagination.total}
        perPage={pagination.perPage}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
        loading={loading}
      />

      <AccessibleFab
        color="primary"
        ariaLabel="adicionar novo registro"
        tooltip="Adicionar novo registro"
        onClick={handleAddClick}
      >
        <AddIcon />
      </AccessibleFab>

      <NovoRegistroModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSaveSuccess={handleSaveSuccess}
      />

      <EditarRegistroModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
        registroData={selectedRegistro}
      />

      {/* Notificação melhorada */}
      <EnhancedNotification
        open={notification.open}
        onClose={hideNotification}
        message={notification.message}
        severity={notification.severity}
        duration={notification.duration}
        position={{ vertical: 'top', horizontal: 'center' }}
      />

      {/* Diálogo de confirmação para editar registros finalizados */}
      <ConfirmationDialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={handleConfirmEdit}
        title="Confirmar Alteração"
        message="Esse processo já foi finalizado. Certeza que deseja alterar?"
      />
    </Box>
  );
};

export default RegistrosPage;


