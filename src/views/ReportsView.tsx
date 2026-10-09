import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import {
  BarChart3, FileSpreadsheet, Printer, Download, Filter,
  DollarSign, CheckCircle2, AlertTriangle, Users, MessageSquare
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<
    'PEMBAYARAN' | 'TUNGGAKAN' | 'PENDAPATAN' | 'WILAYAH' | 'REMINDER'
  >('PEMBAYARAN');

  const payments = dataService.getPayments({ status: 'VERIFIED' });
  const overdueCustomers = dataService.getOverdueCustomers();
  const customers = dataService.getCustomers();
  const services = dataService.getServiceLocations();
  const auditLogs = dataService.getAuditLogs().filter(a => a.action === 'WHATSAPP_REMINDER_OPENED');

  // Total summary numbers
  const totalVerifiedRevenue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalOverdueAmount = overdueCustomers.reduce((acc, c) => acc + c.totalAmount, 0);

  // Group payments by method for Revenue Report
  const paymentsByMethod = payments.reduce((acc, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + Number(p.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Laporan & Rekapitulasi Keuangan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan transparansi pendapatan retribusi persampahan BUMDes Makmur Gedangan.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>
          <button
            onClick={() => dataService.exportPaymentsToExcel()}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setReportType('PEMBAYARAN')}
          className={`px-4 py-2 rounded-xl transition ${
            reportType === 'PEMBAYARAN' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Laporan Pembayaran Lunas
        </button>
        <button
          onClick={() => setReportType('TUNGGAKAN')}
          className={`px-4 py-2 rounded-xl transition ${
            reportType === 'TUNGGAKAN' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Laporan Tunggakan
        </button>
        <button
          onClick={() => setReportType('PENDAPATAN')}
          className={`px-4 py-2 rounded-xl transition ${
            reportType === 'PENDAPATAN' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Rekapitulasi Metode Bayar
        </button>
        <button
          onClick={() => setReportType('REMINDER')}
          className={`px-4 py-2 rounded-xl transition ${
            reportType === 'REMINDER' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Laporan Reminder WhatsApp
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Total Penerimaan Terverifikasi</div>
          <div className="text-xl font-black text-emerald-600 mt-1">
            Rp {totalVerifiedRevenue.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Total Piutang / Tunggakan</div>
          <div className="text-xl font-black text-red-600 mt-1">
            Rp {totalOverdueAmount.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Transaksi Lunas</div>
          <div className="text-xl font-black text-slate-900 mt-1">{payments.length} Resi</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Warga Menunggak</div>
          <div className="text-xl font-black text-slate-900 mt-1">{overdueCustomers.length} Orang</div>
        </div>
      </div>

      {/* REPORT CONTENT 1: PEMBAYARAN */}
      {reportType === 'PEMBAYARAN' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Rincian Pembayaran Masuk Terverifikasi</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Kwitansi</th>
                  <th className="py-2.5 px-3">Nama Warga</th>
                  <th className="py-2.5 px-3">Objek & Periode</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3">Tanggal Setor</th>
                  <th className="py-2.5 px-3">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{p.receiptNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.customerName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{p.serviceName} ({p.billPeriod})</td>
                    <td className="py-2.5 px-3 font-bold text-brand-900">Rp {Number(p.amount).toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3">{p.paymentMethod}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(p.paymentDate).toLocaleDateString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-slate-500">{p.verifiedByName || p.recordedByName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 2: TUNGGAKAN */}
      {reportType === 'TUNGGAKAN' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Laporan Tunggakan Warga</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">ID Pelanggan</th>
                  <th className="py-2.5 px-3">Nama Pelanggan</th>
                  <th className="py-2.5 px-3">No HP / WA</th>
                  <th className="py-2.5 px-3">Bulan Tertunggak</th>
                  <th className="py-2.5 px-3">Total Tunggakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueCustomers.map(item => (
                  <tr key={item.customer.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-brand-800">{item.customer.customerCode}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.customer.name}</td>
                    <td className="py-2.5 px-3 font-mono">{item.customer.phone || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-700">{item.unpaidMonths.join(', ')}</td>
                    <td className="py-2.5 px-3 font-black text-red-600">Rp {item.totalAmount.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 3: METODE BAYAR */}
      {reportType === 'PENDAPATAN' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Rekapitulasi Pendapatan Berdasarkan Metode</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-xs font-bold text-slate-500">Tunai (Petugas & Kantor)</div>
              <div className="text-xl font-black text-slate-900 mt-1">
                Rp {((paymentsByMethod['PETUGAS'] || 0) + (paymentsByMethod['KANTOR'] || 0)).toLocaleString('id-ID')}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="text-xs font-bold text-blue-700">Transfer Bank</div>
              <div className="text-xl font-black text-blue-900 mt-1">
                Rp {(paymentsByMethod['TRANSFER'] || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200">
              <div className="text-xs font-bold text-teal-700">QRIS Manual</div>
              <div className="text-xl font-black text-teal-900 mt-1">
                Rp {(paymentsByMethod['QRIS'] || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 4: REMINDER WA (PRD Section 80) */}
      {reportType === 'REMINDER' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900">Laporan Aktivitas Pengingat WhatsApp</h2>
            <p className="text-[11px] text-slate-500">
              *Catatan PRD Section 80: Status dicatat sebagai OPENED karena sistem menggunakan tautan wa.me langsung ke aplikasi pengirim.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Waktu Dibuat</th>
                  <th className="py-2.5 px-3">Petugas Pengirim</th>
                  <th className="py-2.5 px-3">Pelanggan Penerima</th>
                  <th className="py-2.5 px-3">Nomor WA</th>
                  <th className="py-2.5 px-3">Nominal Tunggakan</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-600">
                      {new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{log.userName}</td>
                    <td className="py-2.5 px-3 font-medium text-brand-900">{log.metadata?.customerName}</td>
                    <td className="py-2.5 px-3 font-mono">{log.metadata?.phone || '-'}</td>
                    <td className="py-2.5 px-3 font-bold text-red-600">
                      Rp {Number(log.metadata?.totalOverdue || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                        OPENED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
