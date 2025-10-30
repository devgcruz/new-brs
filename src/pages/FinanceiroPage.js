import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon, Save as SaveIcon } from '@mui/icons-material';
import OptimizedSelect from '../components/OptimizedSelect';

const FinanceiroPage = () => {
  const [searchId, setSearchId] = useState('');
  const [formData, setFormData] = useState({
    dataNF: '',
    numeroNF: '',
    honorarios: '',
    dataPagHonorarios: '',
    valorDespesas: '',
    dataPagDespesas: '',
    baixaNF: '',
    valor: '',
    dataPagamento: '',
    banco: '',
    observacoes: '',
    informacoesAdicionais: '',
    statusPagamento: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registroEncontrado, setRegistroEncontrado] = useState(null);

  const statusPagamento = ['Pendente', 'Pago', 'Em análise', 'Rejeitado'];

  const handleSearch = async () => {
    if (!searchId.trim()) {
      setError('Por favor, informe o ID do registro');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Simula busca do registro
      setTimeout(() => {
        const mockRegistro = {
          id: searchId,
          placa: 'ABC-1234',
          veiculo: 'Toyota Corolla',
          seguradora: 'Porto Seguro'
        };
        
        setRegistroEncontrado(mockRegistro);
        setLoading(false);
        setSuccess('Registro encontrado!');
      }, 1000);
    } catch (err) {
      setError('Erro ao buscar registro');
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simula salvamento
      setTimeout(() => {
        setLoading(false);
        setSuccess('Dados financeiros salvos com sucesso!');
      }, 1000);
    } catch (err) {
      setError('Erro ao salvar dados');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Financeiro
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Buscar Registro
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="ID do Registro"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>

      {registroEncontrado && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dados do Registro Encontrado
          </Typography>
          
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography><strong>ID:</strong> {registroEncontrado.id}</Typography>
            <Typography><strong>Placa:</strong> {registroEncontrado.placa}</Typography>
            <Typography><strong>Veículo:</strong> {registroEncontrado.veiculo}</Typography>
            <Typography><strong>Seguradora:</strong> {registroEncontrado.seguradora}</Typography>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Dados Financeiros
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Data NF"
                type="date"
                value={formData.dataNF}
                onChange={handleInputChange('dataNF')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Nº NF"
                value={formData.numeroNF}
                onChange={handleInputChange('numeroNF')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Honorários"
                type="number"
                value={formData.honorarios}
                onChange={handleInputChange('honorarios')}
                InputProps={{
                  startAdornment: 'R$ '
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Data Pag. Honorários"
                type="date"
                value={formData.dataPagHonorarios}
                onChange={handleInputChange('dataPagHonorarios')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Valor Despesas"
                type="number"
                value={formData.valorDespesas}
                onChange={handleInputChange('valorDespesas')}
                InputProps={{
                  startAdornment: 'R$ '
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Data Pag. Despesas"
                type="date"
                value={formData.dataPagDespesas}
                onChange={handleInputChange('dataPagDespesas')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Baixa NF"
                value={formData.baixaNF}
                onChange={handleInputChange('baixaNF')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Valor"
                type="number"
                value={formData.valor}
                onChange={handleInputChange('valor')}
                InputProps={{
                  startAdornment: 'R$ '
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Data Pagamento"
                type="date"
                value={formData.dataPagamento}
                onChange={handleInputChange('dataPagamento')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Banco"
                value={formData.banco}
                onChange={handleInputChange('banco')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <OptimizedSelect
                label="Status do Pagamento"
                value={formData.statusPagamento}
                onChange={handleInputChange('statusPagamento')}
                options={statusPagamento.map(status => ({ value: status, label: status }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={handleInputChange('observacoes')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Informações Adicionais"
                multiline
                rows={3}
                value={formData.informacoesAdicionais}
                onChange={handleInputChange('informacoesAdicionais')}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default FinanceiroPage;


