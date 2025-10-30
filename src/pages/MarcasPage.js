import React from 'react';
import GenericCrudPage from '../components/GenericCrudPage';
import marcaService from '../services/marcaService';
import { DirectionsCar as CarIcon } from '@mui/icons-material';

const MarcasPage = () => {
  return (
    <GenericCrudPage
      title="Gerenciar Marcas"
      apiService={marcaService}
      itemName="marca"
      itemNamePlural="marcas"
      icon={CarIcon}
    />
  );
};

export default MarcasPage;


