import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Trash2, Calendar, CheckCircle2, AlertTriangle, Sparkles, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function SeasonalOverrideModal({
  isOpen,
  onClose,
  seasonalOverrides = [],
  onAddOverride,
  onDeleteOverride,
  roomTypes = {},
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

  const [name, setName] = useState('Monsoon Malabar Getaway');
  const [startDate, setStartDate] = useState('2026-08-15');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [roomTypeId, setRoomTypeId] = useState('deluxe');
  const [overrideAcRate, setOverrideAcRate] = useState(2600);
  const [overrideNonAcRate, setOverrideNonAcRate] = useState(1900);
  const [reason, setReason] = useState('Festival tourist compression & holiday surge');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddOverride({
      name,
      startDate,
      endDate,
      roomTypeId,
      overrideAcRate,
      overrideNonAcRate,
      reason
    });
    setName('');
    setReason('');
  };

  const roomTypeKeys = Object.keys(roomTypes);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        {/* Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 p-3 sm:p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between pt-safe">
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass shrink-0 hidden sm:flex">
              <Tag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                Rate Overrides
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                {property.name} • Temporary date-bound pricing
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

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Create New Override Form */}
          <form onSubmit={handleSubmit} className="bg-ink p-4 rounded-xl border border-brass-soft/30 space-y-3">
            <div className="text-[11px] font-mono text-brass uppercase font-bold border-b border-brass-soft/20 pb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Define Date-Bound Surge / Discount Rule</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Season / Event Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Onam Festival Peak Surge"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Target Room Type *</label>
                <select
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                >
                  {roomTypeKeys.map(k => (
                    <option key={k} value={k}>
                      {roomTypes[k]?.name || k} (Base: ₹{roomTypes[k]?.ac_rate} AC)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Override AC Rate (₹) *</label>
                <input
                  type="number"
                  required
                  value={overrideAcRate}
                  onChange={(e) => setOverrideAcRate(e.target.value)}
                  className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block">Override Non-AC Rate (₹) *</label>
                <input
                  type="number"
                  required
                  value={overrideNonAcRate}
                  onChange={(e) => setOverrideNonAcRate(e.target.value)}
                  className="w-full bg-panel border border-brass-soft rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400 block">Pricing Rationale / Note</label>
              <input
                type="text"
                placeholder="e.g. Exhibitor block booking demand"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-panel border border-brass-soft/40 rounded-lg px-2.5 py-1.5 text-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-lg shadow-brass/20 active:scale-95 transition-all flex items-center justify-center gap-2 font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Dynamic Seasonal Rule</span>
            </button>
          </form>

          {/* Active Overrides Register */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
              Active Seasonal Overrides ({seasonalOverrides.length})
            </div>

            {seasonalOverrides.length === 0 ? (
              <div className="p-6 text-center bg-ink rounded-xl border border-brass-soft/20 text-slate-400">
                No active seasonal overrides configured. Base rate table active.
              </div>
            ) : (
              <div className="space-y-2">
                {seasonalOverrides.map(ovr => (
                  <div
                    key={ovr.id}
                    className="p-3 bg-ink rounded-xl border border-brass-soft/30 flex items-center justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-white text-sm">
                          {ovr.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-brass/20 text-brass font-bold">
                          {ovr.room_type_id?.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {ovr.start_date} → {ovr.end_date} • Rates: <strong className="text-signal-green">₹{ovr.override_ac_rate} AC</strong> / <strong className="text-slate-200">₹{ovr.override_non_ac_rate} Non-AC</strong>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans italic mt-0.5">
                        "{ovr.reason}"
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteOverride(ovr.id)}
                      className="w-8 h-8 rounded-lg bg-panel hover:bg-signal-red/20 text-slate-400 hover:text-signal-red flex items-center justify-center border border-brass-soft/30 transition-colors"
                      title="Delete Override"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
