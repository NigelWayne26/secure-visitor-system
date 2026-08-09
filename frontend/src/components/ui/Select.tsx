import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className = '', id, ...props }) => {
  const selectId = id || props.name;
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`px-3 py-2 border rounded-md text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
            : 'border-slate-300 focus:ring-slate-200 focus:border-slate-600'
        } ${className}`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};