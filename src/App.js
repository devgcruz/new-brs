import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import useAuthStore from './store/authStore';
import useAppDataStore from './store/appDataStore';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import RegistrosPage from './pages/RegistrosPage';
import EditorPage from './pages/EditorPage';
import JudicialPage from './pages/JudicialPage';
import PrestadoresPage from './pages/PrestadoresPage';
import RelatoriosPage from './pages/RelatoriosPage';
import RelatoriosFinanceiroPage from './pages/RelatoriosFinanceiroPage';
import RelatorioEntradaPage from './pages/RelatorioEntradaPage';
import RelatorioFinanceiroAgrupadoPage from './pages/RelatorioFinanceiroAgrupadoPage';
import UsuariosPage from './pages/UsuariosPage';
import ColaboradoresPage from './pages/ColaboradoresPage';
import PosicoesPage from './pages/PosicoesPage';
import MarcasPage from './pages/MarcasPage';
import SeguradorasPage from './pages/SeguradorasPage';

// Components
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute from './components/PermissionRoute';

// Utils
import './utils/cacheUtils'; // Carrega utilitários de cache globalmente

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          overflowX: 'hidden',
        },
        '#root': {
          margin: 0,
          padding: 0,
        },
      },
    },
  },
});

function App() {
  const { init, loading, isAuthenticated, initialized, isInitializing } = useAuthStore();
  const { loadDropdownData } = useAppDataStore();

  useEffect(() => {
    // Inicializar autenticação apenas uma vez
    if (!initialized && !isInitializing) {
      init();
    }
  }, [initialized, isInitializing, init]);

  useEffect(() => {
    // Inicializar dados dos dropdowns quando autenticado
    if (isAuthenticated) {
      loadDropdownData();
    }
  }, [isAuthenticated, loadDropdownData]);

  // Mostrar loading enquanto inicializa
  if (loading && !initialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rotas Protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/registrodeentrada" element={
            <ProtectedRoute>
              <DashboardLayout>
                <RegistrosPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/novo" element={
            <ProtectedRoute>
              <DashboardLayout>
                <EditorPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/edit/:id" element={
            <ProtectedRoute>
              <DashboardLayout>
                <EditorPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          
          <Route path="/dashboard/judicial" element={
            <ProtectedRoute>
              <DashboardLayout>
                <JudicialPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/prestadores" element={
            <ProtectedRoute>
              <DashboardLayout>
                <PrestadoresPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/relatorios" element={
            <ProtectedRoute>
              <DashboardLayout>
                <RelatoriosPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/relatorios/financeiro" element={
            <ProtectedRoute>
              <DashboardLayout>
                <RelatoriosFinanceiroPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/relatorios/entradas" element={
            <ProtectedRoute>
              <DashboardLayout>
                <RelatorioEntradaPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/relatorios/financeiro-agrupado" element={
            <ProtectedRoute>
              <DashboardLayout>
                <PermissionRoute permission="acessar-relatorios">
                  <RelatorioFinanceiroAgrupadoPage />
                </PermissionRoute>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/usuarios" element={
            <ProtectedRoute>
              <DashboardLayout>
                <PermissionRoute permission="gerenciar-usuarios">
                  <UsuariosPage />
                </PermissionRoute>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/colaboradores" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ColaboradoresPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/posicoes" element={
            <ProtectedRoute>
              <DashboardLayout>
                <PosicoesPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/marcas" element={
            <ProtectedRoute>
              <DashboardLayout>
                <MarcasPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/seguradoras" element={
            <ProtectedRoute>
              <DashboardLayout>
                <SeguradorasPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* Rota padrão */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Rota 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;

