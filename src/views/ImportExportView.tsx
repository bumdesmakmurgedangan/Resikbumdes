import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { ImportError, ImportResult } from '../types';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, Download, Upload, CheckCircle2,
  AlertTriangle, FileCheck, ArrowRight, Table, RefreshCw, UserPlus, Sparkles
} from 'lucide-react';

export const ImportExportView: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  // Import workflow states
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleDownloadTemplate = () => {
    dataService.downloadImportTemplate();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setParsedRows(data);
        setPreviewOpen(true);
      } catch (err) {
        alert('Gagal membaca file spreadsheet. Pastikan format file adalah .xlsx atau .csv.');
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    try {
      const res = dataService.validateAndImportCustomers(parsedRows, currentUser);
      setImportResult(res);
      setPreviewOpen(false);
      setParsedRows([]);
      setFile(null);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses import');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Import & Export Data Pelanggan
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Migrasikan data pelanggan dari spreadsheet lama (.xlsx / .csv) dan unduh data untuk arsip BUMDes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card Import */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-brand-900 font-bold">
            <Upload className="w-5 h-5 text-brand-600" />
            <h2 className="text-base">Import Data Pelanggan</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sistem akan secara otomatis memvalidasi nama, nomor HP, wilayah RW/RT, serta mengenerate ID Pelanggan dan PIN awal (1234).
          </p>

          {/* Step 1: Download Template */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">1. Unduh Template Resmi</div>
              <div className="text-[11px] text-slate-400">Format kolom baku RESIK (.xlsx)</div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-brand-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </button>
          </div>

          {/* Info Box: Fitur Unggulan Import */}
          <div className="p-3 bg-brand-50/70 border border-brand-200/80 rounded-2xl space-y-2 text-xs text-brand-950">
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-0.5">📍</span>
              <div>
                <div className="font-bold text-brand-900">Mendukung Titik / Link Google Maps</div>
                <p className="text-[11px] text-brand-800/90 mt-0.5 leading-relaxed">
                  Cukup paste link Google Maps atau angka koordinat (contoh: <code className="font-mono bg-white/80 px-1 py-0.5 rounded text-[10px]">-7.3885, 112.7214</code>), sistem akan otomatis mengekstrak Latitude &amp; Longitude.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 pt-1 border-t border-brand-200/60">
              <span className="text-base leading-none mt-0.5">⚡</span>
              <div>
                <div className="font-bold text-brand-900">Tarif Fleksibel &amp; Rekonsiliasi Status Pembayaran</div>
                <p className="text-[11px] text-brand-800/90 mt-0.5 leading-relaxed">
                  Tersedia kolom <strong>Tarif Bulanan</strong> (bisa custom nominal per UMKM/perusahaan), <strong>Status Bayar Bulan Ini</strong> (isi <code className="font-mono bg-white/80 px-1 py-0.5 rounded text-[10px]">LUNAS</code> untuk langsung tercatat lunas dengan kuitansi resmi), dan <strong>Jumlah Bulan Tunggakan Lampau</strong> (misal diisi <code className="font-mono bg-white/80 px-1 py-0.5 rounded text-[10px]">2</code> untuk otomatis mencatat tunggakan 2 bulan ke belakang).
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-700">
              2. Unggah File yang Sudah Diisi
            </label>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer border border-dashed border-slate-300 rounded-2xl p-3"
            />
          </div>
        </div>

        {/* Card Export */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-brand-900 font-bold">
            <FileSpreadsheet className="w-5 h-5 text-brand-600" />
            <h2 className="text-base">Export Data ke Excel</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Unduh rekapitulasi data mutakhir ke dalam format Excel untuk pelaporan bulanan atau analisis internal BUMDes.
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Data Seluruh Pelanggan & Objek</div>
                <div className="text-[11px] text-slate-400">ID, nama, alamat, RW/RT, tarif, GPS</div>
              </div>
              <button
                onClick={() => dataService.exportCustomersToExcel()}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Data</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">Laporan Riwayat Pembayaran</div>
                <div className="text-[11px] text-slate-400">Nomor kuitansi, tanggal, status lunas</div>
              </div>
              <button
                onClick={() => dataService.exportPaymentsToExcel()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Pembayaran</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal before Execution (PRD Section 76) */}
      {previewOpen && parsedRows.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">Pratinjau Data Import ({parsedRows.length} Baris)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mode Upsert Aktif: Data warga yang sudah ada akan otomatis diperbarui tanpa membuat akun/tagihan ganda.
                </p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-2 overflow-auto flex-1 my-3 border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Status Sistem</th>
                    <th className="py-2 px-3">Nama Pelanggan</th>
                    <th className="py-2 px-3">No HP</th>
                    <th className="py-2 px-3">Alamat</th>
                    <th className="py-2 px-3">RW / RT</th>
                    <th className="py-2 px-3">Kategori</th>
                    <th className="py-2 px-3">Titik / GPS</th>
                    <th className="py-2 px-3">Tarif</th>
                    <th className="py-2 px-3">Status Bulan Ini</th>
                    <th className="py-2 px-3">Tunggakan Lampau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.slice(0, 10).map((row, i) => {
                    const rowStatus = dataService.checkImportRowStatus(row);
                    const rawStatus = String(row['Status Bayar Bulan Ini'] || row['Status Bayar'] || row['Status Pembayaran'] || '').toUpperCase();
                    const isPaid = rawStatus === 'LUNAS' || rawStatus === 'PAID' || rawStatus === 'SUDAH' || rawStatus === 'SUDAH BAYAR';
                    const rawTunggakan = row['Jumlah Bulan Tunggakan Lampau'] || row['Tunggakan Lampau'] || row['Tunggakan'] || 0;
                    const tunggakanMonths = !isNaN(Number(rawTunggakan)) ? Number(rawTunggakan) : 0;
                    const tariffVal = Number(row['Tarif Bulanan'] || row['Tarif'] || row['tarif'] || 20000);

                    return (
                      <tr key={i} className={`hover:bg-slate-50 ${rowStatus.isExisting ? 'bg-blue-50/20' : ''}`}>
                        <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {rowStatus.isExisting ? (
                            <span
                              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px]"
                              title={`Data cocok dengan ${rowStatus.matchedCustomer?.customerCode}`}
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              Update ({rowStatus.matchedCustomer?.customerCode})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              <UserPlus className="w-2.5 h-2.5" />
                              Data Baru
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{row['Nama Pelanggan'] || row['namaPelanggan'] || '-'}</td>
                        <td className="py-2 px-3 font-mono">{row['No HP'] || row['noHp'] || '-'}</td>
                        <td className="py-2 px-3">{row['Alamat'] || row['alamat'] || '-'}</td>
                        <td className="py-2 px-3">{row['RW'] || row['rw']} / {row['RT'] || row['rt']}</td>
                        <td className="py-2 px-3">{row['Kategori'] || row['kategori'] || 'Rumah Tangga'}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500 max-w-[140px] truncate" title={String(row['Titik Lokasi Google Maps'] || row['Link Google Maps'] || row['Latitude'] || '-')}>
                          {row['Titik Lokasi Google Maps'] || row['Link Google Maps'] || (row['Latitude'] ? `${row['Latitude']}, ${row['Longitude'] || ''}` : '-')}
                        </td>
                        <td className="py-2 px-3 font-bold text-brand-800">Rp {tariffVal.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3">
                          {isPaid ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              LUNAS
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              BELUM BAYAR
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-center">
                          {tunggakanMonths > 0 ? (
                            <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              {tunggakanMonths} Bln
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {parsedRows.length > 10 && (
                <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50">
                  ... dan {parsedRows.length - 10} baris lainnya siap diproses.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={importing}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{importing ? 'Memproses...' : 'Validasi & Import Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Result Breakdown (PRD Section 77) */}
      {importResult && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>Hasil Eksekusi Import (Mode Upsert)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Status: Selesai</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Data</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{importResult.total}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
              <div className="text-[11px] font-bold text-emerald-700 uppercase">Baru Ditambahkan</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{importResult.createdCount ?? importResult.success}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-center">
              <div className="text-[11px] font-bold text-blue-700 uppercase">Diperbarui (Upsert)</div>
              <div className="text-2xl font-black text-blue-700 mt-1">{importResult.updatedCount ?? 0}</div>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-center">
              <div className="text-[11px] font-bold text-rose-700 uppercase">Gagal / Ditolak</div>
              <div className="text-2xl font-black text-rose-700 mt-1">{importResult.failed}</div>
            </div>
          </div>

          {importResult.updatedCount > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Mode Upsert Berhasil:</strong> Sebanyak {importResult.updatedCount} data warga eksisting berhasil diperbarui (GPS, telepon, atau tarif) tanpa membuat duplikasi akun atau tagihan ganda.
              </span>
            </div>
          )}

          {/* Error breakdown if any failed rows */}
          {importResult.errors.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                Rincian Baris Gagal / Error:
              </div>
              <div className="border border-rose-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50 text-rose-800 font-bold border-b border-rose-200">
                    <tr>
                      <th className="py-2 px-3">Baris</th>
                      <th className="py-2 px-3">Kolom</th>
                      <th className="py-2 px-3">Pesan Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {importResult.errors.map((err, i) => (
                      <tr key={i} className="hover:bg-rose-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-700">{err.rowNumber}</td>
                        <td className="py-2 px-3 font-semibold text-rose-900">{err.fieldName}</td>
                        <td className="py-2 px-3 text-rose-700">{err.errorMessage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
