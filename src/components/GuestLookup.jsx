import React, { useState } from 'react';
import {
  Search,
  Users,
  Phone,
  Calendar,
  Sparkles,
  Award,
  FileText,
  UserPlus,
  ShieldCheck,
  Eye,
  Camera,
  CheckCircle2,
  AlertTriangle,
  X,
  Folder
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import IdPhotoCaptureWidget from './IdPhotoCaptureWidget';

export default function GuestLookup({
  guests = [],
  onNewBookingForGuest,
  onViewGuestIdDoc,
  onViewGuestDossier,
  onUpdateGuestId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [tempFrontUrl, setTempFrontUrl] = useState('');
  const [tempBackUrl, setTempBackUrl] = useState('');
  const [tempIdType, setTempIdType] = useState('Aadhaar Card');
  const [tempIdNumber, setTempIdNumber] = useState('');

  const filteredGuests = guests.filter(g => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) ||
      g.phone.includes(term) ||
      (g.address && g.address.toLowerCase().includes(term)) ||
      (g.id_proof_number && g.id_proof_number.toLowerCase().includes(term))
    );
  });

  const handleStartEditId = (guest) => {
    setEditingGuestId(guest.id);
    setTempFrontUrl(guest.id_proof_photo_url || '');
    setTempBackUrl(guest.id_proof_back_photo_url || '');
    setTempIdType(guest.id_proof_type || 'Aadhaar Card');
    setTempIdNumber(guest.id_proof_number || '');
  };

  const handleSaveId = (guestId) => {
    if (typeof onUpdateGuestId === 'function') {
      onUpdateGuestId(guestId, {
        idType: tempIdType,
        idNumber: tempIdNumber,
        idPhotoUrl: tempFrontUrl,
        idPhotoBackUrl: tempBackUrl
      });
    }
    setEditingGuestId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-panel border border-brass-soft/40 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brass/20 text-brass text-[10px] font-mono font-bold uppercase tracking-wider border border-brass/30">
              GUEST CRM & POLICE ID VERIFICATION
            </span>
            <span className="px-2 py-0.5 rounded-full bg-signal-green/20 text-signal-green text-[10px] font-mono font-bold border border-signal-green/30">
              ✓ Indian Law Compliant
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            Guest Directory & ID Document Archives
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Instant phone lookup, verified government photo IDs, and 1-click inspection for front desk & police audits.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-brass absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-ink border border-brass-soft/50 rounded-xl pl-9 pr-4 py-2 text-white text-xs placeholder-slate-500 focus:border-brass font-sans"
          />
        </div>
      </div>

      {/* Guest Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuests.map(guest => {
          const hasIdPhoto = Boolean(guest.id_proof_photo_url);
          const isEditingThis = editingGuestId === guest.id;

          return (
            <div
              key={guest.id}
              className="bg-panel border border-brass-soft/40 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-brass/70 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Guest Identity & Photo Card (Guaranteed Uniform Proportions) */}
                <div className="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4">
                  
                  {/* Photo Frame with Guaranteed Sizing for any image (webcam or upload) */}
                  <div
                    onClick={() => hasIdPhoto && onViewGuestIdDoc && onViewGuestIdDoc(guest)}
                    className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden border-2 border-brass/60 shrink-0 bg-ink shadow-md cursor-pointer group flex items-center justify-center"
                    style={{ minWidth: '7rem', maxWidth: '8rem', minHeight: '9rem', maxHeight: '10rem' }}
                    title={hasIdPhoto ? "Click to inspect verified ID document" : "No ID photo recorded"}
                  >
                    {hasIdPhoto ? (
                      <>
                        <img
                          src={guest.id_proof_photo_url}
                          alt={guest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <div className="w-10 h-10 rounded-full bg-brass/20 border border-brass/40 flex items-center justify-center font-display font-bold text-base text-brass mb-1">
                          {guest.name ? guest.name.slice(0, 2).toUpperCase() : 'GS'}
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">
                          No Photo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Identity, Contact & Compliance Info */}
                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-white text-base sm:text-lg leading-tight truncate">
                            {guest.name}
                          </h3>
                          {(guest.total_stays || 1) >= 2 ? (
                            <span className="px-2 py-0.5 rounded-full bg-signal-green/20 text-signal-green font-mono text-[9px] font-bold flex items-center gap-1 shrink-0">
                              <Sparkles className="w-2.5 h-2.5" />
                              {guest.total_stays} Stays
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-brass/15 text-brass font-mono text-[9px] font-bold shrink-0">
                              New Guest
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-brass mt-1 flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{guest.phone}</span>
                        </div>
                      </div>

                      {/* ID Compliance Badge */}
                      {hasIdPhoto ? (
                        <span className="px-2 py-0.5 rounded bg-signal-green/15 text-signal-green border border-signal-green/30 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ID on File</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-signal-amber/15 text-signal-amber border border-signal-amber/30 text-[10px] font-mono font-bold flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3" />
                          <span>ID Missing</span>
                        </span>
                      )}
                    </div>

                    {/* Guest Profile Details & ID Info */}
                    <div className="bg-ink p-2.5 sm:p-3 rounded-xl border border-brass-soft/20 text-xs font-mono space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 shrink-0">Address:</span>
                        <span className="text-slate-200 text-right truncate">{guest.address || 'Kozhikode, Kerala'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 shrink-0">Govt ID:</span>
                        <span className="text-brass font-bold text-right truncate">
                          {guest.id_proof_type || 'Aadhaar Card'} ({guest.id_proof_number || 'VERIFIED'})
                        </span>
                      </div>
                      {guest.id_verified_at && (
                        <div className="flex justify-between gap-2 text-[10px] text-slate-500 border-t border-brass-soft/10 pt-1">
                          <span className="shrink-0">Verified:</span>
                          <span className="text-right truncate">
                            {guest.id_verified_at} {guest.id_verified_by_staff ? `(${guest.id_verified_by_staff})` : ''}
                          </span>
                        </div>
                      )}
                      {guest.notes && (
                        <div className="text-[11px] text-brass-soft italic pt-1 border-t border-brass-soft/10 truncate">
                          "{guest.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline ID Photo Editor / Capture Mode */}
                {isEditingThis && (
                  <div className="p-3 bg-panel-raised border border-brass rounded-xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Update ID Proof for {guest.name}</span>
                      <button
                        type="button"
                        onClick={() => setEditingGuestId(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">ID Type</label>
                        <select
                          value={tempIdType}
                          onChange={(e) => setTempIdType(e.target.value)}
                          className="w-full bg-ink border border-brass-soft rounded-lg px-2 py-1 text-white text-xs"
                        >
                          <option>Aadhaar Card</option>
                          <option>Driving License</option>
                          <option>Passport</option>
                          <option>Voter ID</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">ID Number</label>
                        <input
                          type="text"
                          value={tempIdNumber}
                          onChange={(e) => setTempIdNumber(e.target.value)}
                          placeholder="e.g. XXXX-XXXX-4812"
                          className="w-full bg-ink border border-brass-soft rounded-lg px-2 py-1 text-white text-xs"
                        />
                      </div>
                    </div>

                    <IdPhotoCaptureWidget
                      frontPhotoUrl={tempFrontUrl}
                      backPhotoUrl={tempBackUrl}
                      idType={tempIdType}
                      guestPhone={guest.phone}
                      onChangeFront={(url) => setTempFrontUrl(url)}
                      onChangeBack={(url) => setTempBackUrl(url)}
                      compact={true}
                    />

                    <div className="flex justify-end gap-2 pt-1 font-mono">
                      <button
                        type="button"
                        onClick={() => setEditingGuestId(null)}
                        className="px-3 py-1 rounded bg-panel border border-brass-soft text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveId(guest.id)}
                        className="px-4 py-1 rounded bg-signal-green text-ink font-bold text-xs hover:brightness-110"
                      >
                        Save Verified ID
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-brass-soft/20">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onViewGuestDossier && onViewGuestDossier(guest)}
                    className="px-2.5 py-1.5 rounded-lg bg-panel hover:bg-ink text-brass border border-brass-soft/50 font-mono font-bold text-xs flex items-center gap-1 transition-all shadow-sm"
                    title="View complete stay history, past rooms, and invoices folder"
                  >
                    <Folder className="w-3.5 h-3.5 text-brass" />
                    <span>Stay History ({guest.total_stays || 1})</span>
                  </button>

                  {hasIdPhoto && (
                    <button
                      type="button"
                      onClick={() => onViewGuestIdDoc && onViewGuestIdDoc(guest)}
                      className="px-2.5 py-1.5 rounded-lg bg-panel hover:bg-ink text-slate-300 hover:text-white border border-brass-soft/30 font-mono text-xs flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-brass" />
                      <span>Inspect ID</span>
                    </button>
                  )}

                  {!isEditingThis && (
                    <button
                      type="button"
                      onClick={() => handleStartEditId(guest)}
                      className="px-2.5 py-1.5 rounded-lg bg-panel hover:bg-ink text-slate-300 hover:text-white border border-brass-soft/30 font-mono text-xs flex items-center gap-1 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5 text-brass" />
                      <span>{hasIdPhoto ? 'Update ID' : 'Capture ID Photo'}</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onNewBookingForGuest(guest)}
                  className="px-3.5 py-1.5 rounded-lg bg-brass text-ink font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Fast Check-In (2 Steps)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

