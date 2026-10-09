import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Payment, Receipt } from '../types';
import { ProofViewerModal } from '../components/common/ProofViewerModal';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  CheckSquare, Check, X, Eye, Clock, AlertTriangle,
  FileCheck, ShieldAlert, Image as ImageIcon
} from 'lucide-react';

export const VerificationView: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const [refreshKey, setRefreshKey] = useState(0);
  const pendingPayments = dataService.getPayments({ status: 'PENDING' });
  const allPayments = dataService.getPayments();

  // Proof viewer modal
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Reject modal
  const [rejectingPayment, setRejectingPayment] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Digital receipt modal
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null);

  const handleApprove = (payment: Payment) => {
    if (!window.confirm(`Setujui pembayaran dari ${payment.customerName} sebesar Rp${payment.amount.toLocaleString('id-ID')}?`)) {
      return;
    }

    try {
      const verified = dataService.verifyPayment(payment.id, currentUser, true);
      const receipt = dataService.getReceiptByPaymentId(verified.id);
      if (receipt) {
        setGeneratedReceipt(receipt);
      }
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Gagal memverifikasi pembayaran');
    }
  };

  const handleOpenReject = (payment: Payment) => {
    setRejectingPayment(payment);
    setRejectionReason('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment) return;

    if (!rejectionReason.trim()) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    try {
      dataService.verifyPayment(rejectingPayment.id, currentUser, false, rejectionReason);
      alert('Pembayaran telah ditolak dan alasan dicatat.');
      setRejectingPayment(null);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Gagal menolak pembayaran');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Verifikasi Pembayaran Transfer & QRIS
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Periksa keaslian bukti transfer bank atau QRIS warga sebelum mengubah status menjadi LUNAS.
        </p>
      </div>

      {/* Pending Queue Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Antrean Menunggu Verifikasi</h2>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              pendingPayments.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
            }`}>
              {pendingPayments.length} Pembayaran
            </span>
          </div>
        </div>

        {pendingPayments.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <FileCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-slate-600">Semua pembayaran telah diverifikasi!</p>
            <p className="mt-0.5">Tidak ada bukti transfer atau QRIS baru yang tertunda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Pelanggan</th>
                  <th className="py-3 px-3">Objek & Periode</th>
                  <th className="py-3 px-3">Nominal</th>
                  <th className="py-3 px-3">Metode & Tujuan</th>
                  <th className="py-3 px-3">Bukti Bayar</th>
                  <th className="py-3 px-3">Waktu Masuk</th>
                  <th className="py-3 px-3 text-right">Tindakan Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{p.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.recordedByName}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{p.serviceName}</div>
                      <div className="text-[11px] text-brand-700 font-bold">{p.billPeriod}</div>
                    </td>

                    <td className="py-3 px-3 font-bold text-brand-900">
                      Rp {Number(p.amount).toLocaleString('id-ID')}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">
                        {p.paymentMethod === 'TRANSFER' ? '🏦 Transfer Bank' : '📱 QRIS Manual'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                        {p.bankAccountDetails || 'QRIS BUMDes'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {p.paymentProofUrl ? (
                        <button
                          onClick={() => setSelectedProofUrl(p.paymentProofUrl!)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg font-medium transition inline-flex items-center gap-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                          <span>Lihat Bukti</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Tanpa Bukti</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      {new Date(p.paymentDate).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    <td className="py-3 px-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenReject(p)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold transition inline-flex items-center gap-1"
                        title="Tolak pembayaran"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tolak</span>
                      </button>

                      <button
                        onClick={() => handleApprove(p)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-xs inline-flex items-center gap-1"
                        title="Setujui dan terbitkan kwitansi"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Setujui</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History of All Verifications */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Semua Riwayat Verifikasi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Bukti / Status</th>
                <th className="py-2.5 px-3">Pelanggan</th>
                <th className="py-2.5 px-3">Objek & Periode</th>
                <th className="py-2.5 px-3">Nominal</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3">Verifikator</th>
                <th className="py-2.5 px-3 text-right">Kwitansi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allPayments.filter(p => p.status !== 'PENDING').map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3">
                    {p.status === 'VERIFIED' ? (
                      <div>
                        <span className="font-mono font-bold text-emerald-700">{p.receiptNumber}</span>
                        <div className="text-[10px] text-emerald-600 font-semibold">✓ TERVERIFIKASI</div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-rose-600 font-bold">✕ DITOLAK</span>
                        <div className="text-[10px] text-rose-500 truncate max-w-[140px]">{p.rejectionReason}</div>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{p.customerName}</td>
                  <td className="py-2.5 px-3 text-slate-700">{p.serviceName} ({p.billPeriod})</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    Rp {Number(p.amount).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-600">{p.paymentMethod}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">{p.verifiedByName || '-'}</td>
                  <td className="py-2.5 px-3 text-right">
                    {p.status === 'VERIFIED' && p.receiptNumber && (
                      <button
                        onClick={() => {
                          const r = dataService.getReceiptByPaymentId(p.id);
                          if (r) setGeneratedReceipt(r);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                      >
                        Lihat Struk
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Lightbox Modal */}
      <ProofViewerModal
        imageUrl={selectedProofUrl}
        onClose={() => setSelectedProofUrl(null)}
      />

      {/* Rejection Modal (PRD Section 70: "Admin harus memberikan alasan penolakan") */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-2 text-rose-600 font-bold mb-1">
              <ShieldAlert className="w-5 h-5" />
              <span>Tolak Pembayaran</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Wajib menyertakan alasan penolakan agar warga dapat mengetahui kekurangannya (misal: nominal kurang, bukti buram/salah rekening).
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Alasan Penolakan
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Bukti transfer tidak terbaca / nominal tidak sesuai tagihan."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingPayment(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Receipt Modal with Confetti */}
      <ReceiptModal
        receipt={generatedReceipt}
        onClose={() => setGeneratedReceipt(null)}
        triggerConfetti={true}
      />
    </div>
  );
};
