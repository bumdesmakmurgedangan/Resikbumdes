import React, { useState, useEffect, useRef } from 'react';
import { Customer, ServiceLocation, SystemSettings } from '../../types';
import { CustomerCard } from './CustomerCard';
import { CardTemplateModal } from './CardTemplateModal';
import { generateCustomerQrDataUrl } from '../../utils/qrUtils';
import html2canvas from 'html2canvas';
import {
  X, Printer, Download, ChevronLeft, ChevronRight,
  Filter, Layers, CheckSquare, Sparkles, AlertCircle, FileText, Palette
} from 'lucide-react';

interface BatchPrintCardsModalProps {
  customers: Customer[];
  allServices: ServiceLocation[];
  uniqueRWs: string[];
  settings: SystemSettings;
  initialRW?: string;
  onClose: () => void;
}

const CARDS_PER_PAGE = 8; // 2 columns x 4 rows = 8 cards per A4 page

export const BatchPrintCardsModal: React.FC<BatchPrintCardsModalProps> = ({
  customers,
  allServices,
  uniqueRWs,
  settings,
  initialRW = 'ALL',
  onClose
}) => {
  const [selectedRW, setSelectedRW] = useState<string>(initialRW);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);

  // Dynamic Card Template Settings
  const [currentSettings, setCurrentSettings] = useState<SystemSettings>(settings);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Map to cache QR codes for instant rendering
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const sheetRef = useRef<HTMLDivElement>(null);
  const allSheetsContainerRef = useRef<HTMLDivElement>(null);

  // Filter customers by selected RW and search
  const filteredCustomers = customers.filter(customer => {
    if (customer.status !== 'ACTIVE') return false;

    const service = allServices.find(s => s.customerId === customer.id);
    const rw = service?.rw || (customer.address.match(/RW\s*\d+/i)?.[0]) || 'RW 01';

    if (selectedRW !== 'ALL' && rw.toUpperCase() !== selectedRW.toUpperCase()) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.customerCode.toLowerCase().includes(q) ||
        customer.address.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Calculate pages
  const totalPages = Math.ceil(filteredCustomers.length / CARDS_PER_PAGE) || 1;

  // Ensure valid page index when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedRW, searchQuery]);

  // Pre-generate QR codes for current page customers to ensure fast, glitch-free rendering
  useEffect(() => {
    let isCancelled = false;
    const pageCustomers = filteredCustomers.slice(
      currentPage * CARDS_PER_PAGE,
      (currentPage + 1) * CARDS_PER_PAGE
    );

    const neededCustomers = pageCustomers.filter(c => !qrMap[c.customerCode]);
    if (neededCustomers.length === 0) return;

    Promise.all(
      neededCustomers.map(async (c) => {
        const url = await generateCustomerQrDataUrl(c.customerCode, settings.appUrl);
        return { code: c.customerCode, url };
      })
    ).then(results => {
      if (!isCancelled) {
        setQrMap(prev => {
          const updated = { ...prev };
          results.forEach(r => {
            if (r.url) updated[r.code] = r.url;
          });
          return updated;
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentPage, filteredCustomers, settings.appUrl, qrMap]);

  // Helper to get service of customer
  const getService = (customerId: string) => {
    return allServices.find(s => s.customerId === customerId);
  };

  // Customers for currently active preview page
  const currentSheetCustomers = filteredCustomers.slice(
    currentPage * CARDS_PER_PAGE,
    (currentPage + 1) * CARDS_PER_PAGE
  );

  // Download Single Current A4 Sheet as PNG
  const handleDownloadCurrentSheet = async () => {
    if (!sheetRef.current) return;
    setDownloading(true);
    setDownloadProgress('Mengonversi lembar A4 ke gambar beresolusi tinggi...');

    try {
      const canvas = await html2canvas(sheetRef.current, {
        scale: 2.5, // 2.5x high print quality (~300 DPI for A4)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const rwName = selectedRW === 'ALL' ? 'Semua_RW' : selectedRW.replace(/\s+/g, '_');
      const filename = `Lembar_A4_Kartu_${rwName}_Hal_${currentPage + 1}.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download sheet', err);
      alert('Gagal mendownload lembaran kartu. Silakan gunakan tombol Cetak Langsung.');
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Download All Sheets Sequentially as PNG images
  const handleDownloadAllSheets = async () => {
    if (filteredCustomers.length === 0) return;
    setDownloading(true);

    try {
      // First ensure QR codes for ALL customers in selection are generated
      setDownloadProgress('Menyiapkan kode QR seluruh lembaran...');
      const missing = filteredCustomers.filter(c => !qrMap[c.customerCode]);
      const newQrEntries: Record<string, string> = {};

      for (const c of missing) {
        const url = await generateCustomerQrDataUrl(c.customerCode, settings.appUrl);
        newQrEntries[c.customerCode] = url;
      }

      const mergedQrMap = { ...qrMap, ...newQrEntries };
      setQrMap(mergedQrMap);

      const rwName = selectedRW === 'ALL' ? 'Semua_RW' : selectedRW.replace(/\s+/g, '_');

      // Loop each page
      for (let p = 0; p < totalPages; p++) {
        setDownloadProgress(`Mengunduh Lembar ${p + 1} dari ${totalPages}...`);
        setCurrentPage(p);

        // Wait a short tick for React DOM render
        await new Promise(r => setTimeout(r, 400));

        if (sheetRef.current) {
          const canvas = await html2canvas(sheetRef.current, {
            scale: 2.5, // 2.5x high print quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
          });

          const link = document.createElement('a');
          link.download = `Lembar_A4_Kartu_${rwName}_Hal_${p + 1}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();

          // Brief delay between downloads to prevent browser throttling
          await new Promise(r => setTimeout(r, 600));
        }
      }
    } catch (err) {
      console.error('Failed batch download', err);
      alert('Terjadi kendala saat download massal. Silakan unduh lembar per lembar.');
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
                <Layers className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Cetak & Unduh Lembaran Kartu A4 (Massal)
                </h3>
                <p className="text-xs text-slate-500">
                  Format lembar A4 standar isi 8 kartu per halaman • Siap potong & laminasi
                </p>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* RW Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Wilayah:</span>
              <select
                value={selectedRW}
                onChange={(e) => setSelectedRW(e.target.value)}
                className="text-xs font-bold text-emerald-800 bg-transparent outline-none cursor-pointer"
              >
                <option value="ALL">Semua RW ({customers.length})</option>
                {uniqueRWs.map(rw => {
                  const count = customers.filter(c => {
                    const s = allServices.find(srv => srv.customerId === c.id);
                    const r = s?.rw || (c.address.match(/RW\s*\d+/i)?.[0]) || '';
                    return r.toUpperCase() === rw.toUpperCase();
                  }).length;
                  return (
                    <option key={rw} value={rw}>
                      {rw} ({count} warga)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Cari nama/ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-36"
            />

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition ml-2"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar & Pagination Header */}
        <div className="px-6 py-2.5 bg-emerald-50/60 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0 no-print">
          <div className="flex items-center gap-3">
            <span className="font-bold text-emerald-950">
              Total: {filteredCustomers.length} Pelanggan
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-emerald-800">
              {totalPages} Lembar A4 (8 kartu/lembar)
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 0 || downloading}
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition shadow-sm"
              title="Lembar Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            </button>

            <span className="font-bold text-slate-700 px-2">
              Halaman {currentPage + 1} dari {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages - 1 || downloading}
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition shadow-sm"
              title="Lembar Selanjutnya"
            >
              <ChevronRight className="w-4 h-4 text-slate-700" />
            </button>
          </div>

          {/* Export / Print Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold transition shadow-2xs cursor-pointer"
              title="Ganti Tema atau Unggah Background Custom dari Canva/Photoshop"
            >
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              <span>Desain Template</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold hover:bg-slate-50 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak (A4)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCurrentSheet}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm disabled:opacity-50"
              title="Download lembar yang sedang dilihat sebagai file gambar PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Lembar Ini (PNG)</span>
            </button>

            {totalPages > 1 && (
              <button
                type="button"
                onClick={handleDownloadAllSheets}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-sm disabled:opacity-50"
                title="Download semua lembar secara berurutan"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Semua ({totalPages} Lembar)</span>
              </button>
            )}
          </div>
        </div>

        {/* Download Status Banner */}
        {downloadProgress && (
          <div className="bg-emerald-600 text-white text-xs px-6 py-2 flex items-center justify-center gap-2 animate-pulse no-print">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">{downloadProgress}</span>
          </div>
        )}

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/80 flex flex-col items-center">
          {/* Printable Container */}
          <div id="printable-a4-sheet" className="w-full flex flex-col items-center">
            {/* Active Sheet for Screen Preview & Download */}
            <div
              ref={sheetRef}
              className="w-[210mm] min-h-[297mm] bg-white p-[8mm] shadow-xl rounded-2xl flex flex-col justify-between border border-slate-200 text-slate-800 print:shadow-none print:border-none print:rounded-none print:m-0 print:p-[8mm] print:w-full print:min-h-screen"
              style={{ boxSizing: 'border-box' }}
            >
              {/* Sheet Header */}
              <div className="pb-2 border-b-2 border-emerald-800 flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src={settings.logoUrl}
                    alt="Logo BUMDes"
                    className="w-9 h-9 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div>
                    <h2 className="text-xs font-black uppercase text-emerald-950 tracking-wide">
                      {settings.bumdesName || 'BUMDES MAKMUR GEDANGAN'}
                    </h2>
                    <p className="text-[9px] text-slate-600 font-semibold">
                      LEMBAR RESMI KARTU PELANGGAN RETRIBUSI SAMPAH
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                    WILAYAH: {selectedRW === 'ALL' ? 'SEMUA RW' : selectedRW}
                  </span>
                  <p className="text-[8.5px] text-slate-500 font-medium mt-0.5">
                    Halaman {currentPage + 1} dari {totalPages}
                  </p>
                </div>
              </div>

              {/* 2 Columns x 4 Rows = 8 Cards Grid */}
              <div className="grid grid-cols-2 gap-[4mm] flex-1 items-stretch">
                {currentSheetCustomers.map((customer) => {
                  const service = getService(customer.id);
                  return (
                    <div key={customer.id} className="h-full">
                      <CustomerCard
                        customer={customer}
                        service={service}
                        settings={currentSettings}
                        variant="sheet"
                        qrDataUrl={qrMap[customer.customerCode]}
                      />
                    </div>
                  );
                })}

                {/* Empty Placeholders if page has fewer than 8 cards */}
                {Array.from({ length: CARDS_PER_PAGE - currentSheetCustomers.length }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="h-[58mm] rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-slate-300 text-[10px]"
                  >
                    <span>— Slot Kosong —</span>
                  </div>
                ))}
              </div>

              {/* Sheet Footer with Cutting Guide Note */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px]">✂</span>
                  <span>
                    Petunjuk: Gunting/potong mengikuti garis putus-putus. Disarankan cetak pada kertas tebal / Art Paper (210-260 gsm).
                  </span>
                </div>
                <div className="font-semibold text-slate-700">
                  Unit Pelayanan Kebersihan RESIK • Dicetak otomatis dari Sistem BUMDes
                </div>
              </div>
            </div>

            {/* Hidden Container for Print Mode - Renders ALL pages when user chooses Print */}
            <div className="hidden print:block w-full">
              {Array.from({ length: totalPages }).map((_, pageIdx) => {
                if (pageIdx === currentPage) return null; // already rendered above
                const pageCusts = filteredCustomers.slice(
                  pageIdx * CARDS_PER_PAGE,
                  (pageIdx + 1) * CARDS_PER_PAGE
                );

                return (
                  <div
                    key={`print-page-${pageIdx}`}
                    className="w-[210mm] min-h-[297mm] bg-white p-[8mm] flex flex-col justify-between text-slate-800 page-break print:w-full print:min-h-screen"
                    style={{ boxSizing: 'border-box' }}
                  >
                    {/* Header */}
                    <div className="pb-2 border-b-2 border-emerald-800 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={settings.logoUrl}
                          alt="Logo BUMDes"
                          className="w-9 h-9 object-contain"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <div>
                          <h2 className="text-xs font-black uppercase text-emerald-950 tracking-wide">
                            {settings.bumdesName || 'BUMDES MAKMUR GEDANGAN'}
                          </h2>
                          <p className="text-[9px] text-slate-600 font-semibold">
                            LEMBAR RESMI KARTU PELANGGAN RETRIBUSI SAMPAH
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                          WILAYAH: {selectedRW === 'ALL' ? 'SEMUA RW' : selectedRW}
                        </span>
                        <p className="text-[8.5px] text-slate-500 font-medium mt-0.5">
                          Halaman {pageIdx + 1} dari {totalPages}
                        </p>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-2 gap-[4mm] flex-1 items-stretch">
                      {pageCusts.map((customer) => {
                        const service = getService(customer.id);
                        return (
                          <div key={customer.id} className="h-full">
                            <CustomerCard
                              customer={customer}
                              service={service}
                              settings={currentSettings}
                              variant="sheet"
                              qrDataUrl={qrMap[customer.customerCode]}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-500 mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px]">✂</span>
                        <span>
                          Gunting/potong mengikuti garis putus-putus. Disarankan cetak pada kertas tebal / Art Paper (210-260 gsm).
                        </span>
                      </div>
                      <div className="font-semibold text-slate-700">
                        Unit Pelayanan Kebersihan RESIK
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Card Template Design Modal */}
      {templateModalOpen && (
        <CardTemplateModal
          settings={currentSettings}
          sampleCustomer={currentSheetCustomers[0]}
          sampleService={getService(currentSheetCustomers[0]?.id)}
          onSave={(newSettings) => {
            setCurrentSettings(newSettings);
          }}
          onClose={() => setTemplateModalOpen(false)}
        />
      )}
    </div>
  );
};
