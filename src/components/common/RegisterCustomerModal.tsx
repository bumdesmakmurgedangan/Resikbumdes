import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { parseGoogleMapsLocation } from '../../utils/geoUtils';
import {
  UserPlus, X, MapPin, Navigation, CheckCircle2,
  AlertCircle, Sparkles, Phone, Home, ExternalLink, ArrowRight
} from 'lucide-react';

interface RegisterCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegisterCustomerModal: React.FC<RegisterCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  const settings = dataService.getSettings();
  const regions = dataService.getRegions();
  const uniqueRWs: string[] = Array.from(new Set(regions.map(r => r.rwCode))).sort();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [rw, setRw] = useState(uniqueRWs[0] || 'RW 01');
  const [rt, setRt] = useState('RT 01');
  const [gmapsInput, setGmapsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [detectedCoord, setDetectedCoord] = useState<{ latitude: number; longitude: number } | null>(null);

  // Status & Geolocation
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{ name: string; phone: string; address: string; rw: string; rt: string } | null>(null);

  // Available RT options based on selected RW
  const rtOptions = regions.filter(r => r.rwCode === rw).map(r => r.rtCode);
  const displayRTOptions = rtOptions.length > 0 ? Array.from(new Set(rtOptions)).sort() : ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];

  const handleGmapsChange = (val: string) => {
    setGmapsInput(val);
    const parsed = parseGoogleMapsLocation(val);
    if (parsed) {
      setDetectedCoord(parsed);
      setGeoError(null);
    } else {
      setDetectedCoord(null);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Perangkat Anda tidak mendukung fitur deteksi GPS');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setDetectedCoord({ latitude: lat, longitude: lng });
        setGmapsInput(`https://maps.google.com/?q=${lat},${lng}`);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError('Tidak dapat mendeteksi lokasi GPS. Pastikan izin lokasi aktif atau paste link Google Maps secara manual.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert('Nama, No HP/WhatsApp, dan Alamat wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      dataService.createCustomerRegistration({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        rw: rw.trim(),
        rt: rt.trim(),
        googleMapsUrl: gmapsInput.trim() || undefined,
        latitude: detectedCoord?.latitude ?? null,
        longitude: detectedCoord?.longitude ?? null,
        notes: notes.trim() || undefined
      });

      setSubmittedData({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        rw,
        rt
      });
      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim formulir pendaftaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setName('');
    setPhone('');
    setAddress('');
    setGmapsInput('');
    setNotes('');
    setDetectedCoord(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-700 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Daftar Menjadi Pelanggan Baru
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                {settings.bumdesName}
              </p>
            </div>
          </div>
          <p className="text-xs text-white/90 leading-relaxed mt-2 bg-black/10 p-2.5 rounded-xl border border-white/10">
            Formulir pendaftaran layanan pengelolaan sampah &amp; kebersihan lingkungan. Cukup lengkapi data diri Anda di bawah ini, admin &amp; petugas BUMDes akan memproses pendaftaran Anda.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs">
          {isSuccess ? (
            /* Success Confirmation Screen */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
                  Pendaftaran Berhasil Dikirim
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Terima Kasih, {submittedData?.name}!
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Data pendaftaran Anda telah berhasil tersimpan dan diteruskan ke petugas/admin BUMDes untuk dieksekusi.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 max-w-sm mx-auto">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Ringkasan Pendaftaran
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Nama:</span>
                  <span className="font-semibold text-slate-800">{submittedData?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">No. WhatsApp:</span>
                  <span className="font-semibold text-slate-800">{submittedData?.phone}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Wilayah:</span>
                  <span className="font-semibold text-slate-800">{submittedData?.rw} / {submittedData?.rt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alamat:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">{submittedData?.address}</span>
                </div>
              </div>

              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-900 text-left text-[11px] leading-relaxed flex items-start gap-2">
                <Phone className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Langkah Selanjutnya:</strong> Petugas BUMDes akan meninjau pendaftaran Anda, menentukan kategori/tarif, dan menerbitkan <strong>ID Pelanggan resmi</strong> yang akan diinfokan ke nomor WhatsApp Anda.
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition shadow-md shadow-brand-600/30 cursor-pointer"
                >
                  Kembali ke Halaman Login
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Pelanggan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bapak Ahmad Dahlan / Ibu Siti Aminah"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Nomor HP / WhatsApp */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor HP / WhatsApp Aktif <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Digunakan untuk konfirmasi ID Pelanggan dan pengingat tagihan bulanan.
                </p>
              </div>

              {/* Alamat Rumah */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Rumah / Tempat Usaha <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Melati No. 12, Gang 3"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* RT & RW */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Wilayah RW <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rw}
                    onChange={(e) => {
                      setRw(e.target.value);
                      const matchingRTs = regions.filter(r => r.rwCode === e.target.value).map(r => r.rtCode);
                      if (matchingRTs.length > 0) setRt(matchingRTs[0]);
                    }}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-brand-500"
                  >
                    {uniqueRWs.map(rwCode => (
                      <option key={rwCode} value={rwCode}>{rwCode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Wilayah RT <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rt}
                    onChange={(e) => setRt(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-brand-500"
                  >
                    {displayRTOptions.map(rtCode => (
                      <option key={rtCode} value={rtCode}>{rtCode}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Titik Lokasi Rumah (Google Maps / GPS) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">
                    Titik Lokasi Rumah (Google Maps)
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">Sangat disarankan</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gmapsInput}
                    onChange={(e) => handleGmapsChange(e.target.value)}
                    placeholder="Paste link Google Maps (https://maps...) atau koordinat"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-mono focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={geoLoading}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-[11px] font-bold shrink-0 flex items-center gap-1.5 transition shadow-2xs cursor-pointer disabled:bg-slate-400"
                    title="Gunakan GPS ponsel/laptop saat ini"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                    <span>{geoLoading ? 'Mencari...' : '📍 Ambil GPS'}</span>
                  </button>
                </div>

                {/* Status deteksi koordinat */}
                {detectedCoord ? (
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Titik terdeteksi: <strong>{detectedCoord.latitude}, {detectedCoord.longitude}</strong>
                      </span>
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${detectedCoord.latitude},${detectedCoord.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>Lihat Peta</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 leading-tight">
                    💡 <em>Tips: Buka Google Maps di ponsel, tahan jari di atas rumah Anda hingga muncul pin merah, lalu klik <strong>Share/Bagikan</strong> dan tempel link-nya di sini, atau klik tombol <strong>"📍 Ambil GPS"</strong>.</em>
                  </p>
                )}

                {geoError && (
                  <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {geoError}
                  </p>
                )}
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Tambahan Patokan Rumah (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Rumah cat hijau samping musala / depan bengkel"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Notice Kategori & Objek */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Catatan Verifikasi:</strong> Kategori pelanggan (Rumah Tangga/UMKM) dan penentuan tarif iuran bulanan akan ditentukan langsung oleh petugas/admin BUMDes setelah formulir ini diterima.
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-2 py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl font-bold transition text-xs shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{submitting ? 'Mengirim Data...' : 'KIRIM PENDAFTARAN'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
