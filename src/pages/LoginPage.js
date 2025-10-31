import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Slide,
  Divider
} from '@mui/material';
import { 
  Login as LoginIcon
} from '@mui/icons-material';
import useAuthStore from '../store/authStore';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null, radius: 150 });
  
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard/registrodeentrada');
    }
  }, [isAuthenticated, navigate]);

  // Classe Particle
  class Particle {
    constructor(x, y, directionX, directionY, size, color) {
      this.x = x;
      this.y = y;
      this.directionX = directionX;
      this.directionY = directionY;
      this.size = size;
      this.color = color;
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    update(ctx, canvas, mouse) {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < mouse.radius) {
        const force = (mouse.radius - distance) / mouse.radius;
        this.x -= (dx / distance) * force * 2;
        this.y -= (dy / distance) * force * 2;
      }

      this.x += this.directionX;
      this.y += this.directionY;

      if (this.x > canvas.width) { 
        this.x = canvas.width; 
        this.directionX *= -1; 
      } else if (this.x < 0) { 
        this.x = 0; 
        this.directionX *= -1; 
      }
      if (this.y > canvas.height) { 
        this.y = canvas.height; 
        this.directionY *= -1; 
      } else if (this.y < 0) { 
        this.y = 0; 
        this.directionY *= -1; 
      }

      this.draw(ctx);
    }
  }

  // Função para conectar partículas
  const connectParticles = (ctx, canvas, particles) => {
    let opacityValue = 1;
    for (let a = 0; a < particles.length; a++) {
      for (let b = a; b < particles.length; b++) {
        let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) + 
                      ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
        if (distance < (canvas.width / 7) * (canvas.height / 7)) {
          opacityValue = 1 - (distance / 20000);
          ctx.strokeStyle = `rgba(25, 118, 210, ${opacityValue})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }
  };

  // Função para inicializar partículas
  const initParticles = (canvas) => {
    particlesRef.current = [];
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
      let size = (Math.random() * 2) + 1;
      let x = (Math.random() * ((canvas.width - size * 2) - (size * 2)) + size * 2);
      let y = (Math.random() * ((canvas.height - size * 2) - (size * 2)) + size * 2);
      let directionX = (Math.random() * 0.2) - 0.1;
      let directionY = (Math.random() * 0.2) - 0.1;
      let color = 'rgba(25, 118, 210, 0.6)';
      particlesRef.current.push(new Particle(x, y, directionX, directionY, size, color));
    }
  };

  // Função de animação
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < particlesRef.current.length; i++) {
      particlesRef.current[i].update(ctx, canvas, mouseRef.current);
    }
    connectParticles(ctx, canvas, particlesRef.current);
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Event listeners para mouse
  const handleMouseMove = (event) => {
    mouseRef.current.x = event.clientX;
    mouseRef.current.y = event.clientY;
  };

  const handleMouseOut = () => {
    mouseRef.current.x = undefined;
    mouseRef.current.y = undefined;
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles(canvas);
  };

  // Setup do canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    initParticles(canvas);
    animate();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/dashboard/registrodeentrada');
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro inesperado ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="login-page"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.98)',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 0
        }
      }}
    >
      {/* Canvas para partículas animadas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      <Container 
        component="main" 
        maxWidth="md"
        sx={{ position: 'relative', zIndex: 3 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}
        >

          {/* Formulário de login */}
          <Slide direction="left" in timeout={1200}>
            <Card
              className="login-card slide-in-left"
              elevation={0}
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(25px)',
                borderRadius: 6,
                p: 4,
                width: '100%',
                maxWidth: 420,
                border: '1px solid rgba(25, 118, 210, 0.2)',
                boxShadow: '0 20px 60px rgba(25, 118, 210, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1)'
              }}
            >
              <CardContent>
                {/* Logo da empresa */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 4,
                    textAlign: 'center'
                  }}
                >
                  <Typography 
                    component="h1" 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      mb: 1,
                      fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                  >
                    Bernardo
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500,
                      fontSize: { xs: '0.9rem', sm: '1.1rem' },
                      lineHeight: 1.2
                    }}
                  >
                    Reguladora de Sinistro
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3, opacity: 0.3 }} />

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        fontSize: 20
                      }
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    className="login-input"
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Usuário"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                  
                  <TextField
                    className="login-input"
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Senha"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                  
                  <Button
                    className="login-button"
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ 
                      mt: 3, 
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                      boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1565c0 0%, #8e24aa 100%)',
                        boxShadow: '0 12px 35px rgba(25, 118, 210, 0.4)',
                        transform: 'translateY(-3px)'
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
          </Box>

              </CardContent>
            </Card>
          </Slide>
        </Box>
      </Container>

      {/* Adicionar keyframes para animação */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default LoginPage;

