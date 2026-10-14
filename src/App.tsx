import React, { useState, useEffect } from 'react';
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

const MainLayout: React.FC = () => {
  const { isAuthenticated, isCustomer, isStaff } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(isCustomer ? 'customer-dashboard' : 'dashboard');
  const [overdueFilterRw, setOverdueFilterRw] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync active tab when user switches role
  useEffect(() => {
    if (isCustomer && !activeTab.startsWith('customer-')) {
      setActiveTab('customer-dashboard');
    } else if (isStaff && activeTab.startsWith('customer-')) {
      setActiveTab('dashboard');
    }
  }, [isCustomer, isStaff]);

  const handleNavigateTab = (tab: string, param?: string) => {
    if (tab === 'overdue') {
      setOverdueFilterRw(param || 'ALL');
    }
    setActiveTab(tab);
  };

  // If not logged in, render the login page
  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    if (isCustomer) {
      return (
        <CustomerDashboardView
          activeTab={activeTab}
          onNavigateTab={handleNavigateTab}
        />
      );
    }

    // Staff Views
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardView onNavigateTab={handleNavigateTab} />;
      case 'verification':
        return <VerificationView />;
      case 'overdue':
        return <OverdueView initialRw={overdueFilterRw} />;
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
        return <AdminDashboardView onNavigateTab={handleNavigateTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigateTab={handleNavigateTab}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 print:p-0">
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
