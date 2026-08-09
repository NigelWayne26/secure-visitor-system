import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded uppercase">
          {user?.role || 'Receptionist'}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700">{user?.username}</span>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
};