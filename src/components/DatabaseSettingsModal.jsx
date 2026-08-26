import React, { useState } from 'react';
import {
  X,
  Database,
  Cloud,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Wifi,
  Smartphone,
  Laptop
} from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured, saveCustomSupabaseConfig } from '../lib/supabaseClient';

export default function DatabaseSettingsModal({
  isOpen,
  onClose,
  property,
  syncStatus = {},
  onForceSync
}) {
  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState(supabaseUrl);
  const [customKey, setCustomKey] = useState(supabaseAnonKey);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);

  if (!isOpen) return null;

  const isConnected = syncStatus.status === 'connected';
  const devicesCount = syncStatus.connectedDevicesCount || 1;

  const tables = [
    { name: 'properties', count: '2 (Multi-Tenant)', desc: 'Properties directory & Kerala GSTIN configuration' },
    { name: 'rooms', count: '11 Rooms', desc: 'Room inventory, status pulses, and WiFi voucher codes' },
    { name: 'guests', count: '5 Guests', desc: 'Guest CRM, phone index, and Aadhaar/Passport photo URLs' },
    { name: 'bookings', count: '6 Records', desc: 'Stay folios, AC/Non-AC tariffs, and advance deposits' },
    { name: 'invoices', count: '4 Billed', desc: 'Itemized Kerala GST tax invoices and settled balances' },
    { name: 'expenses', count: '5 Entries', desc: 'Categorical operating expenses and monthly P&L ledger' },
    { name: 'staff_members', count: '4 Profiles', desc: 'Staff credentials, roles, bcrypt PIN hashes, and shifts' },
    { name: 'audit_logs', count: '6 Events', desc: 'Immutable security and operations audit trail' }
  ];

  const handleSaveConfig = () => {
    saveCustomSupabaseConfig(customUrl, customKey);
    setSaveSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleTriggerSync = () => {
    setSyncingNow(true);
    if (typeof onForceSync === 'function') {
      onForceSync();
    }
    setTimeout(() => {
      setSyncingNow(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass shrink-0 hidden sm:flex">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                Cloud Sync & Multi-Device Linking
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                Reception Laptop ↔ Owner Mobile Real-Time Engine
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
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Active Real-Time Link Card */}
          <div className="p-4 bg-ink rounded-xl border border-brass-soft/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-signal-green shadow-md shadow-signal-green animate-pulse' : 'bg-signal-amber'}`} />
                <span className="font-display font-bold text-white text-sm">
                  {isConnected ? 'Real-Time Cloud Synchronization Active' : 'Local Standby Mode (Auto-Syncing)'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={syncingNow}
                className="px-3 py-1.5 rounded-lg bg-brass text-ink font-mono font-bold text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingNow ? 'animate-spin' : ''}`} />
                <span>{syncingNow ? 'Broadcasting...' : 'Force Sync Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-1">
              <div className="p-2 bg-panel rounded-lg border border-brass-soft/20 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-brass shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">Reception Desk</div>
                  <div className="text-white font-bold">Linked</div>
                </div>
              </div>

              <div className="p-2 bg-panel rounded-lg border border-brass-soft/20 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-signal-green shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">Owner Mobile</div>
                  <div className="text-white font-bold">Linked</div>
                </div>
              </div>

              <div className="p-2 bg-panel rounded-lg border border-brass-soft/20 flex items-center gap-2 col-span-2 sm:col-span-1">
                <Wifi className="w-4 h-4 text-signal-amber shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">Active Sessions</div>
                  <div className="text-white font-bold">{devicesCount} {devicesCount === 1 ? 'Device' : 'Devices'}</div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              When the receptionist updates room bookings, folios, or cash/UPI collections on the desk computer, all changes reflect on your mobile phone in real-time.
            </p>
          </div>

          {/* Cloud Database Credentials (Supabase) */}
          <div className="p-4 bg-panel rounded-xl border border-brass-soft/30 space-y-3 font-mono">
            <div className="flex items-center justify-between text-brass text-[11px] uppercase font-bold">
              <span>Cloud Database Connection (Supabase)</span>
              <span className="text-slate-400 font-normal">Project Settings</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brass font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Supabase Public Anon Key</label>
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brass font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-sans">
                {saveSuccess ? '✓ Saved! Reloading app...' : 'Paste your Supabase credentials to link both devices instantly.'}
              </span>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-1.5 rounded-lg bg-signal-green text-ink font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow"
              >
                Save & Connect
              </button>
            </div>
          </div>

          {/* PostgreSQL Relational Tables Matrix */}
          <div className="space-y-2 font-mono">
            <div className="flex items-center justify-between text-brass text-[11px] uppercase font-bold border-b border-brass-soft/20 pb-1">
              <span>Relational Database Tables</span>
              <span className="text-slate-400 font-normal">supabase/schema.sql</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tables.map((t, idx) => (
                <div key={idx} className="p-2 bg-ink rounded-lg border border-brass-soft/20 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{t.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-brass/20 text-brass">
                      {t.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-tight">
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Sticky Close Button */}
        <div className="sm:hidden p-3 bg-panel border-t border-brass-soft/30 pb-safe-mobile shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-ink border border-brass text-brass font-mono font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Close Database Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
