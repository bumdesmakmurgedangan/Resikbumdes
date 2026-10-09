import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import {
  Menu, X, LogOut, User as UserIcon, Shield,
  CheckCircle2, AlertCircle, RefreshCw, Sparkles, Building2
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { currentUser, currentCustomer, role, logout, isCustomer, isStaff, loginStaff, loginCustomer } = useAuth();
  const settings = dataService.getSettings();
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);

  const getRoleBadge = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-purple-200">SUPER ADMIN</span>;
      case 'ADMIN':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200">ADMIN</span>;
      case 'PETUGAS':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">PETUGAS</span>;
      case 'CUSTOMER':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">WARGA</span>;
      default:
        return null;
    }
  };

  const handleQuickSwitch = async (type: string, idOrEmail: string, pinOrPass: string) => {
    setShowDemoSwitcher(false);
    if (type === 'CUSTOMER') {
      await loginCustomer(idOrEmail, pinOrPass);
    } else {
      await loginStaff(idOrEmail, pinOrPass);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 transition-all">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition focus:outline-none"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-2.5">
            <img
              src={settings.logoUrl}
              alt="Logo RESIK"
              className="h-9 w-9 object-contain drop-shadow-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-brand-900 tracking-tight text-lg leading-none">RESIK</span>
                <span className="hidden sm:inline-block text-[10px] bg-brand-100 text-brand-800 font-bold px-1.5 py-0.5 rounded">v4.0</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-600 leading-tight truncate max-w-[200px] sm:max-w-none">
                {settings.bumdesName}
              </p>
            </div>
          </div>
        </div>

        {/* Right: User Status & Demo Switcher & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Quick Role Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setShowDemoSwitcher(!showDemoSwitcher)}
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition border border-slate-200"
              title="Ganti akun untuk pengujian PRD"
            >
              <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
              <span>Simulasi Akun</span>
            </button>

            {showDemoSwitcher && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-100 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  Ganti Akun Cepat (Testing)
                </div>
                <div className="py-1">
                  <button
                    onClick={() => handleQuickSwitch('STAFF', 'superadmin@bumdes.id', 'superadmin123')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Pak Joko Sutrisno</div>
                      <div className="text-[10px] text-slate-400">superadmin@bumdes.id</div>
                    </div>
                    <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Super Admin</span>
                  </button>

                  <button
                    onClick={() => handleQuickSwitch('STAFF', 'admin@bumdes.id', 'admin123')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Ibu Siti Aminah</div>
                      <div className="text-[10px] text-slate-400">admin@bumdes.id</div>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Admin</span>
                  </button>

                  <button
                    onClick={() => handleQuickSwitch('STAFF', 'petugas@bumdes.id', 'petugas123')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Andi Prasetyo</div>
                      <div className="text-[10px] text-slate-400">petugas@bumdes.id</div>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Petugas</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => handleQuickSwitch('CUSTOMER', 'PLG-RW03-0025', '1234')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Budi Santoso (Multi-Layanan)</div>
                      <div className="text-[10px] text-emerald-600 font-mono">PLG-RW03-0025</div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Warga</span>
                  </button>

                  <button
                    onClick={() => handleQuickSwitch('CUSTOMER', 'PLG-RW02-0012', '4321')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">Ibu Sri Wahyuni (Menunggu Verif)</div>
                      <div className="text-[10px] text-emerald-600 font-mono">PLG-RW02-0012</div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Warga</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 pl-2">
            <div className="hidden sm:block text-right">
              <div className="font-bold text-xs text-slate-800 leading-tight">
                {currentUser?.fullName || currentCustomer?.name || 'Pengguna'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {currentCustomer?.customerCode || currentUser?.email}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {getRoleBadge()}
              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Keluar dari Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
