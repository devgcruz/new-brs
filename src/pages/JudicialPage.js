import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

const JudicialPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dados do formulário Judiciário
  const [judiciarioData, setJudiciarioData] = useState({
    comarca: '',
    numeroProcesso: '',
    notaFiscal: '',
    numeroVara: '',
    dataPagamento: '',
    honorario: '',
    nomeBanco: '',
    observacoes: ''
  });

  // Dados do formulário Diligência
  const [diligenciaData, setDiligenciaData] = useState({
    numeroNF: '',
    numeroDiligencia: '',
    valor: '',
    dataPagamento: '',
    despesas: '',
    dataPagamento2: ''
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleJudiciarioChange = (field) => (event) => {
    setJudiciarioData({
      ...judiciarioData,
      [field]: event.target.value
    });
  };

  const handleDiligenciaChange = (field) => (event) => {
    setDiligenciaData({
      ...diligenciaData,
      [field]: event.target.value
    });
  };

  const handleSave = async (type) => {
    try {
      setLoading(true);
      setError('');
      
      // Simula salvamento
      setTimeout(() => {
        setLoading(false);
        setSuccess(`Dados ${type} salvos com sucesso!`);
      }, 1000);
    } catch (err) {
      setError('Erro ao salvar dados');
      setLoading(false);
    }
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`judicial-tabpanel-${index}`}
      aria-labelledby={`judicial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Judicial
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Judiciário" />
            <Tab label="Diligência" />
          </Tabs>
        </Box>

        {/* Aba Judiciário */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Dados Judiciários
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Comarca"
                value={judiciarioData.comarca}
                onChange={handleJudiciarioChange('comarca')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nº Processo"
                value={judiciarioData.numeroProcesso}
                onChange={handleJudiciarioChange('numeroProcesso')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nota Fiscal"
                value={judiciarioData.notaFiscal}
                onChange={handleJudiciarioChange('notaFiscal')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nº Vara"
                value={judiciarioData.numeroVara}
                onChange={handleJudiciarioChange('numeroVara')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Data Pagamento"
                type="date"
                value={judiciarioData.dataPagamento}
                onChange={handleJudiciarioChange('dataPagamento')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Honorário"
                type="number"
                value={judiciarioData.honorario}
                onChange={handleJudiciarioChange('honorario')}
                InputProps={{
                  startAdornment: 'R$ '
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nome Banco"
                value={judiciarioData.nomeBanco}
                onChange={handleJudiciarioChange('nomeBanco')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={4}
                value={judiciarioData.observacoes}
                onChange={handleJudiciarioChange('observacoes')}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={() => handleSave('judiciários')}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Dados Judiciários'}
            </Button>
          </Box>
        </TabPanel>

        {/* Aba Diligência */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Dados de Diligência
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nº NF"
                value={diligenciaData.numeroNF}
                onChange={handleDiligenciaChange('numeroNF')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nº Diligência"
                value={diligenciaData.numeroDiligencia}
                onChange={handleDiligenciaChange('numeroDiligencia')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Valor"
                type="number"
                value={diligenciaData.valor}
                onChange={handleDiligenciaChange('valor')}
                InputProps={{
                  startAdornment: 'R$ '
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Data Pagamento"
                type="date"
                value={diligenciaData.dataPagamento}
                onChange={handleDiligenciaChange('dataPagamento')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Despesas"
                type="number"
                value={diligenciaData.despesas}
                onChange={handleDiligenciaChange('despesas')}
                InputProps={{
                  startAdornment: 'R$ '
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Data Pagamento 2"
                type="date"
                value={diligenciaData.dataPagamento2}
                onChange={handleDiligenciaChange('dataPagamento2')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={() => handleSave('de diligência')}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Dados de Diligência'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default JudicialPage;


