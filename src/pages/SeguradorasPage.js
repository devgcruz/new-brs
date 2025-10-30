import React from 'react';
import GenericCrudPage from '../components/GenericCrudPage';
import seguradoraService from '../services/seguradoraService';
import { Security as SecurityIcon } from '@mui/icons-material';

const SeguradorasPage = () => {
  return (
    <GenericCrudPage
      title="Gerenciar Seguradoras"
      apiService={seguradoraService}
      itemName="seguradora"
      itemNamePlural="seguradoras"
      icon={SecurityIcon}
    />
  );
};

export default SeguradorasPage;


