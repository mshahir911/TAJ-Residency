import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  CreditCard,
  Percent,
  Calendar,
  Phone,
  FileText,
  Sparkles,
  Wind,
  Fan,
  Check,
  Building2,
  Camera,
  Search,
  Clock,
  Plus,
  Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOM_TYPES } from '../types/data';
import { formatCurrency } from '../utils/formatters';

export default function WalkInModal({
  isOpen,
  onClose,
  rooms = [],
  selectedRoom: propSelectedRoom,
  preselectedRoom,
  onSaveBooking,
  onSubmit,
  onLookupPhone,
  onFindGuestByPhone,
  getRateForRoom,
  calculateGST,
  onCalculateGST
}) {
  if (!isOpen) return null;

  const vacantRooms = rooms.filter(r => r.status === 'vacant' || r.status === 'ready' || r.status === 'reserved');
  const targetInitial = propSelectedRoom || preselectedRoom || vacantRooms[0] || rooms[0] || { id: 'room-202', room_number: '202', room_type_id: 'classic' };

  const [roomId, setRoomId] = useState(targetInitial?.id || '');
  const selectedRoom = rooms.find(r => r.id === roomId) || targetInitial;
  const roomType = (ROOM_TYPES && ROOM_TYPES[selectedRoom?.room_type_id]) || ROOM_TYPES?.deluxe || { name: 'Standard Room', ac_rate: 2000, non_ac_rate: 1500 };

  // Keep synced if preselected room changes
  useEffect(() => {
    if (propSelectedRoom?.id) {
      setRoomId(propSelectedRoom.id);
    } else if (preselectedRoom?.id) {
      setRoomId(preselectedRoom.id);
    }
  }, [propSelectedRoom, preselectedRoom]);

  // Booking details & Climate
  const [acOrNonAc, setAcOrNonAc] = useState('AC'); // 'AC' | 'Non-AC'
  const [isPreBooking, setIsPreBooking] = useState(false);

  // Day-based duration selection (1 Day, 2 Days, 3 Days, Custom)
  const [stayDays, setStayDays] = useState(1);
  const [isCustomDays, setIsCustomDays] = useState(false);

  const [advancePaid, setAdvancePaid] = useState(1000);
  const [paymentMode, setPaymentMode] = useState('Cash');

  // Guest details (with returning-guest phone prefill)
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoUrl, setIdPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [returningGuestFound, setReturningGuestFound] = useState(null);

  const phoneLookup = onLookupPhone || onFindGuestByPhone;

  // Phone lookup effect
  useEffect(() => {
    if (phone && phone.length >= 8 && typeof phoneLookup === 'function') {
      const match = phoneLookup(phone);
      if (match) {
        setReturningGuestFound(match);
        setName(match.name || '');
        setAddress(match.address || '');
        setIdType(match.id_proof_type || 'Aadhaar Card');
        setIdNumber(match.id_proof_number || '');
        setIdPhotoUrl(match.id_proof_photo_url || '');
        setNotes(match.notes || 'Returning guest');
      } else {
        setReturningGuestFound(null);
      }
    } else {
      setReturningGuestFound(null);
    }
  }, [phone]);

  // Live Rate & Calculation based on stayDays (1 Day, 2 Days, etc.)
  const rateResult = typeof getRateForRoom === 'function' 
    ? getRateForRoom(selectedRoom?.room_type_id, acOrNonAc) 
    : (acOrNonAc === 'AC' ? roomType.ac_rate : roomType.non_ac_rate);
    
  const nightlyRate = typeof rateResult === 'object' && rateResult !== null 
    ? (rateResult.rate || 2000) 
    : (Number(rateResult) || 2000);

  const isSeasonalSurge = typeof rateResult === 'object' && rateResult !== null ? rateResult.isOverridden : false;
  const seasonalName = typeof rateResult === 'object' && rateResult !== null ? rateResult.overrideName : null;

  const totalNights = Math.max(1, Number(stayDays) || 1);

  const gstCalcFn = calculateGST || onCalculateGST;
  const gstCalc = typeof gstCalcFn === 'function'
    ? gstCalcFn(nightlyRate, totalNights)
    : {
        gstRate: 12,
        gstAmount: Math.round(nightlyRate * totalNights * 0.12),
        totalRoomCharge: nightlyRate * totalNights,
        grandTotal: Math.round(nightlyRate * totalNights * 1.12)
      };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Please fill guest name and mobile number');
      return;
    }

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        colors: ['#C9A24B', '#3FCF8E', '#FFFFFF']
      });
    } catch (err) {}

    const now = new Date();
    const checkInStr = now.toISOString().replace('T', ' ').slice(0, 16);
    const checkOutDateObj = new Date(now.getTime() + totalNights * 24 * 60 * 60 * 1000);
    const checkOutStr = checkOutDateObj.toISOString().replace('T', ' ').slice(0, 16);

    const saveFn = onSaveBooking || onSubmit;
    if (typeof saveFn === 'function') {
      saveFn({
        roomId: selectedRoom?.id || roomId,
        guestName: name,
        guestPhone: phone,
        guestAddress: address,
        guestIdType: idType,
        guestIdNumber: idNumber || 'VERIFIED-DESK',
        guestIdPhotoUrl: idPhotoUrl,
        guestNotes: notes,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        nights: totalNights,
        acOrNonAc,
        advancePaid: Number(advancePaid || 0),
        paymentMode,
        isPreBooking
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border border-brass/50 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brass text-ink font-bold flex items-center justify-center font-display text-lg shadow-md shadow-brass/20">
              TR
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg leading-none">
                {isPreBooking ? 'Advance Reservation' : 'Fast Walk-In Check-In'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Taj Residency • Direct Ledger Replacement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Walk-in vs Pre-booking toggle */}
            <div className="bg-ink p-1 rounded-lg border border-brass-soft/40 flex text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setIsPreBooking(false)}
                className={`px-2.5 py-1 rounded transition-all font-bold ${
                  !isPreBooking ? 'bg-brass text-ink shadow' : 'text-slate-400'
                }`}
              >
                Instant Walk-In
              </button>
              <button
                type="button"
                onClick={() => setIsPreBooking(true)}
                className={`px-2.5 py-1 rounded transition-all font-bold ${
                  isPreBooking ? 'bg-signal-amber text-ink shadow' : 'text-slate-400'
                }`}
              >
                Advance Booking
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Room Selection & Climate Type Banner */}
          <div className="bg-ink p-4 rounded-xl border border-brass-soft/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Select Room
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-panel border border-brass-soft rounded-lg px-3 py-1.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-brass"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room {r.room_number} (Floor {r.floor} • {r.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* AC / Non-AC Switcher */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Climate Type & Tariff
                </label>
                <div className="flex items-center gap-1 bg-panel p-1 rounded-lg border border-brass-soft/30">
                  <button
                    type="button"
                    onClick={() => setAcOrNonAc('AC')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                      acOrNonAc === 'AC'
                        ? 'bg-signal-green text-ink shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Wind className="w-3.5 h-3.5" />
                    <span>AC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcOrNonAc('Non-AC')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                      acOrNonAc === 'Non-AC'
                        ? 'bg-slate-300 text-ink shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Fan className="w-3.5 h-3.5" />
                    <span>Non-AC</span>
                  </button>
                </div>
              </div>

              {/* Rate per day */}
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-slate-400">
                  {isSeasonalSurge ? 'Seasonal Tariff' : 'Daily Tariff'}
                </div>
                <div className="text-xl font-mono font-bold text-brass flex items-center gap-1 justify-end">
                  <span>{formatCurrency(nightlyRate)}</span>
                  <span className="text-xs font-normal text-slate-400">/ day</span>
                </div>
                {isSeasonalSurge && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-signal-green/20 text-signal-green font-bold">
                    ⚡ {seasonalName || 'Surge Active'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* User Request: 1 Day, 2 Days, 3 Days and Custom Duration Selector */}
          <div className="bg-panel p-3.5 rounded-xl border border-brass/40 space-y-2">
            <label className="text-[11px] font-mono uppercase text-brass font-bold flex items-center justify-between">
              <span>Stay Duration & Days</span>
              <span className="text-white text-xs font-bold">
                {totalNights} {totalNights === 1 ? 'Day (24 hrs)' : 'Days'}
              </span>
            </label>

            {/* Quick 1 Day / 2 Days / 3 Days / Custom Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { days: 1, label: '1 Day (24 hrs)' },
                { days: 2, label: '2 Days' },
                { days: 3, label: '3 Days' },
                { days: 'custom', label: 'Custom Days' }
              ].map((item) => {
                const isSelected = item.days === 'custom' ? isCustomDays : (!isCustomDays && stayDays === item.days);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.days === 'custom') {
                        setIsCustomDays(true);
                      } else {
                        setIsCustomDays(false);
                        setStayDays(item.days);
                      }
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all text-center border ${
                      isSelected
                        ? 'bg-brass text-ink border-brass shadow-md shadow-brass/20 scale-[1.02]'
                        : 'bg-ink border-brass-soft/30 text-slate-300 hover:text-white hover:border-brass-soft'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Stepper Input if Custom Days selected */}
            {isCustomDays && (
              <div className="pt-2 flex items-center justify-between bg-ink p-2.5 rounded-lg border border-brass-soft/30 animate-in fade-in">
                <span className="text-[11px] font-mono text-slate-300">Enter Number of Days:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStayDays(p => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-lg bg-panel hover:bg-brass hover:text-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={stayDays}
                    onChange={(e) => setStayDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 bg-panel border border-brass-soft rounded-lg py-1 text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-brass"
                  />
                  <span className="text-xs font-mono text-slate-400">Days</span>
                  <button
                    type="button"
                    onClick={() => setStayDays(p => p + 1)}
                    className="w-7 h-7 rounded-lg bg-panel hover:bg-brass hover:text-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Guest Identification (Fast Phone Lookup) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-brass uppercase font-bold flex items-center gap-1">
                <Search className="w-3.5 h-3.5" />
                <span>Guest Records & ID Verification</span>
              </span>
              {returningGuestFound && (
                <span className="text-signal-green flex items-center gap-1 text-[10px] font-bold animate-in fade-in">
                  <Sparkles className="w-3 h-3" />
                  <span>Returning Guest Recognized ({returningGuestFound.total_stays} stays)</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone input with instant auto-complete */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Mobile Number (Fast Lookup) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98470 11223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-ink border border-brass-soft rounded-lg pl-9 pr-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brass"
                  />
                </div>
              </div>

              {/* Guest Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Vivek Menon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-brass"
                />
              </div>
            </div>

            {/* Address & ID Proof Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Address / Origin City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Medical College Junction, Kozhikode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-ink border border-brass-soft/40 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  ID Proof Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full bg-ink border border-brass-soft/40 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brass"
                >
                  <option>Aadhaar Card</option>
                  <option>Driving License</option>
                  <option>Passport</option>
                  <option>Voter ID</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advance Deposit & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                Advance Deposit (₹)
              </label>
              <input
                type="number"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(e.target.value)}
                className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-signal-green font-mono font-bold text-sm focus:outline-none focus:border-brass"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                Advance Payment Method
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['UPI', 'Cash', 'Card'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMode(m)}
                    className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                      paymentMode === m
                        ? 'bg-brass text-ink shadow'
                        : 'bg-ink border border-brass-soft/30 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto Bill Computation Summary Box (Calculated directly from Stay Days) */}
          <div className="p-3.5 bg-panel rounded-xl border border-brass-soft/30 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Tariff ({totalNights} {totalNights === 1 ? 'Day' : 'Days'} @ {formatCurrency(nightlyRate)}):</span>
              <span className="text-white font-bold">{formatCurrency(gstCalc.totalRoomCharge)}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Kerala GST ({gstCalc.gstRate}% - SAC 996311):</span>
              <span className="text-white font-bold">{formatCurrency(gstCalc.gstAmount)}</span>
            </div>
            <div className="flex justify-between text-brass text-sm font-bold border-t border-brass-soft/20 pt-1.5">
              <span>Estimated Grand Total ({totalNights} {totalNights === 1 ? 'Day' : 'Days'}):</span>
              <span>{formatCurrency(gstCalc.grandTotal)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brass text-ink font-bold text-sm font-mono hover:brightness-110 shadow-xl shadow-brass/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {isPreBooking ? 'Confirm Advance Reservation' : `Check In for ${totalNights} ${totalNights === 1 ? 'Day' : 'Days'} — Room ${selectedRoom?.room_number || '305'} (15s)`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
