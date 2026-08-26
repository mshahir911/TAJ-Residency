import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Clock,
  Filter,
  UserCheck,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function AuditTrailView({ auditLogs, property, onBackToGrid }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (log.target && log.target.toLowerCase().includes(q)) ||
      (log.staff_name && log.staff_name.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q))
    );
  });

  const actionsList = [
    'all',
    'BOOKING_CREATED',
    'CHECKOUT_BILLED',
    'HOUSEKEEPING_ADVANCE',
    'SHIFT_HANDOVER',
    'GST_CONFIG_UPDATE'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-panel border border-brass-soft/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brass/20 text-brass text-[10px] font-mono font-bold uppercase tracking-wider border border-brass/30 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              OWNER ROLE PRIVILEGED AUDIT TRAIL
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            Immutable Operations & Dispute Audit Register
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {property.name} • Every booking edit, tariff calculation, cash handover, and turnover stage logged with staff ID & timestamp.
          </p>
        </div>

        {/* Action Controls & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onBackToGrid && (
            <button
              onClick={onBackToGrid}
              className="px-3.5 py-2 rounded-xl bg-panel-raised border border-brass-soft/40 text-slate-300 hover:text-white font-bold text-xs font-mono transition-all shrink-0"
            >
              ← Room Grid
            </button>
          )}

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-brass absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by staff, room, or action details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-ink border border-brass-soft/50 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder-slate-500 focus:border-brass font-sans"
            />
          </div>
        </div>
      </div>

      {/* Action Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-[11px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-brass" /> Filter:
        </span>
        {actionsList.map(act => (
          <button
            key={act}
            onClick={() => setActionFilter(act)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              actionFilter === act
                ? 'bg-brass text-ink font-bold shadow-md'
                : 'bg-panel border border-brass-soft/30 text-slate-300 hover:text-white'
            }`}
          >
            {act === 'all' ? 'All Events' : act}
          </button>
        ))}
      </div>

      {/* Immutable Logs Table */}
      <div className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-xl">
        <div className="bg-ink rounded-xl border border-brass-soft/30 overflow-hidden font-mono text-xs">
          <table className="w-full text-left">
            <thead className="bg-panel-raised text-[10px] uppercase text-slate-400 border-b border-brass-soft/20">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Staff Role & Name</th>
                <th className="p-3">Action Code</th>
                <th className="p-3">Target</th>
                <th className="p-3">Immutable Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brass-soft/10">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-panel/40 transition-colors">
                  <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3">
                    <div className="font-sans font-medium text-white">{log.staff_name}</div>
                    <div className="text-[10px] text-brass-soft">{log.staff_role}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-panel-raised text-[10px] font-bold text-brass border border-brass-soft/30">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-white whitespace-nowrap">{log.target}</td>
                  <td className="p-3 text-slate-300 font-sans text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
