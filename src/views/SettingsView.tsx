import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import {
  BankAccount, OrganizationLink, Category, Tariff, Region,
  MessageTemplate, User, RoleType
} from '../types';
import {
  Settings, Building2, Globe, CreditCard, QrCode, MapPin,
  Tag, Calendar, MessageSquare, Users, Shield, Plus,
  Edit2, Trash2, Check, X, Database, RefreshCw
} from 'lucide-react';
import { saveSupabaseConfig, clearSupabaseConfig, getSupabaseConfig } from '../lib/supabase';
import { SocialBrandIcon, getSocialBadgeStyle } from '../components/common/SocialBrandIcon';

export const SettingsView: React.FC = () => {
  const { currentUser, role } = useAuth();
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<
    'PROFIL' | 'KOP' | 'LINKS' | 'BANK' | 'QRIS' | 'WILAYAH' | 'TARIF' | 'TEMPLATES' | 'USERS' | 'SUPABASE'
  >('PROFIL');

  const [refreshKey, setRefreshKey] = useState(0);

  // Settings State
  const [settings, setSettings] = useState(dataService.getSettings());
  const bankAccounts = dataService.getBankAccounts();
  const orgLinks = dataService.getOrganizationLinks();
  const categories = dataService.getCategories();
  const tariffs = dataService.getTariffs();
  const regions = dataService.getRegions();
  const templates = dataService.getMessageTemplates();
  const users = dataService.getUsers();
  const roles = dataService.getRoles();

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

            <div>
              <label className="block font-bold uppercase text-slate-700 mb-1">URL Logo RESIK</label>
              <input
                type="url"
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
              />
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
                <label className="block font-bold uppercase text-slate-700 mb-1">Website Resmi</label>
                <input
                  type="url"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
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
                    Alamat Sekretariat &amp; Kontak pada Kop
                  </label>
                  <textarea
                    rows={2}
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Alamat kantor, kontak telepon, atau email BUMDes"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
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
                <div className="text-center space-y-1 pb-3 border-b-2 border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    {settings.kopParentInstitution || 'PEMERINTAH KABUPATEN SIDOARJO • KECAMATAN GEDANGAN'}
                  </div>
                  <div className="text-sm font-black uppercase tracking-wide text-slate-900">
                    {settings.bumdesName || 'BADAN USAHA MILIK DESA (BUMDES) MAKMUR GEDANGAN'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {settings.kopUnitName || 'UNIT USAHA PENGELOLAAN KEBERSIHAN & PERSAMPAHAN (RESIK)'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Sekretariat: {settings.address} • Email: {settings.email}
                  </div>
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
      {activeTab === 'TEMPLATES' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900">Template Pesan WhatsApp Pengingat (PRD Section 88)</h2>
          <p className="text-xs text-slate-500">
            Dapat menggunakan variabel otomatis: <code>{'{nama}'}</code>, <code>{'{id_pelanggan}'}</code>, <code>{'{rincian_tunggakan}'}</code>, <code>{'{total_tunggakan}'}</code>, <code>{'{nama_bumdes}'}</code>, <code>{'{nomor_bumdes}'}</code>.
          </p>

          {templates.map(tpl => (
            <div key={tpl.id} className="space-y-2">
              <textarea
                rows={8}
                value={tpl.content}
                onChange={(e) => {
                  tpl.content = e.target.value;
                  setRefreshKey(prev => prev + 1);
                }}
                className="w-full p-3.5 border border-slate-300 rounded-2xl text-xs font-mono leading-relaxed"
              />
              <button
                onClick={() => {
                  dataService.saveMessageTemplate(tpl, currentUser);
                  alert('Template WhatsApp berhasil diperbarui!');
                }}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Simpan Template
              </button>
            </div>
          ))}
        </div>
      )}

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
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5 max-w-2xl">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-600" />
              <span>Koneksi Supabase Backend & Database</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              RESIK dirancang siap produksi dengan Supabase PostgreSQL, Auth, dan Storage. Anda dapat memasukkan URL project Supabase dan Anon Key Anda di bawah ini, atau menggunakan Local Storage Engine bawaan.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supabase URL</label>
              <input
                type="text"
                value={supabaseUrlInput}
                onChange={(e) => setSupabaseUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Supabase Anon Key</label>
              <input
                type="password"
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput)}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm"
              >
                Simpan & Sambungkan
              </button>
              <button
                type="button"
                onClick={() => clearSupabaseConfig()}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium"
              >
                Gunakan Mode Mock Lokal
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">Reset Data Simulasi</h3>
            <p className="text-xs text-slate-500 mb-3">
              Kembalikan seluruh data simulasi ke awal (Budi Santoso, tagihan, kwitansi, dan rekening default BUMDes Gedangan).
            </p>
            <button
              onClick={() => {
                if (window.confirm('Reset seluruh data simulasi ke kondisi awal?')) {
                  dataService.resetToDefaultSeed();
                }
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset ke Seed Bawaan</span>
            </button>
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
                  onChange={(e) => setEditingLink({ ...editingLink, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TIKTOK">TikTok</option>
                  <option value="FACEBOOK">Facebook</option>
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
    </div>
  );
};
