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
  Sparkles
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function DatabaseSettingsModal({
  isOpen,
  onClose,
  property
}) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

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

  const handleCopySchemaNotice = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border border-brass/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg leading-none">
                PostgreSQL & Cloud Storage Architecture
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {property.name} • Relational Postgres, Row Level Security (RLS) & Photo Storage
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
          {/* Active Engine Card */}
          <div className="p-4 bg-ink rounded-xl border border-brass-soft/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-signal-green/20 border border-signal-green flex items-center justify-center text-signal-green">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-white text-sm">
                    {isSupabaseConfigured ? 'Supabase Cloud PostgreSQL Active' : 'Local-First Resilient Engine Active'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-signal-green text-ink font-mono font-bold text-[9px]">
                    ZERO-LATENCY
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {isSupabaseConfigured 
                    ? 'Connected to live PostgreSQL instance with Row Level Security (RLS).'
                    : 'Running in high-speed local storage mode with automatic fallback. Connect your Supabase project URL in .env anytime.'}
                </p>
              </div>
            </div>
          </div>

          {/* PostgreSQL Relational Tables Matrix */}
          <div className="space-y-2 font-mono">
            <div className="flex items-center justify-between text-brass text-[11px] uppercase font-bold border-b border-brass-soft/20 pb-1">
              <span>PostgreSQL Relational Schema Tables</span>
              <span className="text-slate-400 font-normal">supabase/schema.sql</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tables.map((t, idx) => (
                <div key={idx} className="p-2.5 bg-ink rounded-lg border border-brass-soft/20 space-y-1">
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

          {/* Storage Bucket & Security Note */}
          <div className="p-3.5 bg-panel rounded-xl border border-brass-soft/30 space-y-2 font-sans">
            <div className="flex items-center gap-2 text-brass font-mono text-[11px] uppercase font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Storage Buckets & Row Level Security (RLS)</span>
            </div>

            <ul className="space-y-1.5 text-slate-300 text-[11px] font-mono">
              <li>• <strong>guest-id-proofs:</strong> Supabase Storage bucket for storing guest Aadhaar/Passport photo files securely.</li>
              <li>• <strong>Role-Level RLS:</strong> Receptionist cannot alter base room rates; Housekeeping can only update room cleanliness status.</li>
              <li>• <strong>Tenant Scoping:</strong> Every query strictly scopes by <code>property_id</code> for multi-hotel expansion.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-panel border-t border-brass-soft/30 flex justify-between items-center font-mono text-xs">
          <span className="text-slate-400">Migration File: <code>supabase/schema.sql</code></span>
          <button
            onClick={handleCopySchemaNotice}
            className="px-3 py-1.5 rounded-lg bg-brass text-ink font-bold hover:brightness-110 flex items-center gap-1.5 shadow-md shadow-brass/20"
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Path!' : 'Copy Schema Path'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
