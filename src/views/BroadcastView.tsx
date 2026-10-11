import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Broadcast, TargetType } from '../types';
import { Radio, Plus, MessageSquare, Send, Users, CheckCircle2 } from 'lucide-react';

export const BroadcastView: React.FC = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(dataService.getBroadcasts());
  const regions = dataService.getRegions();
  const categories = dataService.getCategories();
  const uniqueRWs = Array.from(new Set(regions.map(r => r.rwCode))).sort();

  // Create Broadcast Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('ALL');
  const [targetRW, setTargetRW] = useState('RW 01');
  const [targetCategory, setTargetCategory] = useState(categories[0]?.id || 'cat-1');

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Judul dan pesan wajib diisi.');
      return;
    }

    try {
      let targetFilter: Record<string, any> = {};
      if (targetType === 'RW') {
        targetFilter = { rw: targetRW };
      } else if (targetType === 'CATEGORY') {
        const cat = categories.find(c => c.id === targetCategory);
        targetFilter = {
          categoryId: targetCategory,
          categoryName: cat ? cat.name : 'Rumah Tangga'
        };
      }

      dataService.sendBroadcast(
        title.trim(),
        message.trim(),
        targetType,
        targetFilter,
        currentUser
      );
      setBroadcasts(dataService.getBroadcasts());
      setModalOpen(false);
      setTitle('');
      setMessage('');
      alert('Broadcast pengumuman berhasil disiarkan ke warga!');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim broadcast');
    }
  };

  const renderTargetBadge = (bc: Broadcast) => {
    if (bc.targetType === 'ALL' || !bc.targetType) {
      return (
        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100">
          Target: Semua Warga
        </span>
      );
    }
    if (bc.targetType === 'RW') {
      return (
        <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
          Target: {bc.targetFilter?.rw || 'Wilayah RW'}
        </span>
      );
    }
    if (bc.targetType === 'CATEGORY') {
      const catName = bc.targetFilter?.categoryName ||
        categories.find(c => c.id === bc.targetFilter?.categoryId)?.name ||
        'Kategori';
      return (
        <span className="bg-purple-50 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-100">
          Target: Kategori {catName}
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
        Target: {bc.targetType}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Broadcast Pengumuman Warga
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kirimkan informasi penting (jadwal truk sampah, pengumuman kerja bakti, dsb) langsung ke dasbor warga.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Siaran Baru</span>
        </button>
      </div>

      {/* Broadcasts List */}
      <div className="space-y-3.5">
        {broadcasts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            Belum ada siaran pengumuman yang diterbitkan.
          </div>
        ) : (
          broadcasts.map(bc => (
            <div key={bc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{bc.title}</span>
                  {renderTargetBadge(bc)}
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(bc.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {bc.message}
              </p>

              <div className="text-[11px] text-slate-400 pt-1">
                Disiarkan oleh: <strong className="text-slate-700">{bc.createdByName}</strong>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Broadcast Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6">
            <h3 className="font-bold text-base text-slate-900 mb-1">Buat Siaran Pengumuman Baru</h3>
            <p className="text-xs text-slate-500 mb-4">Pengumuman akan langsung tampil di beranda aplikasi warga.</p>

            <form onSubmit={handleCreateBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Perubahan Jam Pengambilan Sampah Dusun Makmur"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Sasaran Penerima (Target)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="ALL">Semua Pelanggan</option>
                    <option value="RW">Wilayah RW Tertentu</option>
                    <option value="CATEGORY">Kategori Pelanggan Tertentu</option>
                  </select>

                  {targetType === 'RW' && (
                    <select
                      value={targetRW}
                      onChange={(e) => setTargetRW(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    >
                      {uniqueRWs.map(rw => <option key={rw} value={rw}>{rw}</option>)}
                    </select>
                  )}

                  {targetType === 'CATEGORY' && (
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {targetType === 'CATEGORY' && (
                  <p className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-100 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                    <span>Pengumuman hanya akan diterima oleh pelanggan dengan kategori <strong>{categories.find(c => c.id === targetCategory)?.name || 'terpilih'}</strong>.</span>
                  </p>
                )}
                {targetType === 'RW' && (
                  <p className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100 mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <span>Pengumuman hanya akan diterima oleh warga yang berada di wilayah <strong>{targetRW}</strong>.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Isi Pesan Pengumuman</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ketik informasi pengumuman untuk warga di sini..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Siarkan Pengumuman</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
