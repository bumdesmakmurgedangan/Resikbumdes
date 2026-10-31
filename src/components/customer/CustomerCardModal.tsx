import React, { useRef, useState } from 'react';
import { Customer, ServiceLocation, SystemSettings } from '../../types';
import { CustomerCard } from './CustomerCard';
import { CardTemplateModal } from './CardTemplateModal';
import { generateOfficialCardDataUrl } from '../../utils/cardCanvasExport';
import html2canvas from 'html2canvas';
import {
  X, Download, Printer, Share2, Check,
  CreditCard, Sparkles, AlertCircle, MessageCircle, Palette
} from 'lucide-react';

interface CustomerCardModalProps {
  customer: Customer | null;
  service?: ServiceLocation;
  settings: SystemSettings;
  onClose: () => void;
}

export const CustomerCardModal: React.FC<CustomerCardModalProps> = ({
  customer,
  service,
  settings,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<SystemSettings>(settings);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  if (!customer) return null;

  const handleDownloadImage = async () => {
    setDownloading(true);

    try {
      const theme = currentSettings.cardTheme || 'BUMDES_OFFICIAL';
      const rawBg = currentSettings.cardBackgroundUrl || '/card-template-bumdes.jpg';
      const isOfficial = theme === 'BUMDES_OFFICIAL' || rawBg.includes('card-template-bumdes');

      let dataUrl: string;

      if (isOfficial) {
        // Direct pixel-perfect native HTML5 Canvas export (100% immune to html2canvas baseline bugs)
        dataUrl = await generateOfficialCardDataUrl(customer, service, currentSettings);
      } else {
        // Fallback for custom themes
        const targetElement = (cardRef.current?.querySelector('#customer-card-render-target') as HTMLElement) || cardRef.current;
        if (!targetElement) return;

        const canvas = await html2canvas(targetElement, {
          scale: 4,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      const link = document.createElement('a');
      link.download = `Kartu_Pelanggan_${customer.customerCode}_${customer.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download card image', err);
      alert('Gagal mendownload gambar kartu. Silakan gunakan tombol Cetak.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
    let waNumber = phone;
    if (waNumber.startsWith('0')) {
      waNumber = '62' + waNumber.slice(1);
    }

    const message = encodeURIComponent(
      `*KARTU PELANGGAN RESMI BUMDES*\n\n` +
      `Halo Bapak/Ibu *${customer.name}*,\n` +
      `Berikut adalah rincian data pelanggan resmi layanan kebersihan ${settings.bumdesName || 'BUMDes'}:\n\n` +
      `🆔 *ID Pelanggan:* ${customer.customerCode}\n` +
      `👤 *Nama:* ${customer.name}\n` +
      `📍 *Alamat:* ${customer.address}\n\n` +
      `Simpan nomor ID Pelanggan Anda untuk kemudahan transaksi retribusi dan pengecekan tagihan mandiri.\n` +
      `Terima kasih telah berpartisipasi menjaga kebersihan desa!`
    );

    const waUrl = waNumber
      ? `https://wa.me/${waNumber}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Kartu Pelanggan Digital</h3>
              <p className="text-xs text-slate-500">Pratinjau kartu resmi siap unduh dan cetak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex flex-col items-center">
          {/* Card Presentation Container */}
          <div
            id="printable-customer-card"
            ref={cardRef}
            className="w-full flex justify-center py-2"
          >
            <CustomerCard
              customer={customer}
              service={service}
              settings={currentSettings}
              variant="single"
            />
          </div>

          {/* Action Helper Note */}
          <div className="w-full bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3 no-print">
            <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-semibold">Bisa Diunduh Gambar (PNG) & Dicetak:</span> Warga dapat menyimpan kartu digital ini di galeri HP, atau dicetak fisik seukuran kartu identitas untuk dipindai saat penarikan iuran sampah.
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-300 text-emerald-700 font-semibold text-xs hover:bg-emerald-50 transition cursor-pointer"
              title="Kirim detail kartu ke nomor WhatsApp warga"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Kirim WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs transition cursor-pointer shadow-2xs"
              title="Ganti Tema atau Upload Background Canva"
            >
              <Palette className="w-4 h-4 text-purple-600" />
              <span>Desain Template</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-100 transition shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Kartu</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Memproses...' : 'Unduh Gambar (PNG)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card Template Modal */}
      {templateModalOpen && (
        <CardTemplateModal
          settings={currentSettings}
          sampleCustomer={customer}
          sampleService={service}
          onSave={(newSettings) => {
            setCurrentSettings(newSettings);
          }}
          onClose={() => setTemplateModalOpen(false)}
        />
      )}
    </div>
  );
};
