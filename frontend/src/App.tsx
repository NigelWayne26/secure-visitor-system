import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VisitorsPage } from './pages/VisitorsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { VisitsPage } from './pages/VisitsPage';
import { VerifyPassPage } from './pages/VerifyPassPage';
import { CurrentlyInsidePage } from './pages/CurrentlyInsidePage';
import { ReportsPage } from './pages/ReportsPage';
import { Layout } from './components/layout/Layout';
import type { ActiveTab } from './types';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'visitors' && <VisitorsPage />}
      {activeTab === 'employees' && <EmployeesPage />}
      {activeTab === 'visits' && <VisitsPage />}
      {activeTab === 'verify' && <VerifyPassPage />}
      {activeTab === 'currently_inside' && <CurrentlyInsidePage />}
      {activeTab === 'reports' && <ReportsPage />}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}