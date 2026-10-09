import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LoginView } from './views/LoginView';
import { CustomerDashboardView } from './views/CustomerDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { VerificationView } from './views/VerificationView';
import { OverdueView } from './views/OverdueView';
import { CustomersView } from './views/CustomersView';
import { CashPaymentView } from './views/CashPaymentView';
import { MapView } from './views/MapView';
import { ImportExportView } from './views/ImportExportView';
import { ReportsView } from './views/ReportsView';
import { BroadcastView } from './views/BroadcastView';
import { SettingsView } from './views/SettingsView';
import { AuditLogsView } from './views/AuditLogsView';
import { dataService } from './services/dataService';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isCustomer, isStaff, role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(isCustomer ? 'customer-dashboard' : 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If not logged in, render the login page
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    if (isCustomer) {
      switch (activeTab) {
        case 'customer-dashboard':
        case 'customer-history':
        case 'customer-broadcast':
        case 'customer-help':
        default:
          return <CustomerDashboardView />;
      }
    }

    // Staff Views
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardView onNavigateTab={setActiveTab} />;
      case 'verification':
        return <VerificationView />;
      case 'overdue':
        return <OverdueView />;
      case 'customers':
        return <CustomersView />;
      case 'cash-payment':
        return <CashPaymentView />;
      case 'map':
        return <MapView />;
      case 'broadcast':
        return <BroadcastView />;
      case 'reports':
        return <ReportsView />;
      case 'import-export':
        return <ImportExportView />;
      case 'settings':
        return <SettingsView />;
      case 'audit-logs':
        return <AuditLogsView />;
      default:
        return <AdminDashboardView onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
