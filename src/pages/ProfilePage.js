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
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';
import userService from '../services/userService';
import ImageCropModal from '../components/ImageCropModal';

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showImageCrop, setShowImageCrop] = useState(false);
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

  const handlePhotoUpload = async (croppedImageFile) => {
    // Funcionalidade temporariamente desabilitada
    setMessage({ 
      type: 'info', 
      text: 'Funcionalidade de upload de foto está em construção. Em breve estará disponível!' 
    });
    setShowImageCrop(false);
    return;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Validações básicas
      if (!formData.nome.trim()) {
        setMessage({ type: 'error', text: 'Nome é obrigatório' });
        return;
      }

      if (!formData.email.trim()) {
        setMessage({ type: 'error', text: 'Email é obrigatório' });
        return;
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Senhas não coincidem' });
        return;
      }

      if (formData.password && !formData.currentPassword) {
        setMessage({ type: 'error', text: 'Senha atual é obrigatória para alterar a senha' });
        return;
      }

      // Preparar dados para envio
      const updateData = {
        nome: formData.nome.trim(),
        email: formData.email.trim()
      };

      // Atualizar perfil básico
      const updatedUser = await userService.updateProfile(updateData);
      
      // Atualizar store
      updateUser(updatedUser);
      
      // Se senha foi fornecida, alterar senha separadamente
      if (formData.password.trim()) {
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
            text: 'Perfil atualizado, mas houve erro ao alterar senha. Verifique se a senha atual está correta.' 
          });
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
        text: error.response?.data?.message || 'Erro ao atualizar perfil' 
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
                <Box position="relative">
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main',
                      width: 80,
                      height: 80,
                      fontSize: '2rem'
                    }}
                    src={user.profile_photo_url}
                  >
                    {!user.profile_photo_url && <PersonIcon fontSize="large" />}
                  </Avatar>
                  <Tooltip title="Alterar foto de perfil">
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                        width: 28,
                        height: 28
                      }}
                      onClick={() => setShowImageCrop(true)}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <PhotoCameraIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              title="Informações do Usuário"
              subheader="Dados pessoais"
            />
            <CardContent>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="action" />
                  <Typography variant="body2">
                    <strong>Nome:</strong> {user.nome}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon color="action" />
                  <Typography variant="body2">
                    <strong>Email:</strong> {user.email}
                  </Typography>
                </Box>
                {user.perfil && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LockIcon color="action" />
                    <Typography variant="body2">
                      <strong>Perfil:</strong> {user.perfil}
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

      {/* Modal de edição de foto */}
      <ImageCropModal
        open={showImageCrop}
        onClose={() => setShowImageCrop(false)}
        onSave={handlePhotoUpload}
        title="Editar Foto de Perfil"
      />
    </Box>
  );
};

export default ProfilePage;