import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Customer, Bill, Receipt } from '../types';
import { ReceiptModal } from '../components/common/ReceiptModal';
import {
  Banknote, Search, CheckCircle2, User, Home,
  Calendar, FileText, ArrowRight
} from 'lucide-react';

export const CashPaymentView: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Digital receipt modal
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null);

  const customers = dataService.getCustomers().filter(c => c.status === 'ACTIVE');
  const filteredCustomers = search.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.customerCode.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
      )
    : [];

  const customerBills = selectedCustomer
    ? dataService.getBills({ customerId: selectedCustomer.id }).filter(b => b.status === 'UNPAID' || b.status === 'OVERDUE' || b.status === 'REJECTED')
    : [];

  const selectedBill = customerBills.find(b => b.id === selectedBillId);

  const handleConfirmCashPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    if (!window.confirm(`Konfirmasi penerimaan uang tunai sebesar Rp${selectedBill.amount.toLocaleString('id-ID')} dari ${selectedCustomer?.name}?`)) {
      return;
    }

    setProcessing(true);
    try {
      const { payment } = dataService.recordCashPayment(
        selectedBill.id,
        currentUser,
        paymentNotes || `Setoran tunai diterima oleh ${currentUser.fullName}`
      );

      const receipt = dataService.getReceiptByPaymentId(payment.id);
      if (receipt) {
        setGeneratedReceipt(receipt);
      }

      // Reset selection
      setSelectedBillId('');
      setPaymentNotes('');
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat pembayaran tunai');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Catat Pembayaran Tunai (Petugas & Kantor)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Pencatatan setoran langsung dari warga di lapangan atau loket kantor BUMDes. Sistem akan langsung menerbitkan kuitansi digital sah.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Step 1: Cari Pelanggan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-xs">1</div>
            <span>Cari Data Pelanggan</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ketik nama atau ID (PLG-RW...)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Quick results */}
          {search.trim().length > 0 && (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">Tidak ada pelanggan ditemukan</div>
              ) : (
                filteredCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setSelectedBillId('');
                    }}
                    className={`w-full text-left p-3 hover:bg-brand-50/60 transition flex items-center justify-between text-xs ${
                      selectedCustomer?.id === cust.id ? 'bg-brand-50 border-l-4 border-brand-600' : ''
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-500">{cust.address}</div>
                    </div>
                    <span className="font-mono text-brand-700 font-bold text-[11px]">{cust.customerCode}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected Customer Card */}
          {selectedCustomer && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div className="text-[10px] uppercase font-bold text-emerald-800">Pelanggan Terpilih</div>
              <div className="font-black text-slate-900 text-sm mt-0.5">{selectedCustomer.name}</div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">{selectedCustomer.customerCode} • {selectedCustomer.phone || 'Tanpa HP'}</div>
              <div className="text-xs text-slate-500 mt-1">{selectedCustomer.address}</div>
            </div>
          )}
        </div>

        {/* Step 2: Pilih Tagihan & Catat Setoran */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-xs">2</div>
            <span>Pilih Periode & Konfirmasi</span>
          </div>

          {!selectedCustomer ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Pilih pelanggan di samping terlebih dahulu untuk menampilkan tagihan yang belum lunas.
            </div>
          ) : customerBills.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl p-4">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
              <div className="font-bold">Semua Tagihan Sudah Lunas!</div>
              <p className="text-[11px] text-emerald-600 mt-0.5">Pelanggan ini tidak memiliki tagihan tertunggak.</p>
            </div>
          ) : (
            <form onSubmit={handleConfirmCashPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1.5">
                  Pilih Tagihan yang Dibayarkan
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerBills.map((bill) => (
                    <label
                      key={bill.id}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        selectedBillId === bill.id
                          ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="billSelection"
                          checked={selectedBillId === bill.id}
                          onChange={() => setSelectedBillId(bill.id)}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <div className="font-bold text-slate-900">
                            {dataService.formatMonthName(bill.billingMonth, bill.billingYear)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {bill.serviceName} • Jatuh tempo: {bill.dueDate}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-brand-900">
                          Rp {bill.amount.toLocaleString('id-ID')}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          bill.status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {bill.status}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedBill && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-500">Total Diterima Tunai:</span>
                    <span className="font-black text-brand-800 text-sm">
                      Rp {selectedBill.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Petugas Penerima:</span>
                    <span className="text-slate-700">{currentUser.fullName}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Misal: Diterima uang pas saat penarikan sampah pagi"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedBillId || processing}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>{processing ? 'Mencatat...' : 'Konfirmasi & Terbitkan Struk'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Digital Receipt Modal with Confetti */}
      <ReceiptModal
        receipt={generatedReceipt}
        onClose={() => setGeneratedReceipt(null)}
        triggerConfetti={true}
      />
    </div>
  );
};
