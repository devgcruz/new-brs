import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import financeiroService from '../../services/financeiroService';
import ObservacoesFinanceiroFeed from './ObservacoesFinanceiroFeed';
import EnhancedNotification from '../EnhancedNotification';
import useNotification from '../../hooks/useNotification';
import ValidationAlert from '../ValidationAlert';

const FinanceiroTab = ({ entradaId }) => {
  const [financeiros, setFinanceiros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFinanceiro, setEditingFinanceiro] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [financeiroToDelete, setFinanceiroToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Hook para notificações melhoradas
  const { notification, showSuccess, showError, showWarning, hideNotification } = useNotification();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const [formData, setFormData] = useState({
    NUMERO_RECIBO: '',
    VALOR_TOTAL_RECIBO: '',
    DATA_PAGAMENTO_RECIBO: '',
    data_recibo: '',
    DATA_NOTA_FISCAL: '',
    NUMERO_NOTA_FISCAL: '',
    VALOR_NOTA_FISCAL: '',
    DATA_PAGAMENTO_NOTA_FISCAL: '',
    status_nota_fiscal: '',
    OBSERVACOES: '',
    StatusPG: 'Pendente'
  });

  const statusOptions = [
    'Pendente',
    'Pago',
    'Em análise',
    'Rejeitado'
  ];

  const statusNotaFiscalOptions = [
    'Pendente',
    'Pago',
    'Em análise',
    'Rejeitado'
  ];

  const statusColors = {
    'Pendente': 'warning',
    'Pago': 'success',
    'Em análise': 'info',
    'Rejeitado': 'error'
  };

  useEffect(() => {
    if (entradaId) {
      fetchFinanceiros();
    }
  }, [entradaId]);

  const fetchFinanceiros = async () => {
    try {
      setLoading(true);
      const response = await financeiroService.getFinanceirosByEntrada(entradaId);
      // Garantir que financeiros seja sempre um array
      const financeirosData = response.data?.financeiros || [];
      setFinanceiros(Array.isArray(financeirosData) ? financeirosData : []);
    } catch (error) {
      showError('Erro ao carregar lançamentos financeiros. Tente novamente.');
      setFinanceiros([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      NUMERO_RECIBO: '',
      VALOR_TOTAL_RECIBO: '',
      DATA_PAGAMENTO_RECIBO: '',
      data_recibo: '',
      DATA_NOTA_FISCAL: '',
      NUMERO_NOTA_FISCAL: '',
      VALOR_NOTA_FISCAL: '',
      DATA_PAGAMENTO_NOTA_FISCAL: '',
      status_nota_fiscal: '',
      OBSERVACOES: '',
      StatusPG: 'Pendente'
    });
    setEditingFinanceiro(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setValidationErrors({});
      
      // Validações básicas
      if (!formData.VALOR_TOTAL_RECIBO && !formData.VALOR_NOTA_FISCAL) {
        setValidationErrors({
          geral: ['Pelo menos um valor (Recibo ou Nota Fiscal) deve ser informado']
        });
        showWarning('Preencha pelo menos um valor para continuar');
        return;
      }
      
      if (editingFinanceiro) {
        await financeiroService.updateFinanceiro(editingFinanceiro.Id_Financeiro, formData);
        showSuccess('Lançamento financeiro atualizado com sucesso!');
      } else {
        await financeiroService.createFinanceiroForEntrada(entradaId, formData);
        showSuccess('Lançamento financeiro criado com sucesso!');
      }
      
      setEditModalOpen(false);
      resetForm();
      fetchFinanceiros();
    } catch (error) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        showError('Por favor, corrija os erros abaixo e tente novamente.');
      } else {
        showError('Erro ao salvar lançamento financeiro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (financeiro) => {
    // Função para limpar datas inválidas
    const cleanDate = (date) => {
      if (!date || date === '0000-00-00' || date === 'null') return '';
      return date;
    };
    
    setEditingFinanceiro(financeiro);
    setFormData({
      NUMERO_RECIBO: financeiro.NUMERO_RECIBO || '',
      VALOR_TOTAL_RECIBO: financeiro.VALOR_TOTAL_RECIBO || '',
      DATA_PAGAMENTO_RECIBO: cleanDate(financeiro.DATA_PAGAMENTO_RECIBO),
      data_recibo: cleanDate(financeiro.data_recibo),
      DATA_NOTA_FISCAL: cleanDate(financeiro.DATA_NOTA_FISCAL),
      NUMERO_NOTA_FISCAL: financeiro.NUMERO_NOTA_FISCAL || '',
      VALOR_NOTA_FISCAL: financeiro.VALOR_NOTA_FISCAL || '',
      DATA_PAGAMENTO_NOTA_FISCAL: cleanDate(financeiro.DATA_PAGAMENTO_NOTA_FISCAL),
      status_nota_fiscal: financeiro.status_nota_fiscal || '',
      OBSERVACOES: financeiro.OBSERVACOES || '',
      StatusPG: financeiro.StatusPG || 'Pendente'
    });
    
    setEditModalOpen(true);
  };


  const handleCloseModal = () => {
    setEditModalOpen(false);
    resetForm();
  };

  const handleDelete = (financeiro) => {
    setFinanceiroToDelete(financeiro);
    setDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setFinanceiroToDelete(null);
  };

  const confirmDelete = async () => {
    if (!financeiroToDelete) return;
    
    try {
      setLoading(true);
      await financeiroService.deleteFinanceiro(financeiroToDelete.Id_Financeiro);
      showSuccess('Lançamento financeiro excluído com sucesso!');
      fetchFinanceiros();
      setDeleteDialogOpen(false);
      setFinanceiroToDelete(null);
    } catch (error) {
      showError('Erro ao excluir lançamento financeiro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };


  const handleStatusChange = async (financeiro, newStatus) => {
    try {
      setLoading(true);
      await financeiroService.updateStatus(financeiro.id, newStatus);
      showSuccess(`Status atualizado para "${newStatus}" com sucesso!`);
      
      // Atualizar o status na lista local sem recarregar
      setFinanceiros(prevFinanceiros => {
        const financeirosArray = Array.isArray(prevFinanceiros) ? prevFinanceiros : [];
        return financeirosArray.map(item => 
          item.id === financeiro.id 
            ? { ...item, status_pagamento: newStatus }
            : item
        );
      });
    } catch (error) {
      showError('Erro ao atualizar status do lançamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date || date === null || date === '') return '-';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('pt-BR');
  };

  const calculateTotal = () => {
    const financeirosArray = Array.isArray(financeiros) ? financeiros : [];
    
    const totalRecibo = financeirosArray.reduce((sum, item) => {
      return sum + (parseFloat(item.VALOR_TOTAL_RECIBO) || 0);
    }, 0);
    
    const totalNotaFiscal = financeirosArray.reduce((sum, item) => {
      return sum + (parseFloat(item.VALOR_NOTA_FISCAL) || 0);
    }, 0);
    
    return {
      totalRecibo,
      totalNotaFiscal,
      totalGeral: totalRecibo + totalNotaFiscal
    };
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Lançamentos Financeiros</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setEditModalOpen(true)}
          disabled={loading}
        >
          Adicionar Lançamento
        </Button>
      </Box>

      {loading && !(Array.isArray(financeiros) && financeiros.length > 0) && (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (Array.isArray(financeiros) && financeiros.length === 0) && (
        <Box textAlign="center" p={3}>
          <Typography variant="body2" color="textSecondary">
            Nenhum lançamento financeiro encontrado para esta entrada.
          </Typography>
        </Box>
      )}

      {Array.isArray(financeiros) && financeiros.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nº Recibo</TableCell>
                <TableCell>Valor Recibo</TableCell>
                <TableCell>Data Pag. Recibo</TableCell>
                <TableCell>Nº Nota Fiscal</TableCell>
                <TableCell>Valor Nota Fiscal</TableCell>
                <TableCell>Data Pag. NF</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(Array.isArray(financeiros) ? financeiros : []).map((financeiro) => (
                <TableRow key={financeiro.Id_Financeiro}>
                  <TableCell>{financeiro.NUMERO_RECIBO || '-'}</TableCell>
                  <TableCell>{formatCurrency(financeiro.VALOR_TOTAL_RECIBO)}</TableCell>
                  <TableCell>{formatDate(financeiro.DATA_PAGAMENTO_RECIBO)}</TableCell>
                  <TableCell>{financeiro.NUMERO_NOTA_FISCAL || '-'}</TableCell>
                  <TableCell>{formatCurrency(financeiro.VALOR_NOTA_FISCAL)}</TableCell>
                  <TableCell>{formatDate(financeiro.DATA_PAGAMENTO_NOTA_FISCAL)}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={financeiro.StatusPG === 'Pago'}
                            onChange={(e) => {
                              const newStatus = e.target.checked ? 'Pago' : 'Pendente';
                              handleStatusChange(financeiro, newStatus);
                            }}
                            disabled={loading}
                            size="small"
                          />
                        }
                        label=""
                        sx={{ margin: 0 }}
                      />
                      <Chip
                        label={financeiro.StatusPG || 'Pendente'}
                        color={statusColors[financeiro.StatusPG] || 'default'}
                        size="small"
                        variant={financeiro.StatusPG === 'Pago' ? 'filled' : 'outlined'}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      edge="end"
                      aria-label="editar"
                      onClick={() => handleEdit(financeiro)}
                      color="primary"
                      sx={{ mr: 1 }}
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="deletar"
                      onClick={() => handleDelete(financeiro)}
                      color="error"
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {/* Linha de total */}
              <TableRow sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                <TableCell colSpan={1} sx={{ fontWeight: 'bold' }}>
                  TOTAL GERAL:
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(calculateTotal().totalRecibo)}
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(calculateTotal().totalNotaFiscal)}
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {formatCurrency(calculateTotal().totalGeral)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal de Edição/Criação */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle>
          {editingFinanceiro ? 'Editar Lançamento Financeiro' : 'Novo Lançamento Financeiro'}
        </DialogTitle>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <DialogContent sx={{ 
            flex: 1, 
            overflow: 'hidden',
            p: 0
          }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="abas do lançamento financeiro">
                <Tab label="Dados Financeiros" />
                <Tab label="Observações" />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
              {/* Alert de validação */}
              <ValidationAlert 
                errors={validationErrors}
                show={Object.keys(validationErrors).length > 0}
                severity="error"
                title="Corrija os seguintes erros:"
                sx={{ mb: 2 }}
              />
              
              {activeTab === 0 && (
                <Grid container spacing={2}>
              {/* Seção 1: Dados do Recibo */}
              <Grid item xs={12}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Dados do Recibo
                  </Typography>
                  <Divider sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  name="data_recibo"
                  label="Data do Recibo"
                  type="date"
                  value={formData.data_recibo}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="NUMERO_RECIBO"
                  label="Número do Recibo"
                  value={formData.NUMERO_RECIBO}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="VALOR_TOTAL_RECIBO"
                  label="Valor Total do Recibo"
                  type="number"
                  value={formData.VALOR_TOTAL_RECIBO}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ step: "0.01", min: "0" }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="DATA_PAGAMENTO_RECIBO"
                  label="Data de Pagamento do Recibo"
                  type="date"
                  value={formData.DATA_PAGAMENTO_RECIBO}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="StatusPG"
                    value={formData.StatusPG}
                    onChange={handleInputChange}
                    label="Status"
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Seção 2: Dados da Nota Fiscal */}
              <Grid item xs={12}>
                <Box sx={{ mb: 1.5, mt: 2 }}>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    Dados da Nota Fiscal
                  </Typography>
                  <Divider sx={{ mt: 0.5 }} />
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  name="DATA_NOTA_FISCAL"
                  label="Data da Nota Fiscal"
                  type="date"
                  value={formData.DATA_NOTA_FISCAL}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="NUMERO_NOTA_FISCAL"
                  label="Número da Nota Fiscal"
                  value={formData.NUMERO_NOTA_FISCAL}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="VALOR_NOTA_FISCAL"
                  label="Valor da Nota Fiscal"
                  type="number"
                  value={formData.VALOR_NOTA_FISCAL}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ step: "0.01", min: "0" }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  name="DATA_PAGAMENTO_NOTA_FISCAL"
                  label="Data de Pagamento da Nota Fiscal"
                  type="date"
                  value={formData.DATA_PAGAMENTO_NOTA_FISCAL}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Status da Nota Fiscal</InputLabel>
                  <Select
                    name="status_nota_fiscal"
                    value={formData.status_nota_fiscal}
                    onChange={handleInputChange}
                    label="Status da Nota Fiscal"
                  >
                    <MenuItem value=""><em>Nenhum</em></MenuItem>
                    {statusNotaFiscalOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
              )}
              
              {activeTab === 1 && (
                <>
                  {console.log('🔍 FinanceiroTab: Renderizando aba observações, editingFinanceiro:', editingFinanceiro)}
                  <ObservacoesFinanceiroFeed 
                    financeiroId={editingFinanceiro?.Id_Financeiro}
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            pt: 2, 
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#fafafa',
            flexShrink: 0
          }}>
            <Button
              onClick={handleCloseModal}
              disabled={loading}
              startIcon={<CancelIcon />}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<SaveIcon />}
            >
              {loading ? <CircularProgress size={20} /> : 'Salvar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Notificação melhorada */}
      <EnhancedNotification
        open={notification.open}
        onClose={hideNotification}
        message={notification.message}
        severity={notification.severity}
        duration={notification.duration}
        position={{ vertical: 'top', horizontal: 'center' }}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            WebkitBackdropFilter: 'blur(15px)'
          }
        }}
      >
        <DialogTitle id="delete-dialog-title">
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar o lançamento financeiro "{financeiroToDelete?.numero_recibo || financeiroToDelete?.numero_nota_fiscal || 'ID: ' + financeiroToDelete?.id}"? 
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={cancelDelete} 
            variant="contained" 
            color="error"
          >
            NÃO
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="outlined" 
            sx={{ 
              color: 'grey.600',
              borderColor: 'grey.400',
              '&:hover': {
                borderColor: 'grey.500',
                backgroundColor: 'grey.50'
              }
            }}
          >
            Deletar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinanceiroTab;
