import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';
import userService from '../services/userService';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    currentPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        currentPassword: ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Validações básicas
      if (!formData.nome.trim()) {
        setMessage({ type: 'error', text: 'Nome é obrigatório' });
        setSaving(false);
        return;
      }

      if (!formData.email.trim()) {
        setMessage({ type: 'error', text: 'Email é obrigatório' });
        setSaving(false);
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setMessage({ type: 'error', text: 'Email inválido' });
        setSaving(false);
        return;
      }

      // Validações de senha
      if (formData.password && formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Senhas não coincidem' });
        setSaving(false);
        return;
      }

      if (formData.password && formData.password.length < 8) {
        setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 8 caracteres' });
        setSaving(false);
        return;
      }

      if (formData.password && !formData.currentPassword) {
        setMessage({ type: 'error', text: 'Senha atual é obrigatória para alterar a senha' });
        setSaving(false);
        return;
      }

      // Verificar se nome ou email foram alterados
      const nomeMudou = formData.nome.trim() !== (user.nome || '');
      const emailMudou = formData.email.trim() !== (user.email || '');
      
      // Preparar dados para envio apenas se nome ou email mudaram
      if (nomeMudou || emailMudou) {
        const updateData = {
          nome: formData.nome.trim(),
          email: formData.email.trim()
        };

        // Atualizar perfil básico apenas se houver mudanças
        try {
          const updatedUser = await userService.updateProfile(updateData);
          
          // Atualizar store com os dados atualizados
          if (updatedUser) {
            // Preservar dados adicionais que podem não vir do backend
            const mergedUser = {
              ...user,
              ...updatedUser
            };
            updateUser(mergedUser);
            
            // Atualizar também os campos do formulário para refletir mudanças
            setFormData(prev => ({
              ...prev,
              nome: updatedUser.nome || prev.nome,
              email: updatedUser.email || prev.email
            }));
          }
        } catch (profileError) {
          console.error('Erro ao atualizar perfil:', profileError);
          const errorMessage = profileError.message || profileError.response?.data?.message || 'Erro ao atualizar perfil. Verifique se o email não está em uso.';
          setMessage({ 
            type: 'error', 
            text: errorMessage
          });
          setSaving(false);
          return;
        }
      }
      
      // Se senha foi fornecida, alterar senha separadamente (independente de atualização de perfil)
      if (formData.password && formData.password.trim()) {
        try {
          await userService.changeMyPassword({
            current_password: formData.currentPassword || '',
            new_password: formData.password.trim(),
            new_password_confirmation: formData.confirmPassword.trim()
          });
        } catch (passwordError) {
          console.error('Erro ao alterar senha:', passwordError);
          setMessage({ 
            type: 'warning', 
            text: passwordError.message || 'Perfil atualizado, mas houve erro ao alterar senha. Verifique se a senha atual está correta.' 
          });
          // Limpar campos de senha mesmo em caso de erro
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: '',
            currentPassword: ''
          }));
          setSaving(false);
          return;
        }
      }
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
      // Limpar campos de senha
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
        currentPassword: ''
      }));

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || error.response?.data?.message || 'Erro ao atualizar perfil' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Erro ao carregar dados do usuário
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Meu Perfil
      </Typography>
      
      <Grid container spacing={3}>
        {/* Card de Informações */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main',
                    width: 80,
                    height: 80,
                    fontSize: '2rem'
                  }}
                >
                  <PersonIcon fontSize="large" />
                </Avatar>
              }
              title="Informações do Usuário"
              subheader="Dados pessoais"
            />
            <CardContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="action" />
                  <Typography variant="body2">
                    <strong>Nome:</strong> {user.nome || user.name || '-'}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon color="action" />
                  <Typography variant="body2">
                    <strong>Email:</strong> {user.email || '-'}
                  </Typography>
                </Box>
                {user.nivel && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LockIcon color="action" />
                    <Typography variant="body2">
                      <strong>Nível:</strong> {user.nivel}
                    </Typography>
                  </Box>
                )}
                {user.cargo && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LockIcon color="action" />
                    <Typography variant="body2">
                      <strong>Cargo:</strong> {user.cargo}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Formulário de Edição */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Editar Perfil
            </Typography>
            
            {message.text && (
              <Alert 
                severity={message.type} 
                sx={{ mb: 2 }}
                onClose={() => setMessage({ type: '', text: '' })}
              >
                {message.text}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Alterar Senha (opcional)
                  </Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Senha Atual"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  variant="outlined"
                  helperText="Necessário apenas se desejar alterar a senha"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nova Senha"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Nova Senha"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" gap={2} mt={2}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setFormData({
                        nome: user.nome || '',
                        email: user.email || '',
                        password: '',
                        confirmPassword: '',
                        currentPassword: ''
                      });
                      setMessage({ type: '', text: '' });
                    }}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

    </Box>
  );
};

export default ProfilePage;