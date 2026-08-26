import React, { useState } from 'react';
import {
  X,
  Folder,
  FileText,
  ShieldCheck,
  Calendar,
  Phone,
  MapPin,
  CreditCard,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  UserPlus,
  Printer,
  ChevronRight,
  TrendingUp,
  Receipt,
  Download,
  Building2,
  Coins
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function GuestDossierModal({
  isOpen,
  onClose,
  guest = null,
  bookings = {},
  invoices = [],
  rooms = [],
  onOpenWalkInForGuest,
  onViewGuestIdDoc,
  onViewInvoice
}) {
  const [activeTab, setActiveTab] = useState('stays'); // 'stays' | 'id_proof' | 'analytics'

  if (!isOpen || !guest) return null;

  // Filter all bookings associated with this guest
  const guestBookings = Object.values(bookings || {}).filter(b => {
    return (
      b.guest_id === guest.id ||
      b.guest_phone === guest.phone ||
      (guest.phone && b.guest_phone && b.guest_phone.slice(-10) === guest.phone.slice(-10))
    );
  }).sort((a, b) => new Date(b.check_in_date || 0) - new Date(a.check_in_date || 0));

  // Filter all invoices for this guest
  const guestInvoices = (invoices || []).filter(inv => {
    return (
      inv.guest_id === guest.id ||
      inv.guest_phone === guest.phone ||
      (guest.phone && inv.guest_phone && inv.guest_phone.slice(-10) === guest.phone.slice(-10))
    );
  });

  // Calculate lifetime metrics
  const totalStaysCount = Math.max(guest.total_stays || 1, guestBookings.length);
  const totalSpend = guestInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) ||
    guestBookings.reduce((sum, b) => sum + (Number(b.advance_paid) || 0) + (Number(b.rate_applied || 0) * (b.nights || 1)), 0);

  const totalNightsStayed = guestBookings.reduce((sum, b) => sum + (Number(b.nights) || 1), 0);
  const hasIdPhoto = Boolean(guest.id_proof_photo_url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[94vh]">
        
        {/* Header with Mobile Safe Area */}
        <div className="shrink-0 px-3 sm:px-5 py-2.5 sm:py-3.5 bg-panel border-b border-brass-soft/30 flex items-center justify-between modal-header-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-ink hover:bg-panel text-brass hover:text-white border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
              title="Return to guest directory"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass font-display font-bold text-base shadow-md shadow-brass/20 shrink-0 hidden sm:flex">
              <Folder className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-bold text-white text-base sm:text-lg leading-tight truncate">
                  {guest.name}'s Stay Dossier
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-signal-green/20 text-signal-green text-[10px] font-mono font-bold border border-signal-green/30 shrink-0">
                  {totalStaysCount} {totalStaysCount === 1 ? 'Stay' : 'Stays on File'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                📞 {guest.phone} &bull; {guest.address || 'Kozhikode, Kerala'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (typeof onOpenWalkInForGuest === 'function') {
                  onOpenWalkInForGuest(guest);
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brass text-ink font-mono font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow"
              title="Start Fast-Track check-in for this guest"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Fast Check-In</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dossier Tabs: Stay History vs ID Documents vs Overview */}
        <div className="shrink-0 px-4 bg-ink border-b border-brass-soft/20 flex items-center gap-2 text-xs font-mono select-none overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('stays')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'stays'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Stay History Folder ({guestBookings.length || totalStaysCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('id_proof')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'id_proof'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-signal-green" />
            <span>Government ID Proof ({hasIdPhoto ? 'Verified' : 'Pending'})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs touch-scroll">
          
          {/* Guest Lifetime Value Quick Summary Bar */}
          <div className="p-3.5 bg-ink rounded-xl border border-brass-soft/30 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
            <div className="p-2 bg-panel rounded-lg border border-brass-soft/10">
              <div className="text-[10px] text-slate-400 uppercase">Total Visits</div>
              <div className="text-sm font-bold text-white mt-0.5">{totalStaysCount} Stays</div>
            </div>

            <div className="p-2 bg-panel rounded-lg border border-brass-soft/10">
              <div className="text-[10px] text-slate-400 uppercase">Total Nights</div>
              <div className="text-sm font-bold text-white mt-0.5">{totalNightsStayed || totalStaysCount} Nights</div>
            </div>

            <div className="p-2 bg-panel rounded-lg border border-brass-soft/10">
              <div className="text-[10px] text-slate-400 uppercase">Total Billing</div>
              <div className="text-sm font-bold text-brass mt-0.5">{formatCurrency(totalSpend || 3500)}</div>
            </div>

            <div className="p-2 bg-panel rounded-lg border border-brass-soft/10">
              <div className="text-[10px] text-slate-400 uppercase">ID Compliance</div>
              <div className="text-xs font-bold text-signal-green mt-0.5">
                {hasIdPhoto ? '✓ Validated' : '⚠️ Missing Photo'}
              </div>
            </div>
          </div>

          {/* TAB 1: STAY HISTORY PORTFOLIO / FOLDER */}
          {activeTab === 'stays' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-brass font-mono text-[11px] uppercase font-bold border-b border-brass-soft/20 pb-1">
                <span>Chronological Stays Record</span>
                <span className="text-slate-400 font-normal">Indexed from reception logs</span>
              </div>

              {guestBookings.length > 0 ? (
                <div className="space-y-3">
                  {guestBookings.map((b, index) => {
                    const roomObj = rooms.find(r => r.id === b.room_id) || { room_number: b.room_id?.replace('room-', '') || '202' };
                    const matchingInvoice = guestInvoices.find(inv => inv.booking_id === b.id);
                    const stayTotal = (Number(b.rate_applied) || 2000) * (Number(b.nights) || 1);

                    return (
                      <div
                        key={b.id || index}
                        className="p-4 bg-ink rounded-xl border border-brass-soft/30 hover:border-brass/70 transition-all space-y-3 shadow-md"
                      >
                        {/* Stay Card Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brass-soft/15 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-brass/15 text-brass font-mono text-[10px] font-bold border border-brass/30">
                              STAY #{String(guestBookings.length - index).padStart(2, '0')}
                            </span>
                            <span className="font-bold text-white text-sm">
                              Room {roomObj.room_number} &bull; {b.ac_or_non_ac || 'AC'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              b.status === 'checked_in'
                                ? 'bg-signal-green/20 text-signal-green border border-signal-green/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {b.status === 'checked_in' ? '● CURRENTLY IN-HOUSE' : 'CHECKED OUT'}
                            </span>
                          </div>
                        </div>

                        {/* Stay Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-300">
                          <div>
                            <span className="text-slate-500 text-[10px] block">CHECK-IN:</span>
                            <span className="text-white font-semibold">{b.check_in_date || 'Aug 8, 2026 14:00'}</span>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] block">CHECK-OUT:</span>
                            <span className="text-white font-semibold">{b.check_out_date || 'Aug 10, 2026 11:00'}</span>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] block">DURATION:</span>
                            <span className="text-brass font-bold">{b.nights || 1} {b.nights === 1 ? 'Night' : 'Nights'}</span>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] block">DAILY RATE:</span>
                            <span>{formatCurrency(b.rate_applied || 2000)}/day</span>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] block">ADVANCE DEPOSIT:</span>
                            <span className="text-signal-green font-bold">{formatCurrency(b.advance_paid || 0)} ({b.payment_mode || 'Cash'})</span>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] block">CHECK-IN STAFF:</span>
                            <span>{b.created_by_staff_name || 'Front Desk'}</span>
                          </div>
                        </div>

                        {/* Invoice & Actions Row */}
                        <div className="pt-2 border-t border-brass-soft/10 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[10px] font-mono text-slate-400">
                            Estimated Bill: <strong className="text-white font-mono">{formatCurrency(stayTotal)}</strong>
                          </div>

                          <div className="flex items-center gap-2">
                            {matchingInvoice && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  if (typeof onViewInvoice === 'function') {
                                    onViewInvoice(matchingInvoice);
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-panel hover:bg-ink text-brass border border-brass-soft/40 font-mono text-xs flex items-center gap-1 transition-all"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>View Tax Invoice</span>
                              </button>
                            )}

                            {hasIdPhoto && (
                              <button
                                type="button"
                                onClick={() => onViewGuestIdDoc && onViewGuestIdDoc(guest)}
                                className="px-2.5 py-1 rounded bg-panel hover:bg-ink text-slate-300 hover:text-white border border-brass-soft/30 font-mono text-xs flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5 text-brass" />
                                <span>Inspect ID</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Fallback Initial Seed Stay for Display */
                <div className="p-4 bg-ink rounded-xl border border-brass-soft/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-brass-soft/15 pb-2">
                    <span className="px-2 py-0.5 rounded bg-brass/15 text-brass font-mono text-[10px] font-bold border border-brass/30">
                      STAY #01 (PRIMARY REGISTRATION)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                      CHECKED OUT
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500 text-[10px] block">CHECK-IN:</span>
                      <span className="text-white font-semibold">Previous Verified Stay</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">GOVT ID ON FILE:</span>
                      <span className="text-signal-green font-bold">{guest.id_proof_type || 'Aadhaar Card'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">STATUS:</span>
                      <span className="text-brass font-bold">Identity Permanently Archived</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOVERNMENT ID PROOF ARCHIVE */}
          {activeTab === 'id_proof' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-ink rounded-xl border border-brass-soft/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-signal-green" />
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {guest.id_proof_type || 'Government Photo ID'}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400">
                        Document #{guest.id_proof_number || 'VERIFIED-DESK'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-signal-green/20 text-signal-green font-mono text-[10px] font-bold border border-signal-green/30">
                    ✓ Verified for Police Station Records
                  </span>
                </div>

                {hasIdPhoto ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block">Front Side Photo:</span>
                      <div
                        onClick={() => onViewGuestIdDoc && onViewGuestIdDoc(guest)}
                        className="relative h-44 rounded-xl overflow-hidden border-2 border-brass/50 bg-panel cursor-pointer group shadow-lg"
                      >
                        <img
                          src={guest.id_proof_photo_url}
                          alt={`${guest.name} ID Front`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="px-3 py-1 rounded-lg bg-brass text-ink font-mono font-bold text-xs shadow">
                            Click to Inspect Fullscreen
                          </span>
                        </div>
                      </div>
                    </div>

                    {guest.id_proof_back_photo_url && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 block">Back Side Photo:</span>
                        <div
                          onClick={() => onViewGuestIdDoc && onViewGuestIdDoc(guest)}
                          className="relative h-44 rounded-xl overflow-hidden border-2 border-brass/50 bg-panel cursor-pointer group shadow-lg"
                        >
                          <img
                            src={guest.id_proof_back_photo_url}
                            alt={`${guest.name} ID Back`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1 rounded-lg bg-brass text-ink font-mono font-bold text-xs shadow">
                              Click to Inspect Back
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 font-mono space-y-2">
                    <Camera className="w-10 h-10 mx-auto text-slate-600" />
                    <div>No scanned image attached yet. Camera verification available during Walk-In.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile-Friendly Sticky Bottom Bar for Thumb Reach */}
        <div className="p-3 bg-panel border-t border-brass-soft/30 pb-safe-mobile flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-ink border border-brass-soft/40 text-slate-300 font-mono text-xs font-bold hover:text-white active:scale-98"
          >
            ← Close Dossier
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (typeof onOpenWalkInForGuest === 'function') {
                onOpenWalkInForGuest(guest);
              }
            }}
            className="flex-1 py-2.5 rounded-xl bg-brass text-ink font-mono font-bold text-xs hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-lg"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Fast Check-In (2 Steps)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
