import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const RelatoriosPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Dados mocados para relatório de Entrada
  const entradaRows = [
    { id: 1, entrada: '2024-01-15', placa: 'ABC-1234', veiculo: 'Toyota Corolla', seguradora: 'Porto Seguro', situacao: 'Em análise', valor: 15000 },
    { id: 2, entrada: '2024-01-16', placa: 'DEF-5678', veiculo: 'Honda Civic', seguradora: 'Bradesco', situacao: 'Em reparo', valor: 12000 },
    { id: 3, entrada: '2024-01-17', placa: 'GHI-9012', veiculo: 'Volkswagen Golf', seguradora: 'SulAmérica', situacao: 'Finalizado', valor: 18000 },
    { id: 4, entrada: '2024-01-18', placa: 'JKL-3456', veiculo: 'Ford Focus', seguradora: 'Itaú', situacao: 'Aguardando peças', valor: 9500 },
    { id: 5, entrada: '2024-01-19', placa: 'MNO-7890', veiculo: 'Chevrolet Onix', seguradora: 'Azul', situacao: 'Em análise', valor: 13500 },
    { id: 6, entrada: '2024-01-20', placa: 'PQR-1234', veiculo: 'Nissan Sentra', seguradora: 'Allianz', situacao: 'Em reparo', valor: 16000 },
    { id: 7, entrada: '2024-01-21', placa: 'STU-5678', veiculo: 'Hyundai HB20', seguradora: 'HDI', situacao: 'Finalizado', valor: 11000 },
    { id: 8, entrada: '2024-01-22', placa: 'VWX-9012', veiculo: 'Kia Cerato', seguradora: 'Porto Seguro', situacao: 'Aguardando liberação', valor: 14000 },
    { id: 9, entrada: '2024-01-23', placa: 'YZA-3456', veiculo: 'Toyota Hilux', seguradora: 'Bradesco', situacao: 'Em análise', valor: 25000 },
    { id: 10, entrada: '2024-01-24', placa: 'BCD-7890', veiculo: 'Honda CR-V', seguradora: 'SulAmérica', situacao: 'Em reparo', valor: 22000 }
  ];

  const entradaColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'entrada', headerName: 'Data Entrada', width: 120 },
    { field: 'placa', headerName: 'Placa', width: 120 },
    { field: 'veiculo', headerName: 'Veículo', width: 150 },
    { field: 'seguradora', headerName: 'Seguradora', width: 150 },
    { field: 'situacao', headerName: 'Situação', width: 150 },
    { field: 'valor', headerName: 'Valor (R$)', width: 120, type: 'number' }
  ];

  // Dados mocados para relatório Financeiro
  const financeiroRows = [
    { id: 1, numeroNF: 'NF001', dataNF: '2024-01-15', valorTotal: 15000, honorarios: 2000, despesas: 500, status: 'Pago' },
    { id: 2, numeroNF: 'NF002', dataNF: '2024-01-16', valorTotal: 12000, honorarios: 1500, despesas: 300, status: 'Pendente' },
    { id: 3, numeroNF: 'NF003', dataNF: '2024-01-17', valorTotal: 18000, honorarios: 2500, despesas: 800, status: 'Pago' },
    { id: 4, numeroNF: 'NF004', dataNF: '2024-01-18', valorTotal: 9500, honorarios: 1200, despesas: 200, status: 'Em análise' },
    { id: 5, numeroNF: 'NF005', dataNF: '2024-01-19', valorTotal: 13500, honorarios: 1800, despesas: 400, status: 'Pago' },
    { id: 6, numeroNF: 'NF006', dataNF: '2024-01-20', valorTotal: 16000, honorarios: 2100, despesas: 600, status: 'Pendente' },
    { id: 7, numeroNF: 'NF007', dataNF: '2024-01-21', valorTotal: 11000, honorarios: 1400, despesas: 250, status: 'Pago' },
    { id: 8, numeroNF: 'NF008', dataNF: '2024-01-22', valorTotal: 14000, honorarios: 1900, despesas: 350, status: 'Rejeitado' },
    { id: 9, numeroNF: 'NF009', dataNF: '2024-01-23', valorTotal: 25000, honorarios: 3200, despesas: 1000, status: 'Pago' },
    { id: 10, numeroNF: 'NF010', dataNF: '2024-01-24', valorTotal: 22000, honorarios: 2800, despesas: 700, status: 'Pendente' }
  ];

  const financeiroColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'numeroNF', headerName: 'Nº NF', width: 100 },
    { field: 'dataNF', headerName: 'Data NF', width: 120 },
    { field: 'valorTotal', headerName: 'Valor Total (R$)', width: 150, type: 'number' },
    { field: 'honorarios', headerName: 'Honorários (R$)', width: 150, type: 'number' },
    { field: 'despesas', headerName: 'Despesas (R$)', width: 130, type: 'number' },
    { field: 'status', headerName: 'Status', width: 120 }
  ];

  // Dados mocados para relatório Judicial
  const judicialRows = [
    { id: 1, numeroProcesso: 'PROC001', comarca: 'São Paulo', vara: '1ª Vara Cível', entrada: '2024-01-15', status: 'Em andamento' },
    { id: 2, numeroProcesso: 'PROC002', comarca: 'Rio de Janeiro', vara: '2ª Vara Cível', entrada: '2024-01-16', status: 'Aguardando julgamento' },
    { id: 3, numeroProcesso: 'PROC003', comarca: 'Belo Horizonte', vara: '3ª Vara Cível', entrada: '2024-01-17', status: 'Finalizado' },
    { id: 4, numeroProcesso: 'PROC004', comarca: 'Porto Alegre', vara: '1ª Vara Cível', entrada: '2024-01-18', status: 'Em andamento' },
    { id: 5, numeroProcesso: 'PROC005', comarca: 'Curitiba', vara: '2ª Vara Cível', entrada: '2024-01-19', status: 'Aguardando audiência' },
    { id: 6, numeroProcesso: 'PROC006', comarca: 'Salvador', vara: '1ª Vara Cível', entrada: '2024-01-20', status: 'Em andamento' },
    { id: 7, numeroProcesso: 'PROC007', comarca: 'Fortaleza', vara: '3ª Vara Cível', entrada: '2024-01-21', status: 'Finalizado' },
    { id: 8, numeroProcesso: 'PROC008', comarca: 'Recife', vara: '2ª Vara Cível', entrada: '2024-01-22', status: 'Aguardando julgamento' },
    { id: 9, numeroProcesso: 'PROC009', comarca: 'Brasília', vara: '1ª Vara Cível', entrada: '2024-01-23', status: 'Em andamento' },
    { id: 10, numeroProcesso: 'PROC010', comarca: 'Manaus', vara: '2ª Vara Cível', entrada: '2024-01-24', status: 'Aguardando audiência' }
  ];

  const judicialColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'numeroProcesso', headerName: 'Nº Processo', width: 150 },
    { field: 'comarca', headerName: 'Comarca', width: 150 },
    { field: 'vara', headerName: 'Vara', width: 150 },
    { field: 'entrada', headerName: 'Data Entrada', width: 120 },
    { field: 'status', headerName: 'Status', width: 180 }
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`relatorios-tabpanel-${index}`}
      aria-labelledby={`relatorios-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Relatórios
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Entrada" />
            <Tab label="Financeiro" />
            <Tab label="Judicial" />
          </Tabs>
        </Box>

        {/* Aba Entrada */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={entradaRows}
              columns={entradaColumns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              checkboxSelection
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell': {
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-columnHeader': {
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }
              }}
            />
          </Box>
        </TabPanel>

        {/* Aba Financeiro */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={financeiroRows}
              columns={financeiroColumns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              checkboxSelection
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell': {
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-columnHeader': {
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }
              }}
            />
          </Box>
        </TabPanel>

        {/* Aba Judicial */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={judicialRows}
              columns={judicialColumns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              checkboxSelection
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-cell': {
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-columnHeader': {
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }
              }}
            />
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default RelatoriosPage;


