import { useState, useCallback } from 'react';

const useNotification = () => {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
    duration: 1000
  });

  const showNotification = useCallback((message, severity = 'info', duration = 1000) => {
    setNotification({
      open: true,
      message,
      severity,
      duration
    });
  }, []);

  const showSuccess = useCallback((message, duration = 1000) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message, duration = 1000) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration = 1000) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration = 1000) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  };
};

export default useNotification;

