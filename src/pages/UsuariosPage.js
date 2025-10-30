import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import StatCard from '../components/StatCard';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  TextField,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    Usuario: '',
    email: '',
    Senha: '',
    cargo: '',
    permissoes: [],
    roles: [],
    status: 'ativo'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    administradores: 0
  });

  // Opções de permissões disponíveis
  const permissoesDisponiveis = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'registros', label: 'Registros' },
    { key: 'relatorios', label: 'Relatórios' },
    { key: 'usuarios', label: 'Usuários' }
  ];

  // Carregar usuários da API
  const carregarUsuarios = useCallback(async (filtros = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userService.getAllUsers({
        ...filtros,
        search: searchTerm || undefined
      });
      
      if (response.success) {
        setUsuarios(response.data || []);
      } else {
        setError(response.message || 'Erro ao carregar usuários');
      }
    } catch (err) {
      setError('Erro inesperado ao carregar usuários');
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Carregar estatísticas
  const carregarEstatisticas = useCallback(async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  // Carregar roles disponíveis
  const carregarRoles = useCallback(async () => {
    try {
      const response = await userService.getRoles();
      if (response.success) {
        setAvailableRoles(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar roles:', err);
    }
  }, []);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    carregarUsuarios();
    carregarEstatisticas();
    carregarRoles();
  }, [carregarUsuarios, carregarEstatisticas, carregarRoles]);

  // Efeito para filtrar usuários quando o termo de busca muda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      carregarUsuarios();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, carregarUsuarios]);

  // Função para abrir modal de criação
  const handleNovoUsuario = () => {
    setUsuarioEditando(null);
    setFormData({
      nome: '',
      Usuario: '',
      email: '',
      Senha: '',
      cargo: '',
      permissoes: [],
      roles: [],
      status: 'ativo'
    });
    setModalAberto(true);
  };

  // Função para abrir modal de edição
  const handleEditarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      nome: usuario.nome || '',
      Usuario: usuario.Usuario || '',
      email: usuario.email || '',
      Senha: '', // Sempre limpar senha na edição
      cargo: usuario.cargo || '',
      permissoes: usuario.permissoes || [],
      roles: usuario.roles || [],
      status: usuario.status || 'ativo'
    });
    setModalAberto(true);
  };

  // Função para salvar usuário
  const handleSalvar = async () => {
    try {
      setFormLoading(true);
      
      // Validações básicas
      if (!formData.nome || !formData.Usuario || !formData.email) {
        setSnackbar({
          open: true,
          message: 'Preencha todos os campos obrigatórios',
          severity: 'error'
        });
        return;
      }

      // Para novos usuários, senha é obrigatória
      if (!usuarioEditando && !formData.Senha) {
        setSnackbar({
          open: true,
          message: 'Senha é obrigatória para novos usuários',
          severity: 'error'
        });
        return;
      }

      let response;
      if (usuarioEditando) {
        // Editar usuário existente
        const dadosAtualizacao = { ...formData };
        // Se não foi informada nova senha, remover do payload
        if (!formData.Senha) {
          delete dadosAtualizacao.Senha;
        }
        
        response = await userService.updateUser(usuarioEditando.id, dadosAtualizacao);
      } else {
        // Criar novo usuário
        response = await userService.createUser(formData);
      }
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || `Usuário ${usuarioEditando ? 'atualizado' : 'criado'} com sucesso!`,
          severity: 'success'
        });
        setModalAberto(false);
        carregarUsuarios(); // Recarregar lista
        carregarEstatisticas(); // Recarregar estatísticas
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Erro ao salvar usuário',
          severity: 'error'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro inesperado ao salvar usuário',
        severity: 'error'
      });
      console.error('Erro ao salvar usuário:', err);
    } finally {
      setFormLoading(false);
    }
  };

  // Função para excluir usuário
  const handleExcluir = (usuario) => {
    setUsuarioToDelete(usuario);
    setDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setUsuarioToDelete(null);
  };

  const confirmDelete = async () => {
    if (!usuarioToDelete) return;
    
    try {
      const response = await userService.deleteUser(usuarioToDelete.id);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || 'Usuário excluído com sucesso!',
          severity: 'success'
        });
        carregarUsuarios(); // Recarregar lista
        carregarEstatisticas(); // Recarregar estatísticas
        setDeleteDialogOpen(false);
        setUsuarioToDelete(null);
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Erro ao excluir usuário',
          severity: 'error'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro inesperado ao excluir usuário',
        severity: 'error'
      });
      console.error('Erro ao excluir usuário:', err);
    }
  };

  // Função para alternar status do usuário
  const handleToggleStatus = async (usuario) => {
    try {
      const response = await userService.toggleUserStatus(usuario.id);
      
      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || `Usuário ${usuario.status === 'ativo' ? 'desativado' : 'ativado'} com sucesso!`,
          severity: 'success'
        });
        carregarUsuarios(); // Recarregar lista
        carregarEstatisticas(); // Recarregar estatísticas
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Erro ao alterar status do usuário',
          severity: 'error'
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Erro inesperado ao alterar status',
        severity: 'error'
      });
      console.error('Erro ao alterar status:', err);
    }
  };

  // Função para alterar permissão
  const handlePermissaoChange = (permissao) => {
    setFormData(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissao)
        ? prev.permissoes.filter(p => p !== permissao)
        : [...prev.permissoes, permissao]
    }));
  };

  // Função para alterar roles
  const handleRolesChange = (event) => {
    setFormData(prev => ({
      ...prev,
      roles: event.target.value
    }));
  };

  // Função para recarregar dados
  const handleRefresh = () => {
    carregarUsuarios();
    carregarEstatisticas();
  };

  if (loading && usuarios.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gerenciamento de Usuários
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovoUsuario}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            Novo Usuário
          </Button>
        </Box>
      </Box>

      {/* Campo de busca */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar usuários por nome ou login..."
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
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Usuários"
            value={statistics.total}
            icon={<PersonIcon />}
            color="primary.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Usuários Ativos"
            value={statistics.ativos}
            icon={<VisibilityIcon />}
            color="success.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Usuários Inativos"
            value={statistics.inativos}
            icon={<VisibilityOffIcon />}
            color="error.main"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Administradores"
            value={statistics.administradores}
            icon={<AdminIcon />}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Mensagem de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabela de Usuários */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuário</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Último Acesso</TableCell>
                    <TableCell>Permissões</TableCell>
                    <TableCell>Perfis</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {usuario.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {usuario.Usuario}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {usuario.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {usuario.cargo || 'Não informado'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          color={usuario.status === 'ativo' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {usuario.ultimo_acesso 
                            ? new Date(usuario.ultimo_acesso).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {usuario.permissoes && usuario.permissoes.length > 0 ? (
                            usuario.permissoes.map((permissao) => (
                              <Chip
                                key={permissao}
                                label={permissoesDisponiveis.find(p => p.key === permissao)?.label || permissao}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Nenhuma
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {usuario.roles && usuario.roles.length > 0 ? (
                            usuario.roles.map((role) => (
                              <Chip
                                key={role}
                                label={role}
                                size="small"
                                color="secondary"
                                variant="filled"
                              />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Nenhum
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Editar">
                            <IconButton 
                              edge="end"
                              aria-label="editar"
                              onClick={() => handleEditarUsuario(usuario)}
                              color="primary"
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={usuario.status === 'ativo' ? 'Desativar' : 'Ativar'}>
                            <IconButton 
                              edge="end"
                              aria-label={usuario.status === 'ativo' ? 'desativar' : 'ativar'}
                              onClick={() => handleToggleStatus(usuario)}
                            >
                              {usuario.status === 'ativo' ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton 
                              edge="end"
                              aria-label="deletar"
                              color="error"
                              onClick={() => handleExcluir(usuario)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <Dialog 
        open={modalAberto} 
        onClose={() => setModalAberto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Login"
                value={formData.Usuario}
                onChange={(e) => setFormData(prev => ({ ...prev, Usuario: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="E-mail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={usuarioEditando ? "Nova Senha (deixe em branco para manter a atual)" : "Senha"}
                type="password"
                value={formData.Senha}
                onChange={(e) => setFormData(prev => ({ ...prev, Senha: e.target.value }))}
                required={!usuarioEditando}
                helperText={usuarioEditando ? "Deixe em branco para manter a senha atual" : "Senha obrigatória para novos usuários"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cargo"
                value={formData.cargo}
                onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status === 'ativo'}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      status: e.target.checked ? 'ativo' : 'inativo' 
                    }))}
                  />
                }
                label="Usuário Ativo"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Perfis (Roles)</InputLabel>
                <Select
                  multiple
                  value={formData.roles}
                  onChange={handleRolesChange}
                  renderValue={(selected) => selected.join(', ')}
                  label="Perfis (Roles)"
                >
                  {availableRoles.map((role) => (
                    <MenuItem key={role.name} value={role.name}>
                      <Checkbox checked={formData.roles.indexOf(role.name) > -1} />
                      <ListItemText primary={role.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Permissões de Acesso
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Selecione quais funcionalidades este usuário pode acessar:
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2}>
                {permissoesDisponiveis.map((permissao) => (
                  <Grid item xs={12} sm={6} md={4} key={permissao.key}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.permissoes.includes(permissao.key)}
                          onChange={() => handlePermissaoChange(permissao.key)}
                        />
                      }
                      label={permissao.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalAberto(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar} 
            variant="contained"
            disabled={formLoading || !formData.nome || !formData.Usuario || !formData.email || (!usuarioEditando && !formData.Senha)}
          >
            {formLoading ? <CircularProgress size={20} /> : (usuarioEditando ? 'Atualizar' : 'Criar')} Usuário
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
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
            Tem certeza que deseja deletar o usuário "{usuarioToDelete?.nome}"? 
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={cancelDelete} 
            variant="contained" 
            color="error"
          >
            NÃO
          </Button>
          <Button 
            onClick={confirmDelete} 
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
    </Box>
  );
};

export default UsuariosPage;