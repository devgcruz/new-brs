import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  CircularProgress
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';
import ProfileDropdown from './ProfileDropdown';
import useAuthStore from '../store/authStore';

const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Removido o useEffect que forçava a sidebar a abrir no desktop
  // useEffect(() => {
  //   setSidebarOpen(!isMobile);
  // }, [isMobile]);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <AppBar
        position="fixed"
        sx={{
          width: '100%',
          zIndex: 1300,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Sistema BRS - Dashboard
          </Typography>
          <ProfileDropdown />
        </Toolbar>
      </AppBar>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <Box
        component="main"
        role="main"
        className={`main-content ${sidebarOpen && !isMobile ? 'main-content-with-sidebar' : ''}`}
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#f5f5f5',
          overflow: 'visible',
          transition: 'margin-left 0.3s ease-in-out',
          marginLeft: sidebarOpen && !isMobile ? '240px' : '0px',
          zIndex: 1,
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;

