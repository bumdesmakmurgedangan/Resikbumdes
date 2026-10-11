import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Customer, ServiceLocation, Category, Tariff, Region, CustomerRegistration } from '../types';
import {
  Users, UserPlus, Search, Edit3, Key, Plus,
  Home, Store, Building, MapPin, CheckCircle2, XCircle,
  Eye, RefreshCw, AlertCircle, Navigation, ExternalLink, Check,
  Phone, Clock, MessageSquare, ThumbsUp, ThumbsDown, CheckSquare, Sparkles, Send, X
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

  // Sub Tab Navigation
  const [mainTab, setMainTab] = useState<'REGISTERED' | 'APPLICATIONS'>('REGISTERED');

  // Customer Registrations (Pendaftaran Mandiri Warga)
  const registrations = dataService.getCustomerRegistrations();
  const pendingRegsCount = dataService.getPendingCustomerRegistrationsCount();
  const [regFilterStatus, setRegFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [regSearch, setRegSearch] = useState('');

  // Execution (Approval) Modal States
  const [executingReg, setExecutingReg] = useState<CustomerRegistration | null>(null);
  const [execObjectName, setExecObjectName] = useState('Rumah Tinggal');
  const [execCategoryId, setExecCategoryId] = useState(categories[0]?.id || '');
  const [executingSuccess, setExecutingSuccess] = useState<{
    customer: Customer;
    registration: CustomerRegistration;
    categoryName: string;
  } | null>(null);

  // Rejection Modal States
  const [rejectingReg, setRejectingReg] = useState<CustomerRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [syncServiceAddress, setSyncServiceAddress] = useState(true);

  // Edit Service Location Modal State
  const [editingService, setEditingService] = useState<ServiceLocation | null>(null);
  const [editSrvName, setEditSrvName] = useState('');
  const [editSrvAddress, setEditSrvAddress] = useState('');
  const [editSrvRW, setEditSrvRW] = useState('RW 01');
  const [editSrvRT, setEditSrvRT] = useState('RT 01');
  const [editSrvCategoryId, setEditSrvCategoryId] = useState('');
  const [editSrvTariffId, setEditSrvTariffId] = useState('');
  const [editSrvLat, setEditSrvLat] = useState('');
  const [editSrvLng, setEditSrvLng] = useState('');
  const [editSrvGmapsInput, setEditSrvGmapsInput] = useState('');
  const [editSrvDetectedCoord, setEditSrvDetectedCoord] = useState<{ latitude: number; longitude: number } | null>(null);

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

  // Open Edit Customer Modal
  const handleOpenEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone || '');
    setEditAddress(customer.address);
    setEditStatus(customer.status);
    setSyncServiceAddress(true);
  };

  // Save Edit Customer Changes
  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editName.trim() || !editAddress.trim()) {
      alert('Nama dan alamat domisili pelanggan wajib diisi.');
      return;
    }

    try {
      const updated = dataService.saveCustomer({
        id: editingCustomer.id,
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        status: editStatus
      }, currentUser);

      // Sinkronkan alamat ke lokasi layanan jika dicentang
      if (syncServiceAddress) {
        const custServices = allServices.filter(s => s.customerId === editingCustomer.id);
        if (custServices.length > 0) {
          custServices.forEach((s, idx) => {
            if (idx === 0 || custServices.length === 1) {
              dataService.saveServiceLocation({
                id: s.id,
                address: editAddress.trim()
              }, currentUser);
            }
          });
        }
      }

      // Perbarui selectedCustomer jika sedang terbuka di drawer
      if (selectedCustomer && selectedCustomer.id === editingCustomer.id) {
        setSelectedCustomer(updated);
      }

      setEditingCustomer(null);
      setRefreshKey(prev => prev + 1);
      alert(`Data pelanggan ${updated.name} (${updated.customerCode}) berhasil diperbarui!`);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data pelanggan');
    }
  };

  // Open Edit Service Location Modal
  const handleOpenEditService = (srv: ServiceLocation) => {
    setEditingService(srv);
    setEditSrvName(srv.name);
    setEditSrvAddress(srv.address);
    setEditSrvRW(srv.rw);
    setEditSrvRT(srv.rt);
    setEditSrvCategoryId(srv.categoryId);
    setEditSrvTariffId(srv.tariffId);
    setEditSrvLat(srv.latitude ? srv.latitude.toString() : '');
    setEditSrvLng(srv.longitude ? srv.longitude.toString() : '');
    setEditSrvGmapsInput(srv.latitude && srv.longitude ? `${srv.latitude}, ${srv.longitude}` : '');
    if (srv.latitude && srv.longitude) {
      setEditSrvDetectedCoord({ latitude: srv.latitude, longitude: srv.longitude });
    } else {
      setEditSrvDetectedCoord(null);
    }
  };

  const handleEditSrvGmapsPaste = (val: string) => {
    setEditSrvGmapsInput(val);
    const parsed = parseGoogleMapsLocation(val);
    if (parsed) {
      setEditSrvLat(parsed.latitude.toString());
      setEditSrvLng(parsed.longitude.toString());
      setEditSrvDetectedCoord(parsed);
    } else {
      setEditSrvDetectedCoord(null);
    }
  };

  // Save Edit Service Changes
  const handleSaveEditService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!editSrvName.trim() || !editSrvAddress.trim()) {
      alert('Nama objek dan alamat lokasi layanan wajib diisi.');
      return;
    }

    try {
      const selectedCat = categories.find(c => c.id === editSrvCategoryId) || categories[0];
      const selectedTrf = tariffs.find(t => t.id === editSrvTariffId) || tariffs.find(t => t.categoryId === selectedCat?.id) || tariffs[0];

      dataService.saveServiceLocation({
        id: editingService.id,
        name: editSrvName.trim(),
        address: editSrvAddress.trim(),
        rt: editSrvRT,
        rw: editSrvRW,
        categoryId: selectedCat?.id,
        tariffId: selectedTrf?.id,
        latitude: editSrvLat ? parseFloat(editSrvLat) : null,
        longitude: editSrvLng ? parseFloat(editSrvLng) : null
      }, currentUser);

      setEditingService(null);
      setRefreshKey(prev => prev + 1);
      alert(`Lokasi layanan ${editSrvName} berhasil diperbarui!`);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui lokasi layanan');
    }
  };

  const handleApproveRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingReg) return;
    try {
      const selectedCategory = categories.find(c => c.id === execCategoryId) || categories[0];
      const selectedTariff = tariffs.find(t => t.categoryId === selectedCategory?.id) || tariffs[0];

      const res = dataService.approveCustomerRegistration(
        executingReg.id,
        {
          categoryId: selectedCategory?.id,
          tariffId: selectedTariff?.id,
          objectName: execObjectName || 'Rumah Tinggal'
        },
        currentUser
      );

      setExecutingSuccess({
        customer: res.customer,
        registration: executingReg,
        categoryName: selectedCategory?.name || 'Rumah Tangga'
      });
      setExecutingReg(null);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Gagal mengeksekusi pendaftaran');
    }
  };

  const handleRejectRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReg) return;
    if (!rejectReason.trim()) {
      alert('Mohon cantumkan alasan penolakan.');
      return;
    }
    try {
      dataService.rejectCustomerRegistration(rejectingReg.id, rejectReason.trim(), currentUser);
      setRejectingReg(null);
      setRejectReason('');
      setRefreshKey(prev => prev + 1);
      alert('Permintaan pendaftaran telah ditolak.');
    } catch (err: any) {
      alert(err.message || 'Gagal menolak pendaftaran');
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    if (regFilterStatus !== 'ALL' && r.status !== regFilterStatus) return false;
    if (regSearch.trim()) {
      const q = regSearch.toLowerCase();
      const match = r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.address.toLowerCase().includes(q) || r.rw.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

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

      {/* Sub Tabs: Pelanggan Terdaftar vs Permintaan Pendaftaran */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setMainTab('REGISTERED')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            mainTab === 'REGISTERED'
              ? 'text-brand-800 border-b-2 border-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pelanggan Terdaftar ({customers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('APPLICATIONS')}
          className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            mainTab === 'APPLICATIONS'
              ? 'text-brand-800 border-b-2 border-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Permintaan Pendaftaran Warga</span>
          {pendingRegsCount > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-2xs">
              {pendingRegsCount} Baru
            </span>
          )}
        </button>
      </div>

      {mainTab === 'REGISTERED' ? (
        <>
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

                    <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg text-slate-700 font-semibold transition"
                        title="Lihat Detail & Layanan"
                      >
                        Detail & Layanan
                      </button>

                      <button
                        onClick={() => handleOpenEditCustomer(cust)}
                        className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition inline-flex items-center"
                        title="Edit Data Pelanggan (Nama, No WA, Alamat, Status)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleResetPin(cust)}
                        className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs transition inline-flex items-center"
                        title="Reset PIN Pelanggan"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(cust)}
                        className={`px-2 py-1.5 rounded-lg text-xs transition inline-flex items-center ${
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
      </>
      ) : (
        /* ================= TAB PERMINTAAN PENDAFTARAN WARGA ================= */
        <div className="space-y-4">
          {/* Toolbar & Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama pemohon, nomor WhatsApp, alamat, atau RW..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRegFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  regFilterStatus === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({registrations.length})
              </button>
              <button
                type="button"
                onClick={() => setRegFilterStatus('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  regFilterStatus === 'PENDING'
                    ? 'bg-white text-amber-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Menunggu Eksekusi</span>
                {pendingRegsCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {pendingRegsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setRegFilterStatus('APPROVED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  regFilterStatus === 'APPROVED'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disetujui ({registrations.filter(r => r.status === 'APPROVED').length})
              </button>
              <button
                type="button"
                onClick={() => setRegFilterStatus('REJECTED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  regFilterStatus === 'REJECTED'
                    ? 'bg-white text-rose-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ditolak ({registrations.filter(r => r.status === 'REJECTED').length})
              </button>
            </div>
          </div>

          {/* List Permintaan */}
          {filteredRegistrations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">Tidak ada data pendaftaran warga</p>
              <p className="text-xs text-slate-400 mt-1">
                {regSearch ? 'Tidak ada pendaftaran yang cocok dengan filter pencarian.' : 'Belum ada permintaan pendaftaran baru dari warga.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900">{reg.name}</h3>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                            {reg.rw} / {reg.rt}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Daftar: {new Date(reg.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>

                      {/* Status Badge */}
                      {reg.status === 'PENDING' && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>Menunggu Eksekusi</span>
                        </span>
                      )}
                      {reg.status === 'APPROVED' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Disetujui</span>
                        </span>
                      )}
                      {reg.status === 'REJECTED' && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1 shrink-0">
                          <XCircle className="w-3 h-3" />
                          <span>Ditolak</span>
                        </span>
                      )}
                    </div>

                    {/* Details Info */}
                    <div className="space-y-2 text-xs">
                      {/* WhatsApp / Telepon */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>No. WhatsApp:</span>
                        </span>
                        <a
                          href={`https://wa.me/62${reg.phone.replace(/\D/g, '').replace(/^0/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1"
                          title="Hubungi via WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{reg.phone}</span>
                        </a>
                      </div>

                      {/* Alamat */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 shrink-0 flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-slate-400" />
                          <span>Alamat:</span>
                        </span>
                        <span className="font-medium text-slate-800 text-right">{reg.address}</span>
                      </div>

                      {/* Google Maps Lokasi */}
                      {(reg.googleMapsUrl || (reg.latitude && reg.longitude)) && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span>Titik Peta:</span>
                          </span>
                          <a
                            href={reg.googleMapsUrl || `https://maps.google.com/?q=${reg.latitude},${reg.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition"
                          >
                            <span>Buka Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Catatan Patokan */}
                      {reg.notes && (
                        <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 italic">
                          "{reg.notes}"
                        </div>
                      )}

                      {/* Info Persetujuan atau Penolakan */}
                      {reg.status === 'APPROVED' && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>ID Pelanggan Diterbitkan:</span>
                            <span className="font-mono text-emerald-800 font-bold">{reg.createdCustomerCode || '-'}</span>
                          </div>
                          <div className="text-[10px] text-emerald-700">
                            Disetujui oleh: {reg.processedByName || 'Petugas'} ({reg.processedAt ? new Date(reg.processedAt).toLocaleDateString('id-ID') : '-'})
                          </div>
                        </div>
                      )}

                      {reg.status === 'REJECTED' && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900">
                          <strong>Alasan Ditolak:</strong> {reg.rejectionReason || 'Tidak memenuhi ketentuan pendaftaran'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center gap-2">
                    {reg.status === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingReg(reg);
                            setRejectReason('');
                          }}
                          className="flex-1 py-2 px-3 border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExecutingReg(reg);
                            setExecObjectName('Rumah Tinggal');
                            setExecCategoryId(categories[0]?.id || '');
                          }}
                          className="flex-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Eksekusi &amp; Setujui</span>
                        </button>
                      </>
                    ) : reg.status === 'APPROVED' ? (
                      <a
                        href={dataService.prepareWhatsAppAccountConfirmation({
                          customerName: reg.name,
                          customerCode: reg.createdCustomerCode || '',
                          phone: reg.phone,
                          address: reg.address,
                          pin: '1234'
                        }).waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kirim Info Login via WhatsApp</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Pendaftaran telah ditutup.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditService(srv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-[11px] font-bold border border-slate-200 hover:border-blue-300 transition shadow-2xs cursor-pointer"
                        title="Edit Data Lokasi Layanan Ini"
                      >
                        <Edit3 className="w-3 h-3 text-blue-600" />
                        <span>Edit</span>
                      </button>
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
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleOpenEditCustomer(selectedCustomer)}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Data Pelanggan</span>
              </button>
              <button
                type="button"
                onClick={() => handleResetPin(selectedCustomer)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Reset PIN</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
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

      {/* ================= EXECUTE REGISTRATION MODAL ================= */}
      {executingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Eksekusi Pendaftaran Pelanggan</h3>
                  <p className="text-[11px] text-slate-500">Tentukan kategori objek &amp; terbitkan ID Pelanggan resmi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExecutingReg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ringkasan Data Warga */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-4 space-y-1.5 text-xs">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Data Pemohon Warga:</div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nama:</span>
                  <span className="font-semibold text-slate-800">{executingReg.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">No. WhatsApp:</span>
                  <span className="font-semibold text-slate-800">{executingReg.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Wilayah:</span>
                  <span className="font-semibold text-slate-800">{executingReg.rw} / {executingReg.rt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Alamat:</span>
                  <span className="font-semibold text-slate-800 truncate block">{executingReg.address}</span>
                </div>
              </div>
              {(executingReg.googleMapsUrl || (executingReg.latitude && executingReg.longitude)) && (
                <div className="pt-1 text-[11px]">
                  <a
                    href={executingReg.googleMapsUrl || `https://maps.google.com/?q=${executingReg.latitude},${executingReg.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Cek Titik Rumah di Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <form onSubmit={handleApproveRegistration} className="space-y-4 text-xs">
              {/* Petugas / Admin Decision Fields */}
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Nama Objek Layanan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={execObjectName}
                  onChange={(e) => setExecObjectName(e.target.value)}
                  placeholder="Contoh: Rumah Tinggal / Toko Kelontong / Rumah Induk"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Identitas fisik tempat sampah yang akan dilayani.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Kategori Pelanggan &amp; Tarif Iuran <span className="text-red-500">*</span>
                </label>
                <select
                  value={execCategoryId}
                  onChange={(e) => setExecCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                >
                  {categories.map((c) => {
                    const trf = tariffs.find(t => t.categoryId === c.id);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} — Rp {(trf?.amount || 0).toLocaleString('id-ID')} / bulan
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tarif iuran bulanan akan otomatis terhubung ke kategori yang dipilih.
                </p>
              </div>

              {/* Preview ID Pelanggan dan PIN */}
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-700">ID Pelanggan yang Akan Diterbitkan:</span>
                  <div className="font-mono font-black text-sm text-brand-900 mt-0.5">
                    {dataService.generateCustomerCode(executingReg.rw)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500">PIN Awal:</span>
                  <div className="font-mono font-bold text-xs text-slate-700">1234</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setExecutingReg(null)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui &amp; Terbitkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EXECUTION SUCCESS MODAL ================= */}
      {executingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                Akun Berhasil Diterbitkan
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Pelanggan Baru Aktif!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Data warga <strong>{executingSuccess.customer.name}</strong> telah resmi terdaftar dalam sistem RESIK.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Pelanggan:</span>
                <span className="font-bold text-brand-800 text-sm">{executingSuccess.customer.customerCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PIN Awal:</span>
                <span className="font-bold text-slate-800">1234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-semibold text-slate-800">{executingSuccess.categoryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. WhatsApp:</span>
                <span className="font-semibold text-slate-800">{executingSuccess.registration.phone}</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={dataService.prepareWhatsAppAccountConfirmation({
                  customerName: executingSuccess.customer.name,
                  customerCode: executingSuccess.customer.customerCode,
                  phone: executingSuccess.registration.phone,
                  pin: '1234',
                  categoryName: executingSuccess.categoryName,
                  address: executingSuccess.customer.address
                }).waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim Info Akun via WhatsApp</span>
              </a>
              <p className="text-[10px] text-slate-400 text-center">
                *Warga dapat masuk menggunakan ID Pelanggan atau Nomor WhatsApp yang didaftarkan.
              </p>

              <button
                type="button"
                onClick={() => setExecutingSuccess(null)}
                className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REJECT REGISTRATION MODAL ================= */}
      {rejectingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <h3 className="font-bold text-base text-slate-900 mb-1 text-red-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>Tolak Pendaftaran Warga</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pendaftaran atas nama <strong>{rejectingReg.name}</strong> ({rejectingReg.address}) akan ditandai Ditolak.
            </p>

            <form onSubmit={handleRejectRegistration} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Di luar jangkauan armada truk sampah BUMDes / Alamat dan nomor telepon tidak valid"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingReg(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT CUSTOMER MODAL ================= */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Edit Data Pelanggan
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  Perbarui Informasi Pelanggan
                </h3>
                <p className="text-xs text-slate-500">
                  Revisi nama warga, nomor WhatsApp/HP, domisili/lokasi, atau status akun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-500 mb-1">
                  ID Pelanggan (Permanen)
                </label>
                <input
                  type="text"
                  value={editingCustomer.customerCode}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600 font-bold select-all cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 border border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  No. WhatsApp / Telepon
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 border border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Digunakan untuk masuk (login warga), konfirmasi penerbitan akun, dan reminder tagihan via WhatsApp.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Alamat Domisili / Rumah <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Contoh: Jl. Merpati No. 14, RT 01 / RW 03"
                  className="w-full px-3 py-2 border border-slate-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncServiceAddress}
                    onChange={(e) => setSyncServiceAddress(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className="font-semibold text-slate-700 text-xs">
                    Perbarui juga alamat lokasi layanan utama jika warga pindah lokasi
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 ml-6">
                  Jika dicentang, alamat pada objek layanan kebersihan pelanggan ini otomatis diselaraskan dengan alamat baru di atas.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Status Akun Pelanggan
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="ACTIVE">Aktif (Dapat mengakses layanan & menerima tagihan)</option>
                  <option value="INACTIVE">Nonaktif (Layanan dihentikan sementara)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT SERVICE LOCATION MODAL ================= */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Edit Lokasi Layanan
                </span>
                <h3 className="font-extrabold text-base text-slate-900 mt-1">
                  Revisi Objek / Lokasi Layanan
                </h3>
                <p className="text-xs text-slate-500">
                  Kode Layanan: <strong className="font-mono text-brand-700">{editingService.serviceCode}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditService} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Nama Objek Layanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editSrvName}
                  onChange={(e) => setEditSrvName(e.target.value)}
                  placeholder="Contoh: Rumah Tinggal / Toko Berkah"
                  className="w-full px-3 py-2 border border-slate-300 focus:border-brand-500 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Alamat Objek Layanan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editSrvAddress}
                  onChange={(e) => setEditSrvAddress(e.target.value)}
                  placeholder="Contoh: Jl. Merpati No. 14"
                  className="w-full px-3 py-2 border border-slate-300 focus:border-brand-500 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Wilayah RW</label>
                  <select
                    value={editSrvRW}
                    onChange={(e) => setEditSrvRW(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    {uniqueRWs.map(rw => <option key={rw} value={rw}>{rw}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Wilayah RT</label>
                  <input
                    type="text"
                    value={editSrvRT}
                    onChange={(e) => setEditSrvRT(e.target.value)}
                    placeholder="Contoh: RT 01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editSrvCategoryId}
                    onChange={(e) => {
                      setEditSrvCategoryId(e.target.value);
                      const matchingTrf = tariffs.find(t => t.categoryId === e.target.value);
                      if (matchingTrf) setEditSrvTariffId(matchingTrf.id);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Tarif Retribusi</label>
                  <select
                    value={editSrvTariffId}
                    onChange={(e) => setEditSrvTariffId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-brand-800"
                  >
                    {tariffs.filter(t => t.categoryId === editSrvCategoryId || t.id === editSrvTariffId).map(t => (
                      <option key={t.id} value={t.id}>
                        Rp {t.amount.toLocaleString('id-ID')}/bln
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tempel / Deteksi Titik Google Maps */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold uppercase text-[10px] text-emerald-900 tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Titik / Link Google Maps (Auto Deteksi GPS)</span>
                  </label>
                  {editSrvDetectedCoord && (
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      Terdeteksi!
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={editSrvGmapsInput}
                    onChange={(e) => handleEditSrvGmapsPaste(e.target.value)}
                    placeholder="Paste link Google Maps atau koordinat (-7.3885, 112.7214)..."
                    className="w-full pl-3 pr-8 py-2 bg-white border border-emerald-300 focus:border-emerald-500 rounded-xl text-xs placeholder:text-slate-400"
                  />
                  {editSrvDetectedCoord && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">Latitude</label>
                    <input
                      type="text"
                      value={editSrvLat}
                      onChange={(e) => setEditSrvLat(e.target.value)}
                      placeholder="-7.3885"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">Longitude</label>
                    <input
                      type="text"
                      value={editSrvLng}
                      onChange={(e) => setEditSrvLng(e.target.value)}
                      placeholder="112.7214"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer"
                >
                  Simpan Lokasi Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
