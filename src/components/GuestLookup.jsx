import React, { useState } from 'react';
import {
  Search,
  Users,
  Phone,
  Calendar,
  Sparkles,
  Award,
  FileText,
  UserPlus
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function GuestLookup({ guests, onNewBookingForGuest }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGuests = guests.filter(g => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) ||
      g.phone.includes(term) ||
      (g.address && g.address.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-panel border border-brass-soft/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brass/20 text-brass text-[10px] font-mono font-bold uppercase tracking-wider border border-brass/30">
              GUEST CRM & RETURNING HISTORY
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            Guest Directory & Loyalty Profiles
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Instant phone-number lookup, repeat stay count, and prefill records for fast receptionist onboarding.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-brass absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by phone or guest name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-ink border border-brass-soft/50 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder-slate-500 focus:border-brass font-sans"
          />
        </div>
      </div>

      {/* Guest Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuests.map(guest => (
          <div
            key={guest.id}
            className="bg-panel border border-brass-soft/30 rounded-2xl p-5 shadow-lg space-y-3 hover:border-brass/50 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-ink border border-brass flex items-center justify-center font-display font-bold text-lg text-brass">
                    {guest.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{guest.name}</h3>
                      {(guest.total_stays || 1) >= 2 && (
                        <span className="px-2 py-0.5 rounded-full bg-signal-green/20 text-signal-green font-mono text-[9px] font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Repeat ({guest.total_stays} Stays)
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-brass mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{guest.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-ink p-3 rounded-xl border border-brass-soft/20 text-xs font-mono space-y-1">
                <div>
                  <span className="text-slate-400">Address: </span>
                  <span className="text-slate-200">{guest.address || 'Kozhikode, Kerala'}</span>
                </div>
                <div>
                  <span className="text-slate-400">ID Document: </span>
                  <span className="text-slate-200">{guest.id_proof_type} ({guest.id_proof_number || 'VERIFIED'})</span>
                </div>
                {guest.notes && (
                  <div className="text-[11px] text-brass-soft italic pt-1 border-t border-brass-soft/10">
                    "{guest.notes}"
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => onNewBookingForGuest(guest)}
                className="px-4 py-2 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Fast Book for {guest.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
