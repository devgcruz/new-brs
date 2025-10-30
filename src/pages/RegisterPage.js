import React, { useState } from 'react';
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
  Alert,
  CircularProgress,
  Link,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import authService from '../services/authService';
import ImageCropModal from '../components/ImageCropModal';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    senha_confirmation: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (croppedImageFile) => {
    // Funcionalidade temporariamente desabilitada
    setMessage({ 
      type: 'info', 
      text: 'Funcionalidade de upload de foto está em construção. Em breve estará disponível!' 
    });
    setShowImageCrop(false);
    return;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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

      if (!formData.senha.trim()) {
        setMessage({ type: 'error', text: 'Senha é obrigatória' });
        return;
      }

      if (formData.senha !== formData.senha_confirmation) {
        setMessage({ type: 'error', text: 'Senhas não coincidem' });
        return;
      }

      if (formData.senha.length < 8) {
        setMessage({ type: 'error', text: 'Senha deve ter pelo menos 8 caracteres' });
        return;
      }

      // Preparar dados para registro
      const registerData = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        senha: formData.senha.trim(),
        senha_confirmation: formData.senha_confirmation.trim()
      };

      // Se há foto, fazer upload via FormData
      if (profilePhoto) {
        const formData = new FormData();
        Object.keys(registerData).forEach(key => {
          formData.append(key, registerData[key]);
        });
        formData.append('profile_photo', profilePhoto);

        const response = await fetch(`${process.env.REACT_APP_API_URL}/register`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          setMessage({ 
            type: 'success', 
            text: 'Usuário cadastrado com sucesso! Redirecionando para login...' 
          });
          
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          throw new Error(data.message || 'Erro ao cadastrar usuário');
        }
      } else {
        // Fazer registro sem foto
        const response = await authService.register(registerData);
        
        if (response.success) {
          setMessage({ 
            type: 'success', 
            text: 'Usuário cadastrado com sucesso! Redirecionando para login...' 
          });
          
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          throw new Error(response.message || 'Erro ao cadastrar usuário');
        }
      }

    } catch (error) {
      console.error('Erro no registro:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Erro ao cadastrar usuário' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Grid container justifyContent="center" maxWidth="md">
        <Grid item xs={12} md={8} lg={6}>
          <Card elevation={10}>
            <CardHeader
              avatar={
                <Box position="relative">
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      width: 56, 
                      height: 56,
                      fontSize: '1.5rem'
                    }}
                    src={profilePhoto ? URL.createObjectURL(profilePhoto) : null}
                  >
                    {!profilePhoto && <PersonAddIcon fontSize="large" />}
                  </Avatar>
                  <Tooltip title="Adicionar foto de perfil">
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                        width: 24,
                        height: 24
                      }}
                      onClick={() => setShowImageCrop(true)}
                    >
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              title={
                <Typography variant="h4" component="h1" textAlign="center">
                  Cadastro
                </Typography>
              }
              subheader={
                <Typography variant="body1" textAlign="center" color="text.secondary">
                  Crie sua conta para acessar o sistema
                </Typography>
              }
            />
            
            <CardContent sx={{ p: 4 }}>
              {message.text && (
                <Alert 
                  severity={message.type} 
                  sx={{ mb: 3 }}
                  onClose={() => setMessage({ type: '', text: '' })}
                >
                  {message.text}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nome Completo"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
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
                      required
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Senha"
                      name="senha"
                      type="password"
                      value={formData.senha}
                      onChange={handleInputChange}
                      variant="outlined"
                      required
                      helperText="Mínimo de 8 caracteres"
                      InputProps={{
                        startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirmar Senha"
                      name="senha_confirmation"
                      type="password"
                      value={formData.senha_confirmation}
                      onChange={handleInputChange}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ 
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Cadastrar'
                      )}
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Já tem uma conta?{' '}
                        <Link 
                          component={RouterLink} 
                          to="/login"
                          sx={{ 
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          Faça login
                        </Link>
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal de edição de foto */}
      <ImageCropModal
        open={showImageCrop}
        onClose={() => setShowImageCrop(false)}
        onSave={handlePhotoUpload}
        title="Adicionar Foto de Perfil"
      />
    </Box>
  );
};

export default RegisterPage;