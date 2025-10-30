import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Crop as CropIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ImageCropModal = ({ open, onClose, onSave, title = "Editar Foto de Perfil" }) => {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const hiddenAnchorRef = useRef(null);
  const blobUrlRef = useRef('');

  const onSelectFile = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  }, []);

  const onImageLoad = useCallback((e) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspect,
          width,
          height
        ),
        width,
        height
      ));
    }
  }, [aspect]);

  // Função para converter crop para pixel crop
  const convertToPixelCrop = (crop, imageWidth, imageHeight) => {
    if (!crop) return null;
    
    return {
      x: Math.round(crop.x * imageWidth / 100),
      y: Math.round(crop.y * imageHeight / 100),
      width: Math.round(crop.width * imageWidth / 100),
      height: Math.round(crop.height * imageHeight / 100),
    };
  };

  // Função para desenhar a imagem recortada no canvas
  const drawCroppedImage = useCallback((image, crop, canvas) => {
    if (!image || !crop || !canvas) {
      console.log('drawCroppedImage: Missing required elements', { image: !!image, crop: !!crop, canvas: !!canvas });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('drawCroppedImage: Could not get canvas context');
      return;
    }

    const pixelCrop = convertToPixelCrop(crop, image.naturalWidth, image.naturalHeight);
    if (!pixelCrop) {
      console.log('drawCroppedImage: Could not convert crop to pixels');
      return;
    }

    console.log('drawCroppedImage: Drawing crop', { pixelCrop, imageSize: { width: image.naturalWidth, height: image.naturalHeight } });

    // Configurar canvas para a imagem recortada
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurar qualidade
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Desenhar a imagem recortada
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    console.log('drawCroppedImage: Successfully drawn to canvas');
  }, []);

  // Atualizar preview quando crop muda
  useEffect(() => {
    console.log('useEffect triggered', { 
      completedCrop: !!completedCrop, 
      imgRef: !!imgRef.current, 
      previewCanvasRef: !!previewCanvasRef.current 
    });
    
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      // Pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        drawCroppedImage(imgRef.current, completedCrop, previewCanvasRef.current);
      }, 10);
    }
  }, [completedCrop, drawCroppedImage]);

  const onDownloadCropClick = useCallback(() => {
    if (!previewCanvasRef.current) {
      throw new Error('Crop canvas does not exist');
    }

    previewCanvasRef.current.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create blob');
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = URL.createObjectURL(blob);
      hiddenAnchorRef.current.href = blobUrlRef.current;
      hiddenAnchorRef.current.click();
    });
  }, []);

  const handleSave = async () => {
    if (!previewCanvasRef.current || !completedCrop) {
      setError('Nenhuma imagem selecionada ou recortada');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Criar um canvas temporário para garantir qualidade
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível criar contexto do canvas');
      }

      // Obter dimensões do crop
      const pixelCrop = convertToPixelCrop(completedCrop, imgRef.current.naturalWidth, imgRef.current.naturalHeight);
      
      if (!pixelCrop) {
        throw new Error('Não foi possível calcular dimensões do crop');
      }

      // Configurar canvas com tamanho mínimo de 200x200 para evitar fotos muito pequenas
      const minSize = 200;
      const scale = Math.max(minSize / pixelCrop.width, minSize / pixelCrop.height);
      
      canvas.width = Math.round(pixelCrop.width * scale);
      canvas.height = Math.round(pixelCrop.height * scale);

      // Configurar qualidade do canvas
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Desenhar a imagem recortada no canvas
      ctx.drawImage(
        imgRef.current,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Converter para blob
      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Erro ao processar a imagem');
          setLoading(false);
          return;
        }
        
        // Criar um arquivo a partir do blob
        const file = new File([blob], 'profile-photo.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        onSave(file);
        setLoading(false);
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      setError('Erro ao processar a imagem: ' + error.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    setRotate(0);
    setError('');
    onClose();
  };

  const rotateImage = (direction) => {
    setRotate(prev => direction === 'left' ? prev - 90 : prev + 90);
  };

  const zoomImage = (direction) => {
    setScale(prev => direction === 'in' ? Math.min(prev + 0.1, 3) : Math.max(prev - 0.1, 0.5));
  };

  const resetImage = () => {
    setScale(1);
    setRotate(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <CropIcon color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!imgSrc ? (
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              style={{ display: 'none' }}
            />
            <Typography variant="h6" gutterBottom>
              Clique para selecionar uma foto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Formatos suportados: JPG, PNG, GIF (máx. 5MB)
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Controles */}
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Button
                size="small"
                startIcon={<RotateLeftIcon />}
                onClick={() => rotateImage('left')}
                variant="outlined"
              >
                Girar Esquerda
              </Button>
              <Button
                size="small"
                startIcon={<RotateRightIcon />}
                onClick={() => rotateImage('right')}
                variant="outlined"
              >
                Girar Direita
              </Button>
              <Button
                size="small"
                startIcon={<ZoomInIcon />}
                onClick={() => zoomImage('in')}
                variant="outlined"
              >
                Zoom In
              </Button>
              <Button
                size="small"
                startIcon={<ZoomOutIcon />}
                onClick={() => zoomImage('out')}
                variant="outlined"
              >
                Zoom Out
              </Button>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={resetImage}
                variant="outlined"
              >
                Resetar
              </Button>
            </Stack>

            {/* Editor de imagem */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 300 }}>
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  minWidth={100}
                  minHeight={100}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxHeight: '400px',
                      maxWidth: '100%'
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </Box>

              {/* Preview */}
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Preview:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 200,
                  border: '2px dashed #ccc',
                  borderRadius: 1,
                  bgcolor: '#f5f5f5'
                }}>
                  <canvas
                    ref={previewCanvasRef}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: '50%',
                      border: completedCrop ? '2px solid #1976d2' : '2px dashed #ccc',
                      display: completedCrop ? 'block' : 'none'
                    }}
                  />
                  {!completedCrop && (
                    <Typography color="text.secondary" variant="body2">
                      Selecione uma área para ver o preview
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Aspect ratio controls */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Proporção:
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={aspect === 1 ? "contained" : "outlined"}
                  onClick={() => setAspect(1)}
                >
                  1:1 (Quadrado)
                </Button>
                <Button
                  size="small"
                  variant={aspect === 16/9 ? "contained" : "outlined"}
                  onClick={() => setAspect(16/9)}
                >
                  16:9 (Widescreen)
                </Button>
                <Button
                  size="small"
                  variant={aspect === 4/3 ? "contained" : "outlined"}
                  onClick={() => setAspect(4/3)}
                >
                  4:3 (Padrão)
                </Button>
                <Button
                  size="small"
                  variant={aspect === 0 ? "contained" : "outlined"}
                  onClick={() => setAspect(0)}
                >
                  Livre
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!imgSrc || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CropIcon />}
        >
          {loading ? 'Salvando...' : 'Salvar Foto'}
        </Button>
      </DialogActions>

      {/* Hidden anchor for download */}
      <a
        ref={hiddenAnchorRef}
        download
        style={{
          position: 'absolute',
          top: '-200vh',
          visibility: 'hidden',
        }}
      >
        Hidden download
      </a>
    </Dialog>
  );
};

export default ImageCropModal;
