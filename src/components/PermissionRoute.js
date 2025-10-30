import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { Security as SecurityIcon, Block as BlockIcon } from '@mui/icons-material';
import useAuthStore from '../store/authStore';

const PermissionRoute = ({ children, permission, fallback = null }) => {
  const { isAuthenticated, user, hasPermission, loading } = useAuthStore();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Verificar se usuário está logado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se usuário tem a permissão necessária
  if (!hasPermission(permission)) {
    // Se foi fornecido um fallback, renderizar ele
    if (fallback) {
      return fallback;
    }

    // Caso contrário, mostrar página de acesso negado
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Card sx={{ maxWidth: 500, textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <SecurityIcon sx={{ fontSize: 64, color: 'error.main' }} />
            </Box>
            <Typography variant="h4" gutterBottom color="error">
              Acesso Negado
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Você não tem permissão para acessar esta funcionalidade.
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Entre em contato com o administrador do sistema para solicitar acesso.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Se tem permissão, renderizar o conteúdo
  return children;
};

export default PermissionRoute;
