import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Receipt,
  CreditCard,
  Building2,
  MessageSquare,
  Coins,
  Percent,
  Plus,
  Calendar,
  Sparkles,
  Tag,
  Gift,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { calculateCheckoutBilling } from '../utils/billing';

export default function FolioModal({
  isOpen,
  onClose,
  room,
  booking: propBooking,
  guest: propGuest,
  bookings = {},
  guests = [],
  property = {},
  gstConfig,
  calculateGST,
  onFinalizeCheckout,
  onCheckoutAndGenerateInvoice,
  onPreviewInvoice,
  onOpenPrintInvoice,
  onExtendStay,
  onViewIdPhoto
}) {
  // Auto-resolve booking if passed as collection or direct prop
  const activeBookingId = room?.current_booking_id;
  const booking = propBooking || (bookings && activeBookingId ? bookings[activeBookingId] : null) || {
    id: activeBookingId || 'bk-curr',
    room_id: room?.id || '',
    guest_id: 'gst-01',
    check_in_date: '2026-08-08 14:00',
    nights: 1,
    ac_or_non_ac: 'AC',
    rate_applied: 2000,
    advance_paid: 1500,
    status: 'checked_in'
  };

  // Auto-resolve guest
  const guest = propGuest || (Array.isArray(guests) ? guests.find(g => g.id === booking.guest_id) : null) || {
    name: room?.last_guest_name || 'Dr. Vivek Menon',
    phone: '+91 98470 11223',
    address: 'Medical College Junction, Kozhikode',
    id_proof_type: 'Aadhaar Card',
    id_proof_number: 'XXXX-XXXX-4812',
    id_proof_photo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
  };

  // Hotel noon-to-noon billing calculation
  const billingInfo = calculateCheckoutBilling({
    checkInDate: booking.check_in_date,
    plannedNights: booking.nights || 1,
    checkoutTimestamp: new Date()
  });

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [localNights, setLocalNights] = useState(() => Math.max(booking.nights || 1, billingInfo.billableNights));
  const [extensionMessage, setExtensionMessage] = useState('');

  // Discount / Concession state
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [discountValue, setDiscountValue] = useState(() => booking.discount_amount || 0);
  const [discountReason, setDiscountReason] = useState(() => booking.discount_reason || '');

  // When booking prop updates, keep localNights synced with noon-to-noon calculation
  useEffect(() => {
    if (booking.booking_type !== 'day_use') {
      const updatedBilling = calculateCheckoutBilling({
        checkInDate: booking.check_in_date,
        plannedNights: booking.nights || 1,
        checkoutTimestamp: new Date()
      });
      setLocalNights(Math.max(booking.nights || 1, updatedBilling.billableNights));
    }
  }, [booking.nights, booking.check_in_date, booking.booking_type]);

  const isDayUse = booking.booking_type === 'day_use';
  const nights = isDayUse ? 0 : (localNights || 1);
  const rateApplied = booking.rate_applied || 2000;
  const grossRoomCharge = isDayUse ? rateApplied : (rateApplied * (nights || 1));

  // Calculate discount amount
  let calculatedDiscount = 0;
  if (discountType === 'percent') {
    calculatedDiscount = Math.round((grossRoomCharge * (Number(discountValue) || 0)) / 100);
  } else {
    calculatedDiscount = Math.min(grossRoomCharge, Math.max(0, Number(discountValue) || 0));
  }

  const taxableRoomCharge = Math.max(0, grossRoomCharge - calculatedDiscount);

  // Compute GST on taxable room charge
  const gstCalc = typeof calculateGST === 'function'
    ? calculateGST(taxableRoomCharge > 0 ? (taxableRoomCharge / nights) : 0, nights)
    : {
      gstRate: 12,
      cgstRate: 6,
      sgstRate: 6,
      gstAmount: Math.round(taxableRoomCharge * 0.12),
      cgstAmount: Math.round(taxableRoomCharge * 0.06),
      sgstAmount: Math.round(taxableRoomCharge * 0.06)
    };

  const grandTotal = taxableRoomCharge + gstCalc.gstAmount;
  const advancePaid = booking.advance_paid || 0;
  const balanceDue = Math.max(0, grandTotal - advancePaid);

  // Extend Stay by +1 Day / +2 Days
  const handleExtend = (extraDays) => {
    const newTotalNights = nights + extraDays;
    setLocalNights(newTotalNights);
    setExtensionMessage(`Extended by +${extraDays} Day. Total Stay: ${newTotalNights} Days.`);

    try {
      confetti({
        particleCount: 35,
        spread: 50,
        colors: ['#3FCF8E', '#C9A24B']
      });
    } catch (e) { }

    if (typeof onExtendStay === 'function') {
      onExtendStay(room.id, extraDays);
    }
  };

  const handleShareWhatsApp = () => {
    const hotelName = property?.name || 'Taj Residency';
    const guestName = guest?.name || 'Valued Guest';
    const roomNum = room?.room_number || 'Room';

    const discountLine = calculatedDiscount > 0
      ? `🏷️ *Discount / Concession:* -₹${calculatedDiscount.toLocaleString('en-IN')}${discountReason ? ` (${discountReason})` : ''}\n`
      : '';

    const msg = `🏛️ *${hotelName.toUpperCase()} — TAX INVOICE & RECEIPT*
_Room ${roomNum} (${booking.ac_or_non_ac})_

Dear *${guestName}*,
Thank you for staying at Taj Residency, Kozhikode. Here is your final billing summary:

📋 *Gross Room Tariff (${nights} Days @ ₹${rateApplied}):* ₹${grossRoomCharge.toLocaleString('en-IN')}
${discountLine}📊 *Taxable Value:* ₹${taxableRoomCharge.toLocaleString('en-IN')}
📊 *GST (CGST ${gstCalc.cgstRate}% + SGST ${gstCalc.sgstRate}%):* ₹${gstCalc.gstAmount.toLocaleString('en-IN')}
💰 *Total Bill (GST Inclusive):* ₹${grandTotal.toLocaleString('en-IN')}
💳 *Advance Received:* ₹${advancePaid.toLocaleString('en-IN')}
✅ *Final Balance Settled (${paymentMode}):* ₹${balanceDue.toLocaleString('en-IN')}

GSTIN: ${property?.gst_number || '32AABCT9988Q1Z4'}
SAC Code: 996311 (Hotel Accommodation)

_We look forward to welcoming you back to Calicut!_`;

    const cleanPhone = (guest?.phone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExecuteCheckout = () => {
    const checkoutFn = onFinalizeCheckout || onCheckoutAndGenerateInvoice;
    let inv = null;
    if (typeof checkoutFn === 'function') {
      inv = checkoutFn(room.id, {
        paymentMode,
        notes: checkoutNotes,
        discountAmount: calculatedDiscount,
        discountType,
        discountReason: discountReason || 'Counter Courtesy Discount'
      });
    }
    const previewFn = onPreviewInvoice || onOpenPrintInvoice;
    if (inv && typeof previewFn === 'function') {
      previewFn(inv);
    }
    onClose();
  };

  // Esc key listener for fast back-navigation
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

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[94vh]">

        {/* Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3.5 bg-panel border-b border-brass-soft/30 flex items-center justify-between modal-header-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-ink hover:bg-panel text-brass hover:text-white border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
              title="Back to room grid"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink border border-brass flex items-center justify-center text-brass font-display font-bold text-base sm:text-lg shadow-md shadow-brass/20 shrink-0">
              {room.room_number}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                  Checkout — {guest?.name || 'In-House Guest'}
                </h2>
                {guest?.id_proof_photo_url && (
                  <button
                    type="button"
                    onClick={() => onViewIdPhoto && onViewIdPhoto(guest.id_proof_photo_url, `${guest.name}'s ${guest.id_proof_type}`)}
                    className="px-1.5 py-0.5 rounded bg-signal-green/15 text-signal-green hover:bg-signal-green/30 text-[9px] font-mono font-bold border border-signal-green/30 flex items-center gap-1 shrink-0"
                    title="Click to inspect guest ID proof"
                  >
                    <span>✓ ID</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                {guest?.id_proof_type || 'Govt ID'}: {guest?.id_proof_number || 'VERIFIED'} • {property.name || 'Taj Residency'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30 shrink-0"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Billing Body with Native Touch Momentum Scroll */}
        <div className="p-4 sm:p-5 space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain touch-scroll text-xs">

          {/* Hotel Standard Noon-to-Noon Billing Schedule OR Fresh-Up Schedule */}
          {isDayUse ? (
            <div className="bg-ink p-3.5 rounded-xl border border-amber-500/40 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold flex items-center gap-1.5 uppercase">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Fresh-Up Stay: {booking.duration_hours || 2} Hours ({booking.group_size || 1} Pax)</span>
                </span>
                <span className="text-slate-400 text-[11px]">
                  ₹{rateApplied} total • {booking.ac_or_non_ac}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-panel border border-amber-500/20 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Check-in Time:</span>
                  <span className="text-white font-semibold">{booking.check_in_date || 'Today'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Departure Due:</span>
                  <span className="text-amber-300 font-bold">{booking.check_out_date || 'Today'}</span>
                </div>
              </div>

              <div className="px-2.5 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Short-duration fresh-up stay &bull; Flat per-person tiered tariff</span>
              </div>
            </div>
          ) : (
            <div className="bg-ink p-3.5 rounded-xl border border-brass-soft/40 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brass font-bold flex items-center gap-1.5 uppercase">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Stay Duration: {nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                </span>
                <span className="text-slate-400 text-[11px]">
                  ₹{rateApplied}/night • {booking.ac_or_non_ac}
                </span>
              </div>

              {/* Check-in & Noon Checkout Deadline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-panel border border-brass-soft/20 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Check-in Date & Time:</span>
                  <span className="text-white font-semibold">{booking.check_in_date || 'Today'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Checkout Due (12:00 PM Noon):</span>
                  <span className="text-brass font-bold">{billingInfo.scheduledDeadlineDisplay}</span>
                </div>
              </div>

              {/* Overdue / On-Time Banner */}
              {billingInfo.isOverdue ? (
                <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                    <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Late Checkout Charge Applied (+{billingInfo.extraNights} Night)</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 font-sans">
                    Actual checkout is past the 12:00 PM standard deadline. In accordance with noon-to-noon hotel billing policy, stay has been rounded up to {billingInfo.billableNights} full nights.
                  </p>
                </div>
              ) : (
                <div className="px-2.5 py-1.5 rounded-lg bg-signal-green/10 border border-signal-green/30 text-signal-green text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>On Time: Within 12:00 PM standard checkout deadline.</span>
                </div>
              )}

              {/* Extend Stay Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-brass-soft/20">
                <span className="text-[10px] text-slate-400">Manual Extend:</span>
                <button
                  type="button"
                  onClick={() => handleExtend(1)}
                  className="py-1.5 px-3 rounded-lg bg-brass text-ink font-mono font-bold text-xs hover:brightness-110 shadow-sm shadow-brass/20 flex items-center gap-1 active:scale-95 transition-all"
                >
                  <span>+1 Night ({formatCurrency(rateApplied)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExtend(2)}
                  className="py-1.5 px-3 rounded-lg bg-panel hover:bg-ink text-slate-200 border border-brass-soft/40 font-mono font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                >
                  <span>+2 Nights ({formatCurrency(rateApplied * 2)})</span>
                </button>
              </div>

              {extensionMessage && (
                <div className="text-[11px] text-signal-green flex items-center gap-1 animate-in fade-in">
                  <Sparkles className="w-3 h-3" />
                  <span>{extensionMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* User Request: Billing Discount & Concession Tool */}
          <div className="bg-panel p-3.5 rounded-xl border border-brass/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-brass font-bold flex items-center gap-1.5 uppercase">
                <Tag className="w-3.5 h-3.5 text-brass" />
                <span>Special Discount & Concession</span>
              </span>
              {calculatedDiscount > 0 && (
                <span className="text-signal-green font-bold text-[11px]">
                  - {formatCurrency(calculatedDiscount)} Applied
                </span>
              )}
            </div>

            {/* Quick 1-Click Preset Discounts */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { label: '₹0 (No Disc)', type: 'flat', val: 0 },
                { label: '₹200 Off', type: 'flat', val: 200 },
                { label: '₹500 Off', type: 'flat', val: 500 },
                { label: '₹1,000 Off', type: 'flat', val: 1000 },
                { label: '10% Off', type: 'percent', val: 10 },
                { label: '15% Off', type: 'percent', val: 15 }
              ].map((preset) => {
                const isSelected = discountType === preset.type && Number(discountValue) === preset.val;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setDiscountType(preset.type);
                      setDiscountValue(preset.val);
                      if (preset.val > 0 && !discountReason) {
                        setDiscountReason(preset.type === 'percent' ? `${preset.val}% Courtesy Offer` : `₹${preset.val} Special Discount`);
                      } else if (preset.val === 0) {
                        setDiscountReason('');
                      }
                    }}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold transition-all text-center border ${isSelected
                        ? 'bg-brass text-ink border-brass shadow-sm'
                        : 'bg-ink border-brass-soft/30 text-slate-300 hover:text-white hover:border-brass-soft'
                      }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Discount Input + Reason Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
              <div className="sm:col-span-5 flex items-center gap-1.5">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="bg-ink border border-brass-soft/40 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-brass shrink-0"
                >
                  <option value="flat">₹ Flat (INR)</option>
                  <option value="percent">% Percent</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percent' ? 100 : grossRoomCharge}
                  value={discountValue || ''}
                  placeholder="0"
                  onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-ink border border-brass-soft/40 rounded-lg px-2.5 py-1 text-white font-mono font-bold text-xs focus:outline-none focus:border-brass"
                />
              </div>

              <div className="sm:col-span-7">
                <input
                  type="text"
                  placeholder="Reason (e.g. Corporate Courtesy, Owner Special, Long Stay)"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full bg-ink border border-brass-soft/40 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-brass"
                />
              </div>
            </div>
          </div>

          {/* Itemized Table with Live Discount Breakdown */}
          <div className="bg-ink rounded-xl border border-brass-soft/30 overflow-hidden font-mono">
            <div className="bg-panel p-2.5 text-[10px] uppercase text-slate-400 font-bold border-b border-brass-soft/20 flex justify-between">
              <span>Itemized Charge Particulars</span>
              <span>SAC: 996311</span>
            </div>

            <div className="p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-200">
                <span>
                  Gross Room Tariff ({booking.ac_or_non_ac}) × {nights} {nights === 1 ? 'Day' : 'Days'} @ ₹{rateApplied}
                </span>
                <span className="font-bold text-white">{formatCurrency(grossRoomCharge)}</span>
              </div>

              {/* Discount Deduction Line */}
              {calculatedDiscount > 0 && (
                <div className="flex justify-between items-center text-signal-green text-xs font-bold pl-3 border-l-2 border-signal-green">
                  <span>
                    Concession / Discount {discountReason ? `(${discountReason})` : ''}:
                  </span>
                  <span>- {formatCurrency(calculatedDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Net Taxable Room Charge:</span>
                <span className="text-white font-semibold">{formatCurrency(taxableRoomCharge)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-[11px] pl-3 border-l border-brass-soft/30">
                <span>Central GST ({gstCalc.cgstRate}%):</span>
                <span>{formatCurrency(gstCalc.cgstAmount)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-[11px] pl-3 border-l border-brass-soft/30">
                <span>State GST ({gstCalc.sgstRate}%):</span>
                <span>{formatCurrency(gstCalc.sgstAmount)}</span>
              </div>

              <div className="border-t border-brass-soft/20 pt-2 flex justify-between items-center font-bold text-sm text-brass">
                <span>Grand Total (GST Inclusive):</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>

              {advancePaid > 0 && (
                <div className="flex justify-between items-center text-signal-green text-xs pt-1">
                  <span>Advance Deposit Received:</span>
                  <span>- {formatCurrency(advancePaid)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Final Settlement Box */}
          <div className="bg-panel p-4 rounded-xl border border-brass/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">
                Net Payable at Counter
              </div>
              <div className="text-2xl font-mono font-bold text-signal-green">
                {formatCurrency(balanceDue)}
              </div>
            </div>

            <div className="text-right space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400 block">
                Settlement Payment Mode
              </label>
              <div className="flex items-center gap-1.5">
                {['UPI', 'Cash', 'Card'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${paymentMode === mode
                        ? 'bg-brass text-ink shadow-md shadow-brass/20'
                        : 'bg-ink border border-brass-soft/30 text-slate-400 hover:text-white'
                      }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Pinned Action Footer with Safe Area */}
        <div className="shrink-0 p-3 sm:p-4 bg-panel border-t border-brass-soft/30 pb-safe space-y-2 shadow-lg z-20">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-2 rounded-xl bg-ink hover:bg-panel border border-brass-soft/30 text-slate-300 hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-2.5 px-2 rounded-xl bg-signal-green/20 hover:bg-signal-green text-signal-green hover:text-ink border border-signal-green/40 font-mono font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 truncate"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleExecuteCheckout}
              className="py-2.5 px-2 rounded-xl bg-brass text-ink font-mono font-bold text-xs shadow-lg shadow-brass/20 hover:brightness-110 active:scale-95 flex items-center justify-center gap-1 transition-all truncate"
            >
              <Receipt className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
              <span className="truncate">Settle</span>
            </button>
          </div>
          <div className="text-center font-mono text-[9px] text-slate-500 hidden sm:block">
            Kerala State GST SAC: 996311 • Room switches to DIRTY for Housekeeping turnover
          </div>
        </div>
      </div>
    </div>
  );
}
