import React from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import {
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';

const PaginationControls = ({
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  loading = false,
  disabled = false
}) => {
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= lastPage && !loading && !disabled) {
      onPageChange(newPage);
    }
  };

  const handlePerPageChange = (event) => {
    if (!loading && !disabled) {
      onPerPageChange(parseInt(event.target.value));
    }
  };

  const getPageInfo = () => {
    if (total === 0) return 'Nenhum registro encontrado';
    
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, total);
    
    return `Mostrando ${start}-${end} de ${total} registros`;
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(lastPage, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (lastPage <= 1) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {getPageInfo()}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      py: 2,
      flexWrap: 'wrap',
      gap: 2
    }}>
      {/* Informações da página */}
      <Typography variant="body2" color="text.secondary">
        {getPageInfo()}
      </Typography>

      {/* Controles de paginação */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Botão primeira página */}
        <IconButton
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || loading || disabled}
          size="small"
        >
          <FirstPage />
        </IconButton>

        {/* Botão página anterior */}
        <IconButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading || disabled}
          size="small"
        >
          <NavigateBefore />
        </IconButton>

        {/* Números das páginas */}
        {getPageNumbers().map(page => (
          <Button
            key={page}
            onClick={() => handlePageChange(page)}
            disabled={loading || disabled}
            variant={page === currentPage ? 'contained' : 'outlined'}
            size="small"
            sx={{ minWidth: 40 }}
          >
            {page}
          </Button>
        ))}

        {/* Botão próxima página */}
        <IconButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === lastPage || loading || disabled}
          size="small"
        >
          <NavigateNext />
        </IconButton>

        {/* Botão última página */}
        <IconButton
          onClick={() => handlePageChange(lastPage)}
          disabled={currentPage === lastPage || loading || disabled}
          size="small"
        >
          <LastPage />
        </IconButton>
      </Box>

      {/* Seletor de registros por página */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Por página</InputLabel>
        <Select
          value={perPage}
          onChange={handlePerPageChange}
          disabled={loading || disabled}
          label="Por página"
        >
          <MenuItem value={10}>10</MenuItem>
          <MenuItem value={15}>15</MenuItem>
          <MenuItem value={25}>25</MenuItem>
          <MenuItem value={50}>50</MenuItem>
        </Select>
      </FormControl>

      {/* Loading indicator */}
      {loading && (
        <CircularProgress size={20} />
      )}
    </Box>
  );
};

export default PaginationControls;
