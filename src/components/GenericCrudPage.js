import React, { useState, useEffect } from 'react';
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
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import GenericCrudModal from './GenericCrudModal';
import useAppDataStore from '../store/appDataStore';
import useNotification from '../hooks/useNotification';
import EnhancedNotification from './EnhancedNotification';

const GenericCrudPage = ({ 
  title, 
  apiService, 
  itemName = 'item',
  itemNamePlural = 'itens',
  icon: ItemIcon = null
}) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Hook para notificações melhoradas
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();

  // Hook para acessar o store de dados
  const { invalidateCache } = useAppDataStore();
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState({});

  // Estados dos modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  // Carregar itens
  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAll(currentPage, perPage, searchTerm);
      
      if (response.success) {
        // Lidar com ambos os formatos: dados diretos ou aninhados
        let itemsData = [];
        let metaData = {};
        
        // Verificar se response.data é um array diretamente
        if (Array.isArray(response.data)) {
          itemsData = response.data;
          metaData = response.meta || {};
        } 
        // Verificar se response.data é um objeto com 'data' e 'meta' aninhados
        else if (response.data && typeof response.data === 'object') {
          // Formato aninhado: { data: [...], meta: {...} }
          if (Array.isArray(response.data.data)) {
            itemsData = response.data.data;
            metaData = response.data.meta || response.meta || {};
          }
          // Formato direto mas não array (caso raro)
          else {
            itemsData = [];
            metaData = response.data.meta || response.meta || {};
          }
        }
        
        // Garantir que itemsData seja sempre um array
        if (!Array.isArray(itemsData)) {
          console.warn('GenericCrudPage: response.data não é um array válido, usando array vazio');
          itemsData = [];
        }
        
        setItems(itemsData);
        setTotalPages(metaData.last_page || metaData.totalPages || 1);
        setTotalItems(metaData.total || metaData.totalItems || 0);
        setPaginationInfo(metaData);
      } else {
        setItems([]); // Garantir array vazio em caso de erro
        showError('Erro ao carregar dados');
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      setItems([]); // Garantir array vazio em caso de exceção
      showError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Carregar itens quando a página ou perPage mudar
  useEffect(() => {
    loadItems();
  }, [currentPage, perPage]);

  // Buscar com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadItems();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handlers
  const handleNewItem = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDeleteItem = (item) => {
    setDeleteDialog({ open: true, item });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const response = await apiService.delete(deleteDialog.item.id);
      
      if (response.success) {
        showSuccess(`${itemName} excluído com sucesso!`);
        
        // Invalidar cache para atualizar os dropdowns em outros modais
        console.log(`🔄 GenericCrudPage: Invalidando cache após exclusão de ${itemName}...`);
        invalidateCache();
        
        loadItems();
      } else {
        showError(response.message || 'Erro ao excluir');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showError('Erro ao excluir');
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, item: null });
    }
  };

  const handleModalSave = async (itemData) => {
    try {
      setLoading(true);
      let response;
      
      if (editingItem) {
        response = await apiService.update(editingItem.id, itemData);
      } else {
        response = await apiService.create(itemData);
      }
      
      if (response.success) {
        showSuccess(editingItem ? 
          `${itemName} atualizado com sucesso!` : 
          `${itemName} criado com sucesso!`);
        
        // Invalidar cache para atualizar os dropdowns em outros modais
        console.log(`🔄 GenericCrudPage: Invalidando cache após ${editingItem ? 'atualização' : 'criação'} de ${itemName}...`);
        invalidateCache();
        
        handleCloseModal();
        loadItems();
      } else {
        showError(response.message || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showError('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (event) => {
    setPerPage(event.target.value);
    setCurrentPage(1);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {ItemIcon && <ItemIcon />}
            {title}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewItem}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Novo {itemName}
          </Button>
        </Box>

        {/* Barra de busca */}
        <TextField
          fullWidth
          placeholder={`Buscar ${itemNamePlural}...`}
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


      {/* Conteúdo */}
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? `Nenhum ${itemName} encontrado` : `Nenhum ${itemName} cadastrado`}
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewItem}
                sx={{ mt: 2 }}
              >
                Cadastrar Primeiro {itemName}
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
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {ItemIcon && <ItemIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                          {item.nome}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          edge="end"
                          aria-label="editar"
                          color="primary"
                          sx={{ mr: 1 }}
                          onClick={() => handleEditItem(item)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="deletar"
                          color="error"
                          onClick={() => handleDeleteItem(item)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {items.map((item) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {ItemIcon && <ItemIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                      <Typography variant="h6" component="div">
                        {item.nome}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        edge="end"
                        aria-label="editar"
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => handleEditItem(item)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="deletar"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteItem(item)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </>
        )}

        {/* Paginação */}
        {items.length > 0 && (
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
                Mostrando {paginationInfo.from || 0} a {paginationInfo.to || 0} de {totalItems} {itemNamePlural}
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
        onClick={handleNewItem}
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
      <GenericCrudModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleModalSave}
        item={editingItem}
        itemName={itemName}
      />

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
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
            Tem certeza que deseja deletar o {itemName} "{deleteDialog.item?.nome}"? 
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, item: null })} 
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

      {/* Notificação */}
      <EnhancedNotification
        open={notification.open}
        onClose={hideNotification}
        message={notification.message}
        severity={notification.severity}
        duration={notification.duration}
        position={{ vertical: 'top', horizontal: 'center' }}
      />
    </Container>
  );
};

export default GenericCrudPage;


