import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function ShiftHandoverModal({
  isOpen,
  onClose,
  currentShift,
  shiftLogs,
  stats,
  onCloseShiftHandover,
  property
}) {
  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const [activeTab, setActiveTab] = useState('close'); // 'close' | 'history' | 'summary'
  const [physicalCash, setPhysicalCash] = useState(stats.cashRevenue || currentShift.openingCash);
  const [nextStaffName, setNextStaffName] = useState('Suresh Babu');
  const [handoverNotes, setHandoverNotes] = useState(
    'All check-ins verified. Room 205 Linen change underway by Babu. Cash drawer reconciled.'
  );
  const [completed, setCompleted] = useState(false);

  const expectedCash = stats.cashRevenue || currentShift.openingCash;
  const discrepancy = Number(physicalCash) - Number(expectedCash);

  const handleExecuteClose = (e) => {
    e.preventDefault();
    onCloseShiftHandover({
      physicalCash: Number(physicalCash),
      handoverNotes,
      nextShiftStaff: nextStaffName
    });
    setCompleted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const lastShift = shiftLogs[0] || null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        {/* Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3.5 bg-panel border-b border-brass-soft/30 flex items-center justify-between modal-header-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-ink hover:bg-panel text-brass hover:text-white border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
              title="Close modal"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass font-display font-bold text-base sm:text-lg shrink-0 hidden sm:flex">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                Shift Handover & Cash Tally
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                {currentShift.name} • {currentShift.staffName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-5 pt-3 bg-panel/50 border-b border-brass-soft/20 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('close')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'close'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>End Shift & Count Cash</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Incoming Shift Handover Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Past Handover Logs ({shiftLogs.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: CLOSE SHIFT */}
          {activeTab === 'close' && (
            <div className="space-y-4">
              {completed ? (
                <div className="p-8 bg-panel text-center space-y-2 rounded-xl border border-signal-green">
                  <CheckCircle2 className="w-10 h-10 text-signal-green mx-auto" />
                  <h3 className="font-display font-bold text-lg text-white">
                    Shift Closed & Handed Over to {nextStaffName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Cash drawer verified and logged in immutable audit register.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleExecuteClose} className="space-y-4">
                  {/* Shift Stats Card */}
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="bg-ink p-3 rounded-xl border border-brass-soft/30">
                      <span className="text-[10px] text-slate-400 uppercase block">Expected Cash in Drawer</span>
                      <span className="font-bold text-signal-green text-base">
                        {formatCurrency(expectedCash)}
                      </span>
                    </div>

                    <div className="bg-ink p-3 rounded-xl border border-brass-soft/30">
                      <span className="text-[10px] text-slate-400 uppercase block">Total Shift Revenue</span>
                      <span className="font-bold text-brass text-base">
                        {formatCurrency(stats.totalRevenueToday)}
                      </span>
                    </div>
                  </div>

                  {/* Physical Cash Count */}
                  <div className="bg-panel p-3.5 rounded-xl border border-brass-soft/30 space-y-2">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                      Physical Cash Counted in Drawer (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={physicalCash}
                      onChange={(e) => setPhysicalCash(e.target.value)}
                      className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-2 text-white font-mono font-bold text-base focus:border-brass"
                    />

                    {/* Discrepancy Status Pill */}
                    <div className={`p-2 rounded text-xs font-mono flex items-center justify-between ${
                      discrepancy === 0
                        ? 'bg-signal-green/15 text-signal-green border border-signal-green/30'
                        : 'bg-signal-red/15 text-signal-red border border-signal-red/30'
                    }`}>
                      <span>Discrepancy:</span>
                      <span className="font-bold">
                        {discrepancy === 0 ? '₹0 (Exact Balance Match)' : formatCurrency(discrepancy)}
                      </span>
                    </div>
                  </div>

                  {/* Next Shift Receptionist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">
                        Incoming Receptionist / Lead *
                      </label>
                      <select
                        value={nextStaffName}
                        onChange={(e) => setNextStaffName(e.target.value)}
                        className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-2 text-white text-xs"
                      >
                        <option value="Suresh Babu">Suresh Babu (Day Shift)</option>
                        <option value="Anoop Nair">Anoop Nair (Night Auditor)</option>
                        <option value="Meera Thomas">Meera Thomas (Evening Shift)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 block">
                        Handover Timestamp
                      </label>
                      <input
                        type="text"
                        disabled
                        value={new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'}
                        className="w-full bg-ink border border-brass-soft/30 rounded-lg px-3 py-2 text-slate-400 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Handover Notes */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block">
                      Shift Handover Notes & Instructions for Next Receptionist *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      className="w-full bg-ink border border-brass-soft/40 rounded-lg p-2.5 text-white text-xs focus:border-brass"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-lg bg-panel border border-brass-soft/30 text-slate-300 hover:text-white font-bold text-xs transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-lg bg-brass text-ink font-bold text-xs shadow-lg shadow-brass/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Cash & Handover Shift</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: INCOMING SHIFT SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-3">
              {lastShift ? (
                <div className="bg-ink p-4 rounded-xl border border-brass-soft/30 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-brass-soft/20 pb-2">
                    <span className="font-bold text-brass">{lastShift.shift_name}</span>
                    <span className="text-slate-400 text-[11px]">{lastShift.date}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>Outgoing Lead: <span className="text-white font-bold">{lastShift.staff_name}</span></div>
                    <div>Physical Cash Counted: <span className="text-signal-green font-bold">{formatCurrency(lastShift.physical_cash_confirmed)}</span></div>
                    <div>Check-ins: <span className="text-slate-200">{lastShift.rooms_checked_in} Rooms</span></div>
                    <div>Checkouts Billed: <span className="text-slate-200">{lastShift.rooms_checked_out} Rooms</span></div>
                  </div>

                  <div className="bg-panel p-2.5 rounded-lg border border-brass-soft/20 text-slate-300 font-sans text-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Handover Notes:</span>
                    "{lastShift.handover_notes}"
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400">
                  No previous shift handover recorded.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAST LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-2 font-mono text-xs">
              {shiftLogs.map(log => (
                <div key={log.id} className="p-3 bg-ink rounded-xl border border-brass-soft/30 space-y-1">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-bold text-brass">{log.shift_name}</span>
                    <span className="text-[10px] text-slate-400">{log.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Staff: <span className="text-slate-200">{log.staff_name}</span> • Cash Drawer: <span className="text-signal-green font-bold">{formatCurrency(log.physical_cash_confirmed)}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans italic pt-1 border-t border-brass-soft/10">
                    "{log.handover_notes}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
