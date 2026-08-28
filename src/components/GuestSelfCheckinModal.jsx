import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  CheckCircle2,
  Share2,
  Clock,
  User,
  Shield,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  Eye,
  AlertTriangle,
  Copy,
  ExternalLink,
  Printer,
  Zap,
  Check,
  Building2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import IdPhotoCaptureWidget from './IdPhotoCaptureWidget';

export default function GuestSelfCheckinModal({
  isOpen,
  onClose,
  selfCheckins = [],
  onApproveSelfCheckin,
  onRejectSelfCheckin,
  onConfirmPayment,
  onConfirmSelfCheckin,
  onAddSelfCheckin,
  rooms = [],
  property,
  onViewIdPhoto
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

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'guest-portal' | 'qr-code'
  const [queueFilter, setQueueFilter] = useState('pending'); // 'pending' | 'approved' | 'all'
  const [copiedLink, setCopiedLink] = useState(false);

  // Per-item assignment form state map: { [itemId]: { roomId, acOrNonAc, rateApplied, advancePaid, paymentMode, showRejectPrompt, rejectReason } }
  const [assignmentMap, setAssignmentMap] = useState({});

  const vacantRooms = rooms.filter(r => r.status === 'vacant' || r.status === 'ready');
  const defaultRoom = vacantRooms[0] || rooms[0] || { id: 'room-202', room_number: '202', room_type_id: 'classic' };

  // Generate dynamic, public URL to mobile self-registration page
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://taj-residency.vercel.app';
  const portalUrl = `${baseUrl}/?view=self-checkin&property=${property?.id || 'taj-residency-calicut'}`;

  // Helper to get or initialize state for a specific queue item
  const getItemAssignment = (item) => {
    if (assignmentMap[item.id]) return assignmentMap[item.id];
    const initialRoom = vacantRooms[0] || rooms[0] || { id: 'room-202', room_number: '202', room_type_id: 'classic' };
    const isDayUse = item.booking_type === 'day_use';
    const baseRate = isDayUse ? 600 : (initialRoom.room_type_id === 'deluxe' ? 2000 : 1500);

    return {
      roomId: initialRoom.id,
      acOrNonAc: 'AC',
      rateApplied: baseRate,
      advancePaid: 0,
      paymentMode: 'Cash',
      showRejectPrompt: false,
      rejectReason: ''
    };
  };

  const updateItemAssignment = (itemId, updates) => {
    setAssignmentMap(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || getItemAssignment({ id: itemId })),
        ...updates
      }
    }));
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(portalUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  const handleApprove = (item) => {
    const stateForThis = getItemAssignment(item);
    const approveFn = onApproveSelfCheckin || onConfirmSelfCheckin;
    if (typeof approveFn === 'function') {
      approveFn(item.id, {
        roomId: stateForThis.roomId,
        rateApplied: Number(stateForThis.rateApplied) || 1500,
        acOrNonAc: stateForThis.acOrNonAc || 'AC',
        advancePaid: Number(stateForThis.advancePaid) || 0,
        paymentMode: stateForThis.paymentMode || 'Cash',
        bookingType: item.booking_type || 'overnight',
        durationHours: item.duration_hours || 2,
        groupSize: item.group_size || 1
      });
    }
  };

  const handleReject = (item, status = 'needs_info') => {
    const stateForThis = getItemAssignment(item);
    const reason = stateForThis.rejectReason || (status === 'needs_info' ? 'Please present physical ID at front desk counter' : 'Registration declined');
    if (typeof onRejectSelfCheckin === 'function') {
      onRejectSelfCheckin(item.id, reason, status);
    }
    updateItemAssignment(item.id, { showRejectPrompt: false });
  };

  // Filter queues
  const pendingItems = selfCheckins.filter(s => !s.status || s.status === 'pending' || s.status === 'pending_reception_confirmation');
  const approvedItems = selfCheckins.filter(s => s.status === 'approved' || s.status === 'confirmed_checked_in');
  const needsInfoItems = selfCheckins.filter(s => s.status === 'needs_info' || s.status === 'rejected');

  let displayedItems = pendingItems;
  if (queueFilter === 'approved') displayedItems = approvedItems;
  if (queueFilter === 'needs_info') displayedItems = needsInfoItems;
  if (queueFilter === 'all') displayedItems = selfCheckins;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[94vh]">
        {/* Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 p-3 sm:p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between pt-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-ink hover:bg-panel text-brass hover:text-white border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
              title="Close portal"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass shrink-0 hidden sm:flex">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                Pre-Arrival QR Self Check-In
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                Review guest ID proofs, assign vacant rooms, and approve keys
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

        {/* Top Mode Tabs */}
        <div className="px-4 sm:px-5 pt-3 bg-panel/50 border-b border-brass-soft/20 flex gap-4 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'queue'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Incoming Queue ({pendingItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr-code')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'qr-code'
                ? 'border-brass text-brass'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Counter Stand QR & Link</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* 1. RECEPTIONIST QUEUE TAB */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {/* Queue Status Sub-filters */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-brass-soft/15">
                <div className="flex gap-1.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setQueueFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      queueFilter === 'pending'
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                        : 'text-slate-400 hover:text-white bg-ink'
                    }`}
                  >
                    Pending ({pendingItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueFilter('approved')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      queueFilter === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                        : 'text-slate-400 hover:text-white bg-ink'
                    }`}
                  >
                    Approved ({approvedItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueFilter('needs_info')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      queueFilter === 'needs_info'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold'
                        : 'text-slate-400 hover:text-white bg-ink'
                    }`}
                  >
                    Needs Info / Rejected ({needsInfoItems.length})
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  Vacant Rooms: <strong className="text-white">{vacantRooms.length}</strong>
                </span>
              </div>

              {/* Items List */}
              {displayedItems.length === 0 ? (
                <div className="p-8 text-center bg-ink rounded-2xl border border-brass-soft/20 text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-signal-green mx-auto" />
                  <div className="font-bold text-white text-sm">
                    {queueFilter === 'pending' ? 'No Pending Self-Registrations' : 'No Records in this Filter'}
                  </div>
                  <p className="text-[11px] font-mono max-w-sm mx-auto">
                    Guests can scan the counter-stand QR code to pre-fill their government ID and details before reaching the desk.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedItems.map(item => {
                    const assign = getItemAssignment(item);
                    const isPending = !item.status || item.status === 'pending' || item.status === 'pending_reception_confirmation';
                    const isApproved = item.status === 'approved' || item.status === 'confirmed_checked_in';
                    const isNeedsInfo = item.status === 'needs_info';
                    const isRejected = item.status === 'rejected';

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3.5 shadow-lg ${
                          isPending
                            ? 'bg-ink border-amber-500/40'
                            : (isApproved ? 'bg-ink border-emerald-500/30' : 'bg-ink border-rose-500/30')
                        }`}
                      >
                        {/* Header: Guest Name & Badge */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-brass/20 text-brass text-[9.5px] font-mono font-bold uppercase border border-brass/30">
                                {item.booking_type === 'day_use' ? '⚡ FRESH-UP GUEST' : 'OVERNIGHT GUEST'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Submitted: {item.submitted_at || 'Just now'}
                              </span>
                            </div>
                            <h3 className="font-display font-bold text-white text-base sm:text-lg mt-1">
                              {item.guest_name}
                            </h3>
                            <div className="font-mono text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                              <span>📞 {item.phone}</span>
                              <span>&bull;</span>
                              <span>{item.group_size || 1} Pax</span>
                              {item.address && (
                                <>
                                  <span>&bull;</span>
                                  <span className="text-slate-400 truncate max-w-[200px]">{item.address}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Status & Payment Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {isApproved && (
                              <>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Room {item.room_number}</span>
                                </span>
                                {item.payment_status === 'paid' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-signal-green/15 text-signal-green text-[10px] font-mono font-bold border border-signal-green/30 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    <span>Paid ₹{item.amount_due || item.advance_paid || 1500}</span>
                                  </span>
                                ) : item.payment_status === 'payment_submitted' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/40 flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    <span>⚡ Guest Claims Paid (₹{item.amount_due || 1500})</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-panel text-slate-400 text-[10px] font-mono border border-white/10">
                                    Awaiting UPI (₹{item.amount_due || 1500})
                                  </span>
                                )}
                              </>
                            )}
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-bold border border-amber-400/40 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                <span>Awaiting Review</span>
                              </span>
                            )}
                            {(isNeedsInfo || isRejected) && (
                              <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono font-bold border border-rose-500/30 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>{isNeedsInfo ? 'Needs Info' : 'Rejected'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ID Document Details & Photo Thumbnails */}
                        <div className="bg-panel p-3 rounded-xl border border-brass-soft/20 space-y-2 font-mono text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brass-soft/10 pb-2">
                            <div>
                              <span className="text-slate-400">ID Proof: </span>
                              <strong className="text-white">{item.id_proof_type} ({item.id_proof_number || 'VERIFIED'})</strong>
                            </div>
                            <span className="text-[10px] text-emerald-400">✓ Digital Signature Captured</span>
                          </div>

                          {/* ID Photos */}
                          <div className="flex items-center gap-3 pt-1">
                            {item.id_proof_photo_url ? (
                              <div className="flex items-center gap-2">
                                <div
                                  onClick={() => onViewIdPhoto && onViewIdPhoto(item.id_proof_photo_url, `${item.guest_name}'s ID (Front)`)}
                                  className="w-16 h-12 rounded-lg bg-black border border-brass/50 overflow-hidden cursor-pointer relative group shrink-0"
                                  title="Click to view full photo"
                                >
                                  <img
                                    src={item.id_proof_photo_url}
                                    alt="ID Front"
                                    className="w-full h-full object-contain bg-black group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400">Front ID Photo</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-amber-300">No front photo uploaded</span>
                            )}

                            {item.id_proof_back_photo_url && (
                              <div className="flex items-center gap-2">
                                <div
                                  onClick={() => onViewIdPhoto && onViewIdPhoto(item.id_proof_back_photo_url, `${item.guest_name}'s ID (Back)`)}
                                  className="w-16 h-12 rounded-lg bg-black border border-brass/50 overflow-hidden cursor-pointer relative group shrink-0"
                                  title="Click to view full back photo"
                                >
                                  <img
                                    src={item.id_proof_back_photo_url}
                                    alt="ID Back"
                                    className="w-full h-full object-contain bg-black group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>
                                <span className="text-[10px] text-slate-400">Back ID Photo</span>
                              </div>
                            )}

                            {item.id_proof_photo_url && (
                              <button
                                type="button"
                                onClick={() => onViewIdPhoto && onViewIdPhoto(item.id_proof_photo_url, `${item.guest_name}'s ID Document`)}
                                className="ml-auto px-2.5 py-1 rounded bg-brass/15 text-brass hover:bg-brass/30 text-[10px] font-bold border border-brass/30 flex items-center gap-1 shrink-0"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect Full Resolution</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* If Rejected or Needs Info: Show Reason */}
                        {item.rejection_reason && (
                          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                            <span className="font-bold">Desk Note: </span>"{item.rejection_reason}"
                          </div>
                        )}

                        {/* Action Panel for Pending Items */}
                        {isPending && (
                          <div className="pt-2 border-t border-brass-soft/20 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {/* 1. Room Assignment */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                                  Assign Vacant Room <span className="text-brass">*</span>
                                </label>
                                <select
                                  value={assign.roomId}
                                  onChange={(e) => {
                                    const rId = e.target.value;
                                    const found = rooms.find(r => r.id === rId);
                                    const baseRate = found?.room_type_id === 'deluxe' ? 2000 : 1500;
                                    updateItemAssignment(item.id, {
                                      roomId: rId,
                                      rateApplied: item.booking_type === 'day_use' ? assign.rateApplied : baseRate
                                    });
                                  }}
                                  className="w-full bg-panel-raised border border-brass-soft rounded-lg px-2.5 py-2 text-white font-mono text-xs outline-none"
                                >
                                  {vacantRooms.map(r => (
                                    <option key={r.id} value={r.id}>
                                      Room {r.room_number} ({r.room_type_id === 'deluxe' ? 'Deluxe' : 'Classic'}) — VACANT
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* 2. Rate & AC / Non-AC */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                                  Confirmed Rate (₹)
                                </label>
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    value={assign.rateApplied}
                                    onChange={(e) => updateItemAssignment(item.id, { rateApplied: Number(e.target.value) })}
                                    className="w-full bg-panel-raised border border-brass-soft rounded-lg px-2.5 py-2 text-white font-mono text-xs outline-none"
                                  />
                                  <select
                                    value={assign.acOrNonAc}
                                    onChange={(e) => updateItemAssignment(item.id, { acOrNonAc: e.target.value })}
                                    className="bg-panel-raised border border-brass-soft rounded-lg px-2 text-white font-mono text-xs shrink-0"
                                  >
                                    <option value="AC">AC</option>
                                    <option value="Non-AC">Non-AC</option>
                                  </select>
                                </div>
                              </div>

                              {/* 3. Advance & Payment Mode */}
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                                  Advance Paid (₹)
                                </label>
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={assign.advancePaid}
                                    onChange={(e) => updateItemAssignment(item.id, { advancePaid: Number(e.target.value) })}
                                    className="w-full bg-panel-raised border border-brass-soft rounded-lg px-2.5 py-2 text-white font-mono text-xs outline-none"
                                  />
                                  <select
                                    value={assign.paymentMode}
                                    onChange={(e) => updateItemAssignment(item.id, { paymentMode: e.target.value })}
                                    className="bg-panel-raised border border-brass-soft rounded-lg px-2 text-white font-mono text-xs shrink-0"
                                  >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Card">Card</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Rejection / Note Input Prompt */}
                            {assign.showRejectPrompt ? (
                              <div className="p-3 bg-panel rounded-xl border border-rose-500/40 space-y-2 animate-in fade-in duration-150">
                                <label className="text-[10px] uppercase font-mono text-rose-300 font-bold block">
                                  Enter Note for Guest (Sent directly to guest phone screen):
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Photo of Aadhaar card is blurry, please present original card at counter."
                                  value={assign.rejectReason}
                                  onChange={(e) => updateItemAssignment(item.id, { rejectReason: e.target.value })}
                                  className="w-full bg-[#0A0D12] border border-white/20 rounded-lg px-3 py-2 text-white text-xs outline-none"
                                />
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => updateItemAssignment(item.id, { showRejectPrompt: false })}
                                    className="px-3 py-1 rounded bg-panel hover:bg-ink text-slate-400 text-xs font-mono"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(item, 'needs_info')}
                                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs font-mono"
                                  >
                                    Send "Needs Info"
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReject(item, 'rejected')}
                                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs font-mono"
                                  >
                                    Decline Request
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => updateItemAssignment(item.id, { showRejectPrompt: true })}
                                  className="px-3 py-2 rounded-lg bg-panel hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
                                >
                                  Request Info / Decline
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleApprove(item)}
                                  className="px-5 py-2 rounded-lg bg-brass text-ink hover:brightness-110 font-bold text-xs shadow-lg shadow-brass/20 active:scale-95 transition-all flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                  <span>Approve & Assign Room Key</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Panel for Approved Items Awaiting Payment */}
                        {isApproved && item.payment_status !== 'paid' && (
                          <div className="pt-2 border-t border-brass-soft/20 flex flex-wrap items-center justify-between gap-2.5 bg-panel/70 p-3 rounded-xl border border-brass-soft/30">
                            <div className="text-xs font-mono">
                              <div className="flex items-center gap-1.5 text-brass font-bold">
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>UPI Payment Due: ₹{item.amount_due || 1500}</span>
                              </div>
                              {item.payment_status === 'payment_submitted' ? (
                                <p className="text-[10.5px] text-amber-300 mt-0.5 animate-pulse font-semibold">
                                  ⚡ Guest clicked "I have paid via UPI" on their smartphone. Check your UPI app / SMS and confirm.
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Guest has dynamic QR code & UPI deep-link active on their phone.
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => onConfirmPayment && onConfirmPayment(item.id, { paymentMode: 'UPI', amountPaid: item.amount_due || 1500 })}
                              className="px-4 py-2 rounded-lg bg-signal-green hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-signal-green/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ml-auto whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                              <span>✓ Mark as Paid (₹{item.amount_due || 1500})</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. COUNTER STAND QR TAB */}
          {activeTab === 'qr-code' && (
            <div className="space-y-6 text-center max-w-md mx-auto">
              {/* Stand Card Mockup */}
              <div
                id="counter-stand-printable-card"
                className="bg-[#FAF8F5] text-[#11161D] p-6 sm:p-8 rounded-3xl border-4 border-[#C9A24B] shadow-2xl space-y-4 text-center relative overflow-hidden"
              >
                {/* Luxury Top Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#C9A24B] m-2 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#C9A24B] m-2 pointer-events-none"></div>

                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#C9A24B]/20 border border-[#C9A24B] flex items-center justify-center text-[#C9A24B] font-serif font-bold text-base mx-auto mb-2">
                    TR
                  </div>
                  <h3 className="font-serif font-bold text-xl uppercase tracking-wider text-[#11161D]">
                    {property?.name || 'Taj Residency'}
                  </h3>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#A87B24] font-bold mt-0.5">
                    Express Guest Self Check-In
                  </p>
                </div>

                {/* QR Code SVG */}
                <div className="p-4 bg-white rounded-2xl shadow-inner inline-block border border-[#E5E0D2]">
                  <QRCodeSVG
                    value={portalUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-sm text-[#11161D]">
                    Scan with Phone Camera or WhatsApp
                  </div>
                  <p className="text-xs text-slate-600 font-mono max-w-xs mx-auto">
                    Pre-fill Aadhaar / Passport & collect your room keycard instantly at counter.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E5E0D2] text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
                  <span>🏛️ {property?.address || 'Beach Road, Mananchira, Kozhikode'}</span>
                </div>
              </div>

              {/* Working Public Link & Actions */}
              <div className="bg-ink p-4 rounded-2xl border border-brass-soft/30 space-y-3 text-left font-mono text-xs">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                  Public Guest Registration Route:
                </span>
                <div className="p-2.5 rounded-xl bg-panel border border-brass-soft/20 text-[#C9A24B] break-all select-all font-mono text-[11px]">
                  {portalUrl}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2 px-3 rounded-lg bg-panel hover:bg-panel-raised text-white border border-brass-soft/40 flex items-center justify-center gap-1.5 transition-all text-xs font-bold"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-signal-green" />
                        <span className="text-signal-green">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-brass" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-lg bg-brass text-ink hover:brightness-110 flex items-center justify-center gap-1.5 transition-all text-xs font-bold shadow-md shadow-brass/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Test Guest View ↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2 px-3 rounded-lg bg-panel hover:bg-ink text-slate-300 hover:text-white border border-brass-soft/40 flex items-center gap-1.5 transition-all text-xs"
                    title="Print counter stand on paper"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Stand</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
