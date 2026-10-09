import React, { useEffect } from 'react';
import { Receipt } from '../../types';
import { dataService } from '../../services/dataService';
import { Printer, X, CheckCircle2, Download, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptModalProps {
  receipt: Receipt | null;
  onClose: () => void;
  triggerConfetti?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose, triggerConfetti = false }) => {
  useEffect(() => {
    if (receipt && triggerConfetti) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [receipt, triggerConfetti]);

  if (!receipt) return null;

  const settings = dataService.getSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Actions */}
        <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Bukti Pembayaran Sah Digital</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 overflow-y-auto space-y-5 bg-white text-slate-800">
          {/* Header */}
          <div className="text-center border-b pb-4 border-dashed border-slate-300">
            <img
              src={settings.logoUrl}
              alt="Logo RESIK"
              className="h-14 mx-auto mb-2 object-contain"
              onError={(e) => {
                // Fallback text if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <h2 className="text-xl font-bold tracking-tight text-brand-900">RESIK</h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
              Retribusi Elektronik & Sistem Informasi Kebersihan
            </p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{settings.bumdesName}</p>
            <p className="text-[11px] text-slate-400">{settings.address}</p>
          </div>

          {/* Lunas Stamp & Receipt No */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-base uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              LUNAS / TERBAYAR
            </div>
            <div className="text-xs text-slate-500 font-mono">
              No. Bukti: <span className="font-semibold text-slate-800">{receipt.receiptNumber}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {new Date(receipt.paymentDate).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
            </div>
          </div>

          {/* Receipt Details Table */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Nama Pelanggan</span>
              <span className="font-semibold text-slate-900 text-right">{receipt.customerName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">ID Pelanggan</span>
              <span className="font-mono font-medium text-brand-700 text-right">{receipt.customerCode}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Objek Layanan</span>
              <span className="font-medium text-slate-800 text-right">{receipt.serviceName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Alamat Objek</span>
              <span className="text-xs text-slate-600 text-right max-w-[200px]">{receipt.serviceAddress}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Periode Tagihan</span>
              <span className="font-medium text-slate-900 text-right">{receipt.billingPeriod}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Metode Bayar</span>
              <span className="font-medium text-slate-800 text-right">
                {receipt.paymentMethod === 'PETUGAS' && 'Petugas Lapangan (Tunai)'}
                {receipt.paymentMethod === 'KANTOR' && 'Kantor BUMDes (Tunai)'}
                {receipt.paymentMethod === 'TRANSFER' && 'Transfer Bank'}
                {receipt.paymentMethod === 'QRIS' && 'QRIS Manual'}
              </span>
            </div>

            <div className="flex justify-between py-2 border-t border-b border-slate-300 bg-slate-50 px-2 rounded-lg">
              <span className="font-semibold text-slate-700">Total Nominal</span>
              <span className="font-bold text-brand-800 text-lg">
                Rp {receipt.amount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between py-1 text-xs text-slate-400">
              <span>Petugas / Sistem:</span>
              <span className="font-medium text-slate-600">{receipt.officerName}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 border-t border-dashed border-slate-300">
            <p className="text-[11px] text-slate-500 italic">
              "Terima kasih atas partisipasi aktif Anda menjaga kebersihan lingkungan Desa Gedangan."
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">
              Dicetak otomatis melalui Sistem RESIK BUMDes Makmur Gedangan
            </p>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-sm font-medium hover:bg-white transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </div>
  );
};
