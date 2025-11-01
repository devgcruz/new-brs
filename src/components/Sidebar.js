import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Assessment as RelatoriosIcon,
  People as UsuariosIcon,
  PersonAdd as ColaboradorIcon,
  Work as WorkIcon,
  DirectionsCar as CarIcon,
  Security as SecurityIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  TrendingUp as FinanceiroIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';

const drawerWidth = 240;

// Itens principais do menu
const mainMenuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    permission: 'dashboard'
  },
  {
    text: 'Registros de Entrada',
    icon: <AssignmentIcon />,
    path: '/dashboard/registrodeentrada',
    permission: 'registros'
  },
];

// Sub-itens da seção "Relatórios"
const relatoriosSubItems = [
  {
    text: 'Financeiro',
    icon: <FinanceiroIcon />,
    path: '/dashboard/relatorios/financeiro',
    permission: 'relatorios'
  },
  {
    text: 'Financeiro Agrupado',
    icon: <BarChartIcon />,
    path: '/dashboard/relatorios/financeiro-agrupado',
    permission: 'acessar-relatorios'
  },
  {
    text: 'Entradas',
    icon: <AssignmentIcon />,
    path: '/dashboard/relatorios/entradas',
    permission: 'relatorios'
  }
];

// Sub-itens da seção "Gerenciar"
const gerenciarSubItems = [
  {
    text: 'Usuários',
    icon: <UsuariosIcon />,
    path: '/dashboard/usuarios',
    permission: 'gerenciar-usuarios'
  },
  {
    text: 'Colaboradores',
    icon: <ColaboradorIcon />,
    path: '/colaboradores',
    permission: 'usuarios' // Usando 'usuarios' pois 'colaboradores' não está nas permissões validadas
  },
  {
    text: 'Posições',
    icon: <WorkIcon />,
    path: '/posicoes',
    permission: 'usuarios' // Usando 'usuarios' pois 'posicoes' não está nas permissões validadas
  },
  {
    text: 'Marcas',
    icon: <CarIcon />,
    path: '/marcas',
    permission: 'usuarios' // Usando 'usuarios' pois 'marcas' não está nas permissões validadas
  },
  {
    text: 'Seguradoras',
    icon: <SecurityIcon />,
    path: '/seguradoras',
    permission: 'usuarios' // Usando 'usuarios' pois 'seguradoras' não está nas permissões validadas
  }
];

const Sidebar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuthStore();
  
  // Funções auxiliares para verificar rotas
  const isGerenciarPath = (path) => {
    return gerenciarSubItems.some(item => item.path === path);
  };

  const isRelatoriosPath = (path) => {
    return relatoriosSubItems.some(item => item.path === path);
  };
  
  // Expandir automaticamente se estiver em uma rota de gerenciar
  const [gerenciarExpanded, setGerenciarExpanded] = useState(
    () => isGerenciarPath(location.pathname)
  );
  // Expandir automaticamente se estiver em uma rota de relatórios
  const [relatoriosExpanded, setRelatoriosExpanded] = useState(
    () => isRelatoriosPath(location.pathname)
  );

  const handleNavigation = (path) => {
    navigate(path);
    // Sempre fechar a sidebar após navegação
    if (onClose) {
      onClose();
    }
  };

  const handleGerenciarToggle = () => {
    setGerenciarExpanded(!gerenciarExpanded);
  };

  const handleRelatoriosToggle = () => {
    setRelatoriosExpanded(!relatoriosExpanded);
  };
  
  // Atualizar estado expandido quando a rota mudar
  useEffect(() => {
    setGerenciarExpanded(isGerenciarPath(location.pathname));
    setRelatoriosExpanded(isRelatoriosPath(location.pathname));
  }, [location.pathname]);

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
        hideBackdrop: true,
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableRestoreFocus: true,
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        zIndex: 1200,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          position: 'fixed',
          top: '64px',
          left: 0,
          height: 'calc(100vh - 64px)',
          zIndex: 1200,
          border: 'none',
          transition: 'transform 0.3s ease-in-out',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          filter: 'none',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="primary" fontWeight="bold">
          Sistema BRS
        </Typography>
        {user && (
          <Typography variant="body2" color="text.secondary">
            Bem-vindo, {user.name}
          </Typography>
        )}
      </Box>
      
      <Divider />
      
      <List>
        {/* Itens principais do menu */}
        {mainMenuItems.map((item) => (
          hasPermission(item.permission) && (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'transparent',
                    color: 'black',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'black',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        ))}

        {/* Seção Relatórios */}
        {hasPermission('relatorios') && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={handleRelatoriosToggle}>
                <ListItemIcon>
                  <RelatoriosIcon />
                </ListItemIcon>
                <ListItemText primary="Relatórios" />
                {relatoriosExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={relatoriosExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {relatoriosSubItems.map((item) => (
                  hasPermission(item.permission) && (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        selected={location.pathname === item.path}
                        onClick={() => handleNavigation(item.path)}
                        sx={{
                          pl: 4, // Indentação para sub-itens
                          '&.Mui-selected': {
                            backgroundColor: 'transparent',
                            color: 'black',
                            fontWeight: 'bold',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                            '& .MuiListItemIcon-root': {
                              color: 'black',
                            },
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                    </ListItem>
                  )
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Seção Gerenciar - Mostrar se usuário tem permissão para pelo menos um item */}
        {(hasPermission('gerenciar-usuarios') || hasPermission('usuarios')) && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={handleGerenciarToggle}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Gerenciar" />
                {gerenciarExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </ListItemButton>
            </ListItem>
            
            <Collapse in={gerenciarExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {gerenciarSubItems.map((item) => (
                  hasPermission(item.permission) && (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        selected={location.pathname === item.path}
                        onClick={() => handleNavigation(item.path)}
                        sx={{
                          pl: 4, // Indentação para sub-itens
                          '&.Mui-selected': {
                            backgroundColor: 'transparent',
                            color: 'black',
                            fontWeight: 'bold',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                            '& .MuiListItemIcon-root': {
                              color: 'black',
                            },
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                    </ListItem>
                  )
                ))}
              </List>
            </Collapse>
          </>
        )}
      </List>
      
    </Drawer>
  );
};

export default Sidebar;

