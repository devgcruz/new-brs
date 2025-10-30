import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Pagination,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  FileDownload as DownloadIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';
import relatoriosFinanceirosService from '../services/relatoriosFinanceirosService';
import StatCard from '../components/StatCard';

const RelatoriosFinanceiroPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [relatorios, setRelatorios] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [estatisticas, setEstatisticas] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 20
  });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    status: 'todos'
  });

  const statusOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'Pago', label: 'Pago' },
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Em análise', label: 'Em análise' },
    { value: 'Rejeitado', label: 'Rejeitado' }
  ];

  // Função para buscar relatórios financeiros
  const buscarRelatorios = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await relatoriosFinanceirosService.getRelatorios(
        filtros, 
        { page, per_page: pagination.perPage }
      );
      
      if (response.success) {
        setRelatorios(response.data);
        setEstatisticas(response.estatisticas);
        setPagination({
          currentPage: response.meta?.current_page || page,
          lastPage: response.meta?.last_page || 1,
          total: response.meta?.total || 0,
          perPage: response.meta?.per_page || pagination.perPage
        });
        setSuccess(`${response.data.length} registros encontrados`);
      } else {
        setError(response.message || 'Erro ao buscar relatórios');
        setRelatorios([]);
        setEstatisticas({});
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      setError('Erro ao buscar relatórios financeiros');
      setRelatorios([]);
      setEstatisticas({});
    } finally {
      setLoading(false);
    }
  };

  // Função para alternar expansão de linha
  const toggleExpansao = (entradaId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(entradaId)) {
      newExpanded.delete(entradaId);
    } else {
      newExpanded.add(entradaId);
    }
    setExpandedRows(newExpanded);
  };

  // Função para formatar data
  const formatarData = (data) => {
    if (!data) return '-';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return '-';
    }
  };

  // Função para formatar moeda
  const formatarMoeda = (valor) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Função para obter cor do status
  const getStatusColor = (status) => {
    const cores = {
      'Pago': 'success',
      'Pendente': 'warning',
      'Em análise': 'info',
      'Rejeitado': 'error'
    };
    return cores[status] || 'default';
  };

  // Função para exportar para PDF
  const exportarParaPDF = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await relatoriosFinanceirosService.exportarParaPDF(filtros);
      
      if (result.success) {
        setSuccess('PDF gerado com sucesso!');
      } else {
        setError(result.message || 'Erro ao gerar PDF');
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      setError('Erro ao gerar PDF');
    } finally {
      setLoading(false);
    }
  };

  // Função para exportar para Excel
  const exportarParaExcel = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await relatoriosFinanceirosService.exportarParaExcel(filtros, relatorios);
      
      if (result.success) {
        setSuccess('Excel gerado com sucesso!');
      } else {
        setError(result.message || 'Erro ao gerar Excel');
      }
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      setError('Erro ao gerar Excel');
    } finally {
      setLoading(false);
    }
  };

  // Função para mudar página
  const handlePageChange = (event, newPage) => {
    buscarRelatorios(newPage);
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      status: 'todos'
    });
    setRelatorios([]);
    setEstatisticas({});
    setSuccess('');
    setError('');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Relatórios Financeiros
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Relatório completo de lançamentos financeiros por registro de entrada
      </Typography>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros de Pesquisa
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Data Início"
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Data Fim"
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filtros.status}
                onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              onClick={() => buscarRelatorios(1)}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ExcelIcon />}
              onClick={exportarParaExcel}
              disabled={loading || relatorios.length === 0}
              sx={{ height: '56px' }}
              color="success"
            >
              Excel
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={exportarParaPDF}
              disabled={loading || relatorios.length === 0}
              sx={{ height: '56px' }}
              color="error"
            >
              PDF
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={limparFiltros}
              disabled={loading}
              sx={{ height: '56px' }}
              color="secondary"
            >
              Limpar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      {relatorios.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<AssignmentIcon />}
              title="Registros de Entrada"
              value={estatisticas.total_registros || 0}
              color="primary.main"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<ReceiptIcon />}
              title="Total Despesas"
              value={formatarMoeda(estatisticas.total_recibos || 0)}
              color="success.main"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StatCard
              icon={<AssessmentIcon />}
              title="Total Honorários"
              value={formatarMoeda(estatisticas.total_notas_fiscais || 0)}
              color="warning.main"
            />
          </Grid>
        </Grid>
      )}

      {/* Tabela de Relatórios */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Data do Registro</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Veículo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Placa</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Chassi</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Sinistro</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Lançamentos</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {relatorios.map((relatorio) => {
              const { entrada, financeiros } = relatorio;
              const isExpanded = expandedRows.has(entrada.entrada_id);
              
              return (
                <React.Fragment key={entrada.entrada_id}>
                  {/* Linha principal - Registro de Entrada */}
                  <TableRow 
                    hover 
                    sx={{ 
                      '&:hover': { backgroundColor: '#f8f9fa' },
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleExpansao(entrada.entrada_id)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{formatarData(entrada.data_registro)}</TableCell>
                    <TableCell>{entrada.veiculo || '-'}</TableCell>
                    <TableCell>{entrada.placa || '-'}</TableCell>
                    <TableCell>{entrada.chassi || '-'}</TableCell>
                    <TableCell>{entrada.cod_sinistro || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${financeiros.length} lançamento(s)`}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  
                  {/* Linhas expandidas - Lançamentos Financeiros */}
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, border: 'none' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                            Lançamentos Financeiros
                          </Typography>
                          
                          {financeiros.length === 0 ? (
                            <Alert severity="info">
                              Nenhum lançamento financeiro encontrado para este registro.
                            </Alert>
                          ) : (
                            <Grid container spacing={2}>
                              {financeiros.map((financeiro, index) => (
                                <Grid item xs={12} key={financeiro.id || index}>
                                  <Card variant="outlined">
                                    <CardContent>
                                      <Grid container spacing={2}>
                                        {/* Despesas (Recibo) */}
                                        <Grid item xs={12} sm={6} md={3}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ReceiptIcon color="primary" />
                                            <Box>
                                              <Typography variant="caption" color="text.secondary">
                                                Despesas (Recibo)
                                              </Typography>
                                              <Typography variant="body2" fontWeight="bold">
                                                {formatarMoeda(financeiro.valor_total_recibo)}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </Grid>
                                        
                                        {/* Data de Pagamento do Recibo */}
                                        <Grid item xs={12} sm={6} md={3}>
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">
                                              Data Pag. Recibo
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                              {formatarData(financeiro.data_pagamento_recibo)}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                        
                                        {/* Número da Nota Fiscal */}
                                        <Grid item xs={12} sm={6} md={3}>
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">
                                              Nº Nota Fiscal
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                              {financeiro.numero_nota_fiscal || '-'}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                        
                                        {/* Valor da Nota Fiscal */}
                                        <Grid item xs={12} sm={6} md={3}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <MoneyIcon color="success" />
                                            <Box>
                                              <Typography variant="caption" color="text.secondary">
                                                Valor Nota Fiscal
                                              </Typography>
                                              <Typography variant="body2" fontWeight="bold">
                                                {formatarMoeda(financeiro.valor_nota_fiscal)}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </Grid>
                                        
                                        {/* Data de Pagamento da Nota Fiscal */}
                                        <Grid item xs={12} sm={6} md={3}>
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">
                                              Data Pag. Nota Fiscal
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                              {formatarData(financeiro.data_pagamento_nota_fiscal)}
                                            </Typography>
                                          </Box>
                                        </Grid>
                                        
                                        {/* Status */}
                                        <Grid item xs={12} sm={6} md={3}>
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">
                                              Status
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                              <Chip 
                                                label={financeiro.status_pagamento || 'Pendente'}
                                                color={getStatusColor(financeiro.status_pagamento)}
                                                size="small"
                                              />
                                            </Box>
                                          </Box>
                                        </Grid>
                                        
                                        {/* Observações */}
                                        {(financeiro.observacao || financeiro.OBSERVACOES) && (
                                          <Grid item xs={12}>
                                            <Divider sx={{ my: 1 }} />
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                              <DescriptionIcon color="action" sx={{ mt: 0.5 }} />
                                              <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                  Observações
                                                </Typography>
                                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                  {financeiro.observacao || financeiro.OBSERVACOES}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </Grid>
                                        )}
                                      </Grid>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      {relatorios.length > 0 && pagination.lastPage > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Stack spacing={2}>
            <Pagination
              count={pagination.lastPage}
              page={pagination.currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              disabled={loading}
            />
          </Stack>
        </Box>
      )}

      {relatorios.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Clique em "Buscar" para carregar os relatórios financeiros.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RelatoriosFinanceiroPage;