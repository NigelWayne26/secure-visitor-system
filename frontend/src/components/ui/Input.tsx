import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || props.name;
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`px-3 py-2 border rounded-md text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
            : 'border-slate-300 focus:ring-slate-200 focus:border-slate-600'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};