import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-success text-success-foreground',
          icon: 'CheckCircle',
          border: 'border-success/20'
        };
      case 'error':
        return {
          bg: 'bg-error text-error-foreground',
          icon: 'XCircle',
          border: 'border-error/20'
        };
      case 'warning':
        return {
          bg: 'bg-warning text-warning-foreground',
          icon: 'AlertTriangle',
          border: 'border-warning/20'
        };
      case 'info':
        return {
          bg: 'bg-info text-info-foreground',
          icon: 'Info',
          border: 'border-info/20'
        };
      default:
        return {
          bg: 'bg-card text-foreground',
          icon: 'Info',
          border: 'border-border'
        };
    }
  };

  if (!isVisible) return null;

  const styles = getTypeStyles();

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300',
        'animate-slide-in-right',
        isExiting && 'animate-slide-out-right'
      )}
    >
      <div
        className={cn(
          'rounded-lg border shadow-lg p-4 flex items-start gap-3',
          styles.bg,
          styles.border,
          'hover-lift animate-fade-in-scale'
        )}
      >
        <Icon name={styles.icon} size={20} className="flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Close notification"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
    </div>
  );
};

// Toast Container for managing multiple toasts
export const ToastContainer = ({ toasts, onRemoveToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemoveToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>
  );
};

// Custom hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };
};

export default Toast;