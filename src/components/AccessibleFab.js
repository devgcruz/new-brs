import React from 'react';
import { Fab, Tooltip } from '@mui/material';

const AccessibleFab = ({ 
  color = "primary", 
  ariaLabel, 
  onClick, 
  children, 
  tooltip,
  sx = {},
  ...props 
}) => {
  const fab = (
    <Fab
      color={color}
      aria-label={ariaLabel}
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 1400, // Maior que o drawer (1200)
        ...sx,
      }}
      {...props}
    >
      {children}
    </Fab>
  );

  // Se houver tooltip, envolve o FAB
  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement="left">
        {fab}
      </Tooltip>
    );
  }

  return fab;
};

export default AccessibleFab;
