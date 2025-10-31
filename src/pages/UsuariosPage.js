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
  Chip,
  FormControlLabel,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  VpnKey as VpnKeyIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import userService from '../services/userService';
import useNotification from '../hooks/useNotification';
import EnhancedNotification from '../components/EnhancedNotification';

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [passwordDialog, setPasswordDialog] = useState({ open: false, item: null });
  const [roles, setRoles] = useState([]);
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [paginationInfo, setPaginationInfo] = useState({});
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    roles: []
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Hook para notificações
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  
  // Carregar roles
  const loadRoles = useCallback(async () => {
    try {
      const response = await userService.getRoles();
      if (response.success) {
        const rolesData = Array.isArray(response.data) ? response.data : [];
        setRoles(rolesData);
      } else {
        console.error('Erro ao carregar roles:', response.message);
        setRoles([]);
      }
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      setRoles([]);
    }
  }, []);
  
  // Carregar usuários
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getAll(currentPage, perPage, searchTerm);
      
      if (response.success) {
        // Garantir que response.data seja sempre um array
        const usuariosData = Array.isArray(response.data) ? response.data : [];
        setUsuarios(usuariosData);
        setTotalPages(response.meta?.last_page || response.meta?.totalPages || 1);
        setTotalItems(response.meta?.total || response.meta?.totalItems || 0);
        setPaginationInfo(response.meta || {});
      } else {
        setUsuarios([]); // Garantir array vazio em caso de erro
        showError('Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsuarios([]); // Garantir array vazio em caso de exceção
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, showError]);
  
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);
  
  useEffect(() => {
    loadItems();
  }, [loadItems]);
  
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
  const handleNewItem = async () => {
    setEditingItem(null);
    setFormData({ name: '', username: '', email: '', password: '', roles: [] });
    // Garantir que os roles estejam carregados antes de abrir o modal
    if (roles.length === 0) {
      await loadRoles();
    }
    setModalOpen(true);
  };
  
  const handleEditItem = async (item) => {
    setEditingItem(item);
    setFormData({
      name: item.nome || '',
      username: item.username || '',
      email: item.email || '',
      password: '',
      roles: (item.roles || []).map(r => r.id)
    });
    // Garantir que os roles estejam carregados antes de abrir o modal
    if (roles.length === 0) {
      await loadRoles();
    }
    setModalOpen(true);
  };
  
  const handleDeleteItem = (item) => {
    setDeleteDialog({ open: true, item });
  };
  
  const handleToggleStatus = async (item) => {
    try {
      setLoading(true);
      const response = await userService.toggleStatus(item.id);
      
      if (response.success) {
        showSuccess(`Status alterado para ${response.data?.status || 'alterado'}`);
        loadItems();
      } else {
        showError(response.message || 'Erro ao alterar status');
      }
    } catch (error) {
      showError('Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePassword = (item) => {
    setPasswordDialog({ open: true, item });
  };
  
  const handleSavePassword = async (password) => {
    try {
      setFormLoading(true);
      const response = await userService.changePassword(passwordDialog.item.id, password);
      
      if (response.success) {
        showSuccess('Senha alterada com sucesso!');
        setPasswordDialog({ open: false, item: null });
      } else {
        showError(response.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      showError('Erro ao alterar senha');
    } finally {
      setFormLoading(false);
    }
  };

  const handleModalSave = async () => {
    try {
      setFormLoading(true);
      const data = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        roles: formData.roles
      };
      
      if (!editingItem && formData.password) {
        data.password = formData.password;
      }
      
      let response;
      if (editingItem) {
        response = await userService.update(editingItem.id, data);
      } else {
        response = await userService.create(data);
      }
      
      if (response.success) {
        showSuccess(editingItem ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        setModalOpen(false);
        setEditingItem(null);
        loadItems();
      } else {
        showError(response.message || 'Erro ao salvar usuário');
      }
    } catch (error) {
      showError('Erro ao salvar usuário');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const response = await userService.delete(deleteDialog.item.id);
      
      if (response.success) {
        showSuccess('Usuário excluído com sucesso!');
        setDeleteDialog({ open: false, item: null });
        loadItems();
      } else {
        showError(response.message || 'Erro ao excluir usuário');
      }
    } catch (error) {
      showError('Erro ao excluir usuário');
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
  
  const getStatusColor = (status) => {
    return status === 'ativo' ? 'success' : 'error';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon />
          Gerenciamento de Usuários
        </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewItem}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Novo Usuário
          </Button>
      </Box>

        {/* Barra de busca */}
        <TextField
          fullWidth
          placeholder="Buscar usuários por nome, username ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Conteúdo */}
      <Paper sx={{ p: 2 }}>
        {loading && (!Array.isArray(usuarios) || usuarios.length === 0) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
        ) : !Array.isArray(usuarios) || usuarios.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNewItem}
                sx={{ mt: 2 }}
              >
                Cadastrar Primeiro Usuário
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
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(Array.isArray(usuarios) ? usuarios : []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell>{item.username}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(item.roles || []).map((role) => (
                            <Chip
                              key={role.id}
                              label={role.name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.status || 'ativo'}
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          edge="end"
                          aria-label="alterar status"
                          color={item.status === 'ativo' ? 'error' : 'success'}
                          onClick={() => handleToggleStatus(item)}
                          sx={{ mr: 1 }}
                          disabled={loading}
                        >
                          {item.status === 'ativo' ? <BlockIcon /> : <CheckCircleIcon />}
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="alterar senha"
                          color="primary"
                          onClick={() => handleChangePassword(item)}
                          sx={{ mr: 1 }}
                        >
                          <VpnKeyIcon />
                        </IconButton>
                            <IconButton 
                              edge="end"
                              aria-label="editar"
                              color="primary"
                          onClick={() => handleEditItem(item)}
                              sx={{ mr: 1 }}
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
              {(Array.isArray(usuarios) ? usuarios : []).map((item) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {item.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.username} • {item.email}
                    </Typography>
                    <Box sx={{ mt: 1, mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(item.roles || []).map((role) => (
                        <Chip key={role.id} label={role.name} size="small" variant="outlined" />
                      ))}
                    </Box>
                    <Chip
                      label={item.status || 'ativo'}
                      color={getStatusColor(item.status)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                      <IconButton size="small" onClick={() => handleToggleStatus(item)}>
                        {item.status === 'ativo' ? <BlockIcon /> : <CheckCircleIcon />}
                      </IconButton>
                      <IconButton size="small" onClick={() => handleChangePassword(item)}>
                        <VpnKeyIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEditItem(item)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteItem(item)}>
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
        {Array.isArray(usuarios) && usuarios.length > 0 && (
          <Box sx={{ 
            mt: 3, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {paginationInfo.from || 0} a {paginationInfo.to || 0} de {totalItems} usuários
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Por página</InputLabel>
                <Select value={perPage} label="Por página" onChange={handlePerPageChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
              disabled={loading}
            />
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
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
              label="Nome"
                fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              disabled={formLoading}
              />
              <TextField
              label="Username"
                fullWidth
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              disabled={formLoading}
              />
              <TextField
              label="Email"
              type="email"
                fullWidth
                value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              disabled={formLoading}
              />
            {!editingItem && (
              <TextField
                label="Senha"
                type="password"
                fullWidth
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={formLoading}
              />
            )}
              <FormControl fullWidth>
              <InputLabel>Roles</InputLabel>
                <Select
                  multiple
                  value={formData.roles}
                onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                input={<OutlinedInput label="Roles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const role = roles.find(r => r.id === value);
                      return <Chip key={value} label={role?.name || value} size="small" />;
                    })}
                  </Box>
                )}
                disabled={formLoading}
              >
                {Array.isArray(roles) && roles.length > 0 ? (
                  roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Checkbox checked={formData.roles.indexOf(role.id) > -1} />
                      <ListItemText primary={role.name} />
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <ListItemText primary="Carregando roles..." />
                  </MenuItem>
                )}
                </Select>
              </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={formLoading}>
            Cancelar
          </Button>
          <Button onClick={handleModalSave} variant="contained" disabled={formLoading}>
            {formLoading ? <CircularProgress size={20} /> : (editingItem ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar o usuário "{deleteDialog.item?.nome}"? 
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={loading}>
            Deletar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de alteração de senha */}
      <Dialog open={passwordDialog.open} onClose={() => setPasswordDialog({ open: false, item: null })}>
        <DialogTitle>Alterar Senha</DialogTitle>
        <DialogContent>
          <PasswordChangeForm
            onSubmit={handleSavePassword}
            loading={formLoading}
            userName={passwordDialog.item?.nome}
          />
        </DialogContent>
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

// Componente para formulário de alteração de senha
const PasswordChangeForm = ({ onSubmit, loading, userName }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    setError('');
    onSubmit(password);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Alterar senha de: <strong>{userName}</strong>
      </Typography>
      <TextField
        label="Nova Senha"
        type="password"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Confirmar Senha"
        type="password"
        fullWidth
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={loading}
        error={!!error}
        helperText={error}
      />
      <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Alterar Senha'}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default UsuariosPage;
