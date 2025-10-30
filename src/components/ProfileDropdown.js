import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  AccountCircle,
  Settings,
  Logout,
  ExpandMore
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
    navigate('/login');
  };

  const getProfilePhotoUrl = () => {
    if (user?.profile_photo_url) {
      return user.profile_photo_url;
    }
    return null;
  };

  const getInitials = () => {
    if (user?.nome) {
      return user.nome
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          },
          ml: 2
        }}
        aria-controls={open ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          sx={{ width: 32, height: 32 }}
          src={getProfilePhotoUrl()}
        >
          {getInitials()}
        </Avatar>
        
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white',
              fontSize: '0.75rem',
              lineHeight: 1.2,
              textAlign: 'right'
            }}
          >
            Bem-vindo,
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white',
              fontSize: '0.75rem',
              lineHeight: 1.2,
              textAlign: 'right',
              fontWeight: 'bold'
            }}
          >
            {user?.nome || 'Usuário'}
          </Typography>
        </Box>
        
        <ExpandMore 
          sx={{ 
            color: 'white', 
            fontSize: '20px',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out'
          }} 
        />
      </Box>
      
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.nome || 'Usuário'}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user?.email || 'email@exemplo.com'}
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={handleProfile}>
          <AccountCircle sx={{ mr: 1 }} />
          Meu Perfil
        </MenuItem>
        
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Sair
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileDropdown;



