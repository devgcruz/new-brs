import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import colaboradorService from '../services/colaboradorService';
import ColaboradorModal from '../components/ColaboradorModal';
import useAppDataStore from '../store/appDataStore';

const ColaboradoresPage = () => {
  const navigate = useNavigate();
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, colaborador: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState(null);
  const [cnhModal, setCnhModal] = useState({ open: false, colaborador: null, imageUrl: null });

  // Hook para acessar o store de dados
  const { invalidateColaboradoresCache } = useAppDataStore();
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState({});

  // Carregar colaboradores ao montar o componente
  useEffect(() => {
    loadColaboradores();
  }, [currentPage, perPage]);

  // Carregar colaboradores quando o termo de busca mudar (com debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadColaboradores();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadColaboradores = async () => {
    setLoading(true);
    try {
      const response = await colaboradorService.getAll(currentPage, perPage, searchTerm);
      
      // Atualizar dados dos colaboradores
      setColaboradores(response.data || []);
      
      // Atualizar informações de paginação
      if (response.meta) {
        setTotalPages(response.meta.last_page || 1);
        setTotalItems(response.meta.total || 0);
        setPaginationInfo(response.meta);
      }
    } catch (error) {
      setAlert({
        show: true,
        message: 'Erro ao carregar colaboradores',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Funções de paginação
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (event) => {
    setPerPage(event.target.value);
    setCurrentPage(1); // Voltar para primeira página
  };

  // Abrir modal para novo colaborador
  const handleNewColaborador = () => {
    setEditingColaborador(null);
    setModalOpen(true);
  };

  // Abrir modal para editar colaborador
  const handleEditColaborador = (colaborador) => {
    setEditingColaborador(colaborador);
    setModalOpen(true);
  };

  // Abrir dialog de confirmação para exclusão
  const handleDeleteColaborador = (colaborador) => {
    setDeleteDialog({ open: true, colaborador });
  };

  // Visualizar CNH do colaborador
  const handleViewCnh = (colaborador) => {
    if (colaborador.cnh_path) {
      // Construir URL completa da imagem
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:80';
      const imageUrl = `${baseUrl}/storage/${colaborador.cnh_path}`;
      
      setCnhModal({
        open: true,
        colaborador,
        imageUrl
      });
    }
  };

  // Fechar modal de CNH
  const handleCloseCnhModal = () => {
    setCnhModal({ open: false, colaborador: null, imageUrl: null });
  };

  // Salvar colaborador (callback do modal)
  const handleColaboradorSaved = () => {
    setModalOpen(false);
    setEditingColaborador(null);
    loadColaboradores(); // Recarregar lista
    
    // Invalidar cache de colaboradores para atualizar os dropdowns em outros modais
    console.log('🔄 ColaboradoresPage: Invalidando cache de colaboradores...');
    invalidateColaboradoresCache();
    
    setAlert({
      show: true,
      message: 'Colaborador salvo com sucesso!',
      type: 'success'
    });
  };

  // Fechar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingColaborador(null);
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!deleteDialog.colaborador) return;

    try {
      setLoading(true);
      const response = await colaboradorService.delete(deleteDialog.colaborador.id);
      
      if (response.success) {
        setAlert({
          show: true,
          message: 'Colaborador excluído com sucesso!',
          type: 'success'
        });
        loadColaboradores(); // Recarregar lista
        
        // Invalidar cache de colaboradores para atualizar os dropdowns em outros modais
        console.log('🔄 ColaboradoresPage: Invalidando cache após exclusão...');
        invalidateColaboradoresCache();
      } else {
        setAlert({
          show: true,
          message: response.message || 'Erro ao excluir colaborador',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Erro ao excluir colaborador:', error);
      setAlert({
        show: true,
        message: 'Erro ao excluir colaborador',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, colaborador: null });
    }
  };

  // Cancelar exclusão
  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, colaborador: null });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
            Gerenciamento de Colaboradores
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewColaborador}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Novo Colaborador
          </Button>
        </Box>

        {/* Barra de busca */}
        <TextField
          fullWidth
          placeholder="Buscar colaboradores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Paper>

      {/* Alert */}
      {alert.show && (
        <Alert 
          severity={alert.type} 
          onClose={() => setAlert({ show: false, message: '', type: 'success' })}
          sx={{ mb: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      {/* Conteúdo */}
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : colaboradores.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'Nenhum colaborador encontrado' : 'Nenhum colaborador cadastrado'}
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewColaborador}
                sx={{ mt: 2 }}
              >
                Cadastrar Primeiro Colaborador
              </Button>
            )}
          </Box>
        ) : (
          <>
            {/* Desktop Table */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>CPF</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Celular</TableCell>
                    <TableCell>CNH</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {colaboradores.map((colaborador) => (
                    <TableRow key={colaborador.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          {colaborador.nome}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {colaborador.cpf || 'Não informado'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {colaborador.email || 'Não informado'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {colaborador.celular || 'Não informado'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {colaborador.cnh_path ? (
                          <Tooltip title="Visualizar CNH">
                            <IconButton
                              size="small"
                              onClick={() => handleViewCnh(colaborador)}
                              color="primary"
                            >
                              <ImageIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Não enviada
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            edge="end"
                            aria-label="editar"
                            color="primary"
                            sx={{ mr: 1 }}
                            onClick={() => handleEditColaborador(colaborador)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            edge="end"
                            aria-label="deletar"
                            color="error"
                            onClick={() => handleDeleteColaborador(colaborador)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {colaboradores.map((colaborador) => (
                <Card key={colaborador.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="h6" component="div">
                        {colaborador.nome}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>CPF:</strong> {colaborador.cpf || 'Não informado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {colaborador.email || 'Não informado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Celular:</strong> {colaborador.celular || 'Não informado'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      {colaborador.cnh_path && (
                        <Tooltip title="Visualizar CNH">
                          <IconButton
                            size="small"
                            onClick={() => handleViewCnh(colaborador)}
                            color="primary"
                          >
                            <ImageIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar">
                        <IconButton
                          edge="end"
                          aria-label="editar"
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                          onClick={() => handleEditColaborador(colaborador)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton
                          edge="end"
                          aria-label="deletar"
                          color="error"
                          size="small"
                          onClick={() => handleDeleteColaborador(colaborador)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}

        {/* Paginação */}
        {colaboradores.length > 0 && (
          <Box sx={{ 
            mt: 3, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' },
            flexWrap: 'wrap', 
            gap: 2 
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' }, 
              gap: 2 
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                Mostrando {paginationInfo.from || 0} a {paginationInfo.to || 0} de {totalItems} colaboradores
              </Typography>
              
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                <InputLabel>Por página</InputLabel>
                <Select
                  value={perPage}
                  label="Por página"
                  onChange={handlePerPageChange}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
                disabled={loading}
                size="small"
                siblingCount={1}
                boundaryCount={1}
              />
            </Box>
          </Box>
        )}
      </Paper>

      {/* FAB para mobile */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleNewColaborador}
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
      >
        <AddIcon />
      </Fab>

      {/* Modal de edição/criação */}
      <ColaboradorModal
        open={modalOpen}
        onClose={handleCloseModal}
        colaborador={editingColaborador}
        onSaved={handleColaboradorSaved}
      />

      {/* Modal de visualização da CNH */}
      <Dialog
        open={cnhModal.open}
        onClose={handleCloseCnhModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          CNH - {cnhModal.colaborador?.nome}
        </DialogTitle>
        <DialogContent>
          {cnhModal.imageUrl && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={cnhModal.imageUrl}
                alt={`CNH de ${cnhModal.colaborador?.nome}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCnhModal}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCancelDelete}
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
            Tem certeza que deseja deletar o colaborador "{deleteDialog.colaborador?.nome}"? 
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelDelete} 
            variant="contained" 
            color="error"
          >
            NÃO
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="outlined" 
            disabled={loading}
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
    </Container>
  );
};

export default ColaboradoresPage;