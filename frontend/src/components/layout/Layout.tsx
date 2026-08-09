import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { ActiveTab } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};