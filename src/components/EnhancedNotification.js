import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Slide,
  IconButton,
  Typography,
  Box,
  Fade
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Transição personalizada para entrada mais suave
function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const EnhancedNotification = ({
  open,
  onClose,
  message,
  severity = 'info',
  duration = 6000,
  position = { vertical: 'top', horizontal: 'center' },
  showIcon = true,
  variant = 'filled',
  elevation = 6,
  maxWidth = 400
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    }
  }, [open]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Delay para permitir animação de saída
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    const iconProps = { sx: { fontSize: 20, mr: 1 } };
    
    switch (severity) {
      case 'success':
        return <CheckCircleIcon {...iconProps} />;
      case 'error':
        return <ErrorIcon {...iconProps} />;
      case 'warning':
        return <WarningIcon {...iconProps} />;
      case 'info':
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  const getAlertStyles = () => {
    const baseStyles = {
      width: '100%',
      maxWidth: maxWidth,
      borderRadius: 2,
      boxShadow: `0 4px 20px rgba(0, 0, 0, 0.15)`,
      '& .MuiAlert-message': {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.95rem',
        fontWeight: 500,
        lineHeight: 1.4
      }
    };

    // Estilos específicos por severidade
    switch (severity) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#4caf50',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white'
          }
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#f44336',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white'
          }
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#ff9800',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white'
          }
        };
      case 'info':
      default:
        return {
          ...baseStyles,
          backgroundColor: '#2196f3',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white'
          }
        };
    }
  };

  if (!open) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      className="enhanced-notification"
      sx={{
        zIndex: 1400, // Maior que o header (1300) mas menor que modais
        top: '80px !important', // Posicionar abaixo do header (64px + margem)
        '& .MuiSnackbarContent-root': {
          padding: 0
        }
      }}
    >
      <Fade in={isVisible} timeout={300}>
        <Box>
          <Alert
            severity={severity}
            variant={variant}
            onClose={handleClose}
            icon={getIcon()}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
                sx={{ 
                  opacity: 0.8,
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={getAlertStyles()}
          >
            <Typography component="div" sx={{ fontWeight: 500 }}>
              {message}
            </Typography>
          </Alert>
        </Box>
      </Fade>
    </Snackbar>
  );
};

export default EnhancedNotification;
