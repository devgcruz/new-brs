import React from 'react';
import GenericCrudPage from '../components/GenericCrudPage';
import prestadorService from '../services/prestadorService';
import { Business as BusinessIcon } from '@mui/icons-material';

const PrestadoresPage = () => {
  return (
    <GenericCrudPage
      title="Gerenciamento de Prestadores"
      apiService={prestadorService}
      itemName="Prestador"
      itemNamePlural="prestadores"
      icon={BusinessIcon}
    />
  );
};

export default PrestadoresPage;