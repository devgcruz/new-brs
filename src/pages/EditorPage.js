import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Save as SaveIcon, Delete as DeleteIcon, Print as PrintIcon, AttachFile as AttachFileIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import entradaService from '../services/entradaService';
import PdfModal from '../components/PdfModal';
import OptimizedSelect from '../components/OptimizedSelect';

const EditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    protocolo: '',
    entrada: '',
    marca: '',
    veiculo: '',
    placa: '',
    chassi: '',
    anoVeiculo: '',
    anoModelo: '',
    seguradora: '',
    codSinistro: '',
    numeroBO: '',
    ufSinistro: '',
    cidadeSinistro: '',
    colaborador: '',
    posicao: '',
    uf: '',
    cidade: '',
    numeroProcesso: '',
    tipo: '',
    situacao: '',
    // Novos campos
    cor: '',
    renavam: '',
    numeroMotor: '',
    // Campos condicionais para tipo Judicial
    comarca: '',
    numeroProcessoJudicial: '',
    notaFiscal: '',
    numeroVara: '',
    dataPagamento: '',
    honorario: '',
    nomeBanco: '',
    observacoes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  
  // Estados para validação de placa
  const [placaError, setPlacaError] = useState('');
  const [validatingPlaca, setValidatingPlaca] = useState(false);
  const [placaValid, setPlacaValid] = useState(true);

  // Opções para campos de seleção
  const marcas = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Volkswagen', 'Fiat', 'Hyundai', 'Nissan', 'BMW', 'Mercedes-Benz'];
  const seguradoras = ['Porto Seguro', 'SulAmérica', 'Bradesco Seguros', 'Itaú Seguros', 'Allianz', 'Zurich', 'HDI Seguros', 'Liberty Seguros'];
  const colaboradores = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima', 'Fernanda Lima', 'Roberto Silva', 'Patricia Costa'];
  const posicoes = [
    'DOCTOS RECEBIDO',
    'AGUARDA DOCUMENTOS',
    'DOCTOS ENVIADO REP',
    'VEÍCULO LIBERADO',
    'VEÍCULO REMOVIDO',
    'DOCTOS RECEBIDO REP',
    'FINALIZADO',
    'CANCELADO'
  ];
  const tipos = ['JUDICIAL', 'ADM'];
  
  const ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  const cidades = [
    'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília',
    'Fortaleza', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre',
    'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias',
    'Natal', 'Teresina', 'Campo Grande', 'Nova Iguaçu', 'São Bernardo do Campo'
  ];

  useEffect(() => {
    if (isEdit) {
      loadEntrada();
    }
  }, [id, isEdit]);

  // Debug: Monitorar mudanças no tipo
  useEffect(() => {
    console.log('🔄 Tipo mudou para:', formData.tipo);
    console.log('🔍 Condição JUDICIAL:', formData.tipo === 'JUDICIAL');
  }, [formData.tipo]);

  const loadEntrada = async () => {
    try {
      setLoading(true);
      const response = await entradaService.getEntradaById(id);
      if (response.success) {
        // Preservar campos condicionais que podem não vir do backend
        setFormData(prevFormData => ({
          ...prevFormData,
          ...response.data,
          // Garantir que campos condicionais existam
          comarca: response.data.comarca || '',
          numeroProcessoJudicial: response.data.numeroProcessoJudicial || '',
          notaFiscal: response.data.notaFiscal || '',
          numeroVara: response.data.numeroVara || '',
          dataPagamento: response.data.dataPagamento || '',
          honorario: response.data.honorario || '',
          nomeBanco: response.data.nomeBanco || '',
          observacoes: response.data.observacoes || ''
        }));
        console.log('📦 Dados carregados:', response.data);
      }
    } catch (err) {
      setError('Erro ao carregar registro');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    const newValue = event.target.value;
    
    setFormData({
      ...formData,
      [field]: newValue
    });
    
    // Log especial para o campo tipo
    if (field === 'tipo') {
      console.log('⚖️ Tipo alterado para:', newValue);
      console.log('🔍 Condição JUDICIAL será:', newValue === 'JUDICIAL');
    }
  };

  // Função para normalizar placa (remover hífen)
  const normalizePlaca = (placa) => {
    return placa.replace(/-/g, '').toUpperCase();
  };

  // Função para validar placa duplicada
  const validatePlaca = async (placa) => {
    if (!placa || placa.length < 7) {
      setPlacaError('');
      setPlacaValid(true);
      return;
    }

    setValidatingPlaca(true);
    setPlacaError('');

    try {
      // Simula chamada à API para verificar placa
      const response = await entradaService.checkPlacaExists(placa);
      
      if (response.exists) {
        setPlacaError('Esta placa já está cadastrada no sistema.');
        setPlacaValid(false);
      } else {
        setPlacaError('');
        setPlacaValid(true);
      }
    } catch (error) {
      console.error('Erro ao validar placa:', error);
      setPlacaError('Erro ao verificar placa. Tente novamente.');
      setPlacaValid(false);
    } finally {
      setValidatingPlaca(false);
    }
  };

  // Handler específico para placa com normalização
  const handlePlacaChange = (event) => {
    const value = event.target.value;
    setFormData({
      ...formData,
      placa: value
    });
  };

  // Handler para onBlur da placa
  const handlePlacaBlur = () => {
    if (formData.placa) {
      validatePlaca(formData.placa);
    }
  };


  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Normalizar placa antes de salvar
      const dataToSave = {
        ...formData,
        placa: normalizePlaca(formData.placa)
      };
      
      const response = await entradaService.saveEntrada(dataToSave);
      if (response.success) {
        setSuccess('Registro salvo com sucesso!');
        // Garantir que nenhum modal permaneça aberto após salvar
        setPdfModalOpen(false);
        setTimeout(() => {
          navigate('/dashboard/registrodeentrada');
        }, 1500);
      }
    } catch (err) {
      setError('Erro ao salvar registro');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await entradaService.deleteEntrada(id);
      if (response.success) {
        setSuccess('Registro deletado com sucesso!');
        setTimeout(() => {
          navigate('/dashboard/registrodeentrada');
        }, 1500);
      }
    } catch (err) {
      setError('Erro ao deletar registro');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Função para renderizar seção judicial
  const renderJudicialSection = () => {
    console.log('🔍 Renderizando seção judicial, tipo atual:', formData.tipo);
    if (formData.tipo === 'JUDICIAL') {
      return (
        <>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
              Dados Judiciais
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Comarca"
              value={formData.comarca}
              onChange={handleInputChange('comarca')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="N° Processo"
              value={formData.numeroProcessoJudicial}
              onChange={handleInputChange('numeroProcessoJudicial')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Nota Fiscal"
              value={formData.notaFiscal}
              onChange={handleInputChange('notaFiscal')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="N° Vara"
              value={formData.numeroVara}
              onChange={handleInputChange('numeroVara')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="DT Pagto"
              type="date"
              value={formData.dataPagamento}
              onChange={handleInputChange('dataPagamento')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Honorário"
              value={formData.honorario}
              onChange={handleInputChange('honorario')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Nome Banco"
              value={formData.nomeBanco}
              onChange={handleInputChange('nomeBanco')}
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
              placeholder="Observações adicionais sobre o processo judicial..."
            />
          </Grid>
        </>
      );
    }
    return null;
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Editar Registro' : 'Novo Registro'}
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

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Row 1: Protocolo, Entrada, Marca, Veículo */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Protocolo"
              value={formData.protocolo}
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Entrada"
              type="date"
              value={formData.entrada}
              onChange={handleInputChange('entrada')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <OptimizedSelect
              label="Marca"
              value={formData.marca}
              onChange={handleInputChange('marca')}
              options={marcas.map(marca => ({ value: marca, label: marca }))}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Veículo"
              value={formData.veiculo}
              onChange={handleInputChange('veiculo')}
            />
          </Grid>

          {/* Row 2: Placa, Chassi, Ano Veículo, Ano do Modelo, Seguradora */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Placa"
              placeholder="Digite a placa..."
              value={formData.placa}
              onChange={handlePlacaChange}
              onBlur={handlePlacaBlur}
              error={!!placaError}
              helperText={placaError}
              disabled={validatingPlaca}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Chassi"
              value={formData.chassi}
              onChange={handleInputChange('chassi')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Cor"
              value={formData.cor}
              onChange={handleInputChange('cor')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="RENAVAM"
              value={formData.renavam}
              onChange={handleInputChange('renavam')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Número do Motor"
              value={formData.numeroMotor}
              onChange={handleInputChange('numeroMotor')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Ano Veículo"
              value={formData.anoVeiculo}
              onChange={handleInputChange('anoVeiculo')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Ano do Modelo"
              value={formData.anoModelo}
              onChange={handleInputChange('anoModelo')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <OptimizedSelect
              label="Seguradora"
              value={formData.seguradora}
              onChange={handleInputChange('seguradora')}
              options={seguradoras.map(seguradora => ({ value: seguradora, label: seguradora }))}
            />
          </Grid>

          {/* Row 3: cod Sinistro, Numero B.O, UF Sinistro, Cidade do Sinistro, Colaborador */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="cod Sinistro"
              value={formData.codSinistro}
              onChange={handleInputChange('codSinistro')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Numero B.O"
              value={formData.numeroBO}
              onChange={handleInputChange('numeroBO')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <OptimizedSelect
              label="UF Sinistro"
              value={formData.ufSinistro}
              onChange={handleInputChange('ufSinistro')}
              options={ufs.map(uf => ({ value: uf, label: uf }))}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <OptimizedSelect
              label="Cidade do Sinistro"
              value={formData.cidadeSinistro}
              onChange={handleInputChange('cidadeSinistro')}
              options={cidades.map(cidade => ({ value: cidade, label: cidade }))}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <OptimizedSelect
              label="Colaborador"
              value={formData.colaborador}
              onChange={handleInputChange('colaborador')}
              options={colaboradores.map(colaborador => ({ value: colaborador, label: colaborador }))}
            />
          </Grid>

          {/* Row 4: Posição, UF, Cidade, Numero Processo, Tipo */}
          <Grid item xs={12} sm={6} md={3}>
            <OptimizedSelect
              label="Posição"
              value={formData.posicao}
              onChange={handleInputChange('posicao')}
              options={posicoes.map(posicao => ({ value: posicao, label: posicao }))}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <OptimizedSelect
              label="UF"
              value={formData.uf}
              onChange={handleInputChange('uf')}
              options={ufs.map(uf => ({ value: uf, label: uf }))}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <OptimizedSelect
              label="Cidade"
              value={formData.cidade}
              onChange={handleInputChange('cidade')}
              options={cidades.map(cidade => ({ value: cidade, label: cidade }))}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Numero Processo"
              value={formData.numeroProcesso}
              onChange={handleInputChange('numeroProcesso')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <OptimizedSelect
              label="Tipo"
              value={formData.tipo}
              onChange={handleInputChange('tipo')}
              options={tipos.map(tipo => ({ value: tipo, label: tipo }))}
            />
          </Grid>

          {/* Row 5: Situação (Textarea) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Situação"
              multiline
              rows={4}
              value={formData.situacao}
              onChange={handleInputChange('situacao')}
              placeholder="Descreva a situação atual do veículo..."
            />
          </Grid>

          {/* Debug: Indicador visual do tipo atual */}
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Tipo atual: "{formData.tipo}" | Condição JUDICIAL: {formData.tipo === 'JUDICIAL' ? 'SIM' : 'NÃO'}
            </Typography>
            {formData.tipo === 'JUDICIAL' && (
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                ✅ SEÇÃO JUDICIAL DEVE APARECER AQUI!
              </Typography>
            )}
          </Grid>

          {/* Teste simples de renderização condicional */}
          {formData.tipo === 'JUDICIAL' && (
            <Grid item xs={12}>
              <Typography variant="h5" color="error" sx={{ fontWeight: 'bold', p: 2, bgcolor: 'yellow' }}>
                🚨 TESTE: SEÇÃO JUDICIAL FUNCIONANDO!
              </Typography>
            </Grid>
          )}

          {/* Botão de teste para forçar tipo JUDICIAL */}
          <Grid item xs={12}>
            <Button 
              variant="outlined" 
              onClick={() => {
                console.log('🔧 Forçando tipo para JUDICIAL');
                setFormData(prev => ({ ...prev, tipo: 'JUDICIAL' }));
              }}
              sx={{ mb: 2 }}
            >
              🔧 TESTE: Forçar Tipo JUDICIAL
            </Button>
          </Grid>

          {/* Seção Condicional: Dados Judiciais */}
          {renderJudicialSection()}
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={loading || !placaValid || validatingPlaca}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>

          {isEdit && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                Deletar
              </Button>
            </>
          )}

          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={loading}
          >
            Imprimir
          </Button>

          <Button
            variant="outlined"
            startIcon={<AttachFileIcon />}
            onClick={() => setPdfModalOpen(true)}
            disabled={loading}
          >
            Anexar PDF
          </Button>

          {formData.pdfs && formData.pdfs.length > 0 && (
            <Button
              variant="outlined"
              color="info"
              startIcon={<VisibilityIcon />}
              onClick={() => setPdfModalOpen(true)}
              disabled={loading}
            >
              Visualizar PDFs
            </Button>
          )}
        </Box>
      </Paper>

      {/* Dialog de Confirmação de Delete */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            WebkitBackdropFilter: 'blur(15px)'
          }
        }}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar este registro? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Deletar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de PDFs */}
      <PdfModal
        open={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        registroId={id || 'novo'}
      />
    </Box>
  );
};

export default EditorPage;


