import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Customer, ServiceLocation, Category, Tariff, Region } from '../types';
import {
  Users, UserPlus, Search, Edit3, Key, Plus,
  Home, Store, Building, MapPin, CheckCircle2, XCircle,
  Eye, RefreshCw, AlertCircle, Navigation, ExternalLink, Check
} from 'lucide-react';
import { parseGoogleMapsLocation } from '../utils/geoUtils';

export const CustomersView: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  if (!currentUser) return null;

  const [refreshKey, setRefreshKey] = useState(0);
  const customers = dataService.getCustomers();
  const allServices = dataService.getServiceLocations();
  const categories = dataService.getCategories();
  const tariffs = dataService.getTariffs();
  const regions = dataService.getRegions();
  const uniqueRWs: string[] = Array.from(new Set(regions.map(r => r.rwCode))).sort();

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterRW, setFilterRW] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Customer Detail Drawer / Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Add Customer Modal
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newRW, setNewRW] = useState('RW 01');
  const [newRT, setNewRT] = useState('RT 01');
  const [newObjectName, setNewObjectName] = useState('Rumah Tinggal');
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id || '');
  const [newLat, setNewLat] = useState<string>('');
  const [newLng, setNewLng] = useState<string>('');
  const [gmapsInput, setGmapsInput] = useState('');
  const [detectedCoord, setDetectedCoord] = useState<{ latitude: number; longitude: number } | null>(null);

  // Add Service to Existing Customer Modal
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [srvObjectName, setSrvObjectName] = useState('');
  const [srvAddress, setSrvAddress] = useState('');
  const [srvRW, setSrvRW] = useState('RW 01');
  const [srvRT, setSrvRT] = useState('RT 01');
  const [srvCategoryId, setSrvCategoryId] = useState(categories[0]?.id || '');
  const [srvLat, setSrvLat] = useState<string>('');
  const [srvLng, setSrvLng] = useState<string>('');
  const [srvGmapsInput, setSrvGmapsInput] = useState('');
  const [srvDetectedCoord, setSrvDetectedCoord] = useState<{ latitude: number; longitude: number } | null>(null);

  // Handlers for Google Maps location auto-detection
  const handleGmapsPaste = (val: string) => {
    setGmapsInput(val);
    const parsed = parseGoogleMapsLocation(val);
    if (parsed) {
      setNewLat(parsed.latitude.toString());
      setNewLng(parsed.longitude.toString());
      setDetectedCoord(parsed);
    } else {
      setDetectedCoord(null);
    }
  };

  const handleLatChange = (val: string) => {
    const parsed = parseGoogleMapsLocation(val);
    if (parsed && (val.includes(',') || val.includes('http') || val.includes('@') || val.includes(' '))) {
      setNewLat(parsed.latitude.toString());
      setNewLng(parsed.longitude.toString());
      setDetectedCoord(parsed);
      setGmapsInput(val);
    } else {
      setNewLat(val);
    }
  };

  const handleSrvGmapsPaste = (val: string) => {
    setSrvGmapsInput(val);
    const parsed = parseGoogleMapsLocation(val);
    if (parsed) {
      setSrvLat(parsed.latitude.toString());
      setSrvLng(parsed.longitude.toString());
      setSrvDetectedCoord(parsed);
    } else {
      setSrvDetectedCoord(null);
    }
  };

  // Reset PIN notification modal
  const [resetPinResult, setResetPinResult] = useState<{ code: string; tempPin: string } | null>(null);

  const filteredCustomers = customers.filter(c => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = c.name.toLowerCase().includes(q) || c.customerCode.toLowerCase().includes(q) || c.phone.includes(q);
      if (!match) return false;
    }
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (filterRW !== 'ALL') {
      const custServices = allServices.filter(s => s.customerId === c.id);
      const matchRW = custServices.some(s => s.rw === filterRW);
      if (!matchRW) return false;
    }
    if (filterCategory !== 'ALL') {
      const custServices = allServices.filter(s => s.customerId === c.id);
      const matchCat = custServices.some(s => s.categoryId === filterCategory);
      if (!matchCat) return false;
    }
    return true;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAddress.trim()) {
      alert('Nama dan alamat wajib diisi.');
      return;
    }

    try {
      const customerCode = dataService.generateCustomerCode(newRW);
      const cust = dataService.saveCustomer({
        customerCode,
        name: newName.trim(),
        phone: newPhone.trim(),
        address: newAddress.trim(),
        pinHash: '1234',
        isDefaultPin: true,
        status: 'ACTIVE'
      }, currentUser);

      // Create initial service location
      const selectedTariff = tariffs.find(t => t.categoryId === newCategoryId) || tariffs[0];
      dataService.saveServiceLocation({
        customerId: cust.id,
        name: newObjectName.trim() || 'Rumah Tinggal',
        address: newAddress.trim(),
        rt: newRT,
        rw: newRW,
        categoryId: newCategoryId,
        tariffId: selectedTariff?.id || 'trf-1',
        latitude: newLat ? parseFloat(newLat) : null,
        longitude: newLng ? parseFloat(newLng) : null,
        status: 'ACTIVE'
      }, currentUser);

      alert(`Pelanggan baru berhasil didaftarkan!\nID: ${customerCode}\nPIN Awal: 1234`);
      setAddCustomerModalOpen(false);
      // Reset fields
      setNewName('');
      setNewPhone('');
      setNewAddress('');
      setNewLat('');
      setNewLng('');
      setGmapsInput('');
      setDetectedCoord(null);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftarkan pelanggan');
    }
  };

  const handleAddServiceToCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!srvObjectName.trim()) {
      alert('Nama objek layanan wajib diisi.');
      return;
    }

    try {
      const selectedTariff = tariffs.find(t => t.categoryId === srvCategoryId) || tariffs[0];
      dataService.saveServiceLocation({
        customerId: selectedCustomer.id,
        name: srvObjectName.trim(),
        address: srvAddress.trim() || selectedCustomer.address,
        rt: srvRT,
        rw: srvRW,
        categoryId: srvCategoryId,
        tariffId: selectedTariff?.id || 'trf-1',
        latitude: srvLat ? parseFloat(srvLat) : null,
        longitude: srvLng ? parseFloat(srvLng) : null,
        status: 'ACTIVE'
      }, currentUser);

      alert('Lokasi layanan baru berhasil ditambahkan untuk akun pelanggan ini!');
      setAddServiceModalOpen(false);
      setSrvObjectName('');
      setSrvAddress('');
      setSrvLat('');
      setSrvLng('');
      setSrvGmapsInput('');
      setSrvDetectedCoord(null);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Gagal menambah layanan');
    }
  };

  const handleResetPin = (customer: Customer) => {
    if (!window.confirm(`Reset PIN untuk pelanggan ${customer.name} (${customer.customerCode})?`)) return;
    try {
      const tempPin = dataService.resetCustomerPin(customer.id, currentUser);
      setResetPinResult({ code: customer.customerCode, tempPin });
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Gagal mereset PIN');
    }
  };

  const handleToggleStatus = (customer: Customer) => {
    const action = customer.status === 'ACTIVE' ? 'nonaktifkan' : 'aktifkan';
    if (!window.confirm(`Yakin ingin me-${action} akun pelanggan ${customer.name}?`)) return;
    dataService.toggleCustomerStatus(customer.id, currentUser);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Pelanggan & Lokasi Layanan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data warga, nomor kontak, serta multi-layanan (rumah, warung, toko, dsb).
          </p>
        </div>

        {hasPermission('CUSTOMER_CREATE') && (
          <button
            onClick={() => setAddCustomerModalOpen(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Daftarkan Pelanggan Baru</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, ID (PLG-RW...), atau nomor telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <select
          value={filterRW}
          onChange={(e) => setFilterRW(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="ALL">Semua RW</option>
          {uniqueRWs.map(rw => <option key={rw} value={rw}>{rw}</option>)}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="ALL">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">ID Pelanggan</th>
                <th className="py-3 px-3">Nama & Alamat</th>
                <th className="py-3 px-3">No HP / WhatsApp</th>
                <th className="py-3 px-3">Lokasi Layanan</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const custServices = allServices.filter(s => s.customerId === cust.id);

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-brand-800 text-xs">
                        {cust.customerCode}
                      </span>
                      {cust.isDefaultPin && (
                        <div className="text-[10px] text-amber-600 font-medium">PIN Default</div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-500 max-w-xs truncate">{cust.address}</div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {cust.phone ? (
                        <span className="text-slate-800">{cust.phone}</span>
                      ) : (
                        <span className="text-slate-400 italic">Tidak ada</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {custServices.map(s => (
                          <span
                            key={s.id}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-medium"
                          >
                            {s.name} ({s.rw})
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {cust.status === 'ACTIVE' ? (
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          Aktif
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg text-slate-700 font-semibold transition"
                        title="Lihat Detail & Layanan"
                      >
                        Detail & Layanan
                      </button>

                      <button
                        onClick={() => handleResetPin(cust)}
                        className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs transition"
                        title="Reset PIN Pelanggan"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(cust)}
                        className={`px-2 py-1.5 rounded-lg text-xs transition ${
                          cust.status === 'ACTIVE'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={cust.status === 'ACTIVE' ? 'Nonaktifkan Pelanggan' : 'Aktifkan Pelanggan'}
                      >
                        {cust.status === 'ACTIVE' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ADD CUSTOMER MODAL ================= */}
      {addCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[92vh]">
            <h3 className="font-bold text-base text-slate-900 mb-1">Daftarkan Pelanggan Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              ID Pelanggan dan PIN awal (1234) akan dibuatkan secara otomatis oleh sistem RESIK.
            </p>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Nama Lengkap Warga</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Contoh: 081234567890 (Boleh kosong jika tidak ada)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Contoh: Jl. Merpati No. 14"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Wilayah RW</label>
                  <select
                    value={newRW}
                    onChange={(e) => setNewRW(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {uniqueRWs.map(rw => <option key={rw} value={rw}>{rw}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Wilayah RT</label>
                  <input
                    type="text"
                    value={newRT}
                    onChange={(e) => setNewRT(e.target.value)}
                    placeholder="Contoh: RT 01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Initial Service Object Details */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="font-bold text-slate-900">Objek Layanan Utama</div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Nama Objek</label>
                    <input
                      type="text"
                      value={newObjectName}
                      onChange={(e) => setNewObjectName(e.target.value)}
                      placeholder="Contoh: Rumah Tinggal"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Kategori Pelanggan</label>
                    <select
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                    >
                      {categories.filter(c => c.status === 'ACTIVE' || c.id === newCategoryId).map(c => {
                        const trf = tariffs.find(t => t.categoryId === c.id);
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} {trf ? `(Rp ${trf.amount.toLocaleString('id-ID')}/bln)` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Opsi Cepat: Tempel Titik / Link dari Google Maps */}
                <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold uppercase text-[10px] text-emerald-900 tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tempel Titik / Link Google Maps (Otomatis)</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      Auto Deteksi GPS
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={gmapsInput}
                      onChange={(e) => handleGmapsPaste(e.target.value)}
                      placeholder="Paste koordinat (-7.3885, 112.7214) atau link Google Maps di sini..."
                      className="w-full pl-3 pr-28 py-2 bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                    />
                    {detectedCoord ? (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Terdeteksi!</span>
                      </span>
                    ) : gmapsInput.trim() ? (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
                        Format belum cocok
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>💡 Cukup copy dari Google Maps lalu paste di atas. Latitude & Longitude terisi otomatis.</span>
                    {detectedCoord && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${detectedCoord.latitude},${detectedCoord.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        <span>Cek di Peta</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Latitude (Opsional)</label>
                    <input
                      type="text"
                      value={newLat}
                      onChange={(e) => handleLatChange(e.target.value)}
                      placeholder="-7.3885"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold uppercase text-slate-700 mb-1">Longitude (Opsional)</label>
                    <input
                      type="text"
                      value={newLng}
                      onChange={(e) => setNewLng(e.target.value)}
                      placeholder="112.7214"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddCustomerModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Simpan & Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CUSTOMER DETAIL & MULTI-SERVICE DRAWER ================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[92vh]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-brand-800 text-sm">
                    {selectedCustomer.customerCode}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedCustomer.status}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">{selectedCustomer.address} • Telp: {selectedCustomer.phone || '-'}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Services for this Customer */}
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">
                  Daftar Lokasi Layanan Kebersihan (Multi-Service)
                </h4>
                <button
                  onClick={() => setAddServiceModalOpen(true)}
                  className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Lokasi Baru</span>
                </button>
              </div>

              <div className="space-y-2">
                {allServices.filter(s => s.customerId === selectedCustomer.id).map(srv => (
                  <div key={srv.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        <span>{srv.name}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{srv.serviceCode}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {srv.address} ({srv.rt} / {srv.rw}) • Kategori: <strong>{srv.categoryName}</strong>
                      </div>
                      <div className="text-[11px] font-bold text-brand-700 mt-0.5">
                        Tarif: Rp {srv.tariffAmount?.toLocaleString('id-ID')}/bln
                      </div>
                    </div>
                    {srv.latitude && srv.longitude && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${srv.latitude},${srv.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 transition shadow-2xs cursor-pointer"
                        title="Buka rute Google Maps ke rumah pelanggan"
                      >
                        <Navigation className="w-3 h-3 text-emerald-600" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => handleResetPin(selectedCustomer)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Reset PIN Pelanggan</span>
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD SERVICE LOCATION MODAL ================= */}
      {addServiceModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="font-bold text-base text-slate-900 mb-1">Tambah Lokasi Layanan Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Menambahkan objek baru (misal: Toko, Warung, Ruko) untuk akun <strong>{selectedCustomer.name}</strong>.
            </p>

            <form onSubmit={handleAddServiceToCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Nama Objek Layanan</label>
                <input
                  type="text"
                  value={srvObjectName}
                  onChange={(e) => setSrvObjectName(e.target.value)}
                  placeholder="Contoh: Toko Berkah Kelontong"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Alamat Objek</label>
                <input
                  type="text"
                  value={srvAddress}
                  onChange={(e) => setSrvAddress(e.target.value)}
                  placeholder={`Default: ${selectedCustomer.address}`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">RW</label>
                  <select
                    value={srvRW}
                    onChange={(e) => setSrvRW(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {uniqueRWs.map(rw => <option key={rw} value={rw}>{rw}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">RT</label>
                  <input
                    type="text"
                    value={srvRT}
                    onChange={(e) => setSrvRT(e.target.value)}
                    placeholder="RT 02"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Kategori</label>
                <select
                  value={srvCategoryId}
                  onChange={(e) => setSrvCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                >
                  {categories.filter(c => c.status === 'ACTIVE' || c.id === srvCategoryId).map(c => {
                    const trf = tariffs.find(t => t.categoryId === c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} {trf ? `(Rp ${trf.amount.toLocaleString('id-ID')}/bln)` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Opsi Cepat: Tempel Titik / Link dari Google Maps */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold uppercase text-[10px] text-emerald-900 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tempel Titik / Link Google Maps (Otomatis)</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Auto Deteksi GPS
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={srvGmapsInput}
                    onChange={(e) => handleSrvGmapsPaste(e.target.value)}
                    placeholder="Paste koordinat (-7.3885, 112.7214) atau link Google Maps..."
                    className="w-full pl-3 pr-28 py-2 bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500"
                  />
                  {srvDetectedCoord ? (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Terdeteksi!</span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Latitude (Opsional)</label>
                  <input
                    type="text"
                    value={srvLat}
                    onChange={(e) => setSrvLat(e.target.value)}
                    placeholder="-7.3885"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Longitude (Opsional)</label>
                  <input
                    type="text"
                    value={srvLng}
                    onChange={(e) => setSrvLng(e.target.value)}
                    placeholder="112.7214"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddServiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RESET PIN RESULT NOTIFICATION ================= */}
      {resetPinResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">PIN Berhasil Direset!</h3>
            <p className="text-xs text-slate-500 mb-4">
              Berikan informasi ini kepada pelanggan:
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl mb-4 text-xs font-mono">
              <div>ID Pelanggan: <strong>{resetPinResult.code}</strong></div>
              <div className="text-base font-black text-brand-800 mt-1">
                PIN Sementara: {resetPinResult.tempPin}
              </div>
            </div>

            <button
              onClick={() => setResetPinResult(null)}
              className="w-full py-2.5 bg-brand-600 text-white rounded-xl font-bold text-xs"
            >
              Tutup & Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
