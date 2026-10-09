import React from 'react';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ProofViewerModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ProofViewerModal: React.FC<ProofViewerModalProps> = ({
  imageUrl,
  title = 'Bukti Pembayaran',
  onClose
}) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <ImageIcon className="w-4 h-4 text-brand-600" />
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-slate-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka Tab Baru
            </a>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition p-1 rounded-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto max-h-[75vh]">
          <img
            src={imageUrl}
            alt="Bukti Transfer / QRIS"
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
