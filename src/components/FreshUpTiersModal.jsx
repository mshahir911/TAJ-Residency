import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Coins,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import { DEFAULT_FRESH_UP_TIERS } from '../types/data';
import { formatCurrency } from '../utils/formatters';

export default function FreshUpTiersModal({
  isOpen,
  onClose,
  tiers = DEFAULT_FRESH_UP_TIERS,
  onSaveTiers
}) {
  const [localTiers, setLocalTiers] = useState(tiers);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalTiers(Array.isArray(tiers) && tiers.length > 0 ? tiers : DEFAULT_FRESH_UP_TIERS);
  }, [tiers]);

  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUpdateTier = (id, field, value) => {
    setLocalTiers(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, [field]: field === 'label' ? value : Number(value) || 0 };
      }
      return t;
    }));
    setIsSaved(false);
  };

  const handleAddTier = () => {
    const newTier = {
      id: `tier-${Date.now().toString().slice(-4)}`,
      minPeople: 1,
      maxPeople: 5,
      ratePerPerson: 150,
      label: 'Custom Group Tier'
    };
    setLocalTiers(prev => [...prev, newTier]);
    setIsSaved(false);
  };

  const handleDeleteTier = (id) => {
    if (localTiers.length <= 1) return;
    setLocalTiers(prev => prev.filter(t => t.id !== id));
    setIsSaved(false);
  };

  const handleResetDefaults = () => {
    setLocalTiers(DEFAULT_FRESH_UP_TIERS);
    setIsSaved(false);
  };

  const handleSave = () => {
    if (typeof onSaveTiers === 'function') {
      onSaveTiers(localTiers);
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border border-brass/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="shrink-0 p-3.5 sm:p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-ink hover:bg-panel text-brass border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-signal-green"></span>
                <h2 className="font-display font-bold text-white text-base sm:text-lg leading-tight truncate">
                  Fresh-Up / Day-Use Tiered Rates
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Owner Pricing Settings &bull; Per-Person Group Rate Slabs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-mono">
          
          <div className="p-3 bg-ink/70 border border-brass-soft/30 rounded-xl space-y-1">
            <div className="text-brass font-bold flex items-center gap-1.5 uppercase text-[11px]">
              <Users className="w-3.5 h-3.5" />
              <span>How Fresh-Up Pricing Works</span>
            </div>
            <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
              When bus or group travelers book a room for 1–4 hours to freshen up, the system multiplies the group size by the applicable per-person rate slab below.
            </p>
          </div>

          {/* Tiers List */}
          <div className="space-y-3">
            {localTiers.map((tier, idx) => (
              <div
                key={tier.id || idx}
                className="p-3.5 rounded-xl bg-panel border border-brass-soft/40 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <input
                    type="text"
                    value={tier.label || ''}
                    onChange={(e) => handleUpdateTier(tier.id, 'label', e.target.value)}
                    className="bg-ink border border-brass-soft/40 rounded-lg px-2 py-1 text-white font-bold text-xs focus:outline-none focus:border-brass flex-1 min-w-[140px]"
                    placeholder="Tier Name"
                  />
                  <div className="flex items-center gap-1">
                    {localTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(tier.id)}
                        className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                        title="Remove Tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block mb-1">Min Pax:</label>
                    <input
                      type="number"
                      min="1"
                      value={tier.minPeople}
                      onChange={(e) => handleUpdateTier(tier.id, 'minPeople', e.target.value)}
                      className="w-full bg-ink border border-brass-soft/40 rounded-lg px-2 py-1 text-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block mb-1">Max Pax:</label>
                    <input
                      type="number"
                      min={tier.minPeople}
                      value={tier.maxPeople || ''}
                      onChange={(e) => handleUpdateTier(tier.id, 'maxPeople', e.target.value)}
                      className="w-full bg-ink border border-brass-soft/40 rounded-lg px-2 py-1 text-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block mb-1">Rate / Person:</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1 text-brass font-bold">₹</span>
                      <input
                        type="number"
                        min="10"
                        step="10"
                        value={tier.ratePerPerson}
                        onChange={(e) => handleUpdateTier(tier.id, 'ratePerPerson', e.target.value)}
                        className="w-full bg-ink border border-brass-soft/40 rounded-lg pl-6 pr-2 py-1 text-brass text-right font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddTier}
              className="flex items-center gap-1 text-xs text-brass hover:underline font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Slab</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 bg-panel border-t border-brass-soft/30 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            {isSaved && (
              <span className="text-signal-green font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved successfully!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-ink text-slate-300 hover:text-white font-mono text-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-brass text-ink font-mono font-bold text-xs shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
