import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import {
  BarChart3, FileSpreadsheet, Printer, Download, Filter,
  DollarSign, CheckCircle2, AlertTriangle, Users, MessageSquare,
  Calendar, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';

type PeriodPreset = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

export const ReportsView: React.FC = () => {
  const { currentUser } = useAuth();
  const settings = dataService.getSettings();

  const [reportType, setReportType] = useState<
    'PEMBAYARAN' | 'TUNGGAKAN' | 'PENDAPATAN' | 'REMINDER'
  >('PEMBAYARAN');

  // Filter Period Presets
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-31');

  // Date helper functions
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const weekRange = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7; // 1 = Senin, 7 = Minggu
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  }, []);

  const monthRange = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  }, []);

  // Compute active date boundaries
  const activeDateRange = useMemo(() => {
    switch (periodPreset) {
      case 'TODAY':
        return { start: todayStr, end: todayStr, label: `Hari Ini (${todayStr})` };
      case 'THIS_WEEK':
        return { start: weekRange.start, end: weekRange.end, label: `Minggu Ini (${weekRange.start} s/d ${weekRange.end})` };
      case 'THIS_MONTH':
        return { start: monthRange.start, end: monthRange.end, label: `Bulan Ini (${monthRange.start} s/d ${monthRange.end})` };
      case 'CUSTOM':
        return {
          start: customStartDate,
          end: customEndDate,
          label: `${customStartDate || 'Awal'} s/d ${customEndDate || 'Akhir'}`
        };
      case 'ALL':
      default:
        return { start: '', end: '', label: 'Semua Waktu (Seluruh Data)' };
    }
  }, [periodPreset, todayStr, weekRange, monthRange, customStartDate, customEndDate]);

  // Check if a date string falls inside the selected range
  const isDateInFilter = (dateStr?: string | null): boolean => {
    if (periodPreset === 'ALL') return true;
    if (!dateStr) return false;
    const cleanDate = dateStr.slice(0, 10);
    if (activeDateRange.start && cleanDate < activeDateRange.start) return false;
    if (activeDateRange.end && cleanDate > activeDateRange.end) return false;
    return true;
  };

  // Base raw data
  const allVerifiedPayments = dataService.getPayments({ status: 'VERIFIED' });
  const allOverdueCustomers = dataService.getOverdueCustomers();
  const allAuditLogs = dataService.getAuditLogs().filter(a => a.action === 'WHATSAPP_REMINDER_OPENED');

  // Filtered Datasets
  const filteredPayments = useMemo(() => {
    return allVerifiedPayments.filter(p => isDateInFilter(p.paymentDate));
  }, [allVerifiedPayments, activeDateRange, periodPreset]);

  const filteredAuditLogs = useMemo(() => {
    return allAuditLogs.filter(log => isDateInFilter(log.createdAt));
  }, [allAuditLogs, activeDateRange, periodPreset]);

  // Total summary numbers (calculated based on filtered dataset)
  const totalVerifiedRevenue = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  }, [filteredPayments]);

  const totalOverdueAmount = useMemo(() => {
    return allOverdueCustomers.reduce((acc, c) => acc + c.totalAmount, 0);
  }, [allOverdueCustomers]);

  // Group payments by method for Revenue Report
  const paymentsByMethod = useMemo(() => {
    return filteredPayments.reduce((acc, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + Number(p.amount || 0);
      return acc;
    }, {} as Record<string, number>);
  }, [filteredPayments]);

  // Handlers
  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const periodLabel = activeDateRange.label;

    if (reportType === 'PEMBAYARAN' || reportType === 'PENDAPATAN') {
      dataService.exportPaymentsToExcel(filteredPayments, periodLabel);
    } else if (reportType === 'TUNGGAKAN') {
      dataService.exportOverdueToExcel(allOverdueCustomers, periodLabel);
    } else if (reportType === 'REMINDER') {
      const rows = filteredAuditLogs.map(log => ({
        'Waktu Dikirim': new Date(log.createdAt).toLocaleString('id-ID'),
        'Petugas Pengirim': log.userName,
        'Nama Pelanggan': log.metadata?.customerName || '-',
        'Nomor WhatsApp': log.metadata?.phone || '-',
        'Nominal Tunggakan (Rp)': Number(log.metadata?.totalOverdue || 0),
        'Status': 'OPENED'
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan WA Reminder');
      const cleanSuffix = periodLabel ? `_${periodLabel.replace(/[\s\/\\]+/g, '_')}` : '';
      XLSX.writeFile(workbook, `Laporan_Reminder_WA_RESIK${cleanSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header (No Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
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
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            title="Cetak Laporan atau Simpan ke Format PDF Resmi"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
            title="Download Data Laporan Terfilter ke Format Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Periode & Tanggal (No Print) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-brand-600" />
            <span>Filter Rentang Waktu Laporan:</span>
          </div>

          <span className="text-[11px] text-brand-900 font-bold bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200/80">
            📍 Periode: {activeDateRange.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setPeriodPreset('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              periodPreset === 'ALL'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Waktu
          </button>
          <button
            type="button"
            onClick={() => setPeriodPreset('TODAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              periodPreset === 'TODAY'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setPeriodPreset('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              periodPreset === 'THIS_WEEK'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Minggu Ini
          </button>
          <button
            type="button"
            onClick={() => setPeriodPreset('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              periodPreset === 'THIS_MONTH'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => setPeriodPreset('CUSTOM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              periodPreset === 'CUSTOM'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Pilih Tanggal Manual</span>
          </button>
        </div>

        {/* Input Tanggal Khusus jika CUSTOM dipilih */}
        {periodPreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-600 font-semibold">Dari Tanggal:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-600 font-semibold">Sampai Tanggal:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Switcher Tabs (No Print) */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold no-print">
        <button
          onClick={() => setReportType('PEMBAYARAN')}
          className={`px-4 py-2 rounded-xl transition ${
            reportType === 'PEMBAYARAN' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Laporan Pembayaran Lunas ({filteredPayments.length})
        </button>
        <button
          onClick={() => setReportType('TUNGGAKAN')}
          className={`px-4 py-2 rounded-xl transition ${
            reportType === 'TUNGGAKAN' ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Laporan Tunggakan ({allOverdueCustomers.length})
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
          4. Laporan Reminder WhatsApp ({filteredAuditLogs.length})
        </button>
      </div>

      {/* ============================================================== */}
      {/* PRINTABLE CONTAINER: DOKUMEN LAPORAN RESMI (TAMPIL DI LAYAR & PRINT/PDF) */}
      {/* ============================================================== */}
      <div id="printable-report" className="space-y-6 bg-white print:bg-white rounded-3xl p-0 print:p-0">
        
        {/* KOP SURAT RESMI BUMDES (Hanya tampil saat Cetak / Save as PDF) */}
        <div className="hidden print:block pb-2 mb-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo BUMDes di Kiri Kop Surat */}
            <div className="w-20 flex-shrink-0 flex items-center justify-center">
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt="Logo BUMDes"
                  className="w-18 h-18 max-h-20 object-contain"
                />
              )}
            </div>

            {/* Teks Kop Surat di Tengah */}
            <div className="flex-1 text-center space-y-0.5">
              {settings.kopParentInstitution && (
                <h1 className="text-xs font-bold uppercase tracking-wider text-black">
                  {settings.kopParentInstitution}
                </h1>
              )}
              <h2 className="text-base font-black uppercase text-black tracking-wide leading-tight">
                {settings.bumdesName || 'BADAN USAHA MILIK DESA (BUMDES) MAKMUR GEDANGAN'}
              </h2>
              {settings.kopUnitName && (
                <p className="text-xs font-bold text-black">
                  {settings.kopUnitName}
                </p>
              )}
              <p className="text-[10px] text-black leading-normal pt-0.5">
                {settings.address}
                {settings.email ? ` • Email: ${settings.email}` : ''}
              </p>
            </div>

            {/* Spacer Kanan untuk Keseimbangan Simetris */}
            <div className="w-20 flex-shrink-0"></div>
          </div>

          {/* Garis Ganda Kop Surat Resmi */}
          <div className="border-b-2 border-black mt-2.5"></div>
          <div className="border-b border-black mt-[2px]"></div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 block text-sm uppercase">
                {reportType === 'PEMBAYARAN' && 'LAPORAN PENERIMAAN PEMBAYARAN RETRIBUSI LUNAS'}
                {reportType === 'TUNGGAKAN' && 'LAPORAN REKAPITULASI TUNGGAKAN IURAN WARGA'}
                {reportType === 'PENDAPATAN' && 'LAPORAN REKAPITULASI PENDAPATAN BERDASARKAN METODE'}
                {reportType === 'REMINDER' && 'LAPORAN AKTIVITAS PENGINGAT TUNGGAKAN WHATSAPP'}
              </span>
              <span className="text-slate-700 text-xs mt-0.5 block">
                Periode Data: <strong>{activeDateRange.label}</strong>
              </span>
            </div>
            <div className="text-right text-[11px] text-slate-600">
              <div>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
              <div>Dicetak Oleh: {currentUser?.fullName || 'Petugas BUMDes'}</div>
            </div>
          </div>
        </div>

        {/* Summary KPI Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 print:bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 print:text-slate-600 uppercase">
              Total Penerimaan ({periodPreset === 'ALL' ? 'Total' : 'Periode'})
            </div>
            <div className="text-xl font-black text-emerald-600 print:text-black mt-1">
              Rp {totalVerifiedRevenue.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="bg-slate-50 print:bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 print:text-slate-600 uppercase">Total Piutang / Tunggakan</div>
            <div className="text-xl font-black text-red-600 print:text-black mt-1">
              Rp {totalOverdueAmount.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="bg-slate-50 print:bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 print:text-slate-600 uppercase">Transaksi Lunas ({periodPreset === 'ALL' ? 'Total' : 'Periode'})</div>
            <div className="text-xl font-black text-slate-900 mt-1">{filteredPayments.length} Resi</div>
          </div>

          <div className="bg-slate-50 print:bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 print:text-slate-600 uppercase">Warga Menunggak Aktif</div>
            <div className="text-xl font-black text-slate-900 mt-1">{allOverdueCustomers.length} Orang</div>
          </div>
        </div>

        {/* REPORT CONTENT 1: PEMBAYARAN */}
        {reportType === 'PEMBAYARAN' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Rincian Pembayaran Masuk Terverifikasi ({filteredPayments.length} Data)
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                Periode: {activeDateRange.label}
              </span>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                Tidak ada riwayat pembayaran yang tercatat pada rentang periode ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">No. Kwitansi</th>
                      <th className="py-2.5 px-3">Nama Warga</th>
                      <th className="py-2.5 px-3">Objek &amp; Periode</th>
                      <th className="py-2.5 px-3">Nominal</th>
                      <th className="py-2.5 px-3">Metode</th>
                      <th className="py-2.5 px-3">Tanggal Setor</th>
                      <th className="py-2.5 px-3">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map(p => (
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
                    {/* Baris Total di Bawah Tabel */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <td colSpan={3} className="py-2.5 px-3 text-right uppercase">Total Penerimaan:</td>
                      <td className="py-2.5 px-3 font-black text-brand-900">Rp {totalVerifiedRevenue.toLocaleString('id-ID')}</td>
                      <td colSpan={3} className="py-2.5 px-3 text-slate-500 font-normal">({filteredPayments.length} Transaksi)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* REPORT CONTENT 2: TUNGGAKAN */}
        {reportType === 'TUNGGAKAN' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Laporan Tunggakan Warga ({allOverdueCustomers.length} Pelanggan Menunggak)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ID Pelanggan</th>
                    <th className="py-2.5 px-3">Nama Pelanggan</th>
                    <th className="py-2.5 px-3">No HP / WA</th>
                    <th className="py-2.5 px-3">Bulan Tertunggak</th>
                    <th className="py-2.5 px-3">Total Tunggakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allOverdueCustomers.map(item => (
                    <tr key={item.customer.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-brand-800">{item.customer.customerCode}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.customer.name}</td>
                      <td className="py-2.5 px-3 font-mono">{item.customer.phone || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{item.unpaidMonths.join(', ')}</td>
                      <td className="py-2.5 px-3 font-black text-red-600">Rp {item.totalAmount.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase">Total Piutang Tertunggak:</td>
                    <td className="py-2.5 px-3 font-black text-red-600">Rp {totalOverdueAmount.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT CONTENT 3: METODE BAYAR */}
        {reportType === 'PENDAPATAN' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Rekapitulasi Pendapatan Berdasarkan Metode
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                Periode: {activeDateRange.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 bg-slate-50 print:bg-white rounded-2xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500">Tunai (Petugas &amp; Kantor)</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  Rp {((paymentsByMethod['PETUGAS'] || 0) + (paymentsByMethod['KANTOR'] || 0)).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="p-4 bg-blue-50 print:bg-white rounded-2xl border border-blue-200">
                <div className="text-xs font-bold text-blue-700 print:text-black">Transfer Bank</div>
                <div className="text-xl font-black text-blue-900 print:text-black mt-1">
                  Rp {(paymentsByMethod['TRANSFER'] || 0).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="p-4 bg-teal-50 print:bg-white rounded-2xl border border-teal-200">
                <div className="text-xs font-bold text-teal-700 print:text-black">QRIS Manual</div>
                <div className="text-xl font-black text-teal-900 print:text-black mt-1">
                  Rp {(paymentsByMethod['QRIS'] || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Metode Pembayaran</th>
                    <th className="py-2.5 px-3">Keterangan Alur</th>
                    <th className="py-2.5 px-3">Jumlah Transaksi</th>
                    <th className="py-2.5 px-3">Total Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Tunai (Petugas / Kantor)</td>
                    <td className="py-2.5 px-3 text-slate-600">Disetor langsung ke petugas lapangan / kasir kantor BUMDes</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {filteredPayments.filter(p => p.paymentMethod === 'PETUGAS' || p.paymentMethod === 'KANTOR').length}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-brand-900">
                      Rp {((paymentsByMethod['PETUGAS'] || 0) + (paymentsByMethod['KANTOR'] || 0)).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Transfer Bank</td>
                    <td className="py-2.5 px-3 text-slate-600">Rekening Bank Jateng / BRI BUMDes Makmur Gedangan</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {filteredPayments.filter(p => p.paymentMethod === 'TRANSFER').length}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-brand-900">
                      Rp {(paymentsByMethod['TRANSFER'] || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">QRIS Manual</td>
                    <td className="py-2.5 px-3 text-slate-600">Pindai QRIS BUMDes &amp; unggah bukti transfer</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {filteredPayments.filter(p => p.paymentMethod === 'QRIS').length}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-brand-900">
                      Rp {(paymentsByMethod['QRIS'] || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase">Total Keseluruhan Penerimaan:</td>
                    <td className="py-2.5 px-3 font-black text-brand-900">Rp {totalVerifiedRevenue.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT CONTENT 4: REMINDER WA */}
        {reportType === 'REMINDER' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Laporan Aktivitas Pengingat WhatsApp ({filteredAuditLogs.length} Pesan)
                </h2>
                <p className="text-[11px] text-slate-500">
                  *Catatan: Status OPENED dicatat saat staf menekan tombol kirim pengingat langsung ke aplikasi WhatsApp.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Periode: {activeDateRange.label}
              </span>
            </div>

            {filteredAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                Tidak ada aktivitas pengingat WhatsApp pada rentang periode ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
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
                    {filteredAuditLogs.map(log => (
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
            )}
          </div>
        )}

        {/* TANDA TANGAN RESMI PENGESAHAN LAPORAN (Hanya tampil saat Print / Simpan PDF) */}
        <div className="hidden print:grid grid-cols-2 gap-8 pt-8 text-center text-xs text-black">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-0.5">
              {settings.signer1Title || 'Direktur BUMDes Makmur Gedangan'}
            </p>
            <div className="h-20"></div>
            <p className="font-bold underline text-slate-900">
              {settings.signer1Name || 'Joko Sutrisno, S.E.'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {settings.signer1Id || 'NIP / ID: DIR-BUMDES-01'}
            </p>
          </div>
          <div>
            <p className="text-slate-600">
              {settings.kopCity || 'Gedangan'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="font-bold text-slate-900 mt-0.5">
              {settings.signer2Title || 'Bendahara / Petugas Operasional'}
            </p>
            <div className="h-20"></div>
            <p className="font-bold underline text-slate-900">
              {settings.signer2Name || currentUser?.fullName || 'Siti Aminah'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              {settings.signer2Id || 'Unit Usaha Persampahan RESIK'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
