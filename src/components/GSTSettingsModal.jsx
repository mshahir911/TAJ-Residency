import React, { useState, useEffect } from 'react';
import {
  X,
  Percent,
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Coins,
  ArrowLeft
} from 'lucide-react';
import { DEFAULT_GST_CONFIG } from '../types/data';

/**
 * GSTSettingsModal
 * Allows Owners & Managers to configure legal GST compliance settings:
 * 1. GSTIN (15-character Goods and Services Tax Identification Number)
 * 2. Legal Business Entity Name & Jurisdiction
 * 3. SAC Code (996311 - Hotel Accommodation Services)
 * 4. GST Slabs (Standard Rate 12% vs Luxury Rate 18% based on tariff threshold)
 */
export default function GSTSettingsModal({
  isOpen,
  onClose,
  gstConfig = DEFAULT_GST_CONFIG,
  property = {},
  onSaveGSTSettings
}) {
  const [gstNumber, setGstNumber] = useState(property?.gst_number || '');
  const [legalEntity, setLegalEntity] = useState(gstConfig?.legalEntity || property?.name || 'Taj Residency Tourist Home Pvt Ltd');
  const [jurisdiction, setJurisdiction] = useState(gstConfig?.jurisdiction || `${property?.city || 'Kozhikode'}, ${property?.state || 'Kerala'} (State 32)`);
  const [sacCode, setSacCode] = useState(gstConfig?.sacCode || '996311');
  const [slabThreshold, setSlabThreshold] = useState(gstConfig?.slabThreshold || 7500);
  const [standardRate, setStandardRate] = useState(gstConfig?.standardRate || 12);
  const [luxuryRate, setLuxuryRate] = useState(gstConfig?.luxuryRate || 18);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync with current props when opened
  useEffect(() => {
    if (isOpen) {
      setGstNumber(property?.gst_number || '');
      setLegalEntity(gstConfig?.legalEntity || property?.name || 'Taj Residency Tourist Home Pvt Ltd');
      setJurisdiction(gstConfig?.jurisdiction || `${property?.city || 'Kozhikode'}, ${property?.state || 'Kerala'} (State 32)`);
      setSacCode(gstConfig?.sacCode || '996311');
      setSlabThreshold(gstConfig?.slabThreshold || 7500);
      setStandardRate(gstConfig?.standardRate || 12);
      setLuxuryRate(gstConfig?.luxuryRate || 18);
      setSavedSuccess(false);
    }
  }, [isOpen, property, gstConfig]);

  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSaveGSTSettings === 'function') {
      onSaveGSTSettings({
        gstNumber: gstNumber.trim().toUpperCase(),
        legalEntity: legalEntity.trim(),
        jurisdiction: jurisdiction.trim(),
        sacCode: sacCode.trim(),
        slabThreshold: Number(slabThreshold) || 7500,
        standardRate: Number(standardRate) || 12,
        luxuryRate: Number(luxuryRate) || 18
      });
    }
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const isGstConfigured = Boolean(gstNumber && gstNumber.trim().length >= 10);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass font-display font-bold text-base sm:text-lg shadow-md shadow-brass/20 shrink-0 hidden sm:flex">
              <Percent className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                  GST & Tax Setup
                </h2>
                {isGstConfigured ? (
                  <span className="px-1.5 py-0.5 rounded bg-signal-green/15 text-signal-green text-[9px] font-mono font-bold border border-signal-green/30 shrink-0">
                    Active
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-signal-amber/15 text-signal-amber text-[9px] font-mono font-bold border border-signal-amber/30 shrink-0">
                    Not Configured
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                SAC 996311 • Slabs & Legal Header
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 font-mono text-xs">
          
          {/* Status Alert Banner */}
          {!isGstConfigured ? (
            <div className="p-3 bg-signal-amber/10 border border-signal-amber/30 rounded-xl flex items-start gap-2.5 text-signal-amber">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>GST Number Not Set:</strong> Invoices will display <em>"GST number not configured"</em> until you enter your valid 15-digit GSTIN below.
              </div>
            </div>
          ) : (
            <div className="p-3 bg-signal-green/10 border border-signal-green/30 rounded-xl flex items-start gap-2.5 text-signal-green">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>GST Invoicing Active:</strong> All generated paper & digital invoices will print with GSTIN <strong>{gstNumber}</strong> and SAC <strong>{sacCode}</strong>.
              </div>
            </div>
          )}

          {/* Section 1: Business GSTIN & Legal Identity */}
          <div className="bg-ink p-4 rounded-xl border border-brass-soft/30 space-y-3">
            <div className="text-xs font-bold text-brass uppercase flex items-center gap-1.5 border-b border-brass-soft/20 pb-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Business Tax Identification</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 block font-semibold">
                GSTIN / GST Number (15 Characters) *
              </label>
              <input
                type="text"
                placeholder="e.g. 32AABCT9988Q1Z4"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                maxLength={15}
                className="w-full bg-panel border border-brass-soft rounded-lg px-3 py-2 text-white font-bold tracking-widest text-sm focus:outline-none focus:border-brass"
              />
              <p className="text-[9px] text-slate-500">
                Format: 2-digit State Code (32 for Kerala) + 10-char PAN + 1-digit Entity + 'Z' + 1 Checksum.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 block font-semibold">
                  Legal Entity / Trade Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Taj Residency Tourist Home Pvt Ltd"
                  value={legalEntity}
                  onChange={(e) => setLegalEntity(e.target.value)}
                  className="w-full bg-panel border border-brass-soft/50 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 block font-semibold">
                  Tax Jurisdiction & State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kozhikode, Kerala (State 32)"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full bg-panel border border-brass-soft/50 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                />
              </div>
            </div>
          </div>

          {/* Section 2: SAC Code & GST Slabs */}
          <div className="bg-ink p-4 rounded-xl border border-brass-soft/30 space-y-3">
            <div className="text-xs font-bold text-brass uppercase flex items-center gap-1.5 border-b border-brass-soft/20 pb-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>Service Accounting Code (SAC) & Rate Slabs</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-400 block font-semibold">
                Services Accounting Code (SAC)
              </label>
              <input
                type="text"
                value={sacCode}
                onChange={(e) => setSacCode(e.target.value)}
                className="w-full bg-panel border border-brass-soft/50 rounded-lg px-3 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-brass"
              />
              <span className="text-[9px] text-slate-500">
                Default <strong>996311</strong> is the official Indian GST SAC code for Hotel Room Accommodation Services.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 block font-semibold">
                  Standard Rate (≤ ₹{slabThreshold})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={standardRate}
                    onChange={(e) => setStandardRate(Number(e.target.value))}
                    className="w-full bg-panel border border-brass-soft/50 rounded-lg px-3 py-1.5 text-signal-green font-bold text-xs pr-7 focus:outline-none focus:border-brass"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-400 font-bold">%</span>
                </div>
                <span className="text-[9px] text-slate-500">
                  CGST: {standardRate / 2}% + SGST: {standardRate / 2}%
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 block font-semibold">
                  Luxury Rate (&gt; ₹{slabThreshold})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={luxuryRate}
                    onChange={(e) => setLuxuryRate(Number(e.target.value))}
                    className="w-full bg-panel border border-brass-soft/50 rounded-lg px-3 py-1.5 text-brass font-bold text-xs pr-7 focus:outline-none focus:border-brass"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-400 font-bold">%</span>
                </div>
                <span className="text-[9px] text-slate-500">
                  CGST: {luxuryRate / 2}% + SGST: {luxuryRate / 2}%
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-slate-400 block font-semibold">
                  Slab Threshold (₹)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={slabThreshold}
                  onChange={(e) => setSlabThreshold(Number(e.target.value))}
                  className="w-full bg-panel border border-brass-soft/50 rounded-lg px-3 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-brass"
                />
                <span className="text-[9px] text-slate-500">
                  Cutoff tariff per night
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-brass-soft/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-panel border border-brass-soft/30 text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-brass text-ink font-bold text-xs hover:brightness-110 shadow-lg shadow-brass/20 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-ink" />
                  <span>GST Settings Saved!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Save GST Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
