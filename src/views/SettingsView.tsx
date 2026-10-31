import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import {
  BankAccount, OrganizationLink, Category, Tariff, Region,
  MessageTemplate, User, RoleType, TemplateType
} from '../types';
import {
  Settings, Building2, Globe, CreditCard, QrCode, MapPin,
  Tag, Calendar, MessageSquare, Users, Shield, Plus,
  Edit2, Trash2, Check, X, Database, RefreshCw, Upload, Image,
  CheckCircle2, RotateCcw, Smartphone, Sparkles, AlertTriangle, AlertCircle, Lock,
  Copy, Cloud, CloudUpload, CloudDownload, Palette, Sun, Moon, Eye
} from 'lucide-react';
import { saveSupabaseConfig, clearSupabaseConfig, getSupabaseConfig } from '../lib/supabase';
import { SocialBrandIcon, getSocialBadgeStyle } from '../components/common/SocialBrandIcon';
import { CustomerCard } from '../components/customer/CustomerCard';

export const SettingsView: React.FC = () => {
  const { currentUser, role } = useAuth();
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<
    'PROFIL' | 'KOP' | 'LINKS' | 'BANK' | 'QRIS' | 'WILAYAH' | 'TARIF' | 'TEMPLATES' | 'USERS' | 'SUPABASE' | 'KARTU'
  >('PROFIL');

  const [refreshKey, setRefreshKey] = useState(0);

  // Settings State
  const [settings, setSettings] = useState(dataService.getSettings());
  const bankAccounts = dataService.getBankAccounts();
  const orgLinks = dataService.getOrganizationLinks();
  const categories = dataService.getCategories();
  const tariffs = dataService.getTariffs();
  const regions = dataService.getRegions();
  const [templateList, setTemplateList] = useState<MessageTemplate[]>(dataService.getMessageTemplates());

  // Template Kartu Custom Background State
  const cardBgInputRef = React.useRef<HTMLInputElement>(null);
  const [cardUploadError, setCardUploadError] = useState<string | null>(null);

  const sampleCardCustomer = dataService.getCustomers()[0] || {
    id: 'sample-c1',
    customerCode: 'PLG-RW01-0001',
    name: 'Bpk. Bambang Sudarsono',
    phone: '081234567890',
    address: 'RT 02 / RW 01, Dusun Krajan',
    pinHash: '1234',
    isDefaultPin: false,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const sampleCardService = dataService.getServiceLocations()[0];
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType>('WHATSAPP_ACCOUNT_CONFIRMATION');
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  const users = dataService.getUsers();
  const roles = dataService.getRoles();

  const handleSaveTemplate = (tpl: MessageTemplate) => {
    dataService.saveMessageTemplate(tpl, currentUser);
    setTemplateList(dataService.getMessageTemplates());
    setSaveSuccessId(tpl.id);
    setTimeout(() => setSaveSuccessId(null), 3000);
  };

  const handleResetTemplate = (templateId: string) => {
    if (window.confirm('Kembalikan template ini ke format pesan standar BUMDes?')) {
      dataService.resetMessageTemplate(templateId, currentUser);
      setTemplateList(dataService.getMessageTemplates());
      setSaveSuccessId(templateId);
      setTimeout(() => setSaveSuccessId(null), 3000);
    }
  };

  // Supabase runtime config state
  const supabaseConfig = getSupabaseConfig();
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(supabaseConfig.supabaseUrl);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(supabaseConfig.supabaseAnonKey);

  // Modals state
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Partial<BankAccount>>({
    bankName: '',
    accountNumber: '',
    accountName: '',
    isActive: true,
    sortOrder: 1
  });

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Partial<OrganizationLink>>({
    type: 'WHATSAPP',
    label: '',
    url: '',
    isActive: true,
    sortOrder: 1
  });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({
    fullName: '',
    email: '',
    phone: '',
    role: 'PETUGAS',
    status: 'ACTIVE'
  });

  // Safety Lock Reset modal state
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [resetMode, setResetMode] = useState<'TRANSACTIONS_ONLY' | 'FULL_DATABASE'>('TRANSACTIONS_ONLY');

  // Cloud Sync & SQL state
  const [cloudSyncStatus, setCloudSyncStatus] = useState(dataService.getCloudSyncStatus());
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [billGenFeedback, setBillGenFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = dataService.subscribeSync(() => {
      setCloudSyncStatus(dataService.getCloudSyncStatus());
    });
    return unsub;
  }, []);

  const handlePullCloud = async () => {
    setSyncFeedback(null);
    const res = await dataService.pullFromCloud();
    setSyncFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
    if (res.success) {
      setRefreshKey(prev => prev + 1);
    }
  };

  const handlePushCloud = async () => {
    setSyncFeedback(null);
    const res = await dataService.pushAllToCloud();
    setSyncFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
  };

  const handleCopySql = () => {
    const sql = `-- ============================================================
-- SCRIPT AKTIVASI SINKRONISASI CLOUD RESIK V4.0 KE SUPABASE
-- BUMDes Makmur Gedangan
-- Jalankan di menu SQL Editor Supabase Anda
-- ============================================================

CREATE TABLE IF NOT EXISTS public.resik_cloud_sync (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resik_cloud_sync DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tariffs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.broadcasts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_registrations DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.resik_cloud_sync TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;`;
    navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 3000);
  };

  const handleGenerateBillsMass = () => {
    const res = dataService.generateMonthlyBillsForAll(undefined, undefined, currentUser);
    setBillGenFeedback(`Berhasil menerbitkan ${res.created} tagihan baru bulan berjalan (${res.skipped} tagihan sudah ada).`);
    setTimeout(() => setBillGenFeedback(null), 5000);
    setRefreshKey(prev => prev + 1);
  };

  // Category & Tariff modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id?: string;
    name: string;
    description: string;
    amount: number;
    effectiveFrom: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    name: '',
    description: '',
    amount: 20000,
    effectiveFrom: new Date().toISOString().split('T')[0],
    status: 'ACTIVE'
  });

  const handleOpenAddCategory = () => {
    setEditingCategory({
      name: '',
      description: '',
      amount: 20000,
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    const trf = tariffs.find(t => t.categoryId === cat.id);
    setEditingCategory({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      amount: trf ? trf.amount : 20000,
      effectiveFrom: trf?.effectiveFrom || '2026-01-01',
      status: cat.status
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory.name.trim()) {
      alert('Nama kategori wajib diisi.');
      return;
    }
    if (editingCategory.amount < 0) {
      alert('Nominal tarif tidak boleh bernilai negatif.');
      return;
    }

    try {
      dataService.saveCategoryWithTariff(editingCategory, currentUser);
      setCategoryModalOpen(false);
      setRefreshKey(prev => prev + 1);
      alert('Kategori dan tarif pelanggan berhasil disimpan!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kategori');
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return;

    const res = dataService.deleteCategory(cat.id, currentUser);
    if (!res.success) {
      alert(res.message || 'Kategori tidak dapat dihapus');
      return;
    }
    setRefreshKey(prev => prev + 1);
    alert(`Kategori "${cat.name}" berhasil dihapus.`);
  };

  // Handle General Profile Settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateSettings(settings, currentUser);
    alert('Pengaturan profil BUMDes berhasil disimpan!');
    setRefreshKey(prev => prev + 1);
  };

  // Bank handlers
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank.bankName || !editingBank.accountNumber || !editingBank.accountName) {
      alert('Nama bank, nomor rekening, dan nama pemilik rekening wajib diisi.');
      return;
    }
    dataService.saveBankAccount(editingBank as BankAccount, currentUser);
    setBankModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  // Social link handlers
  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink.label || !editingLink.url) {
      alert('Label dan URL link wajib diisi.');
      return;
    }
    dataService.saveOrganizationLink(editingLink as OrganizationLink, currentUser);
    setLinkModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  // User handlers
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.fullName || !editingUser.email) {
      alert('Nama lengkap dan email wajib diisi.');
      return;
    }
    dataService.saveUser(editingUser, currentUser);
    setUserModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Pengaturan Sistem BUMDes (Anti-Hardcode)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola seluruh konfigurasi operasional, rekening, tarif, wilayah, dan akses pengguna secara mandiri.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('PROFIL')}
          className={`px-3 py-2 rounded-xl transition ${activeTab === 'PROFIL' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Profil BUMDes
        </button>
        <button
          onClick={() => setActiveTab('KOP')}
          className={`px-3 py-2 rounded-xl transition ${activeTab === 'KOP' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Kop &amp; Cetak PDF
        </button>
        <button
          onClick={() => setActiveTab('BANK')}
          className={`px-3 py-2 rounded-xl transition ${activeTab === 'BANK' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Rekening Bank
        </button>
        <button
          onClick={() => setActiveTab('QRIS')}
          className={`px-3 py-2 rounded-xl transition ${activeTab === 'QRIS' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          QRIS Pembayaran
        </button>
        <button
          onClick={() => setActiveTab('KARTU')}
          className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeTab === 'KARTU' ? 'bg-white text-brand-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-purple-600" />
          <span>Template Kartu</span>
        </button>
        <button
          onClick={() => setActiveTab('LINKS')}
          className={`px-3 py-2 rounded-xl transition ${activeTab === 'LINKS' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Kontak & Sosmed
        </button>
        <button
          onClick={() => setActiveTab('TARIF')}
          className={`px-3 py-2 rounded-xl transition ${activeTab === 'TARIF' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Kategori & Tarif
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`px-3 py-2 rounded-xl transition ${activeTab === 'TEMPLATES' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Template WA
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-3 py-2 rounded-xl transition ${activeTab === 'USERS' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Pengguna & Akses
        </button>
        <button
          onClick={() => setActiveTab('SUPABASE')}
          className={`px-3 py-2 rounded-xl transition ${activeTab === 'SUPABASE' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Koneksi Supabase
        </button>
      </div>

      {/* ================= TAB 1: PROFIL BUMDES ================= */}
      {activeTab === 'PROFIL' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs max-w-2xl">
            <div>
              <label className="block font-bold uppercase text-slate-700 mb-1">Nama Organisasi / BUMDes</label>
              <input
                type="text"
                value={settings.bumdesName}
                onChange={(e) => setSettings({ ...settings, bumdesName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-700 mb-1">Slogan / Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            {/* Logo RESIK & Favicon Browser Tab */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              {/* Kolom 1: Logo RESIK */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold uppercase text-slate-700">URL Logo RESIK</label>
                  <span className="text-[11px] text-slate-400 font-normal">Tampil di login &amp; kop</span>
                </div>
                <input
                  type="text"
                  value={settings.logoUrl}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  placeholder="/logo.webp atau https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs bg-white"
                />
                
                {/* Logo Preview */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Preview Logo"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">Tidak ada</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <p className="font-semibold text-slate-700">Preview Logo Utama</p>
                    <p className="text-[10px] text-slate-400">Format: PNG, WEBP, SVG, atau JPG.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSettings({ ...settings, faviconUrl: settings.logoUrl });
                        dataService.applyFavicon(settings.logoUrl);
                      }}
                      className="text-brand-600 hover:text-brand-700 font-bold hover:underline mt-0.5 inline-block cursor-pointer"
                    >
                      ↳ Samakan ke Favicon
                    </button>
                  </div>
                </div>
              </div>

              {/* Kolom 2: Favicon Tab Browser */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold uppercase text-slate-700">Favicon Tab Browser</label>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Icon Tab Web
                  </span>
                </div>
                <input
                  type="text"
                  value={settings.faviconUrl || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings({ ...settings, faviconUrl: val });
                    if (val) dataService.applyFavicon(val);
                  }}
                  placeholder="https://... atau upload file di bawah"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs bg-white"
                />

                {/* Upload Local File or Reset Action */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer shadow-2xs transition">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload File Favicon</span>
                    <input
                      type="file"
                      accept="image/x-icon,image/png,image/svg+xml,image/webp,image/jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert('Ukuran file terlalu besar. Maksimal 2 MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (uploadEvt) => {
                            const result = uploadEvt.target?.result as string;
                            if (result) {
                              setSettings({ ...settings, faviconUrl: result });
                              dataService.applyFavicon(result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {settings.faviconUrl && settings.faviconUrl !== settings.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setSettings({ ...settings, faviconUrl: settings.logoUrl });
                        dataService.applyFavicon(settings.logoUrl);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-medium transition cursor-pointer"
                    >
                      Reset ke Logo Utama
                    </button>
                  )}
                </div>

                {/* Simulated Browser Tab Preview */}
                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 mb-1 font-medium">Simulasi Tampilan Tab Browser:</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-200/90 rounded-t-lg border-t border-x border-slate-300 text-slate-700 shadow-2xs">
                    <div className="w-4 h-4 rounded-xs flex items-center justify-center overflow-hidden shrink-0 bg-white shadow-2xs">
                      <img
                        src={settings.faviconUrl || settings.logoUrl}
                        alt="Favicon Tab"
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 truncate max-w-[170px]">
                      RESIK - {settings.bumdesName || 'BUMDes'}
                    </span>
                    <span className="text-slate-400 text-[10px] ml-1">✕</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-700 mb-1">Alamat Kantor BUMDes</label>
              <textarea
                rows={2}
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Nomor WhatsApp Resmi</label>
                <input
                  type="text"
                  value={settings.phoneWhatsapp}
                  onChange={(e) => setSettings({ ...settings, phoneWhatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Tanggal Jatuh Tempo Bulanan</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={settings.defaultDueDay}
                  onChange={(e) => setSettings({ ...settings, defaultDueDay: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Email Layanan</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Website Utama BUMDes</label>
                <input
                  type="url"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  placeholder="https://bumdesmakmurgedangan.my.id"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="block font-bold uppercase text-slate-700 mb-1">
                Subdomain Web App Layanan RESIK (Alamat Login Warga)
              </label>
              <input
                type="url"
                value={settings.appUrl || ''}
                onChange={(e) => setSettings({ ...settings, appUrl: e.target.value })}
                placeholder="https://resik.bumdesmakmurgedangan.my.id/"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs text-emerald-800 font-semibold"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Alamat web app resmi layanan retribusi yang dikirimkan ke warga via WhatsApp (variabel <code>{'{link_resik}'}</code>)
              </p>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition shadow-sm"
              >
                Simpan Perubahan Profil
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB: KOP & CETAK PDF ================= */}
      {activeTab === 'KOP' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Pengaturan Kop Surat &amp; Penandatangan Laporan Cetak (Anti-Hardcode)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur format kop surat resmi BUMDes dan nama/jabatan pejabat penandatangan yang tercetak pada laporan PDF.
              </p>
            </div>
            <button
              onClick={() => {
                dataService.updateSettings(settings, currentUser);
                alert('Pengaturan kop surat & tanda tangan berhasil disimpan!');
                setRefreshKey(prev => prev + 1);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Pengaturan */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <span>1. Format Kop Surat Laporan (Header)</span>
                </h3>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Instansi Induk (Pemerintah Kabupaten / Kecamatan / Desa)
                  </label>
                  <input
                    type="text"
                    value={settings.kopParentInstitution || ''}
                    onChange={(e) => setSettings({ ...settings, kopParentInstitution: e.target.value })}
                    placeholder="Contoh: PEMERINTAH KABUPATEN SIDOARJO • KECAMATAN GEDANGAN"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Nama Badan Usaha (BUMDes)
                  </label>
                  <input
                    type="text"
                    value={settings.bumdesName}
                    onChange={(e) => setSettings({ ...settings, bumdesName: e.target.value })}
                    placeholder="BADAN USAHA MILIK DESA (BUMDES) MAKMUR GEDANGAN"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Nama Unit Usaha / Layanan
                  </label>
                  <input
                    type="text"
                    value={settings.kopUnitName || ''}
                    onChange={(e) => setSettings({ ...settings, kopUnitName: e.target.value })}
                    placeholder="Contoh: UNIT USAHA PENGELOLAAN KEBERSIHAN & PERSAMPAHAN 'RESIK'"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Alamat &amp; Kontak pada Kop Surat
                  </label>
                  <textarea
                    rows={2}
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Alamat kantor, jalan, desa, kecamatan, kode pos, dll."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Alamat dicetak langsung di baris kontak kop surat tanpa kata otomatis &quot;Sekretariat:&quot;.
                  </p>
                </div>
              </div>

              {/* Pejabat Penandatangan */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>2. Pejabat Penandatangan Laporan (Footer Pengesahan)</span>
                </h3>

                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">
                    Kota / Wilayah Pengesahan Dokumen
                  </label>
                  <input
                    type="text"
                    value={settings.kopCity || ''}
                    onChange={(e) => setSettings({ ...settings, kopCity: e.target.value })}
                    placeholder="Contoh: Gedangan atau Sidoarjo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <div className="font-bold text-slate-800 text-xs mb-2">Pihak 1 (Mengetahui / Pimpinan)</div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={settings.signer1Title || ''}
                      onChange={(e) => setSettings({ ...settings, signer1Title: e.target.value })}
                      placeholder="Jabatan, contoh: Direktur BUMDes Makmur Gedangan"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                    <input
                      type="text"
                      value={settings.signer1Name || ''}
                      onChange={(e) => setSettings({ ...settings, signer1Name: e.target.value })}
                      placeholder="Nama Lengkap & Gelar, contoh: Joko Sutrisno, S.E."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                    />
                    <input
                      type="text"
                      value={settings.signer1Id || ''}
                      onChange={(e) => setSettings({ ...settings, signer1Id: e.target.value })}
                      placeholder="NIP / Nomor ID, contoh: NIP / ID: DIR-BUMDES-01"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <div className="font-bold text-slate-800 text-xs mb-2">Pihak 2 (Pelaksana / Bendahara / Petugas)</div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={settings.signer2Title || ''}
                      onChange={(e) => setSettings({ ...settings, signer2Title: e.target.value })}
                      placeholder="Jabatan, contoh: Bendahara / Petugas Operasional"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    />
                    <input
                      type="text"
                      value={settings.signer2Name || ''}
                      onChange={(e) => setSettings({ ...settings, signer2Name: e.target.value })}
                      placeholder="Nama Lengkap, contoh: Siti Aminah"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                    />
                    <input
                      type="text"
                      value={settings.signer2Id || ''}
                      onChange={(e) => setSettings({ ...settings, signer2Id: e.target.value })}
                      placeholder="Keterangan Unit / ID, contoh: Unit Usaha Persampahan RESIK"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  dataService.updateSettings(settings, currentUser);
                  alert('Pengaturan kop surat & tanda tangan berhasil disimpan!');
                  setRefreshKey(prev => prev + 1);
                }}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Pengaturan Kop &amp; Pejabat Laporan</span>
              </button>
            </div>

            {/* Live Preview Kop Surat & Tanda Tangan */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Pratinjau Hasil Cetak / PDF:</span>
                <span className="text-[11px] text-brand-700 font-mono">Live Preview Real-Time</span>
              </div>

              <div className="p-6 bg-white border-2 border-dashed border-slate-300 rounded-3xl space-y-6 shadow-sm">
                {/* Kop Preview */}
                <div className="pb-3 border-b-2 border-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    {/* Logo BUMDes on Left */}
                    <div className="w-16 sm:w-20 flex-shrink-0 flex items-center justify-center">
                      {settings.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt="Logo BUMDes"
                          className="w-14 h-14 sm:w-16 sm:h-16 max-h-20 object-contain drop-shadow-xs"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-center font-bold text-[10px] text-emerald-700">
                          LOGO
                        </div>
                      )}
                    </div>

                    {/* Kop Text Centered */}
                    <div className="flex-1 text-center space-y-0.5">
                      {settings.kopParentInstitution && (
                        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          {settings.kopParentInstitution}
                        </div>
                      )}
                      <div className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-900 leading-tight">
                        {settings.bumdesName || 'BADAN USAHA MILIK DESA (BUMDES) MAKMUR GEDANGAN'}
                      </div>
                      {settings.kopUnitName && (
                        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-700">
                          {settings.kopUnitName}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-600 leading-normal pt-0.5">
                        {settings.address}
                        {settings.email ? ` • Email: ${settings.email}` : ''}
                      </div>
                    </div>

                    {/* Spacer right for symmetric optical balance */}
                    <div className="w-16 sm:w-20 flex-shrink-0 hidden sm:block"></div>
                  </div>

                  {/* Garis Ganda Kop Surat Resmi */}
                  <div className="border-b-2 border-slate-900 mt-2.5"></div>
                  <div className="border-b border-slate-900 mt-[2px]"></div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs text-slate-500 italic">
                  [ Area Isi Dokumen / Tabel Data Laporan Terpilih ]
                </div>

                {/* Signatures Preview */}
                <div className="grid grid-cols-2 gap-4 text-center text-xs pt-4 border-t border-slate-200">
                  <div>
                    <div className="text-slate-500 text-[11px]">Mengetahui,</div>
                    <div className="font-bold text-slate-800 text-[11px] mt-0.5">
                      {settings.signer1Title || 'Direktur BUMDes Makmur Gedangan'}
                    </div>
                    <div className="h-16 flex items-center justify-center text-slate-300 text-[10px] italic">
                      (Tanda Tangan)
                    </div>
                    <div className="font-bold underline text-slate-900 text-xs">
                      {settings.signer1Name || 'Joko Sutrisno, S.E.'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {settings.signer1Id || 'NIP / ID: DIR-BUMDES-01'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 text-[11px]">
                      {settings.kopCity || 'Gedangan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="font-bold text-slate-800 text-[11px] mt-0.5">
                      {settings.signer2Title || 'Bendahara / Petugas Operasional'}
                    </div>
                    <div className="h-16 flex items-center justify-center text-slate-300 text-[10px] italic">
                      (Tanda Tangan)
                    </div>
                    <div className="font-bold underline text-slate-900 text-xs">
                      {settings.signer2Name || 'Siti Aminah'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {settings.signer2Id || 'Unit Usaha Persampahan RESIK'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: REKENING BANK ================= */}
      {activeTab === 'BANK' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Rekening Bank Pembayaran (PRD Section 60-64)</h2>
              <p className="text-xs text-slate-500">Nomor rekening disimpan sebagai TEXT agar angka 0 di depan tidak hilang.</p>
            </div>
            <button
              onClick={() => {
                setEditingBank({ bankName: '', accountNumber: '', accountName: settings.bumdesName, isActive: true, sortOrder: bankAccounts.length + 1 });
                setBankModalOpen(true);
              }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Rekening</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {bankAccounts.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">🏦 {b.bankName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {b.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="font-mono text-brand-800 font-bold text-sm mt-0.5">{b.accountNumber}</div>
                  <div className="text-slate-500 text-[11px]">a.n. {b.accountName} {b.description && `• ${b.description}`}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingBank(b);
                      setBankModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-brand-700 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      dataService.toggleBankAccountActive(b.id, currentUser);
                      setRefreshKey(prev => prev + 1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${b.isActive ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    {b.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: QRIS ================= */}
      {activeTab === 'QRIS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs max-w-xl space-y-4">
          <h2 className="font-bold text-sm text-slate-900">Pengaturan QRIS Manual RESIK</h2>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
            <img
              src={settings.qrisImageUrl}
              alt="QRIS BUMDes"
              className="w-48 h-48 mx-auto object-contain bg-white p-2 rounded-xl shadow-xs border border-slate-200"
            />
            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1">URL Gambar QRIS</label>
              <input
                type="url"
                value={settings.qrisImageUrl}
                onChange={(e) => setSettings({ ...settings, qrisImageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
              />
            </div>
            <div className="text-xs text-left">
              <label className="block font-bold text-slate-700 mb-1">Keterangan / Petunjuk QRIS</label>
              <textarea
                rows={2}
                value={settings.qrisDescription}
                onChange={(e) => setSettings({ ...settings, qrisDescription: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <button
              onClick={() => {
                dataService.updateSettings(settings, currentUser);
                alert('Pengaturan QRIS berhasil disimpan!');
              }}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Simpan Konfigurasi QRIS
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB: TEMPLATE KARTU PELANGGAN ================= */}
      {activeTab === 'KARTU' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                <span>Pengaturan Desain & Template Background Kartu Pelanggan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih tema bawaan mewah atau upload gambar template dari Canva/Photoshop. Template ini otomatis diterapkan ke seluruh kartu digital dan cetak massal A4.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                dataService.updateSettings(settings, currentUser);
                alert('Konfigurasi desain template kartu berhasil disimpan!');
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>

          {/* Live Preview Container */}
          <div className="bg-slate-100/80 p-5 rounded-3xl border border-slate-200/90 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-xs text-slate-500 font-bold mb-3 px-2">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" />
                Pratinjau Langsung Kartu Pelanggan
              </span>
              <span className="font-normal text-[11px] text-slate-400">Rasio Standar ID Card (CR80)</span>
            </div>

            <div className="w-full max-w-[430px] shadow-2xl rounded-2xl overflow-hidden">
              <CustomerCard
                customer={sampleCardCustomer}
                service={sampleCardService}
                settings={settings}
                variant="single"
              />
            </div>
          </div>

          {/* Theme Selector Grid */}
          <div className="space-y-3">
            <label className="block font-bold text-xs uppercase tracking-wider text-slate-700">
              Pilihan Desain & Latar Belakang:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Preset Resmi BUMDes */}
              <button
                type="button"
                onClick={() => setSettings({
                  ...settings,
                  cardTheme: 'BUMDES_OFFICIAL',
                  cardBackgroundUrl: '/card-template-bumdes.jpg',
                  cardTextColorTheme: 'DARK',
                  cardShowHeaderLogo: false
                })}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 cursor-pointer ${
                  (settings.cardTheme || 'BUMDES_OFFICIAL') === 'BUMDES_OFFICIAL'
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-950 text-white shadow-md'
                    : 'border-slate-200 bg-emerald-900 text-white hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-300">RESMI BUMDES</span>
                  {(settings.cardTheme || 'BUMDES_OFFICIAL') === 'BUMDES_OFFICIAL' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs">Template Resmi BUMDes</div>
                  <p className="text-[10px] text-emerald-200/80 mt-0.5">Truk operasional, bukit desa & footer kontak</p>
                </div>
              </button>

              {/* Preset 2: Emerald Gold */}
              <button
                type="button"
                onClick={() => setSettings({
                  ...settings,
                  cardTheme: 'EMERALD_GOLD',
                  cardBackgroundUrl: '',
                  cardTextColorTheme: 'LIGHT',
                  cardShowHeaderLogo: true
                })}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 cursor-pointer ${
                  settings.cardTheme === 'EMERALD_GOLD'
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-950 text-white shadow-md'
                    : 'border-slate-200 bg-emerald-900/80 text-white hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-300">PRESET 2</span>
                  {settings.cardTheme === 'EMERALD_GOLD' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs">Emerald Gold</div>
                  <p className="text-[10px] text-emerald-200/80 mt-0.5">Zamrud premium ornamen emas & smartchip</p>
                </div>
              </button>

              {/* Preset 3: Royal Navy */}
              <button
                type="button"
                onClick={() => setSettings({
                  ...settings,
                  cardTheme: 'ROYAL_NAVY',
                  cardBackgroundUrl: '',
                  cardTextColorTheme: 'LIGHT',
                  cardShowHeaderLogo: true
                })}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 cursor-pointer ${
                  settings.cardTheme === 'ROYAL_NAVY'
                    ? 'border-blue-600 ring-2 ring-blue-500/30 bg-slate-950 text-white shadow-md'
                    : 'border-slate-200 bg-slate-900 text-white hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-300">PRESET 3</span>
                  {settings.cardTheme === 'ROYAL_NAVY' && (
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs">Royal Sapphire Navy</div>
                  <p className="text-[10px] text-slate-300 mt-0.5">Biru safir modern corporate & aksen futuristik</p>
                </div>
              </button>

              {/* Preset 4: Modern Clean */}
              <button
                type="button"
                onClick={() => setSettings({
                  ...settings,
                  cardTheme: 'MODERN_CLEAN',
                  cardBackgroundUrl: '',
                  cardTextColorTheme: 'DARK',
                  cardShowHeaderLogo: true
                })}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 cursor-pointer ${
                  settings.cardTheme === 'MODERN_CLEAN'
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-white text-slate-900 shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700">PRESET 4</span>
                  {settings.cardTheme === 'MODERN_CLEAN' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs">Modern Clean</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Latar bersih minimalis hemat tinta cetak</p>
                </div>
              </button>

              {/* Custom Upload */}
              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, cardTheme: 'CUSTOM' });
                  if (!settings.cardBackgroundUrl && cardBgInputRef.current) {
                    cardBgInputRef.current.click();
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 cursor-pointer ${
                  settings.cardTheme === 'CUSTOM'
                    ? 'border-purple-600 ring-2 ring-purple-500/30 bg-purple-50 text-purple-950 shadow-md'
                    : 'border-dashed border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    CUSTOM
                  </span>
                  {settings.cardTheme === 'CUSTOM' && (
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-xs">Upload Canva / PS</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pakai gambar latar Anda sendiri</p>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Background Upload Area */}
          {settings.cardTheme === 'CUSTOM' && (
            <div className="bg-purple-50/50 rounded-2xl border border-purple-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-3">
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-800">
                    File Gambar Template Background
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Format: JPG, PNG, atau WEBP • Ukuran rekomendasi: <strong>1000 × 630 px</strong> (Rasio 1.586 : 1)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={cardBgInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        setCardUploadError('File harus berupa gambar (PNG/JPG).');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setSettings({
                          ...settings,
                          cardTheme: 'CUSTOM',
                          cardBackgroundUrl: reader.result as string
                        });
                        setCardUploadError(null);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => cardBgInputRef.current?.click()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{settings.cardBackgroundUrl ? 'Ganti File Gambar' : 'Pilih File Gambar'}</span>
                  </button>

                  {settings.cardBackgroundUrl && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, cardBackgroundUrl: '' })}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200 cursor-pointer"
                      title="Hapus background custom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {cardUploadError && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {cardUploadError}
                </div>
              )}

              {/* Adjustments for Custom Template */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Text Color Setting */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Warna Teks & Informasi (Kontras):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, cardTextColorTheme: 'LIGHT' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        settings.cardTextColorTheme !== 'DARK'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Teks Putih (Gelap)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, cardTextColorTheme: 'DARK' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        settings.cardTextColorTheme === 'DARK'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Teks Hitam (Terang)</span>
                    </button>
                  </div>
                </div>

                {/* Show Header Logo Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tampilkan Logo BUMDes Otomatis:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, cardShowHeaderLogo: true })}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        settings.cardShowHeaderLogo !== false
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tampilkan Logo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, cardShowHeaderLogo: false })}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        settings.cardShowHeaderLogo === false
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Sembunyikan Logo</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: KONTAK & SOSMED ================= */}
      {activeTab === 'LINKS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Media Sosial & Tautan Resmi (PRD Section 22-23)</h2>
              <p className="text-xs text-slate-500">Ikon otomatis muncul di login page & dashboard jika URL terisi.</p>
            </div>
            <button
              onClick={() => {
                setEditingLink({ type: 'INSTAGRAM', label: '', url: '', isActive: true, sortOrder: orgLinks.length + 1 });
                setLinkModalOpen(true);
              }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Link</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {orgLinks.map((l) => {
              const badgeStyle = getSocialBadgeStyle(l.type);
              return (
                <div key={l.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${badgeStyle.badgeBg}`}>
                      <SocialBrandIcon type={l.type} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{l.label}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{l.type}</span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] truncate max-w-md mt-0.5">{l.url}</div>
                    </div>
                  </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingLink(l);
                      setLinkModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-brand-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      dataService.deleteOrganizationLink(l.id, currentUser);
                      setRefreshKey(prev => prev + 1);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* ================= TAB 5: TARIF & KATEGORI ================= */}
      {activeTab === 'TARIF' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Tarif Iuran Berdasarkan Kategori (PRD Section 30)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola kategori pelanggan, tambahkan kategori baru (seperti Kategori Khusus), serta sesuaikan nominal tarif iuran per bulan.
              </p>
            </div>
            {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
              <button
                onClick={handleOpenAddCategory}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Kategori Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map(cat => {
              const trf = tariffs.find(t => t.categoryId === cat.id);
              const amount = trf ? trf.amount : 0;
              const effectiveFrom = trf?.effectiveFrom || '2026-01-01';
              const isDefaultCat = ['cat-1', 'cat-2', 'cat-3'].includes(cat.id);

              return (
                <div key={cat.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2 relative group hover:border-slate-300 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cat.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {cat.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
                      )}
                    </div>

                    {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          className="p-1.5 text-slate-500 hover:text-brand-700 hover:bg-white rounded-lg transition"
                          title="Edit Kategori & Tarif"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isDefaultCat && (
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-2xl font-black text-brand-900">
                    Rp {amount.toLocaleString('id-ID')}
                    <span className="text-xs text-slate-400 font-normal"> / bln</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span>Mulai berlaku: {effectiveFrom}</span>
                    {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
                      <button
                        onClick={() => {
                          dataService.toggleCategoryStatus(cat.id, currentUser);
                          setRefreshKey(prev => prev + 1);
                        }}
                        className="text-[10px] text-brand-700 hover:underline font-semibold"
                      >
                        {cat.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 6: TEMPLATE WA ================= */}
      {activeTab === 'TEMPLATES' && (() => {
        const activeTpl = templateList.find(t => t.type === selectedTemplateType) || templateList[0];

        const confirmationVariables = [
          { code: '{nama}', label: 'Nama Warga' },
          { code: '{id_pelanggan}', label: 'ID Pelanggan Baru' },
          { code: '{no_hp}', label: 'Nomor HP' },
          { code: '{pin_awal}', label: 'PIN Awal (1234)' },
          { code: '{kategori}', label: 'Kategori Tarif' },
          { code: '{alamat}', label: 'Alamat' },
          { code: '{link_resik}', label: 'Web App RESIK (Subdomain)' },
          { code: '{link_web}', label: 'Website Utama BUMDes' },
          { code: '{nama_bumdes}', label: 'Nama BUMDes' },
          { code: '{nomor_bumdes}', label: 'No. WA BUMDes' },
        ];

        const reminderVariables = [
          { code: '{nama}', label: 'Nama Warga' },
          { code: '{id_pelanggan}', label: 'ID Pelanggan' },
          { code: '{rincian_tunggakan}', label: 'Rincian Bulan & Jumlah' },
          { code: '{total_tunggakan}', label: 'Total Nominal (Rp)' },
          { code: '{jumlah_tunggakan}', label: 'Jumlah Bulan' },
          { code: '{link_resik}', label: 'Web App RESIK (Subdomain)' },
          { code: '{link_web}', label: 'Website Utama BUMDes' },
          { code: '{nama_bumdes}', label: 'Nama BUMDes' },
          { code: '{nomor_bumdes}', label: 'No. WA BUMDes' },
        ];

        const activeVariables = selectedTemplateType === 'WHATSAPP_ACCOUNT_CONFIRMATION'
          ? confirmationVariables
          : reminderVariables;

        const getPreviewText = (rawContent: string): string => {
          if (!rawContent) return '';
          const resikSubdomain = settings.appUrl || 'https://resik.bumdesmakmurgedangan.my.id/';
          const mainWeb = settings.website || 'https://bumdesmakmurgedangan.my.id';
          if (selectedTemplateType === 'WHATSAPP_ACCOUNT_CONFIRMATION') {
            return rawContent
              .replace(/{nama}/g, 'Bapak Hendra Gunawan')
              .replace(/{id_pelanggan}/g, 'PLG-RW01-0003')
              .replace(/{no_hp}/g, '081298765432')
              .replace(/{pin_awal}/g, '1234')
              .replace(/{kategori}/g, 'Rumah Tangga')
              .replace(/{alamat}/g, 'Jl. Mawar No. 12, RT 01 / RW 01')
              .replace(/{nama_bumdes}/g, settings.bumdesName || 'BUMDes Makmur Gedangan')
              .replace(/{nomor_bumdes}/g, settings.phoneWhatsapp || '085150736692')
              .replace(/{link_resik}/g, resikSubdomain)
              .replace(/{link_webapp_resik}/g, resikSubdomain)
              .replace(/{link_app}/g, resikSubdomain)
              .replace(/{link_web}/g, mainWeb);
          } else {
            return rawContent
              .replace(/{nama}/g, 'Bapak Budi Santoso')
              .replace(/{id_pelanggan}/g, 'PLG-RW03-0025')
              .replace(/{total_tunggakan}/g, 'Rp40.000')
              .replace(/{jumlah_tunggakan}/g, '2 bulan')
              .replace(/{rincian_tunggakan}/g, '• September 2026 - Rumah (Rp20.000)\n• Oktober 2026 - Rumah (Rp20.000)')
              .replace(/{nama_bumdes}/g, settings.bumdesName || 'BUMDes Makmur Gedangan')
              .replace(/{nomor_bumdes}/g, settings.phoneWhatsapp || '085150736692')
              .replace(/{link_resik}/g, resikSubdomain)
              .replace(/{link_webapp_resik}/g, resikSubdomain)
              .replace(/{link_app}/g, resikSubdomain)
              .replace(/{link_web}/g, mainWeb);
          }
        };

        const handleInsertVar = (varCode: string) => {
          if (!activeTpl) return;
          const updated = { ...activeTpl, content: (activeTpl.content || '') + ' ' + varCode };
          const idx = templateList.findIndex(t => t.id === activeTpl.id);
          const next = [...templateList];
          if (idx >= 0) next[idx] = updated;
          setTemplateList(next);
        };

        const handleChangeContent = (val: string) => {
          if (!activeTpl) return;
          const updated = { ...activeTpl, content: val };
          const idx = templateList.findIndex(t => t.id === activeTpl.id);
          const next = [...templateList];
          if (idx >= 0) next[idx] = updated;
          setTemplateList(next);
        };

        return (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold text-base text-slate-900">Format &amp; Template Pesan WhatsApp</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Atur susunan pesan WhatsApp otomatis yang dikirimkan oleh sistem dan petugas ke warga.
                </p>
              </div>

              {/* Selector Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateType('WHATSAPP_ACCOUNT_CONFIRMATION')}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    selectedTemplateType === 'WHATSAPP_ACCOUNT_CONFIRMATION'
                      ? 'bg-white text-emerald-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Konfirmasi Akun Baru</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTemplateType('WHATSAPP_OVERDUE_REMINDER')}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                    selectedTemplateType === 'WHATSAPP_OVERDUE_REMINDER'
                      ? 'bg-white text-amber-800 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Pengingat Tunggakan</span>
                </button>
              </div>
            </div>

            {/* Template Editor & Live Preview Grid */}
            {activeTpl && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Editor & Variable Tags */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          activeTpl.type === 'WHATSAPP_ACCOUNT_CONFIRMATION'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {activeTpl.type === 'WHATSAPP_ACCOUNT_CONFIRMATION' ? 'Pendaftaran Warga Baru' : 'Penagihan Iuran'}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 mt-1.5">{activeTpl.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {activeTpl.type === 'WHATSAPP_ACCOUNT_CONFIRMATION'
                            ? 'Pesan otomatis saat Petugas/Admin menyetujui pendaftaran pelanggan mandiri.'
                            : 'Pesan pengingat tagihan saat pelanggan memiliki iuran yang belum dibayar.'}
                        </p>
                      </div>

                      {saveSuccessId === activeTpl.id && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-fadeIn">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tersimpan!</span>
                        </div>
                      )}
                    </div>

                    {/* Variable Chips */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Variabel Otomatis (Klik untuk Sisipkan):
                        </label>
                        <span className="text-[10px] text-slate-400">Variabel diganti data asli saat dikirim</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeVariables.map((v) => (
                          <button
                            key={v.code}
                            type="button"
                            onClick={() => handleInsertVar(v.code)}
                            title={`Sisipkan ${v.code} (${v.label})`}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition cursor-pointer flex items-center gap-1 ${
                              v.code === '{link_resik}'
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold hover:bg-emerald-200 shadow-2xs'
                                : 'bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <span>+</span>
                            <span className="font-bold">{v.code}</span>
                            <span className="text-[10px] text-slate-500 font-sans">({v.label})</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Textarea Editor */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Isi Template Pesan WhatsApp:
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {activeTpl.content?.length || 0} karakter
                        </span>
                      </div>
                      <textarea
                        rows={14}
                        value={activeTpl.content}
                        onChange={(e) => handleChangeContent(e.target.value)}
                        placeholder="Ketik susunan template pesan di sini..."
                        className="w-full p-4 border border-slate-300 rounded-2xl text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition shadow-inner bg-slate-50/50"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Tips: Gunakan tanda bintang <code>*teks*</code> untuk teks tebal di WhatsApp.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleResetTemplate(activeTpl.id)}
                        className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reset ke Standar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveTemplate(activeTpl)}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-600/30 flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Simpan Perubahan Template</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Mobile WhatsApp Mockup */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="bg-[#EFEAE2] rounded-3xl border border-slate-300 overflow-hidden shadow-md flex flex-col">
                    {/* Mock Phone Header */}
                    <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-400 flex items-center justify-center font-bold text-xs">
                          🌱
                        </div>
                        <div>
                          <div className="font-bold text-xs truncate max-w-[180px]">
                            {settings.bumdesName || 'BUMDes Makmur Gedangan'}
                          </div>
                          <div className="text-[10px] text-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>online (Akun Resmi)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/80">
                        <Smartphone className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Chat Bubble Body */}
                    <div className="p-4 space-y-2 min-h-[360px] max-h-[500px] overflow-y-auto bg-[radial-gradient(#0000000a_1px,transparent_1px)] [background-size:16px_16px]">
                      {/* Date Pill */}
                      <div className="flex justify-center my-2">
                        <span className="bg-white/80 backdrop-blur-xs text-slate-600 text-[10px] px-3 py-1 rounded-full shadow-2xs font-medium">
                          HARI INI
                        </span>
                      </div>

                      {/* Outgoing Message Bubble */}
                      <div className="flex justify-end">
                        <div className="max-w-[92%] bg-[#DCF8C6] text-slate-800 rounded-2xl rounded-tr-xs p-3.5 shadow-xs border border-emerald-200/50 text-xs leading-relaxed space-y-1">
                          <p className="whitespace-pre-wrap font-sans text-[11.5px] select-text">
                            {getPreviewText(activeTpl.content)}
                          </p>
                          <div className="flex items-center justify-end gap-1 text-[9.5px] text-slate-400 font-mono mt-1 pt-1">
                            <span>10:45</span>
                            <span className="text-sky-500 font-bold">✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mock Input Bar */}
                    <div className="p-2.5 bg-[#F0F2F5] border-t border-slate-200 text-center">
                      <p className="text-[11px] text-slate-500 font-medium">
                        📱 Pratinjau Tampilan Pesan di HP Warga
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Pesan di atas akan otomatis dikirim saat petugas mengklik tombol &quot;Kirim via WhatsApp&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ================= TAB 7: USERS & ROLES ================= */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Pengguna & Hak Akses (PRD Section 13-15)</h2>
              <p className="text-xs text-slate-500">Super Admin dapat membuat, mengubah, serta mengaktifkan/menonaktifkan akun staf.</p>
            </div>
            <button
              onClick={() => {
                setEditingUser({ fullName: '', email: '', phone: '', role: 'PETUGAS', status: 'ACTIVE' });
                setUserModalOpen(true);
              }}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Pengguna</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {users.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{u.fullName}</span>
                    <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {u.role}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                      {u.status}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{u.email} • {u.phone}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      dataService.toggleUserStatus(u.id, currentUser);
                      setRefreshKey(prev => prev + 1);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs ${u.status === 'ACTIVE' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    {u.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 8: KONEKSI SUPABASE & SEED ================= */}
      {activeTab === 'SUPABASE' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-600" />
              <span>Koneksi Supabase Cloud &amp; Sinkronisasi Multi-Perangkat</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Dengan menghubungkan ke Supabase, data yang Anda import di laptop akan otomatis tersinkronisasi ke seluruh perangkat (HP pengurus, laptop lain, komputer kasir) secara terpusat dan aman.
            </p>
          </div>

          {/* Status Sinkronisasi Real-Time */}
          <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${
                  cloudSyncStatus.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' :
                  cloudSyncStatus.status === 'SYNCING' ? 'bg-amber-500 animate-spin' :
                  cloudSyncStatus.status === 'ERROR' ? 'bg-rose-500' : 'bg-slate-400'
                }`} />
                <span className="font-bold text-xs text-slate-800">
                  Status Cloud: {
                    cloudSyncStatus.status === 'CONNECTED' ? '🟢 Terhubung ke Supabase Cloud (Aktif)' :
                    cloudSyncStatus.status === 'SYNCING' ? '🔄 Sedang Menyinkronkan Data...' :
                    cloudSyncStatus.status === 'ERROR' ? '🟡 Perlu Aktivasi Script SQL di Supabase' : '⚪ Belum Terhubung'
                  }
                </span>
              </div>
              {cloudSyncStatus.lastSyncAt && (
                <span className="text-[11px] text-slate-400">
                  Terakhir sinkron: {new Date(cloudSyncStatus.lastSyncAt).toLocaleTimeString('id-ID')}
                </span>
              )}
            </div>

            {cloudSyncStatus.errorMsg && (
              <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="leading-relaxed">
                  <strong>Pesan Sistem:</strong> {cloudSyncStatus.errorMsg}.<br />
                  <span className="text-[11px] text-rose-800">Silakan jalankan script SQL aktivasi di bawah ini melalui SQL Editor Supabase Anda agar izin baca &amp; tulis terbuka.</span>
                </div>
              </div>
            )}

            {syncFeedback && (
              <div className={`text-xs p-2.5 rounded-xl border flex items-center gap-2 ${
                syncFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {syncFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{syncFeedback.message}</span>
              </div>
            )}

            {/* Tombol Aksi Sinkronisasi */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handlePushCloud}
                disabled={cloudSyncStatus.isSyncing}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Unggah Data Laptop Ini ke Cloud (Push 279 Warga)</span>
              </button>
              <button
                type="button"
                onClick={handlePullCloud}
                disabled={cloudSyncStatus.isSyncing}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CloudDownload className="w-4 h-4 text-brand-600" />
                <span>Tarik Data Terbaru dari Cloud (Pull)</span>
              </button>
            </div>
          </div>

          {/* Box Script Aktivasi SQL (Penting untuk mengatasi RLS Supabase) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Shield className="w-4 h-4 text-amber-700" />
                <span>Langkah Aktivasi Supabase (Izin Baca &amp; Simpan Data Multi-Perangkat)</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 shadow-2xs"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                <span>{sqlCopied ? 'Tersalin!' : 'Salin Script SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Supabase secara default mengaktifkan proteksi RLS sehingga browser di perangkat lain diblokir saat membaca data. Cukup <strong>salin script di atas</strong>, buka tab <strong>Supabase</strong> Anda &gt; menu <strong>SQL Editor</strong> &gt; tempel (paste) &gt; klik <strong>Run</strong>. Setelah itu, klik tombol <em>&quot;Unggah Data Laptop Ini ke Cloud&quot;</em>.
            </p>
          </div>

          {/* Form Konfigurasi URL & Key */}
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supabase URL Project</label>
              <input
                type="text"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Supabase Anon / Publishable Key</label>
              <input
                type="password"
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput)}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm"
              >
                Simpan Konfigurasi
              </button>
              <button
                type="button"
                onClick={() => clearSupabaseConfig()}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium"
              >
                Reset ke Default
              </button>
            </div>
          </div>

          {/* Mode Demo / Simulasi Akun & Login Cepat */}
          <div className="pt-5 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Mode Simulasi &amp; Login Cepat</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    settings.isDemoMode !== false ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {settings.isDemoMode !== false ? 'MODE TESTING AKTIF' : 'SIAP LAUNCHING / LIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                  Saat aktif, tombol <strong>&quot;Simulasi Akun&quot;</strong> di navbar atas dan tombol <strong>&quot;Login Cepat&quot;</strong> di halaman login ditampilkan untuk mempermudah evaluasi internal. Nonaktifkan saklar ini saat aplikasi resmi diluncurkan ke warga Gedangan agar tombol jalan pintas tersebut hilang otomatis.
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => {
                  const newMode = settings.isDemoMode === false ? true : false;
                  const updated = { ...settings, isDemoMode: newMode };
                  setSettings(updated);
                  dataService.updateSettings(updated, currentUser);
                  setRefreshKey(prev => prev + 1);
                }}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.isDemoMode !== false ? 'bg-brand-600' : 'bg-slate-300'
                }`}
                title="Klik untuk mengaktifkan / menonaktifkan Mode Demo"
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.isDemoMode !== false ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ======================================================= */}
          {/* BAGIAN RESET TRANSAKSI & GENERATE TAGIHAN (SESUAI REQUEST) */}
          {/* ======================================================= */}
          <div className="pt-5 border-t border-slate-200 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Manajemen Transaksi &amp; Pembersihan Data</h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Perlindungan Data Warga
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Anda dapat mereset data transaksi dan tagihan uji coba kapan saja tanpa khawatir kehilangan 279 data pelanggan yang sudah diimport maupun profil BUMDes.
              </p>
            </div>

            {billGenFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{billGenFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Opsi 1: Reset Transaksi Saja (Recommended) */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900">1. Reset Transaksi &amp; Tagihan Saja</span>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Disarankan</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Menghapus riwayat transaksi dan tagihan uji coba menjadi 0. <strong>Data 279 Warga, titik GPS, profil BUMDes, rekening, dan template WA TETAP UTUH 100%.</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetMode('TRANSACTIONS_ONLY');
                    setResetConfirmationInput('');
                    setResetModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Transaksi Saja (Warga Aman)</span>
                </button>
              </div>

              {/* Opsi 2: Terbitkan Tagihan Baru Bulan Ini */}
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-900">2. Terbitkan Tagihan Baru Bulan Ini</span>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">1-Klik</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Setelah reset transaksi atau pergantian bulan, klik tombol ini untuk menerbitkan tagihan bulan berjalan secara otomatis bagi seluruh warga aktif.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateBillsMass}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Terbitkan Tagihan Bulan Ini</span>
                </button>
              </div>
            </div>

            {/* Opsi Ekstrem: Reset Total (Hapus Warga & Transaksi) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setResetMode('FULL_DATABASE');
                  setResetConfirmationInput('');
                  setResetModalOpen(true);
                }}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold underline underline-offset-2 transition"
              >
                Opsi Ekstrem: Kosongkan juga data warga (Reset Total Database)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bank */}
      {bankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="font-bold text-base text-slate-900 mb-3">Tambah / Edit Rekening Bank</h3>
            <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Nama Bank</label>
                <input
                  type="text"
                  value={editingBank.bankName || ''}
                  onChange={(e) => setEditingBank({ ...editingBank, bankName: e.target.value })}
                  placeholder="Contoh: Bank Jateng"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Nomor Rekening (Format TEXT)</label>
                <input
                  type="text"
                  value={editingBank.accountNumber || ''}
                  onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                  placeholder="1234567890 (angka nol depan tidak akan hilang)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Atas Nama Rekening</label>
                <input
                  type="text"
                  value={editingBank.accountName || ''}
                  onChange={(e) => setEditingBank({ ...editingBank, accountName: e.target.value })}
                  placeholder="BUMDes Makmur Gedangan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBankModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Social Links */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="font-bold text-base text-slate-900 mb-3">Tambah / Edit Tautan Organisasi</h3>
            <form onSubmit={handleSaveLink} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Tipe Media</label>
                <select
                  value={editingLink.type}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    const defaultLabels: Record<string, string> = {
                      WHATSAPP: 'WhatsApp',
                      INSTAGRAM: 'Instagram',
                      TIKTOK: 'TikTok',
                      FACEBOOK: 'Facebook',
                      YOUTUBE: 'YouTube',
                      WEBSITE: 'Website',
                      EMAIL: 'Email',
                      MAP: 'Google Maps'
                    };
                    const isDefaultCurrent = !editingLink.label || Object.values(defaultLabels).includes(editingLink.label);
                    setEditingLink({
                      ...editingLink,
                      type: newType,
                      label: isDefaultCurrent ? (defaultLabels[newType] || editingLink.label) : editingLink.label
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="WEBSITE">Website</option>
                  <option value="EMAIL">Email</option>
                  <option value="MAP">Google Maps</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Label Tampilan</label>
                <input
                  type="text"
                  value={editingLink.label || ''}
                  onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })}
                  placeholder="Contoh: Instagram Resmi BUMDes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">URL / Tautan Lengkap</label>
                <input
                  type="text"
                  value={editingLink.url || ''}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal User */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="font-bold text-base text-slate-900 mb-3">Tambah Pengguna / Pengelola</h3>
            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingUser.fullName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  placeholder="Contoh: Andi Prasetyo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="andi@bumdes.id"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Nomor HP</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Role Jabatan</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as RoleType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="PETUGAS">PETUGAS</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Kategori & Tarif Pelanggan */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingCategory.id ? 'Edit Kategori & Tarif' : 'Tambah Kategori Pelanggan Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCategory.id
                    ? 'Ubah nominal harga iuran atau informasi kategori'
                    : 'Daftarkan kategori khusus/baru untuk penagihan retribusi'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs pt-4">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Contoh: Kategori Khusus, Sekolah, Instansi"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Nominal Tarif Iuran Bulanan (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editingCategory.amount}
                    onChange={(e) => setEditingCategory({ ...editingCategory, amount: Number(e.target.value) || 0 })}
                    placeholder="20000"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-1 focus:ring-brand-500"
                    required
                  />
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <span>Pratinjau Tarif:</span>
                  <span>Rp {Number(editingCategory.amount || 0).toLocaleString('id-ID')} / bulan</span>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Deskripsi Kategori (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Contoh: Tempat ibadah, sekolah, atau fasilitas khusus bersubsidi"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Tanggal Mulai Berlaku Tarif
                </label>
                <input
                  type="date"
                  value={editingCategory.effectiveFrom}
                  onChange={(e) => setEditingCategory({ ...editingCategory, effectiveFrom: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Status Kategori
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory({ ...editingCategory, status: 'ACTIVE' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editingCategory.status === 'ACTIVE'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span>● Aktif</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory({ ...editingCategory, status: 'INACTIVE' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editingCategory.status === 'INACTIVE'
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span>○ Nonaktif</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Kategori & Tarif</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Barier Pengaman Reset (Safety Lock Modal) */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                resetMode === 'TRANSACTIONS_ONLY' ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-rose-50 border border-rose-200 text-rose-600'
              }`}>
                {resetMode === 'TRANSACTIONS_ONLY' ? <RotateCcw className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {resetMode === 'TRANSACTIONS_ONLY' ? 'Konfirmasi Reset Transaksi' : 'Konfirmasi Kosongkan Pelanggan'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {resetMode === 'TRANSACTIONS_ONLY' ? 'Mengosongkan tagihan & riwayat bayar saja (Data warga aman)' : 'Pengosongan seluruh data warga untuk persiapan data riil'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 mb-4">
              <div className="flex items-start gap-2 text-emerald-800 font-semibold text-[11px]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  {resetMode === 'TRANSACTIONS_ONLY'
                    ? 'DIJAMIN AMAN: Seluruh 279 Data Pelanggan, Titik GPS, Profil BUMDes, Rekening Bank, QRIS, Medsos & Template WA'
                    : 'AMAN: Profil BUMDes, Rekening Bank, QRIS, Medsos & Template WA'}
                </span>
              </div>
              <div className="flex items-start gap-2 text-rose-700 font-semibold text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>
                  {resetMode === 'TRANSACTIONS_ONLY'
                    ? 'DIRESET: Seluruh Tagihan Bulanan & Riwayat Pembayaran menjadi 0 (Siap Mulai Baru)'
                    : 'DIKOSONGKAN TOTAL: Data Pelanggan (Budi Santoso dkk), Tagihan & Transaksi (0 Data)'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs mb-4">
              <label className="block text-slate-700 font-bold">
                Ketik kata <span className={`font-mono font-black px-1.5 py-0.5 rounded border ${
                  resetMode === 'TRANSACTIONS_ONLY' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200'
                }`}>RESET</span> di bawah ini untuk membuka kunci:
              </label>
              <input
                type="text"
                value={resetConfirmationInput}
                onChange={(e) => setResetConfirmationInput(e.target.value)}
                placeholder="Ketik: RESET"
                className={`w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-sm tracking-wider uppercase text-center focus:ring-2 focus:outline-none ${
                  resetMode === 'TRANSACTIONS_ONLY' ? 'focus:ring-emerald-500' : 'focus:ring-rose-500'
                }`}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setResetModalOpen(false);
                  setResetConfirmationInput('');
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetConfirmationInput.trim().toUpperCase() !== 'RESET'}
                onClick={() => {
                  if (resetConfirmationInput.trim().toUpperCase() === 'RESET') {
                    if (resetMode === 'TRANSACTIONS_ONLY') {
                      dataService.resetTransactionsOnly(currentUser);
                      setResetModalOpen(false);
                      setResetConfirmationInput('');
                      setRefreshKey(prev => prev + 1);
                      alert('Berhasil! Seluruh transaksi tagihan dan pembayaran uji coba telah dibersihkan. Data 279 warga dan seluruh profil BUMDes tetap aman.');
                    } else {
                      dataService.resetToDefaultSeed();
                    }
                  }
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  resetConfirmationInput.trim().toUpperCase() === 'RESET'
                    ? (resetMode === 'TRANSACTIONS_ONLY'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer'
                        : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer')
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {resetMode === 'TRANSACTIONS_ONLY' ? 'Reset Transaksi Saja' : 'Bersihkan & Kosongkan Sekarang'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
