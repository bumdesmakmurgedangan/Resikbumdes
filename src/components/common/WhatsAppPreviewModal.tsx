import React from 'react';
import { User } from '../../types';
import { dataService } from '../../services/dataService';
import { MessageSquare, AlertTriangle, ExternalLink, X, Clock, Check } from 'lucide-react';

interface WhatsAppPreviewModalProps {
  data: ReturnType<typeof dataService.prepareWhatsAppReminder> | null;
  actorUser: User;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  data,
  actorUser,
  onClose,
  onSuccess
}) => {
  if (!data) return null;

  const handleOpenWhatsApp = () => {
    if (!data.waUrl) return;

    // Record reminder opened & log audit (PRD Section 48 & 54)
    dataService.recordWhatsAppReminderOpened(
      data.customer.id,
      actorUser,
      data.totalOverdue,
      data.messageText
    );

    // Open WhatsApp URL
    window.open(data.waUrl, '_blank', 'noopener,noreferrer');

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Pengingat Tagihan WhatsApp</h3>
              <p className="text-xs text-emerald-100">Pratinjau pesan otomatis sebelum dikirim</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700">
          {/* Target Customer Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Pelanggan</span>
              <span className="font-mono text-emerald-700 font-semibold">{data.customer.customerCode}</span>
            </div>
            <div className="font-bold text-base text-slate-900">{data.customer.name}</div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-500">Nomor WhatsApp:</span>
              <span className="font-mono font-medium text-slate-800">
                {data.customer.phone ? data.customer.phone : <span className="text-red-500">Tidak ada nomor HP</span>}
              </span>
            </div>
          </div>

          {/* Warning if recently reminded */}
          {data.recentReminderWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{data.recentReminderWarning}</p>
                <p className="text-amber-700 mt-0.5">
                  Anda tetap dapat melanjutkan jika diperlukan untuk mengingatkan kembali.
                </p>
              </div>
            </div>
          )}

          {/* Overdue Breakdown summary */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Rincian Tunggakan ({data.bills.length} Bulan/Layanan)</span>
              <span className="text-red-600 font-bold">{data.formattedTotal}</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 space-y-1 text-xs font-mono text-slate-600">
              {data.breakdownList.map((item, i) => (
                <div key={i} className="leading-relaxed">{item}</div>
              ))}
            </div>
          </div>

          {/* Message Preview Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Teks Pesan WhatsApp (Bahasa Santun)
            </label>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs font-sans text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
              {data.messageText}
            </div>
          </div>

          {/* Technical Note */}
          <div className="text-[11px] text-slate-400 bg-slate-100 rounded-lg p-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              Sistem akan membuka tautan wa.me secara individual. Status pengingat dicatat sebagai{' '}
              <strong>OPENED</strong> di audit log.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 text-sm font-medium hover:bg-white transition"
          >
            Batal
          </button>
          <button
            onClick={handleOpenWhatsApp}
            disabled={!data.hasPhone}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm ${
              data.hasPhone
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            {data.hasPhone ? 'Buka WhatsApp Sekarang' : 'Tidak Ada Nomor WA'}
          </button>
        </div>
      </div>
    </div>
  );
};
