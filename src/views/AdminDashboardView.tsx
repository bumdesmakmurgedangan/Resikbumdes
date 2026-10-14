import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { WhatsAppPreviewModal } from '../components/common/WhatsAppPreviewModal';
import {
  Users, CheckCircle2, Clock, AlertTriangle, ArrowUpRight,
  TrendingUp, MessageSquare, AlertCircle, ShieldAlert, DollarSign, UserPlus
} from 'lucide-react';

interface AdminDashboardViewProps {
  onNavigateTab: (tab: string, param?: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigateTab }) => {
  const { currentUser, role } = useAuth();
  if (!currentUser) return null;

  const stats = dataService.getDashboardStats();
  const rwStats = dataService.getRwCollectibilityStats();
  const overdueCustomers = dataService.getOverdueCustomers().slice(0, 5); // top 5 for quick action
  const pendingPayments = dataService.getPayments({ status: 'PENDING' });
  const pendingRegistrationsCount = dataService.getPendingCustomerRegistrationsCount();

  // WhatsApp preview modal state
  const [waModalData, setWaModalData] = useState<ReturnType<typeof dataService.prepareWhatsAppReminder> | null>(null);

  const handleOpenReminder = (customerId: string) => {
    try {
      const data = dataService.prepareWhatsAppReminder(customerId);
      setWaModalData(data);
    } catch (err: any) {
      alert(err.message || 'Tidak dapat membuka pengingat WhatsApp');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Operasional RESIK
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Selamat datang, <strong className="text-slate-800">{currentUser.fullName}</strong> ({role})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('cash-payment')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <span>+ Catat Bayar Tunai</span>
          </button>
        </div>
      </div>

      {/* Verification Alert Banner (PRD Section 82) */}
      {pendingPayments.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">
                Terdapat {pendingPayments.length} Pembayaran Transfer/QRIS Menunggu Verifikasi
              </h2>
              <p className="text-xs text-amber-100 mt-0.5">
                Warga telah mengunggah bukti bayar. Mohon diperiksa agar status tagihan berubah LUNAS.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('verification')}
            className="px-5 py-2.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-black transition shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Periksa Sekarang</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Customer Registration Alert Banner */}
      {pendingRegistrationsCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-block bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full mb-1 uppercase tracking-wider">
                Pendaftaran Warga Baru
              </div>
              <h2 className="font-bold text-base leading-tight">
                Terdapat {pendingRegistrationsCount} Permintaan Pendaftaran Pelanggan Baru Menunggu Eksekusi
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Warga telah mengisi formulir mandiri &amp; titik lokasi rumah. Tentukan kategori/tarif dan terbitkan ID Pelanggan.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('customers')}
            className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black transition shrink-0 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Eksekusi Pendaftaran</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Grid (PRD Section 81) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pelanggan Aktif */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pelanggan Aktif</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.activeCustomers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total warga terdaftar</div>
        </div>

        {/* Sudah Bayar Bulan Ini */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sudah Bayar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.paidBills}</div>
          <div className="text-[11px] text-slate-400 mt-1">Lunas periode Okt 2026</div>
        </div>

        {/* Belum Bayar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Belum Bayar</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.unpaidBills}</div>
          <div className="text-[11px] text-slate-400 mt-1">Periode berjalan</div>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verifikasi</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-600">{stats.pendingBills}</div>
          <div className="text-[11px] text-slate-400 mt-1">Transfer & QRIS baru</div>
        </div>

        {/* Pelanggan Menunggak */}
        <div
          onClick={() => onNavigateTab('overdue', 'ALL')}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-red-300 shadow-xs cursor-pointer transition group"
          title="Klik untuk membuka semua data tunggakan"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-red-700 transition">Pelanggan Menunggak</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600">{stats.totalOverdueCustomers}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Lewat jatuh tempo</span>
            <span className="text-red-600 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
              Lihat &rarr;
            </span>
          </div>
        </div>

        {/* Total Nominal Tunggakan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Tunggakan</span>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-700">
            Rp {stats.totalOverdueAmount.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Akumulasi seluruh RW</div>
        </div>

        {/* Pendapatan Bulan Ini */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs col-span-2">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pendapatan Terkumpul Bulan Ini</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-brand-900">
            Rp {stats.totalRevenueThisMonth.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Penerimaan resmi kas BUMDes (Okt 2026)</div>
        </div>
      </div>

      {/* Tingkat Kolektibilitas Iuran per Wilayah RW */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Tingkat Kolektibilitas Iuran per Wilayah RW
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              Performa pembayaran iuran warga berdasarkan wilayah rukun warga
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Bulan Berjalan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {rwStats.map((item) => {
            const isFull = item.percentage === 100;
            const hasProgress = item.percentage > 0;

            return (
              <div
                key={item.rwCode}
                onClick={() => onNavigateTab('overdue', item.rwCode)}
                title={`Klik untuk melihat rincian tunggakan ${item.rwCode}`}
                className="bg-white border border-slate-200/90 hover:border-brand-400 hover:ring-2 hover:ring-brand-100 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
              >
                {/* Header: Nama RW & Persentase */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition">
                    {item.rwCode}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    {item.percentage}%
                  </span>
                </div>

                {/* Progress Bar Horizontal */}
                <div className="w-full bg-slate-100 rounded-full h-2 my-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull
                        ? 'bg-emerald-500'
                        : hasProgress
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                {/* Footer: X/Y bayar & Total Rupiah */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium text-[11px]">
                    {item.paidCount}/{item.totalBills} bayar
                  </span>
                  <span className="font-medium text-slate-500 font-mono text-[11px]">
                    Rp {item.paidAmount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-brand-600 font-semibold group-hover:text-brand-700">
                  <span>Lihat tunggakan</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Overdue List with WhatsApp Quick Actions (PRD Section 83) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daftar Tunggakan Cepat (Quick Action WA)</h2>
            <p className="text-xs text-slate-500">
              Sistem otomatis mendeteksi tagihan lewat jatuh tempo. Kirim pengingat langsung tanpa pindah halaman.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('overdue', 'ALL')}
            className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Buka Semua Tunggakan ({stats.totalOverdueCustomers})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">ID Pelanggan</th>
                <th className="py-2.5 px-3">Nama Warga</th>
                <th className="py-2.5 px-3">No HP / WA</th>
                <th className="py-2.5 px-3">Bulan Belum Lunas</th>
                <th className="py-2.5 px-3">Total Tunggakan</th>
                <th className="py-2.5 px-3">Terakhir Diingatkan</th>
                <th className="py-2.5 px-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overdueCustomers.map((item) => (
                <tr key={item.customer.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono font-medium text-brand-800">
                    {item.customer.customerCode}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{item.customer.name}</div>
                    <div className="text-[11px] text-slate-400">{item.serviceNames.join(', ')}</div>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {item.customer.phone ? (
                      <span className="text-slate-800">{item.customer.phone}</span>
                    ) : (
                      <span className="text-slate-400 italic">Tidak ada nomor WA</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-200">
                      {item.bills.length} bulan
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-red-600">
                    Rp {item.totalAmount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {item.customer.lastRemindedAt ? (
                      new Date(item.customer.lastRemindedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                    ) : (
                      <span className="text-slate-400">Belum pernah</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {item.customer.phone ? (
                      <button
                        onClick={() => handleOpenReminder(item.customer.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition shadow-xs inline-flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ingatkan WA</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Tanpa WA</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppPreviewModal
        data={waModalData}
        actorUser={currentUser}
        onClose={() => setWaModalData(null)}
      />
    </div>
  );
};
