import React from 'react';

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const getBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'checked_in':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'checked_out':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'expired':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(status)}`}>
      {status.replace('_', ' ')}
    </span>
  );
};