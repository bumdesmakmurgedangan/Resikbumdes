import React, { useState, useRef } from 'react';
import { SystemSettings, Customer, ServiceLocation } from '../../types';
import { CustomerCard } from './CustomerCard';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import {
  X, Upload, Image, Sparkles, Check, CheckCircle2,
  Trash2, Palette, ShieldCheck, Sun, Moon, Eye
} from 'lucide-react';

interface CardTemplateModalProps {
  settings: SystemSettings;
  sampleCustomer?: Customer;
  sampleService?: ServiceLocation;
  onSave: (updatedSettings: SystemSettings) => void;
  onClose: () => void;
}

export const CardTemplateModal: React.FC<CardTemplateModalProps> = ({
  settings: initialSettings,
  sampleCustomer,
  sampleService,
  onSave,
  onClose
}) => {
  const { currentUser } = useAuth();
  const [theme, setTheme] = useState<'BUMDES_OFFICIAL' | 'EMERALD_GOLD' | 'ROYAL_NAVY' | 'MODERN_CLEAN' | 'CUSTOM'>(
    initialSettings.cardTheme || 'BUMDES_OFFICIAL'
  );
  const [backgroundUrl, setBackgroundUrl] = useState<string>(
    initialSettings.cardBackgroundUrl || '/card-template-bumdes.jpg'
  );
  const [textColorTheme, setTextColorTheme] = useState<'DARK' | 'LIGHT'>(
    initialSettings.cardTextColorTheme || 'LIGHT'
  );
  const [showHeaderLogo, setShowHeaderLogo] = useState<boolean>(
    initialSettings.cardShowHeaderLogo !== false
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback demo customer for live preview
  const previewCustomer: Customer = sampleCustomer || {
    id: 'demo-c1',
    customerCode: 'PLG-RW01-0001',
    name: 'Bpk. Bambang Sudarsono',
    phone: '081234567890',
    address: 'RT 02 / RW 01, Dusun Krajan, Gedangan',
    pinHash: '1234',
    isDefaultPin: false,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const previewService: ServiceLocation = sampleService || {
    id: 'demo-s1',
    customerId: 'demo-c1',
    serviceCode: 'LYN-RW01-0001-01',
    name: 'Rumah Tinggal',
    address: 'RT 02 / RW 01, Dusun Krajan',
    rt: 'RT 02',
    rw: 'RW 01',
    categoryId: 'c1',
    categoryName: 'Rumah Tangga',
    tariffId: 'trf-1',
    tariffAmount: 20000,
    status: 'ACTIVE',
    startDate: '2026-01-01',
    createdAt: new Date().toISOString()
  };

  // Create temporary settings object for live preview
  const livePreviewSettings: SystemSettings = {
    ...initialSettings,
    cardTheme: theme,
    cardBackgroundUrl: backgroundUrl,
    cardTextColorTheme: textColorTheme,
    cardShowHeaderLogo: showHeaderLogo
  };

  // Handle image upload from computer (Canva, Photoshop, etc.)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (PNG, JPG, atau WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5MB.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBackgroundUrl(result);
      setTheme('CUSTOM');
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const updated = dataService.updateSettings({
      ...initialSettings,
      cardTheme: theme,
      cardBackgroundUrl: backgroundUrl,
      cardTextColorTheme: textColorTheme,
      cardShowHeaderLogo: showHeaderLogo
    }, currentUser!);

    onSave(updated);
    alert('Desain template kartu berhasil disimpan! Semua kartu kini otomatis menggunakan template ini.');
    onClose();
  };

  const handleResetToEmerald = () => {
    setTheme('BUMDES_OFFICIAL');
    setBackgroundUrl('/card-template-bumdes.jpg');
    setTextColorTheme('DARK');
    setShowHeaderLogo(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Desain & Template Background Kartu</h3>
              <p className="text-xs text-slate-400">
                Pilih tema bawaan mewah atau upload gambar template dari Canva/Photoshop
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Live Preview Container */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Pratinjau Langsung Hasil Kartu (Live Preview)
              </span>
              <span className="text-[11px] text-slate-400">
                Rasio ID Card CR80 (85.6mm × 54mm)
              </span>
            </div>

            <div className="bg-slate-200/60 p-4 sm:p-6 rounded-3xl border border-slate-300/80 flex items-center justify-center shadow-inner">
              <div className="w-full max-w-[420px] shadow-2xl rounded-2xl overflow-hidden">
                <CustomerCard
                  customer={previewCustomer}
                  service={previewService}
                  settings={livePreviewSettings}
                  variant="single"
                />
              </div>
            </div>
          </div>

          {/* Theme Selection Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Pilih Tema Desain / Sumber Background
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Preset 1: Official BUMDes */}
              <button
                type="button"
                onClick={() => {
                  setTheme('BUMDES_OFFICIAL');
                  setBackgroundUrl('/card-template-bumdes.jpg');
                  setTextColorTheme('DARK');
                  setShowHeaderLogo(false);
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 relative cursor-pointer overflow-hidden ${
                  theme === 'BUMDES_OFFICIAL'
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-950 text-white shadow-md'
                    : 'border-slate-200 bg-emerald-900 text-white hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-300">RESMI BUMDES</span>
                  {theme === 'BUMDES_OFFICIAL' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <div className="font-extrabold text-xs">Template Resmi BUMDes</div>
                  <p className="text-[10px] text-emerald-200/80 mt-0.5">Desain truk operasional, logo RESIK & bukit desa</p>
                </div>
              </button>

              {/* Preset 2: Emerald Gold */}
              <button
                type="button"
                onClick={() => {
                  setTheme('EMERALD_GOLD');
                  setBackgroundUrl('');
                  setTextColorTheme('LIGHT');
                  setShowHeaderLogo(true);
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 relative cursor-pointer overflow-hidden ${
                  theme === 'EMERALD_GOLD'
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-950 text-white shadow-md'
                    : 'border-slate-200 bg-emerald-900/80 text-white hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-300">PRESET 2</span>
                  {theme === 'EMERALD_GOLD' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <div className="font-extrabold text-xs">Emerald Gold</div>
                  <p className="text-[10px] text-emerald-200/80 mt-0.5">Hijau zamrud dengan aksen emas & chip</p>
                </div>
              </button>

              {/* Preset 3: Royal Navy */}
              <button
                type="button"
                onClick={() => {
                  setTheme('ROYAL_NAVY');
                  setBackgroundUrl('');
                  setTextColorTheme('LIGHT');
                  setShowHeaderLogo(true);
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 relative cursor-pointer overflow-hidden ${
                  theme === 'ROYAL_NAVY'
                    ? 'border-blue-600 ring-2 ring-blue-500/30 bg-slate-950 text-white shadow-md'
                    : 'border-slate-200 bg-slate-900 text-white hover:opacity-90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-sky-300">PRESET 3</span>
                  {theme === 'ROYAL_NAVY' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                </div>
                <div>
                  <div className="font-extrabold text-xs">Royal Sapphire Navy</div>
                  <p className="text-[10px] text-slate-300 mt-0.5">Biru safir modern corporate & futuristik</p>
                </div>
              </button>

              {/* Preset 4: Modern Clean */}
              <button
                type="button"
                onClick={() => {
                  setTheme('MODERN_CLEAN');
                  setBackgroundUrl('');
                  setTextColorTheme('DARK');
                  setShowHeaderLogo(true);
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 relative cursor-pointer overflow-hidden ${
                  theme === 'MODERN_CLEAN'
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-white text-slate-900 shadow-md'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-700">PRESET 4</span>
                  {theme === 'MODERN_CLEAN' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
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
                  setTheme('CUSTOM');
                  if (!backgroundUrl && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-32 relative cursor-pointer overflow-hidden ${
                  theme === 'CUSTOM'
                    ? 'border-purple-600 ring-2 ring-purple-500/30 bg-purple-50 text-purple-950 shadow-md'
                    : 'border-dashed border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    UPLOAD
                  </span>
                  {theme === 'CUSTOM' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </div>
                <div>
                  <div className="font-extrabold text-xs">Upload Gambar Sendiri</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Gunakan gambar latar template buatan sendiri</p>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Upload Controls (Active when CUSTOM is selected) */}
          {theme === 'CUSTOM' && (
            <div className="bg-white rounded-2xl border border-purple-200 p-5 space-y-4 shadow-sm animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-xs uppercase text-slate-800">
                    Unggah File Template Background
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Disarankan ukuran rasio ID Card: <strong>1000 × 630 px</strong> (JPG / PNG, maks 5MB)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{backgroundUrl ? 'Ganti Gambar' : 'Pilih File Gambar'}</span>
                  </button>

                  {backgroundUrl && (
                    <button
                      type="button"
                      onClick={() => setBackgroundUrl('')}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200"
                      title="Hapus gambar custom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {uploadError}
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
                      onClick={() => setTextColorTheme('LIGHT')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        textColorTheme === 'LIGHT'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Teks Putih (Gelap)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTextColorTheme('DARK')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        textColorTheme === 'DARK'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Teks Hitam (Terang)</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Gunakan Teks Putih jika background Anda gelap, atau Teks Hitam jika background Anda terang.
                  </p>
                </div>

                {/* Show Header Logo Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tampilkan Logo BUMDes Otomatis:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHeaderLogo(true)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        showHeaderLogo
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tampilkan Logo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowHeaderLogo(false)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        !showHeaderLogo
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Sembunyikan Logo</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pilih &apos;Sembunyikan&apos; jika template Canva Anda sudah menyertakan logo BUMDes di gambarnya agar tidak dobel.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handleResetToEmerald}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            Reset ke Tema Standar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Terapkan ke Seluruh Kartu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
