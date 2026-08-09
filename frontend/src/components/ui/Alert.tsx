import React from 'react';

interface AlertProps {
  type?: 'error' | 'success' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type = 'error', message, onClose }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-slate-50 border-slate-200 text-slate-800',
  };

  return (
    <div className={`p-4 border rounded-lg flex items-center justify-between text-sm ${styles[type]} mb-4`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-4 font-bold opacity-60 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
};