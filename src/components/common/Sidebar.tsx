import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import {
  LayoutDashboard, CheckSquare, AlertTriangle, Users,
  Banknote, MapPin, Radio, BarChart3, FileSpreadsheet,
  Settings, History, MessageSquare, HelpCircle, Shield, X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose
}) => {
  const { role, isCustomer, isStaff, hasPermission } = useAuth();

  // Get pending verification count for badge
  const pendingPaymentsCount = dataService.getPayments({ status: 'PENDING' }).length;
  // Get overdue count for badge
  const overdueCustomersCount = dataService.getOverdueCustomers().length;

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  const navItemClass = (tab: string) => `
    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all
    ${activeTab === tab
      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }
  `;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-0 md:top-[57px] left-0 z-40
          h-screen md:h-[calc(100vh-57px)]
          w-64 bg-white border-r border-slate-200
          flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Header in Drawer */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200">
          <span className="font-extrabold text-brand-900">Menu RESIK</span>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-500 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {isCustomer ? (
            /* ================= CUSTOMER MENU ================= */
            <div className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Layanan Warga
              </div>

              <button
                onClick={() => handleSelectTab('customer-dashboard')}
                className={navItemClass('customer-dashboard')}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Tagihan & Status Layanan</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('customer-history')}
                className={navItemClass('customer-history')}
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 shrink-0" />
                  <span>Histori & Bukti Bayar</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('customer-broadcast')}
                className={navItemClass('customer-broadcast')}
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 shrink-0" />
                  <span>Pengumuman</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('customer-help')}
                className={navItemClass('customer-help')}
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>Bantuan & Kontak BUMDes</span>
                </div>
              </button>
            </div>
          ) : (
            /* ================= STAFF MENU ================= */
            <div className="space-y-5">
              {/* Operasional Utama */}
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Operasional
                </div>

                <button
                  onClick={() => handleSelectTab('dashboard')}
                  className={navItemClass('dashboard')}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span>Dashboard Ringkasan</span>
                  </div>
                </button>

                {hasPermission('PAYMENT_VERIFY') && (
                  <button
                    onClick={() => handleSelectTab('verification')}
                    className={navItemClass('verification')}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-4 h-4 shrink-0" />
                      <span>Verifikasi Transfer/QRIS</span>
                    </div>
                    {pendingPaymentsCount > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                        {pendingPaymentsCount}
                      </span>
                    )}
                  </button>
                )}

                {hasPermission('OVERDUE_VIEW') && (
                  <button
                    onClick={() => handleSelectTab('overdue')}
                    className={navItemClass('overdue')}
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Tunggakan & WA Reminder</span>
                    </div>
                    {overdueCustomersCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {overdueCustomersCount}
                      </span>
                    )}
                  </button>
                )}

                {hasPermission('PAYMENT_CREATE') && (
                  <button
                    onClick={() => handleSelectTab('cash-payment')}
                    className={navItemClass('cash-payment')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Banknote className="w-4 h-4 shrink-0" />
                      <span>Catat Pembayaran Tunai</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Data & Lapangan */}
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Data & Wilayah
                </div>

                {hasPermission('CUSTOMER_VIEW') && (
                  <button
                    onClick={() => handleSelectTab('customers')}
                    className={navItemClass('customers')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 shrink-0" />
                      <span>Pelanggan & Lokasi Layanan</span>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => handleSelectTab('map')}
                  className={navItemClass('map')}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Peta Sebaran GPS</span>
                  </div>
                </button>

                {hasPermission('BROADCAST_SEND') && (
                  <button
                    onClick={() => handleSelectTab('broadcast')}
                    className={navItemClass('broadcast')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Radio className="w-4 h-4 shrink-0" />
                      <span>Broadcast Pengumuman</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Laporan & Administrasi */}
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Laporan & Arsip
                </div>

                {hasPermission('REPORT_VIEW') && (
                  <button
                    onClick={() => handleSelectTab('reports')}
                    className={navItemClass('reports')}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 shrink-0" />
                      <span>Laporan & Rekapitulasi</span>
                    </div>
                  </button>
                )}

                {hasPermission('IMPORT_DATA') && (
                  <button
                    onClick={() => handleSelectTab('import-export')}
                    className={navItemClass('import-export')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 shrink-0" />
                      <span>Import & Export Excel</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Konfigurasi Sistem (Super Admin & Authorized Admin) */}
              {(role === 'SUPER_ADMIN' || hasPermission('MANAGE_SETTINGS')) && (
                <div className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pengaturan BUMDes
                  </div>

                  <button
                    onClick={() => handleSelectTab('settings')}
                    className={navItemClass('settings')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 shrink-0" />
                      <span>Pengaturan Sistem</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectTab('audit-logs')}
                    className={navItemClass('audit-logs')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>Audit Log Aktivitas</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          <div className="font-semibold text-slate-700">BUMDes Makmur Gedangan</div>
          <div className="text-[10px] text-slate-400">"Iuran Mudah, Lingkungan Bersih"</div>
        </div>
      </aside>
    </>
  );
};
