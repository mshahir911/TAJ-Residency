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
  Minus,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  User,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOM_TYPES } from '../types/data';
import { formatCurrency } from '../utils/formatters';
import IdPhotoCaptureWidget from './IdPhotoCaptureWidget';

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
  onCalculateGST,
  onViewIdPhoto
}) {
  const vacantRooms = rooms.filter(r => r.status === 'vacant' || r.status === 'ready' || r.status === 'reserved');
  const targetInitial = propSelectedRoom || preselectedRoom || vacantRooms[0] || rooms[0] || { id: 'room-202', room_number: '202', room_type_id: 'classic' };

  const [step, setStep] = useState(1); // 1: Stay & Room, 2: Guest Info, 3: ID Capture, 4: Payment
  const [isAllInOne, setIsAllInOne] = useState(false); // Toggle between 4-Step Guided vs 1-Page Rapid

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
  const [idPhotoBackUrl, setIdPhotoBackUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [returningGuestFound, setReturningGuestFound] = useState(null);

  const phoneLookup = onLookupPhone || onFindGuestByPhone;

  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (step > 1 && !isAllInOne) {
          setStep(prev => prev - 1);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, isAllInOne, onClose]);

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
        setIdPhotoBackUrl(match.id_proof_back_photo_url || '');
        setNotes(match.notes || 'Returning guest');
      } else {
        setReturningGuestFound(null);
      }
    } else {
      setReturningGuestFound(null);
    }
  }, [phone, phoneLookup]);

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

  const validateStep = (current) => {
    if (current === 1) {
      if (!roomId) {
        alert('Please select a room');
        return false;
      }
    }
    if (current === 2) {
      if (!phone || phone.trim().length < 8) {
        alert('Please enter a valid guest mobile number');
        return false;
      }
      if (!name || name.trim().length < 2) {
        alert('Please enter the guest full name');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = (e) => {
    e?.preventDefault();
    if (validateStep(step)) {
      setStep(prev => Math.min(4, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!name || !phone) {
      alert('Please fill guest name and mobile number');
      setStep(2);
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
        guestIdBackPhotoUrl: idPhotoBackUrl,
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

  const stepsList = [
    { num: 1, label: 'Stay & Room', icon: Calendar },
    { num: 2, label: 'Guest Info', icon: User },
    { num: 3, label: 'ID Capture', icon: Camera },
    { num: 4, label: 'Payment', icon: Coins }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        
        {/* Modal Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 p-3 sm:p-4 bg-panel border-b border-brass-soft/30 flex items-center justify-between pt-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Dedicated Top Back Button (Always accessible on Mobile) */}
            <button
              type="button"
              onClick={() => {
                if (step > 1 && !isAllInOne) {
                  handlePrevStep();
                } else {
                  onClose();
                }
              }}
              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-ink hover:bg-panel text-brass hover:text-white border border-brass-soft/40 font-mono text-xs font-bold transition-all shrink-0 active:scale-95"
              title={step > 1 && !isAllInOne ? "Go back to previous step" : "Close modal and return to room grid"}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="text-xs">{step > 1 && !isAllInOne ? 'Back' : 'Close'}</span>
            </button>

            <div className="w-8 h-8 rounded-lg bg-brass text-ink font-bold flex items-center justify-center font-display text-base shadow-md shadow-brass/20 shrink-0 hidden sm:flex">
              TR
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-white text-base sm:text-lg leading-tight truncate">
                {isPreBooking ? 'Advance Reservation' : 'Walk-In Check-In'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                Room {selectedRoom?.room_number || '202'} • {isAllInOne ? '1-Page Mode' : `Step ${step} of 4`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1-Page vs 4-Step Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsAllInOne(prev => !prev)}
              className="text-[10px] font-mono px-2 py-1 rounded bg-panel text-slate-300 hover:text-white border border-brass-soft/30 transition-colors hidden xs:inline-block"
              title="Toggle between Step-by-Step and 1-Page view"
            >
              {isAllInOne ? '📋 Steps' : '⚡ 1-Page'}
            </button>

            {/* Walk-in vs Pre-booking toggle */}
            <div className="bg-ink p-0.5 sm:p-1 rounded-lg border border-brass-soft/40 flex text-[10px] font-mono shrink-0">
              <button
                type="button"
                onClick={() => setIsPreBooking(false)}
                className={`px-2 sm:px-2.5 py-1 rounded transition-all font-bold ${
                  !isPreBooking ? 'bg-brass text-ink shadow' : 'text-slate-400'
                }`}
              >
                Walk-In
              </button>
              <button
                type="button"
                onClick={() => setIsPreBooking(true)}
                className={`px-2 sm:px-2.5 py-1 rounded transition-all font-bold ${
                  isPreBooking ? 'bg-signal-amber text-ink shadow' : 'text-slate-400'
                }`}
              >
                Advance
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-panel hover:bg-ink text-slate-400 hover:text-white flex items-center justify-center border border-brass-soft/30 transition-colors shrink-0"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Indicator Header (Step Mode) */}
        {!isAllInOne && (
          <div className="shrink-0 bg-ink/80 border-b border-brass-soft/20 px-3 sm:px-4 py-2 flex items-center justify-between text-xs font-mono select-none overflow-x-auto">
            {stepsList.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <button
                    type="button"
                    onClick={() => {
                      if (s.num < step || validateStep(step)) {
                        setStep(s.num);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all shrink-0 ${
                      isActive
                        ? 'bg-brass text-ink font-bold shadow-sm'
                        : isPast
                        ? 'text-signal-green hover:bg-panel'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-ink text-brass' : (isPast ? 'bg-signal-green/20 text-signal-green' : 'bg-panel-raised text-slate-400')
                    }`}>
                      {isPast ? '✓' : s.num}
                    </span>
                    <span className="text-[11px]">{s.label}</span>
                  </button>
                  {idx < stepsList.length - 1 && (
                    <span className="text-slate-600 px-1">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Scrollable Form Container with Pinned Bottom Action Bar */}
        <form
          id="walkin-booking-form"
          onSubmit={step === 4 || isAllInOne ? handleSubmit : handleNextStep}
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          {/* Scrollable Body with Native Touch Scrolling */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-5 space-y-4 text-xs">
          
          {/* STEP 1: STAY DURATION & ROOM SELECTION */}
          {(isAllInOne || step === 1) && (
            <div className="space-y-4 animate-in fade-in">
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

              {/* Day-based duration selection */}
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
            </div>
          )}

          {/* STEP 2: GUEST RECORDS & PHONE LOOKUP */}
          {(isAllInOne || step === 2) && (
            <div className="space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-brass uppercase font-bold flex items-center gap-1">
                  <Search className="w-3.5 h-3.5" />
                  <span>Guest Records & Profile</span>
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
                <div className="space-y-1">
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

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                    ID Number / Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. XXXX-XXXX-4812"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full bg-ink border border-brass-soft/40 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-brass"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: GOVERNMENT ID PHOTO CAPTURE */}
          {(isAllInOne || step === 3) && (
            <div className="space-y-2 animate-in fade-in">
              <IdPhotoCaptureWidget
                frontPhotoUrl={idPhotoUrl}
                backPhotoUrl={idPhotoBackUrl}
                idType={idType}
                guestPhone={phone}
                onChangeFront={(url) => setIdPhotoUrl(url)}
                onChangeBack={(url) => setIdPhotoBackUrl(url)}
                onViewFullscreen={(img, t) => onViewIdPhoto && onViewIdPhoto(img, t)}
              />
            </div>
          )}

          {/* STEP 4: ADVANCE PAYMENT & CONFIRMATION */}
          {(isAllInOne || step === 4) && (
            <div className="space-y-3 animate-in fade-in">
              {/* Advance Deposit & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Auto Bill Computation Summary Box */}
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
            </div>
          )}

          </div>

          {/* Pinned Bottom Action Bar with Complete Back-Navigation & Safe Area */}
          <div className="shrink-0 p-3 sm:p-4 bg-panel border-t border-brass-soft/30 pb-safe flex items-center justify-between gap-3 shadow-lg z-20">
            {/* Left Button: Cancel or Back Step */}
            {!isAllInOne && step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="py-2.5 px-4 rounded-xl bg-ink hover:bg-panel border border-brass-soft/40 text-slate-200 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-ink hover:bg-panel border border-brass-soft/30 text-slate-400 hover:text-white font-mono text-xs font-bold transition-all active:scale-95 shrink-0"
              >
                Cancel
              </button>
            )}

            {/* Right Button: Continue Step or Final Check-In */}
            {!isAllInOne && step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="py-2.5 px-5 sm:px-6 rounded-xl bg-brass text-ink font-bold text-xs font-mono hover:brightness-110 shadow-lg shadow-brass/20 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span>Continue to {stepsList[step].label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="py-2.5 px-5 sm:px-6 rounded-xl bg-signal-green text-ink font-bold text-xs font-mono hover:brightness-110 shadow-xl shadow-signal-green/20 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span className="truncate">
                  {isPreBooking ? 'Confirm Reservation' : `Check In (${totalNights} ${totalNights === 1 ? 'Day' : 'Days'} • Rm ${selectedRoom?.room_number || '202'})`}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
