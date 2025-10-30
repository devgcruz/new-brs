import React, { useEffect } from 'react';
import { Dialog } from '@mui/material';

const BlurredDialog = ({ children, open, ...props }) => {
  useEffect(() => {
    if (open) {
      // Adicionar classe ao body para indicar que há modal aberto
      document.body.classList.add('modal-open');
      
      // Aplicar blur via JavaScript com transição suave
      const timer = setTimeout(() => {
        // Aplicar blur em TODOS os backdrops primeiro, EXCETO drawer
        const backdrops = document.querySelectorAll('[class*="MuiBackdrop-root"], [role="presentation"]');
        backdrops.forEach(backdrop => {
          // Verificar se NÃO é um backdrop do drawer
          const isDrawerBackdrop = backdrop.closest('[class*="MuiDrawer"]') || 
                                  backdrop.closest('.MuiDrawer-root') ||
                                  backdrop.closest('.MuiDrawer-paper');
          
          if (!isDrawerBackdrop) {
            backdrop.style.setProperty('backdrop-filter', 'blur(4px)', 'important');
            backdrop.style.setProperty('-webkit-backdrop-filter', 'blur(4px)', 'important');
            backdrop.style.setProperty('background-color', 'rgba(255, 255, 255, 0.3)', 'important');
            backdrop.style.setProperty('transition', 'backdrop-filter 0.4s ease-in-out, background-color 0.4s ease-in-out', 'important');
          }
        });
        
        // Garantir que drawer NUNCA tenha blur
        const drawerElements = document.querySelectorAll('[class*="MuiDrawer"], .MuiDrawer-root, .MuiDrawer-paper');
        drawerElements.forEach(element => {
          element.style.setProperty('backdrop-filter', 'none', 'important');
          element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
          element.style.setProperty('filter', 'none', 'important');
          element.style.setProperty('transition', 'backdrop-filter 0.2s ease-in-out', 'important');
        });
        
        // Depois remover blur APENAS de dropdowns e menus
        const dropdownElements = document.querySelectorAll('.MuiSelect-root, .MuiMenu-root, .MuiPopover-root, .MuiPopper-root, .MuiMenuItem-root');
        dropdownElements.forEach(element => {
          element.style.setProperty('backdrop-filter', 'none', 'important');
          element.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
          element.style.setProperty('transition', 'backdrop-filter 0.2s ease-in-out', 'important');
        });
        
        // Remover blur dos backdrops de dropdowns especificamente
        const dropdownBackdrops = document.querySelectorAll('.MuiSelect-root .MuiBackdrop-root, .MuiMenu-root .MuiBackdrop-root, .MuiPopover-root .MuiBackdrop-root, .MuiPopper-root .MuiBackdrop-root');
        dropdownBackdrops.forEach(backdrop => {
          backdrop.style.setProperty('backdrop-filter', 'none', 'important');
          backdrop.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
          backdrop.style.setProperty('background-color', 'transparent', 'important');
          backdrop.style.setProperty('transition', 'backdrop-filter 0.2s ease-in-out, background-color 0.2s ease-in-out', 'important');
        });
      }, 10);
      
      return () => clearTimeout(timer);
    } else {
      // Verificar se ainda há outros modais abertos antes de remover a classe
      const timer = setTimeout(() => {
        const openModals = document.querySelectorAll('[role="dialog"][style*="display: block"], [role="dialog"]:not([style*="display: none"])');
        if (openModals.length === 0) {
          document.body.classList.remove('modal-open');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog
      {...props}
      open={open}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'backdrop-filter 0.4s ease-in-out, background-color 0.4s ease-in-out'
        },
        style: {
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          transition: 'backdrop-filter 0.4s ease-in-out, background-color 0.4s ease-in-out'
        }
      }}
    >
      {children}
    </Dialog>
  );
};

export default BlurredDialog;
