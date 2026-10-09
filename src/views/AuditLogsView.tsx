import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { AuditLog } from '../types';
import { Shield, Search, Filter, Clock, Eye, AlertCircle } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const logs = dataService.getAuditLogs();
  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort();

  const filteredLogs = logs.filter(l => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        (l.userName || '').toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterAction !== 'ALL' && l.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand-600" />
          <span>Audit Log Aktivitas Sistem (PRD Section 127)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Seluruh aktivitas krusial (login, verifikasi, reminder WhatsApp, reset PIN, perubahan tarif/rekening) tercatat permanen.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari user, nama aksi, entitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700"
        >
          <option value="ALL">Semua Tipe Aksi</option>
          {uniqueActions.map(act => <option key={act} value={act}>{act}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Waktu Kejadian</th>
                <th className="py-2.5 px-3">Pengguna / Aktor</th>
                <th className="py-2.5 px-3">Aksi Sistem</th>
                <th className="py-2.5 px-3">Entitas</th>
                <th className="py-2.5 px-3 text-right">Rincian Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition font-sans">
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{log.userName || log.userId}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[11px] font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-600">{log.entityType}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Lihat JSON</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-900">Rincian Audit Log: {selectedLog.action}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl text-xs font-mono overflow-auto max-h-80 whitespace-pre-wrap">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
