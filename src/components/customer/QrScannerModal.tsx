import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { parseScannedCustomerCode, playSuccessBeep } from '../../utils/qrUtils';
import {
  X, Camera, AlertCircle, RefreshCw, CheckCircle2,
  Keyboard, Search, Sparkles
} from 'lucide-react';

interface QrScannerModalProps {
  onScanSuccess: (customerCode: string) => void;
  onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  onScanSuccess,
  onClose
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanSuccessCode, setScanSuccessCode] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartedRef = useRef(false);

  useEffect(() => {
    const elementId = 'customer-qr-reader-target';
    const scanner = new Html5Qrcode(elementId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false
    });
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        setCameraError(null);
        setScanning(true);

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await scanner.start(
          { facingMode: 'environment' }, // Back camera for smartphone
          config,
          (decodedText) => {
            // Success callback
            const parsedCode = parseScannedCustomerCode(decodedText);
            if (parsedCode) {
              playSuccessBeep();
              setScanSuccessCode(parsedCode);

              // Stop scanner immediately
              if (scannerRef.current && isStartedRef.current) {
                isStartedRef.current = false;
                scannerRef.current.stop().catch(() => {}).then(() => {
                  setTimeout(() => {
                    onScanSuccess(parsedCode);
                  }, 400);
                });
              } else {
                setTimeout(() => {
                  onScanSuccess(parsedCode);
                }, 400);
              }
            }
          },
          () => {
            // Frame error - ignore normal scan misses
          }
        );

        isStartedRef.current = true;
      } catch (err: any) {
        console.warn('Camera start error:', err);
        setCameraError(
          err?.message ||
          'Tidak dapat mengakses kamera. Pastikan izin kamera aktif pada browser.'
        );
        setScanning(false);
      }
    };

    // Small delay to ensure DOM element is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && isStartedRef.current) {
        isStartedRef.current = false;
        scannerRef.current
          .stop()
          .catch(() => {})
          .then(() => {
            try {
              scannerRef.current?.clear();
            } catch {}
          });
      }
    };
  }, [onScanSuccess]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = parseScannedCustomerCode(manualCode);
    if (code) {
      playSuccessBeep();
      onScanSuccess(code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Scan Kartu Pelanggan</h3>
              <p className="text-[11px] text-slate-400">Arahkan kamera ke QR Code kartu atau stiker rumah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View Area */}
        <div className="p-6 flex flex-col items-center bg-slate-950 relative min-h-[320px] justify-center overflow-hidden">
          {/* Target Scanner DIV */}
          <div
            id="customer-qr-reader-target"
            className="w-full max-w-[300px] overflow-hidden rounded-2xl border-2 border-emerald-500/50 shadow-inner"
          />

          {/* Success Overlay Flash */}
          {scanSuccessCode && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-white z-20 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-extrabold text-base">QR Berhasil Terdeteksi!</h4>
              <p className="text-emerald-300 font-mono text-sm mt-1">{scanSuccessCode}</p>
              <span className="text-xs text-slate-400 mt-2">Memuat data pelanggan...</span>
            </div>
          )}

          {/* Error State */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-white z-10">
              <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
              <h4 className="font-bold text-sm text-slate-100 mb-1">Kamera Tidak Tersedia</h4>
              <p className="text-xs text-slate-400 max-w-xs mb-4">{cameraError}</p>
              <p className="text-xs text-emerald-400 font-medium">
                Gunakan input manual di bawah untuk mencari ID Pelanggan.
              </p>
            </div>
          )}
        </div>

        {/* Manual Fallback Input */}
        <div className="p-5 bg-white border-t border-slate-100">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                Atau Ketik ID Pelanggan Manual:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Contoh: PLG-RW03-0025"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Pilih
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
