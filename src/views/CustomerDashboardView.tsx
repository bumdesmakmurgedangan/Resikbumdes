import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Bill, ServiceLocation, Payment, BankAccount, Receipt, Broadcast } from '../types';
import { ReceiptModal } from '../components/common/ReceiptModal';
import { SocialBrandIcon, getSocialBadgeStyle } from '../components/common/SocialBrandIcon';
import {
  Home, Store, Building, AlertCircle, CheckCircle2, Clock,
  XCircle, Copy, Check, Upload, QrCode, CreditCard, Banknote,
  ShieldAlert, Key, MessageSquare, ChevronRight, FileText, ArrowUpRight,
  Radio, HelpCircle, History, Phone, ExternalLink, Calendar, Info, X
} from 'lucide-react';

interface CustomerDashboardViewProps {
  activeTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  activeTab = 'customer-dashboard',
  onNavigateTab = () => {}
}) => {
  const { currentCustomer, refreshProfile } = useAuth();
  if (!currentCustomer) return null;

  const settings = dataService.getSettings();
  const bankAccounts = dataService.getActiveBankAccounts();
  const services = dataService.getServiceLocations(currentCustomer.id);
  const bills = dataService.getBills({ customerId: currentCustomer.id });
  const payments = dataService.getPayments({ customerId: currentCustomer.id });
  const customerRWs = services.map(s => s.rw);
  const customerCategoryIds = services.map(s => s.categoryId);
  const customerCategoryNames = services.map(s => (s.categoryName || '').toLowerCase());

  const broadcasts = dataService.getBroadcasts().filter(b => {
    if (b.status !== 'PUBLISHED') return false;
    if (!b.targetType || b.targetType === 'ALL') return true;
    if (b.targetType === 'RW') {
      const rw = b.targetFilter?.rw;
      return !rw || customerRWs.includes(rw) || currentCustomer.address.includes(rw) || currentCustomer.customerCode.includes(rw);
    }
    if (b.targetType === 'CATEGORY') {
      const catId = b.targetFilter?.categoryId;
      const catName = (b.targetFilter?.categoryName || '').toLowerCase();
      return (catId && customerCategoryIds.includes(catId)) || (catName && customerCategoryNames.includes(catName));
    }
    return true;
  });
  const orgLinks = dataService.getActiveOrganizationLinks();

  // Payment Modal States
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'QRIS' | 'TUNAI'>('TRANSFER');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [transferNotes, setTransferNotes] = useState('');
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Change PIN modal state - DO NOT automatically popup immediately!
  const [changePinModalOpen, setChangePinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Digital Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // History Tab Filter
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING' | 'REJECTED'>('ALL');

  // Clipboard copy handler with robust fallback (PRD Section 62)
  const handleCopyAccount = (bankId: string, accountNumber: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(accountNumber);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = accountNumber;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (e) {
      console.error('Clipboard copy error', e);
    }
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
      alert('Untuk pembayaran tunai, silakan lakukan pembayaran langsung ke petugas sampah saat berkeliling atau ke kantor BUMDes Makmur Gedangan.');
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
      alert(err.message || 'Terjadi kesalahan saat mengirim pembayaran');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Open Payment modal for a specific bill
  const handleOpenPaymentForBill = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentModalOpen(true);
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

  // Filtered payments for history tab
  const filteredPayments = payments.filter(p => {
    if (historyFilter === 'ALL') return true;
    return p.status === historyFilter;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ================= TAB 1: TAGIHAN & STATUS LAYANAN (DASHBOARD UTAMA) ================= */}
      {activeTab === 'customer-dashboard' && (
        <div className="space-y-6">
          {/* ================= PENGUMUMAN & BROADCAST PALING ATAS SENDIRI (PRD User Request) ================= */}
          {broadcasts.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-emerald-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-sans">
                        PENGUMUMAN RESMI
                      </span>
                      <span className="text-xs text-emerald-100 font-medium">{settings.bumdesName}</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5 text-white">
                      Informasi & Siaran Penting Desa Gedangan
                    </h2>
                  </div>
                </div>

                {broadcasts.length > 1 && (
                  <button
                    onClick={() => onNavigateTab('customer-broadcast')}
                    className="text-xs font-bold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto backdrop-blur-sm"
                  >
                    <span>Lihat Semua ({broadcasts.length})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Latest Broadcast Item Highlighted */}
              <div className="space-y-3">
                {broadcasts.slice(0, 1).map((bc, idx) => (
                  <div
                    key={bc.id}
                    className={`rounded-2xl p-4 transition ${
                      idx === 0
                        ? 'bg-white/15 backdrop-blur-md border border-white/25 shadow-sm'
                        : 'bg-black/10 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <h3 className="font-extrabold text-sm text-white tracking-tight flex flex-wrap items-center gap-2">
                        <span>{bc.title}</span>
                        {bc.targetType === 'CATEGORY' && bc.targetFilter?.categoryName && (
                          <span className="text-[10px] bg-white/20 text-white font-medium px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
                            Kategori: {bc.targetFilter.categoryName}
                          </span>
                        )}
                        {bc.targetType === 'RW' && bc.targetFilter?.rw && (
                          <span className="text-[10px] bg-white/20 text-white font-medium px-2 py-0.5 rounded-full border border-white/20 backdrop-blur-sm">
                            {bc.targetFilter.rw}
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] text-emerald-200 font-medium">
                        {new Date(bc.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-50 leading-relaxed whitespace-pre-line font-normal">
                      {bc.message}
                    </p>
                    <div className="text-[10px] text-emerald-200/90 mt-2 font-medium flex items-center gap-1">
                      <span>Disiarkan oleh:</span>
                      <span className="font-bold text-white">{bc.createdByName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default PIN Alert Banner (PRD Section 17 & 113) */}
          {currentCustomer.isDefaultPin && (
            <div className="bg-amber-500 text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Keamanan Akun: Anda masih menggunakan PIN default (1234)!</p>
                  <p className="text-xs text-amber-100">
                    Demi keamanan data Anda, silakan ganti PIN default 4-digit Anda sekarang.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChangePinModalOpen(true)}
                className="px-4 py-2 bg-white text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-50 transition shrink-0 self-start sm:self-auto cursor-pointer shadow-sm"
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
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold backdrop-blur-sm transition flex items-center gap-2 cursor-pointer"
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
                const unpaidSrvBills = srvBills.filter(b => b.status === 'UNPAID' || b.status === 'OVERDUE' || b.status === 'REJECTED');

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
                    {unpaidSrvBills.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            Tagihan: {dataService.formatMonthName(unpaidSrvBills[0].billingMonth, unpaidSrvBills[0].billingYear)}
                          </div>
                          <div className="text-sm font-bold text-slate-900">
                            Rp {Number(unpaidSrvBills[0].amount).toLocaleString('id-ID')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenPaymentForBill(unpaidSrvBills[0])}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
                  <p className="text-xs text-slate-500">Pilih tagihan untuk melakukan pembayaran transfer bank atau QRIS</p>
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
                        onClick={() => handleOpenPaymentForBill(bill)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Bayar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Payment History Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Riwayat Pembayaran Terakhir</h2>
                <p className="text-xs text-slate-500">Daftar pembayaran yang pernah Anda kirimkan</p>
              </div>
              <button
                onClick={() => onNavigateTab('customer-history')}
                className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1"
              >
                <span>Buka Semua Riwayat</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Belum ada riwayat pembayaran yang tercatat.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.slice(0, 3).map((pay) => (
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
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
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
        </div>
      )}

      {/* ================= TAB 2: HISTORI & BUKTI BAYAR ================= */}
      {activeTab === 'customer-history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Histori & Bukti Pembayaran Digital
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Arsip seluruh pembayaran iuran sampah yang pernah Anda lakukan, lengkap dengan kwitansi digital sah dari BUMDes.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('customer-dashboard')}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition self-start sm:self-auto cursor-pointer"
            >
              ← Kembali ke Tagihan
            </button>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold w-fit">
            <button
              onClick={() => setHistoryFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                historyFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({payments.length})
            </button>
            <button
              onClick={() => setHistoryFilter('VERIFIED')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                historyFilter === 'VERIFIED' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lunas Terverifikasi ({payments.filter(p => p.status === 'VERIFIED').length})
            </button>
            <button
              onClick={() => setHistoryFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                historyFilter === 'PENDING' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu Verifikasi ({payments.filter(p => p.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setHistoryFilter('REJECTED')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                historyFilter === 'REJECTED' ? 'bg-white text-rose-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ditolak ({payments.filter(p => p.status === 'REJECTED').length})
            </button>
          </div>

          {/* Payments List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Tidak ada riwayat pembayaran yang ditemukan.</p>
                <p className="mt-0.5">Seluruh setoran lunas atau bukti yang diunggah akan tercatat di halaman ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPayments.map((pay) => (
                  <div key={pay.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{pay.billPeriod}</span>
                        <span className="text-xs text-slate-500 font-medium">• {pay.serviceName}</span>
                        {pay.status === 'VERIFIED' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                            ✓ LUNAS
                          </span>
                        ) : pay.status === 'PENDING' ? (
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                            ⏳ MENUNGGU VERIFIKASI
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                            ✕ DITOLAK
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 pt-0.5">
                        <span>Metode: <strong className="text-slate-700">{pay.paymentMethod}</strong></span>
                        <span>•</span>
                        <span>Tanggal: {new Date(pay.paymentDate).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        {pay.receiptNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-emerald-700 font-bold">No: {pay.receiptNumber}</span>
                          </>
                        )}
                      </div>

                      {pay.rejectionReason && (
                        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 mt-2">
                          <strong>Alasan Penolakan:</strong> {pay.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Nominal</div>
                        <div className="text-base font-black text-brand-900">
                          Rp {Number(pay.amount).toLocaleString('id-ID')}
                        </div>
                      </div>

                      {pay.status === 'VERIFIED' && pay.receiptNumber && (
                        <button
                          onClick={() => {
                            const receipt = dataService.getReceiptByPaymentId(pay.id);
                            if (receipt) setSelectedReceipt(receipt);
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lihat Bukti Setor</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: PENGUMUMAN DESA ================= */}
      {activeTab === 'customer-broadcast' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Radio className="w-6 h-6 text-brand-600" />
                <span>Pengumuman</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemberitahuan resmi jadwal armada truk sampah dan pengumuman kebersihan dari BUMDes Makmur Gedangan.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('customer-dashboard')}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition self-start sm:self-auto cursor-pointer"
            >
              ← Kembali ke Tagihan
            </button>
          </div>

          <div className="space-y-4">
            {broadcasts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                Belum ada pengumuman baru yang diterbitkan.
              </div>
            ) : (
              broadcasts.map(bc => (
                <div key={bc.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <h2 className="font-extrabold text-base text-slate-900">{bc.title}</h2>
                      {bc.targetType === 'CATEGORY' && bc.targetFilter?.categoryName && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-100">
                          Kategori: {bc.targetFilter.categoryName}
                        </span>
                      )}
                      {bc.targetType === 'RW' && bc.targetFilter?.rw && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-100">
                          Wilayah: {bc.targetFilter.rw}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(bc.createdAt).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100 font-sans">
                    {bc.message}
                  </p>

                  <div className="text-xs text-slate-400 pt-1 flex items-center justify-between">
                    <span>Pengirim: <strong className="text-slate-700">{bc.createdByName}</strong></span>
                    <span className="text-[11px] bg-brand-50 text-brand-800 font-bold px-2.5 py-0.5 rounded-full">
                      BUMDes Makmur Gedangan
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: BANTUAN & KONTAK BUMDES ================= */}
      {activeTab === 'customer-help' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-brand-600" />
                <span>Bantuan & Kontak Resmi BUMDes</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Punya pertanyaan, kendala verifikasi, atau lupa PIN? Pengurus BUMDes Makmur Gedangan siap membantu Anda.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('customer-dashboard')}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition self-start sm:self-auto cursor-pointer"
            >
              ← Kembali ke Tagihan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* WhatsApp Quick Action Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-extrabold text-base leading-tight">Layanan WhatsApp BUMDes</h2>
                  <p className="text-xs text-emerald-100 font-mono mt-0.5">{settings.phoneWhatsapp}</p>
                </div>
              </div>
              <p className="text-xs text-emerald-50 leading-relaxed">
                Hubungi pengurus BUMDes secara langsung untuk permohonan reset PIN, konfirmasi pembayaran manual, atau keluhan armada pengangkutan sampah.
              </p>
              <a
                href={`https://wa.me/62${settings.phoneWhatsapp.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(
                  `Halo BUMDes Makmur Gedangan, saya ${currentCustomer.name} (${currentCustomer.customerCode}) membutuhkan bantuan terkait layanan RESIK.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-white text-emerald-900 hover:bg-emerald-50 font-black rounded-2xl text-xs transition shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Buka WhatsApp Sekarang</span>
              </a>
            </div>

            {/* Office Location & Info Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm">
                <Building className="w-5 h-5 text-brand-600" />
                <span>Kantor BUMDes Makmur Gedangan</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {settings.address}
              </p>
              <div className="text-xs text-slate-500 space-y-1 pt-1">
                <div>Email: <strong className="text-slate-700">{settings.email}</strong></div>
                <div>Website: <strong className="text-slate-700">{settings.website}</strong></div>
                <div>Jatuh Tempo Bulanan: <strong>Tanggal {settings.defaultDueDay} setiap bulan</strong></div>
              </div>

              {settings.website && (
                <a
                  href={settings.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-700 font-bold hover:underline pt-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Kunjungi Website Desa Gedangan</span>
                </a>
              )}
            </div>
          </div>

          {/* Official Bank Accounts List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <span>Rekening Pembayaran Resmi BUMDes (Bisa Disalin)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {bankAccounts.map(b => (
                <div key={b.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">🏦 {b.bankName}</span>
                    <button
                      onClick={() => handleCopyAccount(b.id, b.accountNumber)}
                      className="px-2 py-1 bg-white hover:bg-brand-50 border border-slate-200 text-brand-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedBankId === b.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-base font-black text-brand-900">{b.accountNumber}</div>
                  <div className="text-[11px] text-slate-500">a.n. {b.accountName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Social Links */}
          {orgLinks.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900">Media Sosial & Informasi Resmi</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Kanal komunikasi, pengaduan, dan publikasi resmi BUMDes</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">
                  {orgLinks.length} Kanal Aktif
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {orgLinks.map(link => {
                  const style = getSocialBadgeStyle(link.type);
                  const appName = style.brandName || link.label;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className={`group inline-flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50/70 hover:bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 text-slate-700 hover:-translate-y-0.5 cursor-pointer ${style.hoverBorder}`}
                      title={appName}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-2xs ${style.badgeBg}`}>
                        <SocialBrandIcon type={link.type} className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950 transition">
                        {appName}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition ml-0.5" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
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
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-white/80 hover:text-white rounded-lg p-1.5 cursor-pointer hover:bg-white/10"
              >
                <X className="w-5 h-5" />
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
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
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
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
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
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
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
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-100 hover:bg-brand-200 px-2 py-1 rounded-lg transition cursor-pointer"
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
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative">
            <button
              onClick={() => setChangePinModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

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
                <button
                  type="button"
                  onClick={() => setChangePinModalOpen(false)}
                  className="w-1/2 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Simpan PIN
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
