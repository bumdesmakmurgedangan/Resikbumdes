import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { SocialBrandIcon, getSocialBadgeStyle } from '../components/common/SocialBrandIcon';
import {
  Eye, EyeOff, MessageSquare, Globe, Camera, Share2,
  Video, Mail, MapPin, ArrowRight, ShieldCheck, Lock, UserCheck
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginCustomer, loginStaff, rateLimitCooldownSeconds } = useAuth();
  const settings = dataService.getSettings();
  const activeLinks = dataService.getActiveOrganizationLinks();

  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');

  // Customer form state
  const [customerCode, setCustomerCode] = useState('');
  const [customerPin, setCustomerPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Staff form state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & error handling
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await loginCustomer(customerCode, customerPin);
      if (!res.success) {
        setErrorMessage(res.message || 'Login gagal. Periksa data Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await loginStaff(staffEmail, staffPassword);
      if (!res.success) {
        setErrorMessage(res.message || 'Login petugas gagal.');
      }
    } finally {
      setLoading(false);
    }
  };


  // Quick fill buttons for testing/demo
  const fillSampleCustomer = (code: string, pin: string) => {
    setCustomerCode(code);
    setCustomerPin(pin);
    setErrorMessage(null);
  };

  const fillSampleStaff = (email: string, pass: string) => {
    setStaffEmail(email);
    setStaffPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md w-full mx-auto my-auto py-6">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Top Brand Banner */}
          <div className="p-6 pb-5 text-center bg-gradient-to-b from-brand-50/60 to-white">
            <img
              src={settings.logoUrl}
              alt="Logo RESIK"
              className="h-20 w-auto mx-auto mb-3 object-contain drop-shadow"
              onError={(e) => {
                // If remote logo fails, show stylized text
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            <h1 className="text-2xl font-black text-brand-900 tracking-tight">RESIK</h1>
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mt-0.5">
              Retribusi Elektronik & Sistem Informasi Kebersihan
            </p>
            <p className="text-xs text-brand-700 font-medium mt-1">
              {settings.bumdesName}
            </p>

            {/* Optional Website Link (PRD Section 21) */}
            {settings.website && settings.website.trim().length > 0 && (
              <a
                href={settings.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium mt-2.5 py-1 px-3 bg-brand-50 hover:bg-brand-100 rounded-full transition"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>🌐 Kunjungi Website {settings.bumdesName}</span>
              </a>
            )}
          </div>

          {/* Login Mode Tabs */}
          <div className="px-6 pt-2 pb-0">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setActiveTab('CUSTOMER'); setErrorMessage(null); }}
                className={`py-2.5 rounded-xl transition-all ${
                  activeTab === 'CUSTOMER'
                    ? 'bg-white text-brand-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk Warga
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('STAFF'); setErrorMessage(null); }}
                className={`py-2.5 rounded-xl transition-all ${
                  activeTab === 'STAFF'
                    ? 'bg-white text-brand-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Petugas & Admin
              </button>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <span className="font-bold">⚠️</span>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Rate Limit Cooldown Notice */}
          {rateLimitCooldownSeconds > 0 && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              Terlalu banyak percobaan gagal. Mohon tunggu <strong>{rateLimitCooldownSeconds} detik</strong> sebelum mencoba kembali.
            </div>
          )}

          {/* Form Content */}
          <div className="p-6 pt-5">
            {activeTab === 'CUSTOMER' ? (
              /* ================= CUSTOMER LOGIN FORM ================= */
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    ID Pelanggan
                  </label>
                  <input
                    type="text"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: PLG-RW03-0025"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sesuai kartu/kode pelanggan yang terdaftar di BUMDes
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      PIN Keamanan (4 Digit)
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      maxLength={4}
                      value={customerPin}
                      onChange={(e) => setCustomerPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label="Lihat PIN"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 text-center">
                    PIN default awal: <strong>1234</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || rateLimitCooldownSeconds > 0}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-sm font-bold tracking-wide transition shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  <span>{loading ? 'Memeriksa...' : 'MASUK KE LAYANAN'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Sample Customer Quick Fill for demo evaluation */}
                <div className="pt-2 border-t border-slate-100 text-center">
                  <span className="text-[11px] text-slate-400">Uji coba cepat warga:</span>
                  <div className="flex flex-wrap justify-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => fillSampleCustomer('PLG-RW03-0025', '1234')}
                      className="text-[11px] bg-slate-100 hover:bg-brand-100 hover:text-brand-800 text-slate-600 px-2.5 py-1 rounded-lg font-mono transition"
                    >
                      Budi (Multi-Layanan)
                    </button>
                    <button
                      type="button"
                      onClick={() => fillSampleCustomer('PLG-RW02-0012', '4321')}
                      className="text-[11px] bg-slate-100 hover:bg-brand-100 hover:text-brand-800 text-slate-600 px-2.5 py-1 rounded-lg font-mono transition"
                    >
                      Sri (Pending Verif)
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* ================= STAFF LOGIN FORM ================= */
              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Pengelola
                  </label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="nama@bumdes.id"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Masuk...' : 'MASUK SEBAGAI PENGELOLA'}</span>
                </button>

                {/* Staff Quick Fill for demo evaluation */}
                <div className="pt-2 border-t border-slate-100 text-center">
                  <span className="text-[11px] text-slate-400">Pilih akun pengujian:</span>
                  <div className="flex flex-wrap justify-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => fillSampleStaff('superadmin@bumdes.id', 'superadmin123')}
                      className="text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-100 px-2.5 py-1 rounded-lg font-medium transition"
                    >
                      Super Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => fillSampleStaff('admin@bumdes.id', 'admin123')}
                      className="text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-medium transition"
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => fillSampleStaff('petugas@bumdes.id', 'petugas123')}
                      className="text-[11px] bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-medium transition"
                    >
                      Petugas
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* WhatsApp Help Button (PRD Sections 19 & 20) */}
            {settings.phoneWhatsapp && settings.phoneWhatsapp.trim().length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-500 mb-2">Lupa PIN atau butuh bantuan?</p>
                <a
                  href={`https://wa.me/62${settings.phoneWhatsapp.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(
                    `Halo ${settings.bumdesName}, saya membutuhkan bantuan terkait akun RESIK.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Hubungi WhatsApp BUMDes</span>
                </a>
              </div>
            )}
          </div>

          {/* Social Media Links (PRD Sections 22 & 121) */}
          {activeLinks.length > 0 && (
            <div className="bg-slate-50 p-4 border-t border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 text-center tracking-wider mb-2.5">
                Media Sosial & Informasi Resmi
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {activeLinks.map((link) => {
                  const style = getSocialBadgeStyle(link.type);
                  const appName = style.brandName || link.label;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 transition shadow-2xs hover:shadow-xs hover:-translate-y-0.5 ${style.hoverBorder}`}
                      title={appName}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${style.badgeBg}`}>
                        <SocialBrandIcon type={link.type} className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate max-w-[130px]">{appName}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer tagline */}
        <p className="text-center text-xs text-slate-400 font-medium mt-6">
          "Iuran Mudah, Lingkungan Bersih." • {settings.bumdesName}
        </p>
      </div>
    </div>
  );
};
