import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { WhatsAppPreviewModal } from '../components/common/WhatsAppPreviewModal';
import {
  AlertTriangle, MessageSquare, Search, Filter,
  Phone, Users, DollarSign, Clock, CheckSquare, Square
} from 'lucide-react';

export const OverdueView: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const [refreshKey, setRefreshKey] = useState(0);
  const overdueItems = dataService.getOverdueCustomers();
  const regions = dataService.getRegions();
  const uniqueRWs: string[] = Array.from(new Set(regions.map(r => r.rwCode))).sort();

  // Filter States (PRD Section 51)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRW, setFilterRW] = useState('ALL');
  const [filterWhatsApp, setFilterWhatsApp] = useState<'ALL' | 'WITH_WA' | 'NO_WA'>('ALL');
  const [filterReminder, setFilterReminder] = useState<'ALL' | 'REMINDED' | 'NOT_REMINDED'>('ALL');

  // Bulk selection state (PRD Section 50)
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);

  // WhatsApp preview modal
  const [waModalData, setWaModalData] = useState<ReturnType<typeof dataService.prepareWhatsAppReminder> | null>(null);

  // Apply filters
  const filteredList = overdueItems.filter((item) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.customer.name.toLowerCase().includes(q);
      const matchCode = item.customer.customerCode.toLowerCase().includes(q);
      const matchPhone = item.customer.phone.includes(q);
      if (!matchName && !matchCode && !matchPhone) return false;
    }

    // Filter RW
    if (filterRW !== 'ALL') {
      const match = item.bills.some(b => {
        const srv = dataService.getServiceLocations().find(s => s.id === b.serviceId);
        return srv?.rw === filterRW;
      });
      if (!match) return false;
    }

    // Filter WhatsApp
    if (filterWhatsApp === 'WITH_WA' && (!item.customer.phone || item.customer.phone.trim().length === 0)) {
      return false;
    }
    if (filterWhatsApp === 'NO_WA' && item.customer.phone && item.customer.phone.trim().length > 0) {
      return false;
    }

    // Filter Reminder status
    if (filterReminder === 'REMINDED' && !item.customer.lastRemindedAt) {
      return false;
    }
    if (filterReminder === 'NOT_REMINDED' && item.customer.lastRemindedAt) {
      return false;
    }

    return true;
  });

  // Calculate statistics (PRD Section 52)
  const totalOverdueCustomers = overdueItems.length;
  const totalOverdueAmount = overdueItems.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const alreadyOpenedCount = overdueItems.filter(o => Boolean(o.customer.lastRemindedAt)).length;
  const notRemindedCount = totalOverdueCustomers - alreadyOpenedCount;
  const hasPhoneCount = overdueItems.filter(o => Boolean(o.customer.phone && o.customer.phone.trim().length > 0)).length;

  const handleOpenReminder = (customerId: string) => {
    try {
      const data = dataService.prepareWhatsAppReminder(customerId);
      setWaModalData(data);
    } catch (err: any) {
      alert(err.message || 'Gagal membuka pengingat WhatsApp');
    }
  };

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomerIds.length === filteredList.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(filteredList.map(item => item.customer.id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header (PRD Section 40) */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Daftar Pelanggan Menunggak
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Sistem otomatis mendeteksi tagihan yang melewati batas jatuh tempo dan belum lunas.
        </p>
      </div>

      {/* Statistics Banner (PRD Section 52) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelanggan Menunggak</div>
          <div className="text-2xl font-black text-red-600 mt-1">{totalOverdueCustomers}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Warga belum lunas</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tunggakan</div>
          <div className="text-xl font-black text-red-700 mt-1">
            Rp {totalOverdueAmount.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Akumulasi seluruh objek</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sudah Dibuka Pengingat</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{alreadyOpenedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tercatat status OPENED</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Belum Diingatkan</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{notRemindedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Perlu tindak lanjut</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memiliki WhatsApp</div>
          <div className="text-2xl font-black text-brand-900 mt-1">{hasPhoneCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Siap kirim via wa.me</div>
        </div>
      </div>

      {/* Filter and Search Bar (PRD Section 51) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, ID, atau No WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* RW Filter */}
          <select
            value={filterRW}
            onChange={(e) => setFilterRW(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">Semua RW</option>
            {uniqueRWs.map(rw => (
              <option key={rw} value={rw}>{rw}</option>
            ))}
          </select>

          {/* WhatsApp Availability */}
          <select
            value={filterWhatsApp}
            onChange={(e) => setFilterWhatsApp(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">Semua Status No. WA</option>
            <option value="WITH_WA">Memiliki Nomor WhatsApp</option>
            <option value="NO_WA">Tanpa Nomor WhatsApp</option>
          </select>

          {/* Reminder Status */}
          <select
            value={filterReminder}
            onChange={(e) => setFilterReminder(e.target.value as any)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-1 focus:ring-brand-500"
          >
            <option value="ALL">Semua Status Pengingat</option>
            <option value="REMINDED">Sudah Pernah Diingatkan</option>
            <option value="NOT_REMINDED">Belum Pernah Diingatkan</option>
          </select>
        </div>

        {/* Bulk Preparation bar (PRD Section 50) */}
        {selectedCustomerIds.length > 0 && (
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-brand-900">
              {selectedCustomerIds.length} pelanggan dipilih untuk disiapkan pesan pengingat
            </span>
            <span className="text-[11px] text-brand-700">
              (Setiap pesan dibuka satu per satu via wa.me sesuai standar keamanan)
            </span>
          </div>
        )}
      </div>

      {/* Overdue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold text-[11px]">
              <tr>
                <th className="py-3 px-3 w-9 text-center">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    {selectedCustomerIds.length === filteredList.length && filteredList.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-3 w-28 whitespace-nowrap">ID Pelanggan</th>
                <th className="py-3.5 px-3 min-w-[150px]">Nama Warga</th>
                <th className="py-3.5 px-3 w-32 whitespace-nowrap">No HP / WhatsApp</th>
                <th className="py-3.5 px-3 w-24 text-center whitespace-nowrap">Bulan</th>
                <th className="py-3.5 px-3 w-32 text-right whitespace-nowrap">Total Tunggakan</th>
                <th className="py-3.5 px-3 w-32 text-center whitespace-nowrap">Terakhir Diingatkan</th>
                <th className="py-3.5 px-3 w-28 text-right whitespace-nowrap">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data tunggakan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isSelected = selectedCustomerIds.includes(item.customer.id);
                  const hasPhone = Boolean(item.customer.phone && item.customer.phone.trim().length > 0);

                  return (
                    <tr key={item.customer.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 text-center align-middle">
                        <button
                          onClick={() => toggleSelectCustomer(item.customer.id)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-brand-800 align-middle whitespace-nowrap text-xs">
                        <span className="bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-md inline-block">
                          {item.customer.customerCode}
                        </span>
                      </td>

                      <td className="py-3 px-3 align-middle">
                        <div className="font-bold text-slate-900 text-xs">{item.customer.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px] mt-0.5" title={item.customer.address}>
                          {item.customer.address}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono align-middle whitespace-nowrap text-xs">
                        {hasPhone ? (
                          <span className="text-slate-800 font-medium">{item.customer.phone}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Tanpa WA
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {item.unpaidMonths.map((m, i) => (
                            <span key={i} className="bg-red-50 text-red-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-red-200 whitespace-nowrap">
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-black text-red-600 text-xs font-mono align-middle text-right whitespace-nowrap">
                        Rp {item.totalAmount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-500 align-middle text-center whitespace-nowrap">
                        {item.customer.lastRemindedAt ? (
                          <div>
                            <div className="font-medium text-slate-700">
                              {new Date(item.customer.lastRemindedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold">Status: OPENED</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum pernah</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right align-middle whitespace-nowrap">
                        {hasPhone ? (
                          <button
                            onClick={() => handleOpenReminder(item.customer.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Ingatkan WA</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed whitespace-nowrap"
                            title="Nomor WhatsApp tidak tersedia"
                          >
                            Tanpa WA
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan <strong>{filteredList.length}</strong> dari <strong>{overdueItems.length}</strong> pelanggan menunggak</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Pilih centang massal untuk menyiapkan pesan atau klik tombol &quot;Ingatkan WA&quot; per pelanggan</span>
        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppPreviewModal
        data={waModalData}
        actorUser={currentUser}
        onClose={() => setWaModalData(null)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
};
