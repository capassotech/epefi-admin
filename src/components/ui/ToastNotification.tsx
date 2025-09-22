// src/components/ui/ToastNotification.tsx
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }[type];

  // ✅ Opcional: Agregamos un hover para cerrar manualmente
  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg text-white shadow-lg ${bgColor} animate-fade-in-down cursor-pointer transform hover:scale-105 transition-transform duration-200`}
      onClick={onClose} // 👈 Cierra al hacer clic
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2">
        {type === 'success' && <span aria-label="Éxito">✅</span>}
        {type === 'error' && <span aria-label="Error">❌</span>}
        {type === 'warning' && <span aria-label="Advertencia">⚠️</span>}
        {type === 'info' && <span aria-label="Información">ℹ️</span>}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default ToastNotification;