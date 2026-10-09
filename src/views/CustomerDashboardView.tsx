import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Bill, ServiceLocation, Payment, BankAccount, Receipt } from '../types';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  Home, Store, Building, AlertCircle, CheckCircle2, Clock,
  XCircle, Copy, Check, Upload, QrCode, CreditCard, Banknote,
  ShieldAlert, Key, MessageSquare, ChevronRight, FileText, ArrowUpRight
} from 'lucide-react';

export const CustomerDashboardView: React.FC = () => {
  const { currentCustomer, refreshProfile } = useAuth();
  if (!currentCustomer) return null;

  const settings = dataService.getSettings();
  const bankAccounts = dataService.getActiveBankAccounts();
  const services = dataService.getServiceLocations(currentCustomer.id);
  const bills = dataService.getBills({ customerId: currentCustomer.id });
  const payments = dataService.getPayments({ customerId: currentCustomer.id });
  const broadcasts = dataService.getBroadcasts().filter(b => b.status === 'PUBLISHED').slice(0, 3);

  // States
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'QRIS' | 'TUNAI'>('TRANSFER');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [transferNotes, setTransferNotes] = useState('');
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Change PIN modal state
  const [changePinModalOpen, setChangePinModalOpen] = useState(currentCustomer.isDefaultPin);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Digital Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Clipboard copy handler with feedback (PRD Section 62)
  const handleCopyAccount = (bankId: string, accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedBankId(bankId);
    setTimeout(() => {
      setCopiedBankId(null);
    }, 2000);
  };

  // Image upload handler (converts to base64 for reliable demo/local viewing)
  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit payment
  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    if (paymentMethod === 'TUNAI') {
      alert('Untuk pembayaran tunai, silakan lakukan pembayaran langsung ke petugas sampah atau ke kantor BUMDes.');
      setPaymentModalOpen(false);
      return;
    }

    if (!proofPreviewUrl) {
      alert('Harap unggah foto bukti transfer atau pembayaran QRIS.');
      return;
    }

    setSubmittingPayment(true);
    try {
      dataService.submitTransferOrQrisPayment(
        selectedBill.id,
        currentCustomer,
        paymentMethod,
        proofPreviewUrl,
        paymentMethod === 'TRANSFER' ? selectedBankId : undefined,
        transferNotes
      );

      alert('Bukti pembayaran berhasil diunggah! Menunggu verifikasi dari pengelola BUMDes.');
      setPaymentModalOpen(false);
      setProofPreviewUrl(null);
      setTransferNotes('');
      refreshProfile();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle Change PIN
  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN harus berupa 4 angka.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('Konfirmasi PIN tidak cocok.');
      return;
    }

    const ok = dataService.changeCustomerPin(currentCustomer.id, newPin);
    if (ok) {
      setPinSuccess(true);
      setTimeout(() => {
        setPinSuccess(false);
        setChangePinModalOpen(false);
        refreshProfile();
      }, 1500);
    }
  };

  const getStatusBadge = (status: Bill['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            LUNAS
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            MENUNGGU VERIFIKASI
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            MENUNGGAK
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            DITOLAK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
            BELUM BAYAR
          </span>
        );
    }
  };

  // Group unpaid/overdue bills
  const unpaidBills = bills.filter(b => b.status === 'UNPAID' || b.status === 'OVERDUE' || b.status === 'REJECTED');
  const totalUnpaidAmount = unpaidBills.reduce((acc, b) => acc + Number(b.amount), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Default PIN Alert Banner (PRD Section 17 & 113) */}
      {currentCustomer.isDefaultPin && (
        <div className="bg-amber-500 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">Keamanan Akun: Anda masih menggunakan PIN default!</p>
              <p className="text-xs text-amber-100">
                Demi keamanan data Anda, silakan ganti PIN default 4-digit Anda sekarang.
              </p>
            </div>
          </div>
          <button
            onClick={() => setChangePinModalOpen(true)}
            className="px-4 py-2 bg-white text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-50 transition shrink-0"
          >
            Ganti PIN Sekarang
          </button>
        </div>
      )}

      {/* Customer Header Card */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-200 uppercase tracking-wider mb-1">
              <span>Kartu Digital Pelanggan</span>
              <span>•</span>
              <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-white">{currentCustomer.customerCode}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{currentCustomer.name}</h1>
            <p className="text-xs text-brand-100 mt-1 max-w-md">{currentCustomer.address}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setChangePinModalOpen(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold backdrop-blur-sm transition flex items-center gap-2"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Ubah PIN</span>
            </button>
          </div>
        </div>

        {/* Total Overdue/Unpaid Widget */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <div className="text-[11px] text-brand-200 font-semibold uppercase">Total Layanan Terdaftar</div>
            <div className="text-xl font-bold mt-0.5">{services.length} Lokasi</div>
          </div>

          <div className="bg-white/10 rounded-2xl p-3.5 backdrop-blur-xs">
            <div className="text-[11px] text-brand-200 font-semibold uppercase">Tagihan Belum Lunas</div>
            <div className="text-xl font-bold mt-0.5">{unpaidBills.length} Bulan</div>
          </div>

          <div className="bg-white/15 rounded-2xl p-3.5 backdrop-blur-xs">
            <div className="text-[11px] text-brand-100 font-semibold uppercase">Total Yang Harus Dibayar</div>
            <div className="text-xl font-black mt-0.5 text-amber-300">
              Rp {totalUnpaidAmount.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Service Locations Cards (PRD Section 32 & 85) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Lokasi Layanan Kebersihan Milik Anda</span>
            <span className="text-xs font-normal text-slate-400">({services.length} Objek)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((srv) => {
            const srvBills = bills.filter(b => b.serviceId === srv.id);
            const currentMonthBill = srvBills.find(b => b.billingYear === 2026 && b.billingMonth === 10);

            return (
              <div
                key={srv.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-brand-50 rounded-xl text-brand-700">
                        {srv.categoryName?.toLowerCase().includes('umkm') || srv.name.toLowerCase().includes('toko') ? (
                          <Store className="w-5 h-5" />
                        ) : srv.categoryName?.toLowerCase().includes('perusahaan') ? (
                          <Building className="w-5 h-5" />
                        ) : (
                          <Home className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{srv.name}</h3>
                        <p className="text-[11px] font-mono text-slate-400">{srv.serviceCode}</p>
                      </div>
                    </div>

                    {currentMonthBill && getStatusBadge(currentMonthBill.status)}
                  </div>

                  <div className="mt-3.5 space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Alamat:</span>
                      <span className="font-medium text-slate-700 text-right">{srv.address} ({srv.rt} / {srv.rw})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kategori & Tarif:</span>
                      <span className="font-semibold text-slate-900">
                        {srv.categoryName} (Rp {srv.tariffAmount?.toLocaleString('id-ID')}/bln)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick bill action for this location */}
                {currentMonthBill && currentMonthBill.status !== 'PAID' && currentMonthBill.status !== 'PENDING_VERIFICATION' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Tagihan Okt 2026</div>
                      <div className="text-sm font-bold text-slate-900">
                        Rp {currentMonthBill.amount.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBill(currentMonthBill);
                        setPaymentModalOpen(true);
                      }}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Bayar Sekarang
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unpaid / Overdue Bills List */}
      {unpaidBills.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Daftar Tagihan Belum Lunas</h2>
              <p className="text-xs text-slate-500">Pilih tagihan untuk melakukan pembayaran transfer atau QRIS</p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
              {unpaidBills.length} Tagihan
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {unpaidBills.map((bill) => (
              <div key={bill.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {dataService.formatMonthName(bill.billingMonth, bill.billingYear)}
                    </span>
                    <span className="text-xs text-slate-500">• {bill.serviceName}</span>
                    {getStatusBadge(bill.status)}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Jatuh Tempo: {bill.dueDate}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-brand-900 text-base">
                    Rp {Number(bill.amount).toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBill(bill);
                      setPaymentModalOpen(true);
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Bayar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History & Digital Receipt (PRD Sections 67, 69) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Riwayat Pembayaran</h2>
            <p className="text-xs text-slate-500">Daftar pembayaran yang pernah Anda kirimkan</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Belum ada riwayat pembayaran yang tercatat.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((pay) => (
              <div key={pay.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{pay.billPeriod}</span>
                    <span className="text-xs text-slate-500">• {pay.serviceName}</span>
                    {pay.status === 'VERIFIED' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        LUNAS
                      </span>
                    ) : pay.status === 'PENDING' ? (
                      <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        MENUNGGU VERIFIKASI
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        DITOLAK
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Metode: {pay.paymentMethod}</span>
                    <span>•</span>
                    <span>{new Date(pay.paymentDate).toLocaleDateString('id-ID')}</span>
                  </div>
                  {pay.rejectionReason && (
                    <div className="text-xs text-rose-600 mt-1 font-medium">
                      Alasan Ditolak: {pay.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-900 text-sm">
                    Rp {Number(pay.amount).toLocaleString('id-ID')}
                  </span>
                  {pay.status === 'VERIFIED' && pay.receiptNumber && (
                    <button
                      onClick={() => {
                        const receipt = dataService.getReceiptByPaymentId(pay.id);
                        if (receipt) setSelectedReceipt(receipt);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      <span>Bukti Setor</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Announcements for Residents */}
      {broadcasts.length > 0 && (
        <div className="bg-slate-100/70 rounded-2xl p-5 border border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            <span>Pengumuman dari Pengurus BUMDes</span>
          </h2>
          <div className="space-y-3">
            {broadcasts.map((bc) => (
              <div key={bc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900">{bc.title}</span>
                  <span className="text-[10px] text-slate-400">{new Date(bc.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{bc.message}</p>
                <div className="text-[10px] text-slate-400 mt-2 font-medium">
                  Disiarkan oleh: {bc.createdByName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= PAYMENT MODAL (PRD Sections 122, 123, 124) ================= */}
      {paymentModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-brand-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Pembayaran Iuran Kebersihan</h3>
                <p className="text-xs text-brand-100">
                  {dataService.formatMonthName(selectedBill.billingMonth, selectedBill.billingYear)} • {selectedBill.serviceName}
                </p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-white/80 hover:text-white rounded-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePaySubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Bill Nominal Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Nominal Tagihan</div>
                  <div className="text-xs text-slate-400">Jatuh Tempo: {selectedBill.dueDate}</div>
                </div>
                <div className="text-xl font-black text-brand-800">
                  Rp {selectedBill.amount.toLocaleString('id-ID')}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">
                  Pilih Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Transfer Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'QRIS'
                        ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs">QRIS Manual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TUNAI')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'TUNAI'
                        ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs">Tunai</span>
                  </button>
                </div>
              </div>

              {/* TRANSFER BANK VIEW (PRD Sections 61, 62, 123) */}
              {paymentMethod === 'TRANSFER' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-600 font-semibold">
                    Silakan transfer ke salah satu rekening resmi BUMDes Makmur Gedangan:
                  </div>

                  <div className="space-y-2.5">
                    {bankAccounts.map((bank) => (
                      <div
                        key={bank.id}
                        onClick={() => setSelectedBankId(bank.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          selectedBankId === bank.id
                            ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-900 text-xs">🏦 {bank.bankName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyAccount(bank.id, bank.accountNumber);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-100 hover:bg-brand-200 px-2 py-1 rounded-lg transition"
                          >
                            {copiedBankId === bank.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>✓ Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>📋 Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-base font-bold text-slate-800 tracking-wider">
                          {bank.accountNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          a.n. {bank.accountName}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Upload Transfer Proof */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                      Unggah Bukti Transfer (Screenshot / Foto Struk)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                      required
                    />

                    {proofPreviewUrl && (
                      <div className="mt-3 p-2 border border-slate-200 rounded-xl max-h-40 overflow-hidden flex items-center justify-center bg-slate-950">
                        <img src={proofPreviewUrl} alt="Preview Bukti" className="max-h-36 object-contain" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Catatan Pengirim (Opsional)
                    </label>
                    <input
                      type="text"
                      value={transferNotes}
                      onChange={(e) => setTransferNotes(e.target.value)}
                      placeholder="Contoh: Dari Rekening a.n. Budi Santoso"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              {/* QRIS MANUAL VIEW (PRD Section 124) */}
              {paymentMethod === 'QRIS' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                    <img
                      src={settings.qrisImageUrl}
                      alt="QRIS BUMDes"
                      className="w-48 h-48 mx-auto object-contain rounded-xl shadow-xs border border-slate-200 bg-white p-2"
                    />
                    <div className="mt-2 font-bold text-xs text-slate-800">
                      RESIK QRIS • {settings.bumdesName}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      {settings.qrisDescription}
                    </p>
                  </div>

                  {/* Steps */}
                  <div className="text-xs text-slate-600 bg-emerald-50/60 p-3 rounded-xl space-y-1">
                    <div className="font-bold text-emerald-900 mb-1">Petunjuk Pembayaran:</div>
                    <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-700">
                      <li>Buka aplikasi m-Banking atau e-wallet (BCA, Mandiri, BRI, Dana, GoPay, dll).</li>
                      <li>Scan kode QRIS di atas.</li>
                      <li>Masukkan nominal tepat: <strong>Rp {selectedBill.amount.toLocaleString('id-ID')}</strong>.</li>
                      <li>Simpan screenshot / bukti bayar dan unggah di bawah ini.</li>
                    </ol>
                  </div>

                  {/* Upload QRIS Proof */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                      Unggah Bukti Transaksi QRIS
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                      required
                    />

                    {proofPreviewUrl && (
                      <div className="mt-3 p-2 border border-slate-200 rounded-xl max-h-40 overflow-hidden flex items-center justify-center bg-slate-950">
                        <img src={proofPreviewUrl} alt="Preview Bukti" className="max-h-36 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TUNAI VIEW */}
              {paymentMethod === 'TUNAI' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
                  <p className="font-bold text-slate-900 text-sm">Pembayaran Tunai</p>
                  <p>
                    Anda dapat melakukan pembayaran langsung kepada Petugas Pengangkut Sampah BUMDes saat berkeliling di wilayah RW Anda, atau datang langsung ke Kantor BUMDes Makmur Gedangan.
                  </p>
                  <p className="text-slate-500">
                    Alamat Kantor: {settings.address}
                  </p>
                  <p className="font-semibold text-brand-700">
                    Petugas akan langsung mencatatkan setoran Anda dan menerbitkan Bukti Pembayaran Digital RESIK resmi.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {submittingPayment ? 'Mengirim...' : paymentMethod === 'TUNAI' ? 'Tutup Petunjuk' : 'Kirim Bukti Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CHANGE PIN MODAL (PRD Sections 17 & 18) ================= */}
      {changePinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">
            <h3 className="font-bold text-base text-slate-900 mb-1">Ganti PIN Keamanan</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan 4 angka baru untuk PIN masuk akun RESIK Anda.
            </p>

            {pinError && (
              <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {pinError}
              </div>
            )}

            {pinSuccess && (
              <div className="p-3 mb-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                ✓ PIN berhasil diperbarui!
              </div>
            )}

            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">PIN Baru (4 Angka)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-center font-mono text-lg tracking-widest focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Ulangi PIN Baru</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-center font-mono text-lg tracking-widest focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                {!currentCustomer.isDefaultPin && (
                  <button
                    type="button"
                    onClick={() => setChangePinModalOpen(false)}
                    className="w-1/2 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className={`py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm ${
                    currentCustomer.isDefaultPin ? 'w-full' : 'w-1/2'
                  }`}
                >
                  Simpan PIN Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DIGITAL RECEIPT MODAL ================= */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
};
