import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { WhatsAppPreviewModal } from '../components/common/WhatsAppPreviewModal';
import {
  AlertTriangle, MessageSquare, Search, Filter,
  Phone, Users, DollarSign, Clock, CheckSquare, Square,
  Send, CheckCircle2, Copy, Check, X, ExternalLink, ChevronRight, ChevronLeft
} from 'lucide-react';

const formatShortMonth = (monthStr: string) => {
  return monthStr
    .replace('Januari', 'Jan')
    .replace('Februari', 'Feb')
    .replace('Maret', 'Mar')
    .replace('April', 'Apr')
    .replace('Mei', 'Mei')
    .replace('Juni', 'Jun')
    .replace('Juli', 'Jul')
    .replace('Agustus', 'Agt')
    .replace('September', 'Sep')
    .replace('Oktober', 'Okt')
    .replace('November', 'Nov')
    .replace('Desember', 'Des');
};

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

  // Bulk actions & queue runner state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkQueueIndex, setBulkQueueIndex] = useState(0);
  const [completedBulkIds, setCompletedBulkIds] = useState<string[]>([]);
  const [bulkFinished, setBulkFinished] = useState(false);
  const [copiedBulk, setCopiedBulk] = useState(false);

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

  // Selected items with valid WhatsApp phone
  const selectedWithPhoneItems = overdueItems.filter(
    item => selectedCustomerIds.includes(item.customer.id) &&
    Boolean(item.customer.phone && item.customer.phone.trim().length > 0)
  );

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

  // Bulk Actions Handlers
  const handleStartBulkSend = () => {
    if (selectedWithPhoneItems.length === 0) {
      alert('Pelanggan yang dipilih tidak memiliki nomor WhatsApp yang dapat dihubungi.');
      return;
    }
    setBulkQueueIndex(0);
    setCompletedBulkIds([]);
    setBulkFinished(false);
    setBulkModalOpen(true);
  };

  const handleBulkMarkAsReminded = () => {
    if (!confirm(`Tandai ${selectedCustomerIds.length} pelanggan terpilih sebagai sudah diingatkan di sistem?`)) {
      return;
    }
    let count = 0;
    for (const custId of selectedCustomerIds) {
      try {
        const prep = dataService.prepareWhatsAppReminder(custId);
        dataService.recordWhatsAppReminderOpened(
          custId,
          currentUser,
          prep.totalOverdue,
          prep.messageText
        );
        count++;
      } catch {
        // Customer might have no overdue bills
      }
    }
    setSelectedCustomerIds([]);
    setRefreshKey(prev => prev + 1);
    alert(`Berhasil menandai ${count} pelanggan sebagai sudah diingatkan.`);
  };

  const handleBulkCopy = () => {
    const texts: string[] = [];
    for (const custId of selectedCustomerIds) {
      try {
        const prep = dataService.prepareWhatsAppReminder(custId);
        texts.push(`[${prep.customer.customerCode} - ${prep.customer.name} (${prep.customer.phone || 'Tanpa WA'})]\n${prep.messageText}`);
      } catch {}
    }
    if (texts.length === 0) {
      alert('Tidak ada teks pesan yang dapat disalin.');
      return;
    }
    navigator.clipboard.writeText(texts.join('\n\n========================================\n\n'));
    setCopiedBulk(true);
    setTimeout(() => setCopiedBulk(false), 2500);
  };

  // Bulk queue current item
  const currentBulkItem = selectedWithPhoneItems[bulkQueueIndex];
  const currentBulkPrep = currentBulkItem
    ? (() => {
        try {
          return dataService.prepareWhatsAppReminder(currentBulkItem.customer.id);
        } catch {
          return null;
        }
      })()
    : null;

  const handleProcessCurrentBulk = () => {
    if (!currentBulkItem || !currentBulkPrep) return;

    dataService.recordWhatsAppReminderOpened(
      currentBulkItem.customer.id,
      currentUser,
      currentBulkPrep.totalOverdue,
      currentBulkPrep.messageText
    );

    if (currentBulkPrep.waUrl) {
      window.open(currentBulkPrep.waUrl, '_blank', 'noopener,noreferrer');
    }

    if (!completedBulkIds.includes(currentBulkItem.customer.id)) {
      setCompletedBulkIds(prev => [...prev, currentBulkItem.customer.id]);
    }

    if (bulkQueueIndex < selectedWithPhoneItems.length - 1) {
      setBulkQueueIndex(prev => prev + 1);
    } else {
      setBulkFinished(true);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleSkipCurrentBulk = () => {
    if (bulkQueueIndex < selectedWithPhoneItems.length - 1) {
      setBulkQueueIndex(prev => prev + 1);
    } else {
      setBulkFinished(true);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleCloseBulkModal = () => {
    setBulkModalOpen(false);
    setSelectedCustomerIds([]);
    setRefreshKey(prev => prev + 1);
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

        {/* Bulk Actions Bar (Follow-up for checklist) */}
        {selectedCustomerIds.length > 0 && (
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px]">
                {selectedCustomerIds.length}
              </span>
              <div>
                <span className="font-bold text-brand-900">
                  {selectedCustomerIds.length} Pelanggan Terpilih
                </span>
                <span className="text-[11px] text-brand-700 ml-2 hidden sm:inline">
                  ({selectedWithPhoneItems.length} memiliki nomor WA siap kirim)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleStartBulkSend}
                disabled={selectedWithPhoneItems.length === 0}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                  selectedWithPhoneItems.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title="Buka antrean pengiriman pesan WhatsApp berurutan per pelanggan"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim WA Terpilih ({selectedWithPhoneItems.length})</span>
              </button>

              <button
                onClick={handleBulkMarkAsReminded}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Tandai status pengingat sebagai OPENED untuk seluruh pelanggan terpilih"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tandai Terkirim</span>
              </button>

              <button
                onClick={handleBulkCopy}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                title="Salin seluruh draf pesan teks ke clipboard"
              >
                {copiedBulk ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedCustomerIds([])}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-brand-100 rounded-lg transition cursor-pointer"
                title="Batalkan pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overdue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-2 w-8 text-center">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    {selectedCustomerIds.length === filteredList.length && filteredList.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-2 w-24 whitespace-nowrap">ID Pelanggan</th>
                <th className="py-2.5 px-2 min-w-[130px]">Nama Warga</th>
                <th className="py-2.5 px-2 w-28 whitespace-nowrap">WhatsApp</th>
                <th className="py-2.5 px-2 w-24 text-center whitespace-nowrap">Bulan</th>
                <th className="py-2.5 px-2 w-24 text-right whitespace-nowrap">Tunggakan</th>
                <th className="py-2.5 px-2 w-28 text-center whitespace-nowrap">Diingatkan</th>
                <th className="py-2.5 px-2 w-20 text-right whitespace-nowrap">Aksi</th>
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
                      <td className="py-2.5 px-2 text-center align-middle">
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

                      <td className="py-2.5 px-2 font-mono font-bold text-brand-800 align-middle whitespace-nowrap text-xs">
                        <span className="bg-brand-50 border border-brand-200/80 px-1.5 py-0.5 rounded text-[11px] inline-block">
                          {item.customer.customerCode}
                        </span>
                      </td>

                      <td className="py-2.5 px-2 align-middle">
                        <div className="font-bold text-slate-900 text-xs">{item.customer.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px] mt-0.5" title={item.customer.address}>
                          {item.customer.address}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 font-mono align-middle whitespace-nowrap text-xs">
                        {hasPhone ? (
                          <span className="text-slate-800 font-medium">{item.customer.phone}</span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Tanpa WA
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {item.unpaidMonths.map((m, i) => (
                            <span key={i} className="bg-red-50 text-red-700 font-bold text-[10px] px-1.5 py-0.5 rounded-full border border-red-200 whitespace-nowrap">
                              {formatShortMonth(m)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 font-black text-red-600 text-xs font-mono align-middle text-right whitespace-nowrap">
                        Rp {item.totalAmount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-2.5 px-2 text-[11px] text-slate-500 align-middle text-center whitespace-nowrap">
                        {item.customer.lastRemindedAt ? (
                          <div>
                            <div className="font-medium text-slate-700 text-[10px]">
                              {new Date(item.customer.lastRemindedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })},{' '}
                              {new Date(item.customer.lastRemindedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[9px] text-emerald-600 font-bold">OPENED</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum</span>
                        )}
                      </td>

                      <td className="py-2.5 px-2 text-right align-middle whitespace-nowrap">
                        {hasPhone ? (
                          <button
                            onClick={() => handleOpenReminder(item.customer.id)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-2xs inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Ingatkan</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed whitespace-nowrap"
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
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan <strong>{filteredList.length}</strong> dari <strong>{overdueItems.length}</strong> pelanggan menunggak</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Pilih centang massal untuk tindak lanjut atau klik &quot;Ingatkan&quot; per pelanggan</span>
        </div>
      </div>

      {/* Bulk WhatsApp Queue Modal */}
      {bulkModalOpen && selectedWithPhoneItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    Antrean Kirim WhatsApp Massal
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    {bulkFinished
                      ? 'Pengiriman selesai'
                      : `Warga ke-${bulkQueueIndex + 1} dari ${selectedWithPhoneItems.length} pelanggan terpilih`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseBulkModal}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-emerald-950/20 h-1.5">
              <div
                className="bg-emerald-400 h-1.5 transition-all duration-300"
                style={{
                  width: `${bulkFinished ? 100 : Math.round(((bulkQueueIndex + 1) / selectedWithPhoneItems.length) * 100)}%`
                }}
              />
            </div>

            {/* Modal Body */}
            {bulkFinished ? (
              <div className="p-8 text-center space-y-4 my-auto">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    Antrean Selesai Diproses!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Sebanyak <strong>{completedBulkIds.length}</strong> dari <strong>{selectedWithPhoneItems.length}</strong> warga berhasil dibuka pengingat WhatsApp-nya dan status pengingat telah diperbarui di sistem.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleCloseBulkModal}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Selesai & Kembali ke Tabel
                  </button>
                </div>
              </div>
            ) : currentBulkItem && currentBulkPrep ? (
              <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
                {/* Stepper list */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  {selectedWithPhoneItems.map((item, idx) => {
                    const isDone = completedBulkIds.includes(item.customer.id);
                    const isCurrent = idx === bulkQueueIndex;
                    return (
                      <button
                        key={item.customer.id}
                        onClick={() => setBulkQueueIndex(idx)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[10px] shrink-0 transition flex items-center gap-1 border ${
                          isCurrent
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                            : isDone
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 text-emerald-600" />}
                        <span>{idx + 1}. {item.customer.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Customer card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {currentBulkPrep.customer.customerCode}
                    </span>
                    <span className="text-[11px] font-mono text-slate-600 font-medium">
                      📱 {currentBulkPrep.customer.phone}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="font-bold text-sm text-slate-900">{currentBulkPrep.customer.name}</div>
                    <div className="text-right">
                      <span className="text-red-600 font-mono font-bold text-sm">
                        {currentBulkPrep.formattedTotal}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {currentBulkPrep.customer.address}
                  </div>
                </div>

                {/* Warning if recently reminded */}
                {currentBulkPrep.recentReminderWarning && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{currentBulkPrep.recentReminderWarning}</span>
                  </div>
                )}

                {/* Message preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Pratinjau Pesan yang Dikirim
                    </label>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      Template Resmi BUMDes
                    </span>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto font-sans">
                    {currentBulkPrep.messageText}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 bg-slate-50 rounded-lg p-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Klik tombol di bawah akan membuka tab WhatsApp baru dan otomatis berpindah ke antrean warga berikutnya.
                  </span>
                </div>
              </div>
            ) : null}

            {/* Modal Footer */}
            {!bulkFinished && (
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBulkQueueIndex(prev => Math.max(0, prev - 1))}
                    disabled={bulkQueueIndex === 0}
                    className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Warga Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBulkQueueIndex(prev => Math.min(selectedWithPhoneItems.length - 1, prev + 1))}
                    disabled={bulkQueueIndex === selectedWithPhoneItems.length - 1}
                    className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Warga Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSkipCurrentBulk}
                    className="px-3 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-white text-xs font-semibold transition"
                  >
                    Lewati
                  </button>
                  <button
                    onClick={handleProcessCurrentBulk}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {bulkQueueIndex === selectedWithPhoneItems.length - 1
                        ? 'Kirim WA & Selesai'
                        : 'Kirim WA & Lanjut'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
