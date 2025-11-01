import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Button, Grid, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Download as DownloadIcon } from '@mui/icons-material';
import relatoriosFinanceirosService from '../services/relatoriosFinanceirosService';
import { exportToExcel } from '../utils/excelExporter';
import useNotification from '../hooks/useNotification';

// Definição das colunas que correspondem à query SQL e ao pedido do utilizador
const columns = [
  { field: 'Protocolo', headerName: 'Protocolo', width: 130 },
  { field: 'Data_Entrada', headerName: 'Data Registro Entrada', width: 150 },
  { field: 'VEICULO', headerName: 'Veículo', width: 200 },
  { field: 'PLACA', headerName: 'Placa', width: 100 },
  { field: 'CHASSI', headerName: 'Chassi', width: 170 },
  { field: 'N_Sinistro', headerName: 'Sinistro', width: 150 },
  { field: 'SEGURADORA', headerName: 'Seguradora', width: 150 },
  
  { 
    field: 'Datas_Inclusao_Despesas', 
    headerName: 'Data Inclusao Despesa', 
    width: 180, 
    renderCell: (params) => (
      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
        {params.value || '-'}
      </div>
    )
  },
  { 
    field: 'Total_Despesas', 
    headerName: 'Despesas', 
    width: 150, 
    type: 'number',
    valueFormatter: ({ value }) => value ? `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}` : 'R$ 0,00'
  },
  { 
    field: 'Datas_Pagto_Despesas', 
    headerName: 'Data Pagto Despesas', 
    width: 180, 
    renderCell: (params) => (
      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
        {params.value || '-'}
      </div>
    )
  },

  { 
    field: 'Datas_Inclusao_NF', 
    headerName: 'Data Inclusao Nota Fiscal', 
    width: 180, 
    renderCell: (params) => (
      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
        {params.value || '-'}
      </div>
    )
  },
  { 
    field: 'Notas_Fiscais', 
    headerName: 'Nota Fiscal', 
    width: 180, 
    renderCell: (params) => (
      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
        {params.value || '-'}
      </div>
    )
  },
  { 
    field: 'Total_Honorarios', 
    headerName: 'Honorários', 
    width: 160, 
    type: 'number',
    valueFormatter: ({ value }) => value ? `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}` : 'R$ 0,00'
  },
  { 
    field: 'Datas_Pagto_Honorarios', 
    headerName: 'Data Pagto Honorários', 
    width: 190, 
    renderCell: (params) => (
      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
        {params.value || '-'}
      </div>
    )
  },

  { 
    field: 'Status_Pagamentos', 
    headerName: 'Status', 
    width: 180, 
    renderCell: (params) => (
      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
        {params.value || '-'}
      </div>
    )
  },
];

const RelatorioFinanceiroAgrupadoPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useNotification();
  
  const [dataInicio, setDataInicio] = useState('2020-01-01');
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);

  const fetchRelatorio = useCallback(async () => {
    setLoading(true);
    try {
      const response = await relatoriosFinanceirosService.getRelatorioAgrupado({
        data_inicio: dataInicio,
        data_fim: dataFim,
      });
      if (response.success) {
        // DataGrid precisa de um 'id' único em cada linha
        const dataWithId = response.data.map((row) => ({
          ...row,
          id: row.ID_Entrada, 
        }));
        setRows(dataWithId);
        if (dataWithId.length === 0) {
          showInfo('Nenhum dado encontrado para os filtros aplicados');
        } else {
          showSuccess(`Relatório carregado: ${dataWithId.length} registro(s)`);
        }
      } else {
        showError(response.message || 'Erro ao buscar relatório');
      }
    } catch (err) {
      showError(err.message || 'Erro ao buscar relatório');
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, showSuccess, showError, showInfo]);

  useEffect(() => {
    fetchRelatorio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Carrega na montagem inicial

  const handleFiltrar = () => {
    fetchRelatorio();
  };

  const handleExport = () => {
    if (rows.length === 0) {
      showWarning('Não há dados para exportar');
      return;
    }
    
    try {
      // Preparar dados para exportação (remover campos técnicos e formatar valores)
      const dadosExportacao = rows.map(row => {
        const exportRow = { ...row };
        delete exportRow.id; // Remover ID técnico do DataGrid
        
        // Formatar valores monetários
        if (exportRow.Total_Despesas) {
          exportRow.Total_Despesas = parseFloat(exportRow.Total_Despesas).toFixed(2);
        }
        if (exportRow.Total_Honorarios) {
          exportRow.Total_Honorarios = parseFloat(exportRow.Total_Honorarios).toFixed(2);
        }
        
        return exportRow;
      });
      
      // Utiliza o exportador de Excel existente
      const result = exportToExcel(dadosExportacao, 'Relatorio_Financeiro_Agrupado');
      if (result.success) {
        showSuccess('Relatório exportado com sucesso!');
      } else {
        showError(result.message || 'Erro ao exportar relatório');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      showError('Erro ao exportar relatório');
    }
  };

  return (
    <Paper sx={{ p: 3, height: '85vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom>
        Relatório Financeiro Agrupado por Registro
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Data Início"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Data Fim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button variant="contained" onClick={handleFiltrar} disabled={loading} fullWidth>
            Filtrar
          </Button>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading || rows.length === 0}
            fullWidth
          >
            Exportar para Excel
          </Button>
        </Grid>
      </Grid>
      
      <Box sx={{ flexGrow: 1, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          density="compact"
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default RelatorioFinanceiroAgrupadoPage;

