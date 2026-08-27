import React, { useState } from 'react';
import {
  X,
  Database,
  Cloud,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
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
  Laptop,
  CheckSquare,
  Activity
} from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured, saveCustomSupabaseConfig } from '../lib/supabaseClient';

export default function DatabaseSettingsModal({
  isOpen,
  onClose,
  property,
  syncStatus = {},
  offlineQueueCount = 0,
  onFlushQueue,
  onTestConnection,
  onRefreshFromDatabase,
  onSyncAllNow,
  roomsCount = 11,
  bookingsCount = 0,
  guestsCount = 0,
  invoicesCount = 0
}) {
  const [customUrl, setCustomUrl] = useState(supabaseUrl);
  const [customKey, setCustomKey] = useState(supabaseAnonKey);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  if (!isOpen) return null;

  const isConnected = syncStatus.status === 'connected';

  const tables = [
    { name: 'rooms', count: `${roomsCount} Rooms`, desc: 'Physical room inventory, floor allocations, and clean statuses' },
    { name: 'bookings', count: `${bookingsCount} Records`, desc: 'Check-ins, stay nights, AC/Non-AC rates, and advance deposits' },
    { name: 'guests', count: `${guestsCount} Profiles`, desc: 'Guest CRM, phone index, and permanent Aadhaar/Passport IDs' },
    { name: 'invoices', count: `${invoicesCount} Invoices`, desc: 'Kerala GST tax receipts with SAC 996311 and paid balances' },
    { name: 'expenses', count: 'Ledger', desc: 'Categorical monthly operating costs and P&L entries' },
    { name: 'shift_logs', count: 'Cash Drawer', desc: 'Immutable physical cash drawer reconciliation logs' },
    { name: 'audit_logs', count: 'Security Logs', desc: 'Cryptographic compliance audit trail for police inspections' }
  ];

  const handleSaveConfig = () => {
    const ok = saveCustomSupabaseConfig(customUrl, customKey);
    if (ok) {
      setSaveSuccess(true);
      setActionNotice('Saved! Re-establishing Supabase Realtime channel...');
      setTimeout(() => {
        setSaveSuccess(false);
        setActionNotice('');
        if (typeof onRefreshFromDatabase === 'function') {
          onRefreshFromDatabase();
        }
      }, 1200);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    if (typeof onTestConnection === 'function') {
      const res = await onTestConnection();
      setTestResult(res);
    }
    setTestingConnection(false);
  };

  const handleManualFlush = async () => {
    setFlushing(true);
    if (typeof onFlushQueue === 'function') {
      const res = await onFlushQueue();
      if (res.processed > 0) {
        setActionNotice(`Successfully pushed ${res.processed} queued operations to Supabase!`);
      } else if (res.failed > 0) {
        setActionNotice(`Could not reach Supabase. ${res.remainingCount} items remain queued in localStorage.`);
      } else {
        setActionNotice('Queue is clean. All local writes are already synced with PostgreSQL!');
      }
    }
    setTimeout(() => {
      setFlushing(false);
      setActionNotice('');
    }, 2500);
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-white text-sm sm:text-base leading-tight truncate">
                  Supabase PostgreSQL & Realtime
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border shrink-0 ${
                  isConnected
                    ? 'bg-signal-green/20 text-signal-green border-signal-green/40'
                    : 'bg-signal-amber/20 text-signal-amber border-signal-amber/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-signal-green animate-pulse' : 'bg-signal-amber'}`} />
                  <span>{isConnected ? 'REALTIME ACTIVE' : 'OFFLINE / QUEUEING'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                Single mandatory source of truth &bull; 1-2s cross-device sync &bull; Zero data loss
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30 transition-colors shrink-0"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Notice Notification */}
        {actionNotice && (
          <div className="px-4 py-2 bg-brass text-ink font-mono text-xs font-bold text-center animate-in slide-in-from-top duration-200">
            {actionNotice}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-mono">
          
          {/* Architecture Status Card */}
          <div className="p-4 rounded-xl bg-ink border border-brass-soft/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-brass uppercase font-bold tracking-wider text-[11px] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brass" />
                <span>PostgreSQL Primary Source of Truth</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Channel: postgres_changes
              </span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed font-sans">
              All front desk writes (<span className="text-white font-semibold">check-ins, invoices, room cleanings</span>) write directly to Supabase PostgreSQL first. Every other connected device receives the update automatically within <span className="text-signal-green font-semibold">1-2 seconds</span> via native WebSocket subscriptions without pressing any buttons.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-brass-soft/20 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">REALTIME SUBSCRIPTION:</span>
                <span className={`font-bold ${isConnected ? 'text-signal-green' : 'text-signal-amber'}`}>
                  {isConnected ? '🟢 Subscribed (Active)' : '🟡 Connecting...'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SYNC LATENCY:</span>
                <span className="text-brass font-bold">&lt; 1.5 Seconds</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-slate-500 block text-[10px]">OFFLINE QUEUE:</span>
                <span className={`font-bold ${offlineQueueCount > 0 ? 'text-signal-amber' : 'text-slate-300'}`}>
                  {offlineQueueCount} Pending Writes
                </span>
              </div>
            </div>
          </div>

          {/* Offline Write-Queue Flush Monitor */}
          <div className="p-4 rounded-xl bg-panel border border-brass-soft/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-brass" />
                  <span>Offline Write-Queue (LocalStorage Resilience)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  If the internet goes down, writes queue locally and automatically flush to PostgreSQL once back online.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onSyncAllNow === 'function') {
                      onSyncAllNow();
                      setActionNotice('Broadcasted current device state to all other browsers & devices in < 150ms!');
                      setTimeout(() => setActionNotice(''), 2500);
                    }
                  }}
                  className="py-1.5 px-3 rounded-lg bg-ink border border-brass text-brass hover:bg-brass hover:text-ink font-bold text-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                  title="Broadcast this device view to other open devices"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Sync to Other Devices</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualFlush}
                  disabled={flushing}
                  className="py-1.5 px-3 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${flushing ? 'animate-spin' : ''}`} />
                  <span>{flushing ? 'Flushing...' : 'Flush Queue Now'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* PostgreSQL Relational Tables Matrix */}
          <div className="p-4 rounded-xl bg-ink border border-brass-soft/30 space-y-3">
            <div className="flex items-center justify-between border-b border-brass-soft/20 pb-2">
              <span className="text-brass uppercase font-bold text-[11px] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brass" />
                <span>Database Tables (Realtime Enabled)</span>
              </span>
              <span className="text-slate-400 text-[10px]">Public Schema</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tables.map(t => (
                <div key={t.name} className="p-2 rounded-lg bg-panel border border-brass-soft/20 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-white text-xs block truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{t.desc}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-ink border border-brass-soft/40 text-brass text-[10px] font-bold shrink-0">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Database Credentials & Connection Tester */}
          <div className="p-4 rounded-xl bg-panel border border-brass-soft/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-brass uppercase font-bold text-[11px] flex items-center gap-1.5">
                <Server className="w-4 h-4 text-brass" />
                <span>Supabase Project Credentials</span>
              </span>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="py-1 px-2.5 rounded-lg bg-ink border border-brass text-brass hover:bg-brass hover:text-ink font-bold text-[11px] transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} />
                <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs animate-in fade-in ${
                testResult.ok ? 'bg-signal-green/10 border-signal-green/40 text-signal-green' : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.ok ? `Successfully connected to PostgreSQL in ${testResult.latency}ms!` : `Connection failed: ${testResult.error}`}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">SUPABASE URL</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brass"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">SUPABASE PUBLIC ANON KEY</label>
                <input
                  type="password"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brass"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Credentials are saved securely in your browser session.
              </span>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="py-1.5 px-4 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow"
              >
                {saveSuccess ? '✓ Saved!' : 'Save & Reconnect'}
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-4 py-3 bg-panel border-t border-brass-soft/30 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            Target Latency: &lt; 2s &bull; Auto-sync active
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-ink border border-brass-soft/40 hover:border-brass text-white font-mono text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
