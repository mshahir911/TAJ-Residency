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
  Coins,
  ChevronDown,
  ChevronUp,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOM_TYPES } from '../types/data';
import { formatCurrency } from '../utils/formatters';
import IdPhotoCaptureWidget from './IdPhotoCaptureWidget';

export default function WalkInModal({
  isOpen,
  onClose,
  rooms = [],
  guests = [],
  selectedRoom: propSelectedRoom,
  preselectedRoom,
  preselectedGuest = null,
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

  const [step, setStep] = useState(1);
  const [isAllInOne, setIsAllInOne] = useState(false);

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

  // Guest details
  const [phone, setPhone] = useState(preselectedGuest?.phone || '');
  const [name, setName] = useState(preselectedGuest?.name || '');
  const [address, setAddress] = useState(preselectedGuest?.address || '');
  const [idType, setIdType] = useState(preselectedGuest?.id_proof_type || 'Aadhaar Card');
  const [idNumber, setIdNumber] = useState(preselectedGuest?.id_proof_number || '');
  const [idPhotoUrl, setIdPhotoUrl] = useState(preselectedGuest?.id_proof_photo_url || '');
  const [idPhotoBackUrl, setIdPhotoBackUrl] = useState(preselectedGuest?.id_proof_back_photo_url || '');
  const [notes, setNotes] = useState(preselectedGuest?.notes || '');
  const [returningGuestFound, setReturningGuestFound] = useState(preselectedGuest || null);
  const [searchGuestInput, setSearchGuestInput] = useState('');
  const [isEditDetailsOpen, setIsEditDetailsOpen] = useState(false);

  const phoneLookup = onLookupPhone || onFindGuestByPhone;

  // Returning Guest Fast-Track determination
  const isFastTrack = Boolean(returningGuestFound);

  // Dynamic step structure: 2 Steps for Returning Guests (Room ➔ Payment), 4 Steps for New Guests
  const stepsList = isFastTrack
    ? [
        { num: 1, label: 'Stay & Room', icon: Calendar },
        { num: 2, label: 'Payment & Keys', icon: Coins }
      ]
    : [
        { num: 1, label: 'Stay & Room', icon: Calendar },
        { num: 2, label: 'Guest Info', icon: User },
        { num: 3, label: 'ID Capture', icon: Camera },
        { num: 4, label: 'Payment & Keys', icon: Coins }
      ];

  const totalSteps = stepsList.length;

  // Esc key listener for back-navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (step > 1 && !isAllInOne) {
          handlePrevStep();
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

  // Handle manual or automatic guest selection
  const applyGuestData = (guest) => {
    if (!guest) return;
    setReturningGuestFound(guest);
    setName(guest.name || '');
    setPhone(guest.phone || '');
    setAddress(guest.address || '');
    setIdType(guest.id_proof_type || 'Aadhaar Card');
    setIdNumber(guest.id_proof_number || '');
    setIdPhotoUrl(guest.id_proof_photo_url || '');
    setIdPhotoBackUrl(guest.id_proof_back_photo_url || '');
    setNotes(guest.notes || 'Returning guest');
  };

  const handleClearReturningGuest = () => {
    setReturningGuestFound(null);
    setName('');
    setPhone('');
    setAddress('');
    setIdNumber('');
    setIdPhotoUrl('');
    setIdPhotoBackUrl('');
    setSearchGuestInput('');
    setStep(1);
  };

  // Phone lookup effect
  useEffect(() => {
    if (phone && phone.length >= 8 && typeof phoneLookup === 'function') {
      const match = phoneLookup(phone);
      if (match) {
        applyGuestData(match);
      }
    }
  }, [phone, phoneLookup]);

  // Live Rate & Calculation based on stayDays
  const rateResult = typeof getRateForRoom === 'function' 
    ? getRateForRoom(selectedRoom?.room_type_id, acOrNonAc) 
    : (acOrNonAc === 'AC' ? roomType.ac_rate : roomType.non_ac_rate);
    
  const nightlyRate = typeof rateResult === 'object' && rateResult !== null 
    ? (rateResult.rate || 2000) 
    : (Number(rateResult) || 2000);

  const isSeasonalSurge = typeof rateResult === 'object' && rateResult !== null ? rateResult.isOverridden : false;
  const seasonalName = typeof rateResult === 'object' && rateResult !== null ? rateResult.overrideName : null;

  const totalNights = Math.max(1, Number(stayDays) || 1);

  // Auto-align default advance paid with calculated daily tariff
  useEffect(() => {
    if (nightlyRate > 0) {
      setAdvancePaid(nightlyRate);
    }
  }, [nightlyRate]);

  // GST Calculation
  const gstFn = calculateGST || onCalculateGST;
  const gstCalc = typeof gstFn === 'function'
    ? gstFn(nightlyRate, totalNights)
    : {
        taxableRoomCharge: nightlyRate * totalNights,
        gstRate: nightlyRate >= 2500 ? 12 : 0,
        cgstRate: nightlyRate >= 2500 ? 6 : 0,
        sgstRate: nightlyRate >= 2500 ? 6 : 0,
        gstAmount: nightlyRate >= 2500 ? Math.round(nightlyRate * totalNights * 0.12) : 0,
        grandTotal: nightlyRate >= 2500 ? Math.round(nightlyRate * totalNights * 1.12) : nightlyRate * totalNights
      };

  const validateStep = (currentStep) => {
    if (isFastTrack) {
      // In Fast-Track, step 1 is Stay & Room, step 2 is Payment
      if (currentStep === 1) {
        if (!roomId) {
          alert('Please select a room for check-in');
          return false;
        }
      }
      return true;
    }

    // Normal 4-Step Validation
    if (currentStep === 1) {
      if (!roomId) {
        alert('Please select a room for check-in');
        return false;
      }
    } else if (currentStep === 2) {
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
      setStep(prev => Math.min(totalSteps, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!name || !phone) {
      alert('Please fill guest name and mobile number');
      setStep(isFastTrack ? 1 : 2);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 modal-overlay animate-in fade-in duration-200">
      <div className="bg-panel-raised border-0 sm:border border-brass/50 rounded-none sm:rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/90 flex flex-col h-full sm:h-auto max-h-[100dvh] sm:max-h-[92vh]">
        
        {/* Modal Header with Mobile Back Button & Safe Area */}
        <div className="shrink-0 px-3 sm:px-4 py-2.5 sm:py-3.5 bg-panel border-b border-brass-soft/30 flex items-center justify-between modal-header-safe">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Top Back Button */}
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
              title={step > 1 && !isAllInOne ? "Go back to previous step" : "Close modal"}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="text-xs">{step > 1 && !isAllInOne ? 'Back' : 'Close'}</span>
            </button>

            <div className="w-8 h-8 rounded-lg bg-brass text-ink font-bold flex items-center justify-center font-display text-base shadow-md shadow-brass/20 shrink-0 hidden sm:flex">
              TR
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-display font-bold text-white text-base sm:text-lg leading-tight truncate">
                  {isPreBooking ? 'Advance Reservation' : (isFastTrack ? '⚡ Express Walk-In' : 'Walk-In Check-In')}
                </h2>
                {isFastTrack && (
                  <span className="px-1.5 py-0.5 rounded bg-signal-green/20 text-signal-green text-[9px] font-mono font-bold border border-signal-green/30 shrink-0">
                    FAST-TRACK (2 STEPS)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                Room {selectedRoom?.room_number || '202'} • {isAllInOne ? '1-Page Mode' : `Step ${step} of ${totalSteps}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

        {/* Form Container with Native Touch Scrolling */}
        <form
          id="walkin-booking-form"
          onSubmit={step === totalSteps || isAllInOne ? handleSubmit : handleNextStep}
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-scroll p-4 sm:p-5 space-y-4 text-xs">
          
            {/* STEP 1: STAY DURATION & ROOM SELECTION */}
            {(isAllInOne || step === 1) && (
              <div className="space-y-4 animate-in fade-in">
                {/* Returning Guest Quick Search Bar */}
                <div className="p-3 bg-panel rounded-xl border border-brass-soft/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-brass uppercase font-bold flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5" />
                      <span>Returning Guest Recognition</span>
                    </span>
                    {isFastTrack && (
                      <button
                        type="button"
                        onClick={handleClearReturningGuest}
                        className="text-slate-400 hover:text-white text-[10px] underline"
                      >
                        Reset to New Guest
                      </button>
                    )}
                  </div>

                  {!isFastTrack ? (
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-brass absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Type phone number or guest name (e.g. 9847123456)..."
                        value={searchGuestInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchGuestInput(val);
                          if (val.length >= 4 && typeof phoneLookup === 'function') {
                            const match = phoneLookup(val);
                            if (match) applyGuestData(match);
                          }
                        }}
                        className="w-full bg-ink border border-brass-soft rounded-lg pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-brass placeholder-slate-500"
                      />
                    </div>
                  ) : (
                    /* Returning Guest Recognized Badge */
                    <div className="p-3 bg-brass/10 border border-brass rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-brass text-ink font-bold font-display flex items-center justify-center text-sm shrink-0">
                          {returningGuestFound.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs sm:text-sm truncate">
                              {returningGuestFound.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-signal-green text-ink font-mono font-bold text-[9px] shrink-0">
                              ✓ ID ON FILE
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-brass mt-0.5 truncate">
                            📞 {returningGuestFound.phone} • {returningGuestFound.total_stays || 1} Past Stays • {returningGuestFound.id_proof_type || 'Aadhaar'} ({returningGuestFound.id_proof_number || 'VERIFIED'})
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearReturningGuest}
                        className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-panel border border-brass-soft/30 shrink-0"
                        title="Clear and register as new guest"
                      >
                        ✕ Clear
                      </button>
                    </div>
                  )}

                  {isFastTrack && (
                    <div className="text-[10px] font-mono text-signal-green flex items-center gap-1.5 pt-0.5">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Fast-Track Active: Guest info & ID capture skipped. Proceed directly to Amount step!</span>
                    </div>
                  )}
                </div>

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
                        {vacantRooms.map(r => (
                          <option key={r.id} value={r.id}>
                            Room {r.room_number} (Floor {r.floor} • {r.status.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                        Daily Tariff {isSeasonalSurge && <span className="text-signal-amber font-bold">({seasonalName || 'Seasonal Surge'})</span>}
                      </span>
                      <div className="text-xl font-bold font-mono text-brass">
                        {formatCurrency(nightlyRate)} <span className="text-xs text-slate-400 font-normal">/ day</span>
                      </div>
                    </div>
                  </div>

                  {/* Climate Toggle */}
                  <div className="pt-2 border-t border-brass-soft/20 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-slate-300">Climate Type:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <button
                        type="button"
                        onClick={() => setAcOrNonAc('AC')}
                        className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                          acOrNonAc === 'AC'
                            ? 'bg-brass text-ink border-brass shadow'
                            : 'bg-panel text-slate-400 border-brass-soft/40 hover:text-white'
                        }`}
                      >
                        <Wind className="w-3.5 h-3.5" />
                        <span>AC ({formatCurrency(roomType.ac_rate)})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAcOrNonAc('Non-AC')}
                        className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                          acOrNonAc === 'Non-AC'
                            ? 'bg-brass text-ink border-brass shadow'
                            : 'bg-panel text-slate-400 border-brass-soft/40 hover:text-white'
                        }`}
                      >
                        <Fan className="w-3.5 h-3.5" />
                        <span>Non-AC ({formatCurrency(roomType.non_ac_rate)})</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Day-Based Stay Duration Selection */}
                <div className="bg-ink p-4 rounded-xl border border-brass-soft/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      Stay Duration & Days
                    </label>
                    <span className="text-xs font-mono font-bold text-brass">
                      {totalNights} {totalNights === 1 ? 'Day (24 hrs)' : 'Days'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                    {[1, 2, 3].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setStayDays(days);
                          setIsCustomDays(false);
                        }}
                        className={`py-2 px-1 rounded-xl border font-bold transition-all text-center ${
                          stayDays === days && !isCustomDays
                            ? 'bg-brass text-ink border-brass shadow-md shadow-brass/20'
                            : 'bg-panel text-slate-300 border-brass-soft/30 hover:border-brass-soft'
                        }`}
                      >
                        <div>{days} {days === 1 ? 'Day' : 'Days'}</div>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsCustomDays(true)}
                      className={`py-2 px-1 rounded-xl border font-bold transition-all text-center ${
                        isCustomDays
                          ? 'bg-brass text-ink border-brass shadow-md shadow-brass/20'
                          : 'bg-panel text-slate-300 border-brass-soft/30 hover:border-brass-soft'
                      }`}
                    >
                      <div>Custom</div>
                    </button>
                  </div>

                  {isCustomDays && (
                    <div className="pt-2 flex items-center justify-between bg-panel p-2.5 rounded-lg border border-brass-soft/30 animate-in fade-in">
                      <span className="text-[11px] font-mono text-slate-300">Enter Number of Days:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStayDays(p => Math.max(1, p - 1))}
                          className="w-7 h-7 rounded-lg bg-ink hover:bg-brass hover:text-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={stayDays}
                          onChange={(e) => setStayDays(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-14 bg-ink border border-brass-soft rounded-lg py-1 text-center font-mono font-bold text-white text-sm focus:outline-none focus:border-brass"
                        />
                        <span className="text-xs font-mono text-slate-400">Days</span>
                        <button
                          type="button"
                          onClick={() => setStayDays(p => p + 1)}
                          className="w-7 h-7 rounded-lg bg-ink hover:bg-brass hover:text-ink text-white font-bold flex items-center justify-center border border-brass-soft"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 (NEW GUEST ONLY): GUEST RECORDS & PROFILE */}
            {(!isFastTrack && (isAllInOne || step === 2)) && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-brass uppercase font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>New Guest Information</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      Mobile Number *
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

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      Guest Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                      Residential Address / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Calicut, Kerala"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-ink border border-brass-soft rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 (NEW GUEST ONLY): ID CAPTURE & COMPLIANCE */}
            {(!isFastTrack && (isAllInOne || step === 3)) && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-brass uppercase font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-signal-green" />
                    <span>Government ID Capture (Police Compliance)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    Saved once &bull; Auto-linked forever
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">ID Document Type</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                    >
                      <option>Aadhaar Card</option>
                      <option>Driving License</option>
                      <option>Passport</option>
                      <option>Voter ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">ID Document Number</label>
                    <input
                      type="text"
                      placeholder="e.g. XXXX-XXXX-4812"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full bg-ink border border-brass-soft rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-brass"
                    />
                  </div>
                </div>

                <IdPhotoCaptureWidget
                  frontPhotoUrl={idPhotoUrl}
                  backPhotoUrl={idPhotoBackUrl}
                  idType={idType}
                  guestPhone={phone}
                  onChangeFront={(url) => setIdPhotoUrl(url)}
                  onChangeBack={(url) => setIdPhotoBackUrl(url)}
                />
              </div>
            )}

            {/* STEP 2 (FOR FAST-TRACK) OR STEP 4 (FOR NEW GUEST): PAYMENT & KEYS */}
            {(isAllInOne || (isFastTrack ? step === 2 : step === 4)) && (
              <div className="space-y-4 animate-in fade-in">
                {/* Fast-Track Guest Recap Header */}
                {isFastTrack && (
                  <div className="p-3 bg-panel rounded-xl border border-brass-soft/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brass text-ink font-bold font-display flex items-center justify-center text-xs">
                          {name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">{name}</span>
                            <span className="px-1.5 py-0.2 rounded bg-signal-green text-ink font-mono font-bold text-[9px]">
                              ✓ ID VERIFIED
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            📞 {phone} &bull; {idType} ({idNumber || 'On File'})
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEditDetailsOpen(prev => !prev)}
                        className="text-[10px] font-mono text-brass hover:text-white flex items-center gap-1 bg-ink px-2 py-1 rounded border border-brass-soft/30"
                      >
                        <span>{isEditDetailsOpen ? 'Hide Edit' : '✎ Edit Info'}</span>
                        {isEditDetailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {isEditDetailsOpen && (
                      <div className="pt-2 border-t border-brass-soft/20 grid grid-cols-2 gap-2 text-[11px] font-mono animate-in fade-in">
                        <div>
                          <label className="text-[9px] text-slate-400 block">Name</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-ink border border-brass-soft/40 rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-400 block">Phone</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-ink border border-brass-soft/40 rounded px-2 py-1 text-white text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tariff & Payment Breakdown */}
                <div className="bg-ink p-4 rounded-xl border border-brass-soft/40 space-y-3">
                  <div className="flex items-center justify-between text-brass text-[11px] uppercase font-mono font-bold border-b border-brass-soft/20 pb-1.5">
                    <span>Stay Charges & GST Breakdown</span>
                    <span>{totalNights} {totalNights === 1 ? 'Day' : 'Days'} Stay</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Room Tariff ({totalNights} x {formatCurrency(nightlyRate)}):</span>
                      <span>{formatCurrency(gstCalc.taxableRoomCharge)}</span>
                    </div>
                    {gstCalc.gstAmount > 0 ? (
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Kerala GST ({gstCalc.gstRate}%):</span>
                        <span>{formatCurrency(gstCalc.gstAmount)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-signal-green text-[11px]">
                        <span>GST Exemption (&lt; ₹2,500/day):</span>
                        <span>₹0.00 (0% GST)</span>
                      </div>
                    )}
                    <div className="flex justify-between text-brass text-base font-bold border-t border-brass-soft/20 pt-2">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(gstCalc.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Advance Amount & Payment Mode */}
                <div className="bg-panel p-4 rounded-xl border border-brass-soft/40 space-y-3">
                  <label className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                    Advance Paid at Check-In Counter *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                    <div className="relative">
                      <span className="text-slate-400 absolute left-3 top-2.5 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={gstCalc.grandTotal * 2}
                        value={advancePaid}
                        onChange={(e) => setAdvancePaid(e.target.value)}
                        className="w-full bg-ink border border-brass-soft rounded-lg pl-8 pr-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-brass"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {['Cash', 'UPI', 'Card'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPaymentMode(mode)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all text-center ${
                            paymentMode === mode
                              ? 'bg-brass text-ink border-brass shadow'
                              : 'bg-ink text-slate-400 border-brass-soft/30 hover:text-white'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                    <span>Balance Due at Checkout:</span>
                    <span className="font-bold text-signal-amber">
                      {formatCurrency(Math.max(0, gstCalc.grandTotal - Number(advancePaid || 0)))}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Pinned Bottom Action Bar with Mobile Safe Area & Thumb Reach */}
          <div className="shrink-0 px-3 sm:px-4 py-3 bg-panel border-t border-brass-soft/30 pb-safe-mobile flex items-center justify-between gap-3 shadow-xl z-20">
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
            {!isAllInOne && step < totalSteps ? (
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
                  {isPreBooking ? 'Confirm Reservation' : `Check In (Rm ${selectedRoom?.room_number || '202'} • ₹${advancePaid})`}
                </span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
