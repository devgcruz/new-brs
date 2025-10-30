import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts';
import dashboardService from '../services/dashboardService';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dadosMontadoras, setDadosMontadoras] = useState([]);
  const [dadosTipoServico, setDadosTipoServico] = useState([]);
  const [dadosSituacao, setDadosSituacao] = useState([]);
  const [dadosEvolucaoEntradas, setDadosEvolucaoEntradas] = useState([]);
  const [dadosEvolucaoHonorarios, setDadosEvolucaoHonorarios] = useState([]);
  const [dadosEvolucaoDespesas, setDadosEvolucaoDespesas] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        
        // Buscar todos os dados em paralelo
        const [
          montadoras,
          tipoServico,
          situacao,
          evolucaoEntradas,
          evolucaoHonorarios,
          evolucaoDespesas
        ] = await Promise.all([
          dashboardService.getDadosMontadoras(),
          dashboardService.getDadosTipoServico(),
          dashboardService.getDadosSituacao(),
          dashboardService.getDadosEvolucaoEntradas(),
          dashboardService.getDadosEvolucaoHonorarios(),
          dashboardService.getDadosEvolucaoDespesas()
        ]);

        setDadosMontadoras(montadoras);
        setDadosTipoServico(tipoServico);
        setDadosSituacao(situacao);
        setDadosEvolucaoEntradas(evolucaoEntradas);
        setDadosEvolucaoHonorarios(evolucaoHonorarios);
        setDadosEvolucaoDespesas(evolucaoDespesas);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard - Sistema BRS
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Indicadores e análises do sistema.
      </Typography>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Percentual de Veículos por Montadora - Gráfico de Pizza */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Percentual de Veículos por Montadora
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosMontadoras}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosMontadoras.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Percentual por Tipo de Serviço - Gráfico de Rosca */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Percentual por Tipo de Serviço
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosTipoServico}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dadosTipoServico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Quantidade por Situação - Gráfico de Colunas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Quantidade por Situação
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosSituacao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Evolução Mensal de Entradas - Gráfico de Linha */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Evolução Mensal de Entradas
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosEvolucaoEntradas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="entradas" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Evolução Mensal de Honorários - Gráfico de Colunas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Evolução Mensal de Honorários
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosEvolucaoHonorarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Honorários']} />
                <Bar dataKey="honorarios" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Evolução Mensal de Despesas - Gráfico de Área */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Evolução Mensal de Despesas (Valor de Diligência)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosEvolucaoDespesas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Despesas']} />
                <Area type="monotone" dataKey="despesas" stroke="#ffc658" fill="#ffc658" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;

