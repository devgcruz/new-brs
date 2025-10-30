import React from 'react';
import GenericCrudPage from '../components/GenericCrudPage';
import posicaoService from '../services/posicaoService';
import { Work as WorkIcon } from '@mui/icons-material';

const PosicoesPage = () => {
  return (
    <GenericCrudPage
      title="Gerenciar Posições"
      apiService={posicaoService}
      itemName="posição"
      itemNamePlural="posições"
      icon={WorkIcon}
    />
  );
};

export default PosicoesPage;


