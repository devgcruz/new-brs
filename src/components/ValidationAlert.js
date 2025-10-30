import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Paper
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const ValidationAlert = ({
  errors = {},
  title = 'Erros de Validação',
  severity = 'error',
  show = false,
  sx = {}
}) => {
  if (!show || Object.keys(errors).length === 0) {
    return null;
  }

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      case 'error':
      default:
        return <ErrorIcon />;
    }
  };

  const getAlertStyles = () => {
    const baseStyles = {
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid',
      ...sx
    };

    switch (severity) {
      case 'warning':
        return {
          ...baseStyles,
          borderColor: 'warning.main',
          backgroundColor: 'warning.light',
          color: 'warning.dark'
        };
      case 'info':
        return {
          ...baseStyles,
          borderColor: 'info.main',
          backgroundColor: 'info.light',
          color: 'info.dark'
        };
      case 'error':
      default:
        return {
          ...baseStyles,
          borderColor: 'error.main',
          backgroundColor: 'error.light',
          color: 'error.dark'
        };
    }
  };

  // Flatten all error messages
  const allErrors = Object.values(errors).flat().filter(Boolean);

  return (
    <Fade in={show} timeout={300}>
      <Alert 
        severity={severity}
        sx={getAlertStyles()}
        icon={getIcon()}
      >
        <AlertTitle sx={{ fontWeight: 600, mb: 1 }}>
          {title}
        </AlertTitle>
        
        {allErrors.length === 1 ? (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {allErrors[0]}
          </Typography>
        ) : (
          <List dense sx={{ py: 0 }}>
            {allErrors.map((error, index) => (
              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    •
                  </Typography>
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {error}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Alert>
    </Fade>
  );
};

export default ValidationAlert;

